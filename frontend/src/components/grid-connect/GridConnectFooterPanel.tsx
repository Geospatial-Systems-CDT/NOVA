// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, Typography, styled } from '@mui/material';
import { useMemo, useState, useEffect } from 'react';
import StatCircle from './StatCircle';
import type { Substation } from '../map-substations-list/SubstationsList';
import { useMapStore } from '../../stores/useMapStore';

interface Specification {
    name: string;
    value: string;
}

interface Variation {
    name: string;
    specification: Specification[];
    image: string;
    icon: string;
}

interface Asset {
    id: string;
    name: string;
    variations: Variation[];
}

const GridConnectFooterContainer = styled(Box)(({ theme }) => ({
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[3],
    padding: theme.spacing(1, 4),
    zIndex: 1300,
    display: 'grid',
    gridTemplateColumns: '1fr auto auto',
    alignItems: 'center',
    borderTop: `4px solid ${theme.palette.divider}`,
    minHeight: theme.spacing(15),
    gap: theme.spacing(4),
}));

const TurbineInfoSection = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    minWidth: 0,
}));

const TurbineIcon = styled('img')(({ theme }) => ({
    height: theme.spacing(6),
    marginRight: theme.spacing(1.5),
}));

const MainStatSection = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
    justifyContent: 'center',
    minWidth: theme.spacing(18),
}));

const MainStatTitle = styled(Typography)(({ theme }) => ({
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.pxToRem(18),
    marginBottom: theme.spacing(0.5),
    textAlign: 'center',
}));

const StatGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    rowGap: theme.spacing(0.5),
    columnGap: theme.spacing(2),
    alignItems: 'center',
}));

const StatGridItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    minWidth: 0,
}));

const StatLabel = styled(Typography)(({ theme }) => ({
    fontSize: theme.typography.pxToRem(14),
    whiteSpace: 'nowrap',
}));

type Range = {
    min: number;
    max: number;
    decimals?: number; // number of decimal places
};

interface GridConnectFooterPanelProps {
    selectedSubstation: Substation;
}

interface AssetStats {
    assetId: string;
    location: string;
    connectedSubstation: string;
    connectionDistance: string;
    outputMWh: number;
    outputMW: number;
    gridSupportMW: number;
    boostPercent: number;
    localBoostPercent: number;
    maxOutputMWh?: number;
    maxOutputMW?: number;
    maxBoostPercent?: number;
    maxLocalBoostPercent?: number;
    maxGridSupportMW: number;
}

export default function GridConnectFooterPanel({ selectedSubstation }: GridConnectFooterPanelProps) {
    const markerPosition = useMapStore((s) => s.markerPosition);
    const markerVariant = useMapStore((s) => s.markerVariant);
    const lng = markerPosition && markerPosition.longitude ? markerPosition.longitude : -3.744;
    const lat = markerPosition && markerPosition.latitude ? markerPosition.latitude : 57.148;

    const [assets, setAssets] = useState<Asset[]>([]);

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const res = await fetch('/data/assets.json');
                const data = await res.json();
                setAssets(data);
            } catch (error) {
                console.error('Failed to fetch assets:', error);
            }
        };
        fetchAssets();
    }, []);

    const getRandomInRange = (range: Range): number => {
        const raw = Math.random() * (range.max - range.min) + range.min;
        if (range.decimals === undefined) {
            return raw;
        }
        return Number.parseFloat(raw.toFixed(range.decimals));
    };

    const stats = useMemo((): AssetStats => {
        // Find the asset that contains the selected markerVariant
        let asset: Asset | undefined;
        let isWind = true; // default fallback
        
        if (markerVariant) {
            asset = assets.find(a => a.variations.some(v => v.name === markerVariant.name));
            isWind = asset?.id === 'windTurbine';
        } else {
            // Fallback to old logic if no markerVariant (shouldn't happen in normal flow)
            isWind = selectedSubstation.id % 2 === 0;
            const assetId = isWind ? 'windTurbine' : 'solarPanel';
            asset = assets.find(a => a.id === assetId);
        }

        let ratedPowerMW = 6; // default fallback
        let assetIdPrefix = 'WT';
        let selectedVariation = markerVariant;

        if (asset && asset.variations.length > 0) {
            // Use markerVariant if available, otherwise select variation based on substation ID
            if (!selectedVariation) {
                const variationIndex = Math.floor(selectedSubstation.id / 2) % asset.variations.length;
                selectedVariation = asset.variations[variationIndex];
            }

            if (isWind) {
                const capacitySpec = selectedVariation.specification.find(spec => spec.name === 'Capacity (MW)');
                if (capacitySpec) {
                    const capacityValue = parseFloat(capacitySpec.value.replace(' MW', ''));
                    if (!isNaN(capacityValue)) {
                        ratedPowerMW = capacityValue;
                    }
                }
                assetIdPrefix = 'WT';
            } else {
                // Solar panel
                const wattageSpec = selectedVariation.specification.find(spec => spec.name === 'Wattage');
                if (wattageSpec) {
                    let wattageValue = wattageSpec.value;
                    let multiplier = 1;
                    if (wattageValue.includes(' kW')) {
                        multiplier = 1000;
                        wattageValue = wattageValue.replace(' kW', '');
                    } else if (wattageValue.includes(' W')) {
                        wattageValue = wattageValue.replace(' W', '');
                    }
                    const wattage = parseFloat(wattageValue);
                    if (!isNaN(wattage)) {
                        ratedPowerMW = (wattage * multiplier) / 1000000; // Convert to MW
                    }
                }
                assetIdPrefix = 'SP';
            }
        }

        // Calculate annual output
        let annualOutputMWh: number;
        if (isWind) {
            // Wind: rated power * capacity factor * hours per year
            const capacityFactor = 0.4;
            const hoursPerYear = 8760;
            annualOutputMWh = ratedPowerMW * capacityFactor * hoursPerYear;
        } else {
            // Solar: approximate annual output based on UK average
            // Assuming 15% system efficiency and ~1000 kWh/m²/year irradiance
            // Simple approximation: 1 MW solar system produces ~1500 MWh/year in UK
            annualOutputMWh = ratedPowerMW * 1500;
        }

        return {
            assetId: `${assetIdPrefix}-${selectedSubstation.id}`,
            location: `${lat}, ${lng}`,
            connectedSubstation: selectedSubstation.name,
            connectionDistance: selectedSubstation.distanceFromTurbine,
            outputMWh: annualOutputMWh,
            outputMW: getRandomInRange({ min: 1.5, max: 8, decimals: 2 }),
            gridSupportMW: getRandomInRange({ min: 1.5, max: 8, decimals: 2 }),
            boostPercent: getRandomInRange({ min: 1, max: 10, decimals: 1 }),
            localBoostPercent: getRandomInRange({ min: 1, max: 10, decimals: 1 }),
            maxOutputMWh: annualOutputMWh * 1.2, // 20% higher for max
            maxOutputMW: getRandomInRange({ min: 8, max: 10, decimals: 2 }),
            maxBoostPercent: getRandomInRange({ min: 20, max: 100, decimals: 1 }),
            maxLocalBoostPercent: getRandomInRange({ min: 20, max: 100, decimals: 1 }),
            maxGridSupportMW: getRandomInRange({ min: 8, max: 10, decimals: 2 }),
        };
    }, [selectedSubstation, lat, lng, assets, markerVariant]);

    // Get the current asset info for display
    const currentAssetInfo = useMemo(() => {
        if (markerVariant) {
            const asset = assets.find(a => a.variations.some(v => v.name === markerVariant.name));
            const isWind = asset?.id === 'windTurbine';
            return {
                type: isWind ? 'Turbine' : 'Panel',
                icon: markerVariant.icon
            };
        } else {
            // Fallback to old logic
            const isWind = selectedSubstation.id % 2 === 0;
            const assetId = isWind ? 'windTurbine' : 'solarPanel';
            const asset = assets.find(a => a.id === assetId);
            if (asset && asset.variations.length > 0) {
                const variationIndex = Math.floor(selectedSubstation.id / 2) % asset.variations.length;
                return {
                    type: isWind ? 'Turbine' : 'Panel',
                    icon: asset.variations[variationIndex]?.icon || (isWind ? '/images/turbine-icon.png' : '/images/solar-icon.png')
                };
            }
            return {
                type: 'Turbine',
                icon: '/images/turbine-icon.png'
            };
        }
    }, [selectedSubstation, assets, markerVariant]);

    return (
        <GridConnectFooterContainer>
            <TurbineInfoSection>
                <TurbineIcon src={currentAssetInfo.icon} alt={currentAssetInfo.type} />
                <Box sx={{ minWidth: 0 }}>
                    <Typography fontSize={16} noWrap>
                        <strong>{currentAssetInfo.type} ID:</strong> {stats.assetId}
                    </Typography>
                    <Typography fontSize={16} noWrap>
                        <strong>Location:</strong> {stats.location}
                    </Typography>
                    <Typography fontSize={16} noWrap>
                        <strong>Connected Substation:</strong> {stats.connectedSubstation}
                    </Typography>
                    <Typography fontSize={16} noWrap>
                        <strong>Connection distance:</strong> {stats.connectionDistance}km
                    </Typography>
                </Box>
            </TurbineInfoSection>

            <MainStatSection>
                <MainStatTitle>Estimated output contribution:</MainStatTitle>
                <StatGridItem>
                    <StatCircle value={stats.outputMWh} max={stats.maxOutputMWh ?? 20000} unit="MWh/year" size={96} decimals={0} />
                    <StatLabel variant="body2">projected into {stats.connectedSubstation} load</StatLabel>
                </StatGridItem>
            </MainStatSection>

            <StatGrid>
                <StatGridItem>
                    <StatCircle value={stats.outputMW} max={stats.maxOutputMW ?? 10} unit="MW" size={64} decimals={1} />
                    <StatLabel variant="body2">to local distribution network</StatLabel>
                </StatGridItem>
                <StatGridItem>
                    <StatCircle value={stats.gridSupportMW} max={stats.maxGridSupportMW ?? 10} unit="MW" size={64} decimals={1} />
                    <StatLabel variant="body2">grid support</StatLabel>
                </StatGridItem>
                <StatGridItem>
                    <StatCircle value={stats.boostPercent} max={stats.maxBoostPercent ?? 100} suffix="%" size={64} decimals={1} />
                    <StatLabel variant="body2">boost to substation capacity</StatLabel>
                </StatGridItem>
                <StatGridItem>
                    <StatCircle value={stats.localBoostPercent} max={stats.maxLocalBoostPercent ?? 100} suffix="%" size={64} decimals={1} />
                    <StatLabel variant="body2">local self-sufficiency</StatLabel>
                </StatGridItem>
            </StatGrid>
        </GridConnectFooterContainer>
    );
}
