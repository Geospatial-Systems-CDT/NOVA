// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, IconButton, Tooltip, tooltipClasses, type TooltipProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledIconButton = styled(IconButton, { shouldForwardProp: (prop) => prop !== 'isActive' })<{ isActive?: boolean }>(({ theme, isActive }) => ({
    backgroundColor: isActive ? theme.palette.secondary.main : theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    color: isActive ? theme.palette.primary.contrastText : theme.palette.text.primary,
    height: '3rem',
    padding: 0,
    '&:hover': {
        backgroundColor: isActive ? theme.palette.secondary.dark : theme.palette.background.paper,
    },
    width: '3rem',
    '& .MuiTouchRipple-root .MuiTouchRipple-child': {
        borderRadius: theme.shape.borderRadius,
    },
}));

const StyledTooltip = styled((props: TooltipProps) => (
    <Tooltip
        {...props}
        placement="bottom"
        slotProps={{
            popper: {
                modifiers: [
                    {
                        name: 'offset',
                        options: {
                            offset: [0, 12], // 12px space below the button
                        },
                    },
                ],
            },
        }}
        classes={{ popper: props.className }}
    />
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: '#ffffff',
        color: '#000000',
        boxShadow: theme.shadows[2],
        fontSize: 13,
        padding: '6px 12px',
        borderRadius: 8,
    },
    [`& .${tooltipClasses.arrow}`]: {
        display: 'none',
    },
}));

interface ControlIconProps {
    onClick: () => void;
    children: React.ReactNode;
    'aria-label': string;
    isActive?: boolean;
    disabled?: boolean;
    showTooltip?: boolean;
    'aria-pressed'?: boolean;
}

const ControlIcon = ({ onClick, children, 'aria-label': ariaLabel, isActive, disabled, 'aria-pressed': ariaPressed, showTooltip }: ControlIconProps) => {
    const pressedState = ariaPressed !== undefined ? ariaPressed : isActive;

    return (
        <Box>
            {showTooltip ? (
                <StyledTooltip title={ariaLabel}>
                    <span>
                        <StyledIconButton
                            onClick={onClick}
                            isActive={isActive}
                            disabled={disabled}
                            aria-pressed={pressedState}
                            aria-label={ariaLabel + ' button'}
                        >
                            {children}
                        </StyledIconButton>
                    </span>
                </StyledTooltip>
            ) : (
                <StyledIconButton onClick={onClick} aria-label={ariaLabel} isActive={isActive} disabled={disabled} aria-pressed={pressedState}>
                    {children}
                </StyledIconButton>
            )}
        </Box>
    );
};

export default ControlIcon;
