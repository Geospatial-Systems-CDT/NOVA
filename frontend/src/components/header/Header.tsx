// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { AppBar, Box, Button, styled } from '@mui/material';
import React from 'react';
import novaLogo from '../../assets/nova-logo.svg';
import UserMenu from './UserMenu';

const Toolbar = styled(AppBar)(({ theme }) => ({
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    height: 'var(--header-height)',
    justifyContent: 'space-between',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
}));

type HeaderProps = {
    onOpenPrivacy: () => void;
};

const Header: React.FC<HeaderProps> = ({ onOpenPrivacy }) => {
    return (
        <Toolbar position="relative">
            <Box component="img" src={novaLogo} alt="NOVA Logo" sx={{ height: '1.5rem' }} />
            {/* TODO: remove temporary test button */}
            <Button
                variant="outlined"
                size="small"
                sx={{ color: 'white', borderColor: 'white' }}
                onClick={() => window.open('/report', '_blank', 'noopener,noreferrer')}
            >
                Test Report Page
            </Button>
            <UserMenu onOpenPrivacy={onOpenPrivacy} />
        </Toolbar>
    );
};

export default Header;
