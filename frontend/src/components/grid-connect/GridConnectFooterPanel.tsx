// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, Typography, styled } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import StatCircle from './StatCircle';
import type { Substation } from '../map-substations-list/SubstationsList';
import { useMapStore } from '../../stores/useMapStore';
import { estimateAssetStats, type EstimatedAssetStats } from '../../utils/energyEstimation';
import { fetchAssetEstimation } from '../../services/assetEstimationApi';

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

interface GridConnectFooterPanelProps {
    selectedSubstation: Substation;
}

export default function GridConnectFooterPanel({ selectedSubstation }: GridConnectFooterPanelProps) {
    const markerPosition = useMapStore((s) => s.markerPosition);
    const markerVariant = useMapStore((s) => s.markerVariant);
    const lng = markerPosition && markerPosition.longitude ? markerPosition.longitude : -3.744;
    const lat = markerPosition && markerPosition.latitude ? markerPosition.latitude : 57.148;
    const [stats, setStats] = useState<EstimatedAssetStats | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadEstimation = async () => {
            try {
                const estimated = await fetchAssetEstimation({
                    variant: markerVariant,
                    selectedSubstation,
                    latitude: lat,
                    longitude: lng,
                });

                if (!cancelled) {
                    setStats(estimated);
                }
            } catch (error) {
                console.error('Error fetching backend estimation, using fallback:', error);
                const fallback = estimateAssetStats({
                    variant: markerVariant,
                    selectedSubstation,
                    latitude: lat,
                    longitude: lng,
                });

                if (!cancelled) {
                    setStats(fallback);
                }
            }
        };

        void loadEstimation();

        return () => {
            cancelled = true;
        };
    }, [markerVariant, selectedSubstation, lat, lng]);

    const computedStats = useMemo(
        () =>
            stats ??
            estimateAssetStats({
                variant: markerVariant,
                selectedSubstation,
                latitude: lat,
                longitude: lng,
            }),
        [stats, markerVariant, selectedSubstation, lat, lng]
    );

    const assetIcon = computedStats.technology === 'solar' ? '/images/solar-icon.png' : '/images/turbine-icon.png';

    return (
        <GridConnectFooterContainer>
            <TurbineInfoSection>
                <TurbineIcon src={assetIcon} alt="Selected asset" />
                <Box sx={{ minWidth: 0 }}>
                    <Typography fontSize={16} noWrap>
                        <strong>Asset ID:</strong> {computedStats.assetId}
                    </Typography>
                    <Typography fontSize={16} noWrap>
                        <strong>Location:</strong> {computedStats.location}
                    </Typography>
                    <Typography fontSize={16} noWrap>
                        <strong>Connected Substation:</strong> {computedStats.connectedSubstation}
                    </Typography>
                    <Typography fontSize={16} noWrap>
                        <strong>Connection distance:</strong> {computedStats.connectionDistanceKm.toFixed(2)} km
                    </Typography>
                </Box>
            </TurbineInfoSection>

            <MainStatSection>
                <MainStatTitle>Estimated output contribution:</MainStatTitle>
                <StatGridItem>
                    <StatCircle value={computedStats.outputMWh} max={computedStats.maxOutputMWh} unit="MWh/year" size={96} decimals={0} />
                    <StatLabel variant="body2">projected into {computedStats.connectedSubstation} load</StatLabel>
                </StatGridItem>
                <Typography variant="caption" color="text.secondary">
                    Estimated using shared assumptions and location context.
                </Typography>
            </MainStatSection>

            <StatGrid>
                <StatGridItem>
                    <StatCircle value={computedStats.outputMW} max={computedStats.maxOutputMW} unit="MW" size={64} decimals={1} />
                    <StatLabel variant="body2">to local distribution network</StatLabel>
                </StatGridItem>
                <StatGridItem>
                    <StatCircle value={computedStats.gridSupportMW} max={computedStats.maxGridSupportMW} unit="MW" size={64} decimals={1} />
                    <StatLabel variant="body2">grid support</StatLabel>
                </StatGridItem>
                <StatGridItem>
                    <StatCircle value={computedStats.boostPercent} max={computedStats.maxBoostPercent} suffix="%" size={64} decimals={1} />
                    <StatLabel variant="body2">boost to substation capacity</StatLabel>
                </StatGridItem>
                <StatGridItem>
                    <StatCircle value={computedStats.localBoostPercent} max={computedStats.maxLocalBoostPercent} suffix="%" size={64} decimals={1} />
                    <StatLabel variant="body2">local self-sufficiency</StatLabel>
                </StatGridItem>
            </StatGrid>
        </GridConnectFooterContainer>
    );
}
