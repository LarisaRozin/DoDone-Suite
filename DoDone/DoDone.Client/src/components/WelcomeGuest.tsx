/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { Box, Typography, Button, useMediaQuery, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function WelcomeGuest() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isLandscape = useMediaQuery('(orientation: landscape) and (max-height: 600px)');

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: theme.palette.dodone.backgroundDefault,
            width: '100%',
            padding: '12px',
            textAlign: 'center'
        }}>
            <Typography
                variant="h2"
                sx={{
                    fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
                    fontWeight: 700,
                    width: '100%',
                    textAlign: 'center',
                    marginBottom: 2,
                    color: theme.palette.dodone.highlight,
                    textShadow: `1px 1px 2px ${theme.palette.dodone.shadow}`,
                    fontSize: isLandscape ? '2.5rem' : '3rem',
                }}
            >
                WELCOME TO DODONE!
            </Typography>
            
            <Box sx={{ width: '100%', textAlign: 'center', marginBottom: 1, paddingY: 1 }}>
                <Typography
                    variant="h5"
                    sx={{
                        fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
                        fontWeight: 500,
                        color: theme.palette.dodone.textSecondary,
                        lineHeight: 1.5,
                    }}
                >
                    It ought to be rewarding fun<br />
                    To get your tasks and chores<br />
                    all done.<br />
                </Typography>
                <Typography
                    variant="h5"
                    sx={{
                        fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
                        fontWeight: 600,
                        color: theme.palette.dodone.accentDark,
                        lineHeight: 1.5,
                    }}
                >
                    You're very welcome to DoDone!
                </Typography>
            </Box>
            
            <Box sx={{
                display: 'flex',
                flexDirection: isLandscape ? 'row' : 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                marginTop: 2,
                width: '100%',
                maxWidth: isLandscape ? '600px' : '400px',
            }}>
                <Button
                    variant="contained"
                    onClick={() => navigate('/login')}
                    sx={{
                        backgroundColor: theme.palette.dodone.buttonPrimary,
                        color: theme.palette.dodone.textOnPrimary,
                        paddingY: '14px',
                        paddingX: '28px',
                        borderRadius: '30px',
                        border: `3px solid ${theme.palette.dodone.primaryLight}`,
                        boxShadow: `0px 4px 6px ${theme.palette.dodone.shadow}`,
                        marginY: 1,
                        minWidth: '200px',
                        maxWidth: isLandscape ? '220px' : 'none',
                        flex: isLandscape ? 1 : 'none',
                        fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
                        fontWeight: 600,
                        fontSize: '16px',
                        textTransform: 'none',
                        '&:hover': {
                            backgroundColor: theme.palette.dodone.primaryDark,
                            boxShadow: '0px 6px 8px rgba(0, 0, 0, 0.25)',
                        },
                    }}
                >
                    Log In
                </Button>
                
                <Button
                    variant="outlined"
                    onClick={() => navigate('/register')}
                    sx={{
                        backgroundColor: 'transparent',
                        borderWidth: '2px',
                        borderColor: theme.palette.dodone.primary,
                        color: theme.palette.dodone.primary,
                        paddingY: '10px',
                        paddingX: '22px',
                        borderRadius: '30px',
                        minWidth: '200px',
                        maxWidth: isLandscape ? '220px' : 'none',
                        flex: isLandscape ? 1 : 'none',
                        fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
                        fontWeight: 600,
                        fontSize: '16px',
                        textTransform: 'none',
                        '&:hover': {
                            backgroundColor: `rgba(245, 124, 0, 0.1)`,
                            borderColor: theme.palette.dodone.primaryDark,
                            color: theme.palette.dodone.primaryDark,
                        },
                    }}
                >
                    Register
                </Button>
            </Box>
            
            <Box sx={{ 
                mt: 4, 
                textAlign: 'center',
                color: theme.palette.dodone.textSecondary,
            }}>
                <Typography 
                    variant="body2" 
                    component="span"
                    sx={{ 
                        fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        '&:hover': {
                            color: theme.palette.dodone.primary,
                        }
                    }}
                    onClick={() => navigate('/privacy-policy')}
                >
                    Privacy Policy
                </Typography>
                <Typography 
                    variant="body2" 
                    component="span"
                    sx={{ 
                        fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
                        mx: 1
                    }}
                >
                    |
                </Typography>
                <Typography 
                    variant="body2" 
                    component="span"
                    sx={{ 
                        fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        '&:hover': {
                            color: theme.palette.dodone.primary,
                        }
                    }}
                    onClick={() => navigate('/support')}
                >
                    Support
                </Typography>
            </Box>
        </Box>
    );
}