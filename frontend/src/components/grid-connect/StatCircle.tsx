// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, styled, Typography, useTheme } from '@mui/material';
import React from 'react';

interface StatCircleProps {
    value: number;
    max: number;
    suffix?: string;
    unit?: string;
    color?: string;
    size?: number;
    decimals?: number;
}

const StatCircleContainer = styled(Box)<{ $size: number }>(({ $size }) => ({
    position: 'relative',
    width: $size,
    height: $size,
    display: 'inline-block',
}));

const StatCircleOverlay = styled(Box)({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
});

const StatCircleValue = styled(Typography)(({ theme }) => ({
    fontWeight: theme.typography.fontWeightBold,
    lineHeight: 1,
}));

const StatCircleUnit = styled(Typography)(({ theme }) => ({
    fontWeight: 400,
    fontSize: theme.typography.caption.fontSize,
    color: theme.palette.text.secondary,
}));

const StatCircle: React.FC<StatCircleProps> = ({ value, max, suffix, unit, size, decimals = 1 }) => {
    const theme = useTheme();
    const arcColor = theme.palette.secondary.main;
    const circleSize = size || theme.spacing(12);
    const radius = Number(circleSize) / 2 - 6;
    const circumference = 2 * Math.PI * radius;
    const percent = Math.max(0, Math.min(1, value / max));
    const arc = percent * circumference;

    return (
        <StatCircleContainer $size={Number(circleSize)}>
            <svg width={circleSize} height={circleSize}>
                <circle cx={Number(circleSize) / 2} cy={Number(circleSize) / 2} r={radius} fill="none" stroke={theme.palette.grey[200]} strokeWidth={6} />
                <circle
                    cx={Number(circleSize) / 2}
                    cy={Number(circleSize) / 2}
                    r={radius}
                    fill="none"
                    stroke={arcColor}
                    strokeWidth={6}
                    strokeDasharray={`${arc} ${circumference - arc}`}
                    strokeDashoffset={circumference * 0.25}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.5s' }}
                />
            </svg>
            <StatCircleOverlay>
                <StatCircleValue>
                    <span>+{value.toLocaleString(undefined, { maximumFractionDigits: decimals })}</span>
                    {suffix && <span>{suffix}</span>}
                </StatCircleValue>
                {unit && <StatCircleUnit>{unit}</StatCircleUnit>}
            </StatCircleOverlay>
        </StatCircleContainer>
    );
};

export default StatCircle;
