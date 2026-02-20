// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { Divider, IconButton, Menu, MenuItem, Typography, styled } from '@mui/material';
import { useEffect, useState } from 'react';
import { userService } from '../../services/userService';

const UserMenuButton = styled(IconButton, { shouldForwardProp: (prop) => prop !== 'isActive' })<{ isActive: boolean }>(({ theme, isActive }) => ({
    color: isActive ? '#ffcf06' : theme.palette.background.paper,
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
    '& .MuiPaper-root': {
        marginTop: theme.spacing(1),
        minWidth: '300px',
    },
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
    backgroundColor: theme.palette.divider,
    margin: theme.spacing(1) + ' 0',
    opacity: 0.3,
}));

const UsernameTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.disabled,
    padding: theme.spacing(1) + ' ' + theme.spacing(2),
}));

const StyledLogoutIcon = styled(LogoutIcon)(({ theme }) => ({
    color: theme.palette.primary.main,
    marginRight: theme.spacing(1),
}));

const StyledPrivacyIcon = styled(LockOutlinedIcon)(({ theme }) => ({
    color: theme.palette.primary.main,
    marginRight: theme.spacing(1),
}));

const MenuTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.primary.main,
}));

type UserMenuProps = {
    onOpenPrivacy?: () => void;
};

const UserMenu = ({ onOpenPrivacy }: Readonly<UserMenuProps>) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [username, setUsername] = useState<string>('Anonymous');
    const open = Boolean(anchorEl);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = await userService.getUserData();
                setUsername(userData.email);
            } catch (err) {
                console.error('Failed to fetch user data:', err);
            }
        };
        fetchUserData();
    }, []);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSignOut = async () => {
        try {
            await userService.logout();
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    };

    const handlePrivacyNotice = () => {
        onOpenPrivacy?.();
        handleClose();
    };

    return (
        <>
            <UserMenuButton aria-label="account of current user" aria-controls="menu-appbar" aria-haspopup="true" onClick={handleClick} isActive={open}>
                {open ? <AccountCircleIcon /> : <AccountCircleOutlinedIcon />}
            </UserMenuButton>
            <StyledMenu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={open}
                onClose={handleClose}
            >
                <UsernameTypography>{username}</UsernameTypography>
                <StyledDivider />
                <MenuItem onClick={handlePrivacyNotice}>
                    <StyledPrivacyIcon />
                    <MenuTypography>Privacy notice</MenuTypography>
                </MenuItem>
                <MenuItem onClick={handleSignOut}>
                    <StyledLogoutIcon />
                    <MenuTypography>Sign out</MenuTypography>
                </MenuItem>
            </StyledMenu>
        </>
    );
};

export default UserMenu;
