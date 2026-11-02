/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'dodone-shared';
import { AppBar, Avatar, Box, IconButton, Menu, MenuItem, Toolbar, Typography } from "@mui/material";
// import SearchIcon from '@mui/icons-material/Search';
import logoIcon from '../assets/web-icons/app-icon-master.svg';

export default function MainAppBar() {
    const { user, dispatch } = useAuth();
    // Menu state
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);

    const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
        console.log('Avatar clicked', event.currentTarget);
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        console.log('Menu closing');
        setAnchorEl(null);
    };

    const navigate = useNavigate();

    const handleMenuItemClick = (path: string) => {
        handleMenuClose();
        if (path === '/logout') {
            dispatch({ type: 'LOGOUT' });
            navigate('/');
        } else {
            navigate(path);
        }
    };
    return (
        <AppBar position="static" elevation={1}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Box
                    sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                >
                    <Box
                        component="img"
                        src={logoIcon}
                        alt="DoDone Logo"
                        sx={{
                            width: 32,
                            height: 32,
                            mr: 1
                        }}
                    />
                    <Typography variant="logoTitle" sx={{ ml: 1 }}>
                        DoDone
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* {user && (
                        <IconButton color="inherit" title="Search">
                            <SearchIcon />
                        </IconButton>
                    )} 
                    <Typography variant="body2">
                        {user ? `Hi ${user.userName}!` : 'Hi Guest!'}
                    </Typography>
                    */}
                    {user && user.userName && (
                        <>
                            <IconButton
                                onClick={handleAvatarClick}
                                sx={{ p: 0 }}
                                aria-controls={menuOpen ? 'account-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={menuOpen ? 'true' : undefined}
                            >
                                <Avatar
                                    sx={{ 
                                        cursor: 'pointer',
                                        bgcolor: 'primary.main',
                                        '&:hover': {
                                            bgcolor: 'primary.dark'
                                        }
                                    }}
                                >
                                    {user.userName.slice(0, 2).toUpperCase()}
                                </Avatar>
                            </IconButton>
                            <Menu
                                id="account-menu"
                                anchorEl={anchorEl}
                                open={menuOpen}
                                onClose={handleMenuClose}
                                MenuListProps={{
                                    'aria-labelledby': 'account-menu',
                                }}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            >
                                {/* <MenuItem onClick={() => handleMenuItemClick('/edit-profile')}>Edit Profile</MenuItem> */}
                                {/* <MenuItem onClick={() => handleMenuItemClick('/manage-team')}> Manage Team </MenuItem> */}
                                {/* <MenuItem onClick={() => handleMenuItemClick('/settings')}>Settings</MenuItem> */}
                                <MenuItem onClick={() => handleMenuItemClick('/privacy-policy')}>Privacy Policy</MenuItem>
                                <MenuItem onClick={() => handleMenuItemClick('/support')}>Support</MenuItem>
                                <MenuItem onClick={() => handleMenuItemClick('/logout')}>Log Off</MenuItem>
                            </Menu>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}