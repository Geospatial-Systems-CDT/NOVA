// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { BBox } from 'geojson';
import type { ReportRegionDTO } from '../types/report';

export const formatNumber = (value: number | string | null, decimals = 2): string => {
    return Number(value).toLocaleString(undefined, {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
    });
};

export const getPrimaryRing = (region: ReportRegionDTO): [number, number][] => {
    return (region.polygon?.geometry?.coordinates?.[0] as [number, number][]) ?? [];
};

export const buildWorldImageryUrl = (bbox: BBox, size: { width: number; height: number }): string => {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const params = new URLSearchParams({
        bbox: `${minLon},${minLat},${maxLon},${maxLat}`,
        bboxSR: '4326',
        imageSR: '4326',
        size: `${size.width},${size.height}`,
        format: 'jpg',
        transparent: 'false',
        f: 'image',
    });
    return `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?${params.toString()}`;
};

export const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Unable to load map image'));
        img.src = url;
    });
};

export const clipSatelliteToPolygon = async (region: ReportRegionDTO): Promise<string> => {
    const ring = getPrimaryRing(region);
    if (!ring.length || ring.length < 3) {
        throw new Error('Invalid polygon coordinates');
    }

    const bbox = region.bbox;
    if (!bbox || bbox.length !== 4) {
        throw new Error('Missing bounding box');
    }

    const width = 900;
    const height = 540;
    const mapImage = await loadImage(buildWorldImageryUrl(bbox, { width, height }));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create drawing context');

    const [minLon, minLat, maxLon, maxLat] = bbox;
    const lonSpan = maxLon - minLon;
    const latSpan = maxLat - minLat;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.beginPath();

    ring.forEach(([lon, lat], i) => {
        const x = ((lon - minLon) / lonSpan) * width;
        const y = ((maxLat - lat) / latSpan) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.closePath();
    ctx.clip();
    ctx.drawImage(mapImage, 0, 0, width, height);
    ctx.restore();

    ctx.beginPath();
    ring.forEach(([lon, lat], i) => {
        const x = ((lon - minLon) / lonSpan) * width;
        const y = ((maxLat - lat) / latSpan) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.lineWidth = 3;
    ctx.stroke();

    return canvas.toDataURL('image/png');
};

const drawDot = (ctx: CanvasRenderingContext2D, x: number, y: number): void => {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#f1c519';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
};

export const renderSatelliteBboxWithPolygonHighlight = async (region: ReportRegionDTO): Promise<string> => {
    const regionBbox = region.bbox;
    if (!regionBbox || regionBbox.length !== 4) {
        throw new Error('Missing bounding box');
    }

    // Compute region centre from its bbox
    const [origMinLon, origMinLat, origMaxLon, origMaxLat] = regionBbox;
    const centreLat = (origMinLat + origMaxLat) / 2;
    const centreLon = (origMinLon + origMaxLon) / 2;

    // Build a 20km × 20km square bbox centred on the region
    const halfKm = 10;
    const deltaLat = halfKm / 111.32;
    const deltaLon = halfKm / (111.32 * Math.cos((centreLat * Math.PI) / 180));

    const bbox: BBox = [centreLon - deltaLon, centreLat - deltaLat, centreLon + deltaLon, centreLat + deltaLat];

    const width = 900;
    const height = 900;
    const mapImage = await loadImage(buildWorldImageryUrl(bbox, { width, height }));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create drawing context');

    const [minLon, minLat, maxLon, maxLat] = bbox;
    const lonSpan = maxLon - minLon;
    const latSpan = maxLat - minLat;
    if (lonSpan === 0 || latSpan === 0) {
        throw new Error('Invalid bounding box span');
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(mapImage, 0, 0, width, height);

    // Bbox border
    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(54, 111, 177, 0.95)';
    ctx.strokeRect(2, 2, width - 4, height - 4);
    ctx.restore();

    // Dot at the region centre
    const pinX = ((centreLon - minLon) / lonSpan) * width;
    const pinY = ((maxLat - centreLat) / latSpan) * height;
    drawDot(ctx, pinX, pinY);

    return canvas.toDataURL('image/png');
};
