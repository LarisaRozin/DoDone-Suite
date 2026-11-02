/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { Box, Typography, Container, Paper, useTheme, Link } from "@mui/material";

export default function SupportPage() {
    const theme = useTheme();

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper 
                elevation={3} 
                sx={{ 
                    p: 4, 
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: 2
                }}
            >
                <Typography variant="h3" component="h1" gutterBottom sx={{ 
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    mb: 3
                }}>
                    DoDone App Support
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 4, textAlign: 'center', fontStyle: 'italic' }}>
                    <strong>Last Updated:</strong> December 22, 2025
                </Typography>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    Get Help & Support
                </Typography>
                <Typography variant="body1" paragraph>
                    Thank you for using DoDone! We're here to help you make the most of your task management and family allowance tracking experience.
                </Typography>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    Contact Information
                </Typography>
                <Typography variant="body1" paragraph>
                    For any questions, issues, or feedback regarding the DoDone app, please reach out to us using the appropriate contact method below:
                </Typography>
                
                <Box sx={{ ml: 2, mb: 3 }}>
                    <Typography variant="body1" paragraph>
                        <strong>General Information & Inquiries:</strong><br />
                        <Link href="mailto:info@dodoneapp.com" color="primary">
                            info@dodoneapp.com
                        </Link>
                    </Typography>
                    
                    <Typography variant="body1" paragraph>
                        <strong>Technical Support & Bug Reports:</strong><br />
                        <Link href="mailto:support@dodoneapp.com" color="primary">
                            support@dodoneapp.com
                        </Link>
                    </Typography>
                    
                    <Typography variant="body1" paragraph>
                        <strong>Privacy & Data Protection:</strong><br />
                        <Link href="mailto:privacy@dodoneapp.com" color="primary">
                            privacy@dodoneapp.com
                        </Link>
                    </Typography>
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    What We Can Help With
                </Typography>
                <Typography variant="body1" paragraph>
                    Our support team can assist you with:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 3 }}>
                    <Typography component="li" variant="body1">Account setup and login issues</Typography>
                    <Typography component="li" variant="body1">Task creation and management</Typography>
                    <Typography component="li" variant="body1">Allowance and bonus tracking</Typography>
                    <Typography component="li" variant="body1">Family member management</Typography>
                    <Typography component="li" variant="body1">App navigation and features</Typography>
                    <Typography component="li" variant="body1">Technical troubleshooting</Typography>
                    <Typography component="li" variant="body1">Privacy and data questions</Typography>
                    <Typography component="li" variant="body1">Feature requests and feedback</Typography>
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    Response Time
                </Typography>
                <Typography variant="body1" paragraph>
                    We strive to respond to all support inquiries within 24-48 hours. For urgent technical issues, please include "URGENT" in your email subject line.
                </Typography>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    When Contacting Support
                </Typography>
                <Typography variant="body1" paragraph>
                    To help us assist you more effectively, please include:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 3 }}>
                    <Typography component="li" variant="body1">A clear description of the issue or question</Typography>
                    <Typography component="li" variant="body1">Your device type (iPhone, Android, etc.)</Typography>
                    <Typography component="li" variant="body1">App version number (if available)</Typography>
                    <Typography component="li" variant="body1">Steps you've already tried to resolve the issue</Typography>
                    <Typography component="li" variant="body1">Screenshots (if applicable and helpful)</Typography>
                </Box>

                <Box sx={{ 
                    mt: 6, 
                    p: 3, 
                    backgroundColor: theme.palette.grey[50], 
                    borderRadius: 1, 
                    textAlign: 'center' 
                }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        <strong>DoDone App Support</strong><br />
                        Helping families stay organized and motivated<br />
                        <strong>Last Updated:</strong> December 22, 2025
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}