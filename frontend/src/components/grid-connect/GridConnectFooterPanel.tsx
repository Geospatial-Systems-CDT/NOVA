// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, Typography, styled } from '@mui/material';
import { useMemo } from 'react';
import StatCircle from './StatCircle';
import type { Substation } from '../map-substations-list/SubstationsList';
import { useMapStore } from '../../stores/useMapStore';

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
    turbineId: string;
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
    const lng = markerPosition && markerPosition.longitude ? markerPosition.longitude : -3.744;
    const lat = markerPosition && markerPosition.latitude ? markerPosition.latitude : 57.148;

    const getRandomInRange = (range: Range): number => {
        const raw = Math.random() * (range.max - range.min) + range.min;
        if (range.decimals === undefined) {
            return raw;
        }
        return Number.parseFloat(raw.toFixed(range.decimals));
    };

    const stats = useMemo((): AssetStats => {
        return {
            turbineId: `WT-${selectedSubstation.id}`,
            location: `${lat}, ${lng}`,
            connectedSubstation: selectedSubstation.name,
            connectionDistance: selectedSubstation.distanceFromTurbine,
            outputMWh: getRandomInRange({ min: 5000, max: 25000, decimals: 0 }),
            outputMW: getRandomInRange({ min: 1.5, max: 8, decimals: 2 }),
            gridSupportMW: getRandomInRange({ min: 1.5, max: 8, decimals: 2 }),
            boostPercent: getRandomInRange({ min: 1, max: 10, decimals: 1 }),
            localBoostPercent: getRandomInRange({ min: 1, max: 10, decimals: 1 }),
            maxOutputMWh: getRandomInRange({ min: 25000, max: 35000 }),
            maxOutputMW: getRandomInRange({ min: 8, max: 10, decimals: 2 }),
            maxBoostPercent: getRandomInRange({ min: 20, max: 100, decimals: 1 }),
            maxLocalBoostPercent: getRandomInRange({ min: 20, max: 100, decimals: 1 }),
            maxGridSupportMW: getRandomInRange({ min: 8, max: 10, decimals: 2 }),
        };
    }, [selectedSubstation, lat, lng]);

    return (
        <GridConnectFooterContainer>
            <TurbineInfoSection>
                <TurbineIcon src="/images/turbine-icon.png" alt="Turbine" />
                <Box sx={{ minWidth: 0 }}>
                    <Typography fontSize={16} noWrap>
                        <strong>Turbine ID:</strong> {stats.turbineId}
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
