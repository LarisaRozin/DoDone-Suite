/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { Box, Typography, Container, Paper, useTheme } from "@mui/material";

export default function PrivacyPolicyPage() {
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
                    Privacy Policy for DoDone App
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', fontStyle: 'italic' }}>
                    <strong>Effective Date:</strong> December 23, 2025<br />
                    <strong>Last Updated:</strong> January 17, 2026
                </Typography>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    Introduction
                </Typography>
                <Typography variant="body1" paragraph>
                    Larisa Rozin ("we," "our," or "us") operates the DoDone application (the "App"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our App.
                </Typography>
                <Typography variant="body1" paragraph>
                    By using DoDone, you agree to the collection and use of information in accordance with this policy.
                </Typography>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    Contact Information
                </Typography>
                <Typography variant="body1" paragraph>
                    <strong>Privacy Officer:</strong> Larisa Rozin<br />
                    <strong>Email:</strong> privacy@dodoneapp.com<br />
                    <strong>Support Email:</strong> support@dodoneapp.com<br />
                    <strong>General Contact:</strong> info@dodoneapp.com<br />
                    <strong>Website:</strong> https://dodoneapp.com
                </Typography>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    Information We Collect
                </Typography>
                
                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Personal Information You Provide
                </Typography>
                <Typography variant="body1" paragraph>
                    When you create an account and use DoDone, we collect:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>Account Information:</strong> Name, email address, password (encrypted)</Typography>
                    <Typography component="li" variant="body1"><strong>Profile Information:</strong> Display name, family role (admin or not), avatar selection</Typography>
                    <Typography component="li" variant="body1"><strong>Avatar Images:</strong> Photos you select or capture for your profile avatar (stored securely, only visible to your family group)</Typography>
                    <Typography component="li" variant="body1"><strong>Family Information:</strong> Names and roles of family members you add</Typography>
                    <Typography component="li" variant="body1"><strong>Task Data:</strong> Tasks you create, assign, complete, assign credits, grade, and track</Typography>
                    <Typography component="li" variant="body1"><strong>Allowance Data:</strong> Allowance amounts, bonus information, approval history</Typography>
                    <Typography component="li" variant="body1"><strong>Communication Data:</strong> Comments and messages within the app</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Automatically Collected Information
                </Typography>
                <Typography variant="body1" paragraph>
                    When you use our App, we automatically collect:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>Device Information:</strong> Device type, operating system, app version, browser type (web app)</Typography>
                    <Typography component="li" variant="body1"><strong>Device Access:</strong> Camera and photo gallery access (only when you choose to capture or select an avatar image)</Typography>
                    <Typography component="li" variant="body1"><strong>Session Information:</strong> Login tokens, session duration, authentication cookies (web app only)</Typography>
                    <Typography component="li" variant="body1"><strong>Usage Data:</strong> Features used, time spent in app, user interactions</Typography>
                    <Typography component="li" variant="body1"><strong>Performance Data:</strong> App crashes, errors, loading times</Typography>
                    <Typography component="li" variant="body1"><strong>Analytics Data:</strong> General usage patterns and trends (anonymized)</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Information We Do NOT Collect
                </Typography>
                <Typography variant="body1" paragraph>
                    We do not collect:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Social Security Numbers or government ID numbers</Typography>
                    <Typography component="li" variant="body1">Location data or GPS coordinates</Typography>
                    <Typography component="li" variant="body1">Contact list or phone contacts</Typography>
                    <Typography component="li" variant="body1">Microphone or audio recordings</Typography>
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    How We Use Your Information
                </Typography>
                
                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Primary App Functionality
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Provide task management and grade-based allowance calculation and tracking services</Typography>
                    <Typography component="li" variant="body1">Bonus approval based on task completion</Typography>
                    <Typography component="li" variant="body1">Enable communication between family members</Typography>
                    <Typography component="li" variant="body1">Sync data across devices for the same account</Typography>
                    <Typography component="li" variant="body1">Provide customer support and technical assistance</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    App Improvement
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Analyze usage patterns to improve features</Typography>
                    <Typography component="li" variant="body1">Identify and fix bugs and performance issues</Typography>
                    <Typography component="li" variant="body1">Develop new features based on user needs</Typography>
                    <Typography component="li" variant="body1">Ensure app security and prevent abuse</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Communication
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Send important updates about your account</Typography>
                    <Typography component="li" variant="body1">Notify you of significant app changes or new features</Typography>
                    <Typography component="li" variant="body1">Respond to your support requests and inquiries</Typography>
                    <Typography component="li" variant="body1">Send service-related notifications (task reminders, etc.)</Typography>
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    Information Sharing and Disclosure
                </Typography>
                
                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    We Do NOT Sell Your Information
                </Typography>
                <Typography variant="body1" paragraph>
                    We do not sell, trade, or rent your personal information to third parties.
                </Typography>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Limited Sharing Scenarios
                </Typography>
                <Typography variant="body1" paragraph>
                    We may share your information only in these specific circumstances:
                </Typography>
                
                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    Within Your Family Group:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Task and allowance data is shared with family members you invite</Typography>
                    <Typography component="li" variant="body1">Comments and messages are visible to relevant family members</Typography>
                    <Typography component="li" variant="body1">Profile information is shared within your family group</Typography>
                </Box>

                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    Service Providers:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Cloud hosting services for data storage and backup</Typography>
                    <Typography component="li" variant="body1">Analytics services for app improvement (data is anonymized)</Typography>
                    <Typography component="li" variant="body1">Customer support tools for responding to inquiries</Typography>
                </Box>

                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    Legal Requirements:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">When required by law, court order, or government request</Typography>
                    <Typography component="li" variant="body1">To protect our rights, property, or safety</Typography>
                    <Typography component="li" variant="body1">To prevent fraud or illegal activities</Typography>
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    Data Security
                </Typography>
                
                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Security Measures We Implement
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>Encryption:</strong> All data is encrypted in transit (HTTPS/TLS), and sensitive data like passwords are encrypted when stored</Typography>
                    <Typography component="li" variant="body1"><strong>Authentication:</strong> Secure login with password requirements</Typography>
                    <Typography component="li" variant="body1"><strong>Access Controls:</strong> Limited access to personal data by our team</Typography>
                    <Typography component="li" variant="body1"><strong>Infrastructure Security:</strong> We use secure cloud hosting services with industry-standard security measures</Typography>
                    <Typography component="li" variant="body1"><strong>Monitoring:</strong> We monitor for security threats and unauthorized access</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Security Features in Development
                </Typography>
                <Typography variant="body1" paragraph>
                    As DoDone continues to evolve, we are working to implement additional security features, including:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Two-factor authentication (2FA) for enhanced account security</Typography>
                    <Typography component="li" variant="body1">Regular security updates and patches</Typography>
                    <Typography component="li" variant="body1">Advanced threat detection and prevention</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Your Security Responsibilities
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Use a strong, unique password for your account</Typography>
                    <Typography component="li" variant="body1">Log out of shared devices</Typography>
                    <Typography component="li" variant="body1">Report any suspicious activity immediately</Typography>
                    <Typography component="li" variant="body1">Keep your app updated to the latest version</Typography>
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    Your Privacy Rights
                </Typography>
                
                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Access and Control
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>View Your Data:</strong> Access your profile and data within the app</Typography>
                    <Typography component="li" variant="body1"><strong>Update Information:</strong> Modify your profile, tasks, and preferences</Typography>
                    <Typography component="li" variant="body1"><strong>Delete Content:</strong> Remove tasks, comments, and other content you created</Typography>
                    <Typography component="li" variant="body1"><strong>Account Deletion:</strong> Request complete account deletion</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Data Portability
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>Export Data:</strong> Request a copy of your data (functionality in development)</Typography>
                    <Typography component="li" variant="body1"><strong>Transfer Data:</strong> Move your data to another service (where technically feasible)</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Communication Preferences
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>Opt-out:</strong> Unsubscribe from non-essential communications</Typography>
                    <Typography component="li" variant="body1"><strong>Notification Control:</strong> Manage push notifications in app settings</Typography>
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    Data Retention
                </Typography>
                
                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    How Long We Keep Your Data
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>Active Accounts:</strong> We retain your data while your account is active</Typography>
                    <Typography component="li" variant="body1"><strong>Deleted Accounts:</strong> Data is permanently deleted within 30 days of account deletion</Typography>
                    <Typography component="li" variant="body1"><strong>Legal Requirements:</strong> Some data may be retained longer if required by law</Typography>
                </Box>

                <Typography variant="h5" component="h3" id="account-deletion" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Account Deletion
                </Typography>
                
                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    How to Delete Your Account
                </Typography>
                <Typography variant="body1" paragraph>
                    DoDone provides different account deletion options depending on your role:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>Administrator Users:</strong> Can delete their own account through the app settings. If you created your own account through self-registration, you have full control to delete it at any time.</Typography>
                    <Typography component="li" variant="body1"><strong>Non-Administrator Users:</strong> Accounts created by family/team administrators (such as children's accounts) are managed by the administrator who created them. If you need your account deleted, please ask your family/team administrator.</Typography>
                    <Typography component="li" variant="body1"><strong>Active Subscriptions:</strong> If your team has an active Pro subscription, you must first cancel it through the App Store (iOS) or Google Play Store (Android) settings before deleting your account. Account deletion will be blocked while an active subscription exists to prevent accidental loss of paid service.</Typography>
                </Box>

                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    What Gets Deleted Immediately
                </Typography>
                <Typography variant="body1" paragraph>
                    When an account is deleted, we permanently remove the following data within 7 days:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>User Account Information:</strong> Username, email address, password, and authentication credentials</Typography>
                    <Typography component="li" variant="body1"><strong>Personal Profile Data:</strong> Name, salutation, middle name, profile avatar</Typography>
                    <Typography component="li" variant="body1"><strong>Device Registrations:</strong> All device tokens and push notification registrations</Typography>
                    <Typography component="li" variant="body1"><strong>User Preferences:</strong> Notification preferences and app settings</Typography>
                    <Typography component="li" variant="body1"><strong>Personal Notifications:</strong> All notifications sent to or about the user</Typography>
                    <Typography component="li" variant="body1"><strong>User-Created Content:</strong> Task pins, personal task groups, task categories, task kinds</Typography>
                    <Typography component="li" variant="body1"><strong>Personal Allowance Data:</strong> Allowance history records for the deleted user</Typography>
                    <Typography component="li" variant="body1"><strong>Tasks Created by User:</strong> All tasks created by the deleted user (unless team remains active - see below)</Typography>
                    <Typography component="li" variant="body1"><strong>All Private Tasks, Groups, Kinds and Categories Created by User:</strong> All private tasks, groups, kinds, and categories created by the deleted user</Typography>
                </Box>

                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    What Gets Anonymized (When Team Remains Active)
                </Typography>
                <Typography variant="body1" paragraph>
                    If other administrators exist and the team/family remains active after account deletion, some data is anonymized rather than deleted to preserve team functionality and history:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>Task Comments:</strong> Comments on team tasks are preserved but attributed to "[Deleted User]" to maintain conversation context</Typography>
                    <Typography component="li" variant="body1"><strong>Audit Trail References:</strong> References showing who created, updated, completed, graded, or archived team tasks are changed to "[Deleted User]"</Typography>
                    <Typography component="li" variant="body1"><strong>Allowance Configuration:</strong> Team allowance intervals and grade configurations created by the user are preserved for team continuity but marked as created by "[Deleted User]"</Typography>
                    <Typography component="li" variant="body1"><strong>Task References:</strong> Tasks assigned to or completed by the deleted user have these references cleared or anonymized</Typography>
                </Box>

                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    What Gets Deleted When Last Administrator Deletes Account
                </Typography>
                <Typography variant="body1" paragraph>
                    If the account being deleted is the last administrator account on a team/family, the entire team and all associated data is permanently deleted:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>All Team Member Accounts:</strong> All non-administrator accounts in the team/family are also deleted</Typography>
                    <Typography component="li" variant="body1"><strong>All Team Data:</strong> All tasks, comments, task categories, groups, and kinds are permanently deleted</Typography>
                    <Typography component="li" variant="body1"><strong>All Team Configuration:</strong> Allowance intervals, grade configurations, and team settings are deleted</Typography>
                    <Typography component="li" variant="body1"><strong>Team Record:</strong> The team/family record is anonymized (name and description are removed) but retained to maintain the relationship with purchase history records for legal and compliance purposes</Typography>
                </Box>

                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    What We Retain (Legal and Compliance Requirements)
                </Typography>
                <Typography variant="body1" paragraph>
                    Certain data must be retained for legal, financial, and security compliance:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>Purchase Histories:</strong> Transaction records, subscription information, and payment history are retained for tax, accounting, and dispute resolution purposes (typically 7 years as required by law)</Typography>
                    <Typography component="li" variant="body1"><strong>Security Logs:</strong> Anonymized audit logs for fraud prevention and security investigations</Typography>
                    <Typography component="li" variant="body1"><strong>Legal Hold Data:</strong> Any data subject to legal preservation requirements or active legal proceedings</Typography>
                    <Typography component="li" variant="body1"><strong>Anonymized Analytics:</strong> Aggregated, non-identifiable usage statistics that cannot be traced back to individual users</Typography>
                </Box>

                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    Deletion Timeline
                </Typography>
                <Box component="ol" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>Immediate (0-5 minutes):</strong> Account is deactivated and login access is removed</Typography>
                    <Typography component="li" variant="body1"><strong>Within 7 days:</strong> Personal data is permanently deleted from active production systems</Typography>
                    <Typography component="li" variant="body1"><strong>Within 30 days:</strong> Data is removed from all backup systems and archives</Typography>
                    <Typography component="li" variant="body1"><strong>Retained Indefinitely:</strong> Purchase histories and anonymized analytics as described above</Typography>
                </Box>

                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    Important Notes About Account Deletion
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>Permanent Action:</strong> Account deletion cannot be undone. Once deleted, your account and personal data cannot be recovered.</Typography>
                    <Typography component="li" variant="body1"><strong>Team Impact:</strong> If you are the last administrator, deleting your account will delete all team members' accounts and all team data.</Typography>
                    <Typography component="li" variant="body1"><strong>Download Your Data First:</strong> We recommend exporting any important data before deleting your account (data export functionality coming soon).</Typography>
                    <Typography component="li" variant="body1"><strong>Alternative to Deletion:</strong> If you're unsure, you can temporarily deactivate your account by contacting support@dodoneapp.com instead of permanently deleting it.</Typography>
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    Children's Privacy
                </Typography>
                
                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Age Requirements and Verification
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">DoDone is designed for family use</Typography>
                    <Typography component="li" variant="body1">Children under 13 may use the app under parental supervision</Typography>
                    <Typography component="li" variant="body1">Parents are responsible for managing their children's accounts</Typography>
                    <Typography component="li" variant="body1">We do not knowingly collect personal information from children under 13 without parental consent</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    COPPA Compliance and Parental Consent
                </Typography>
                <Typography variant="body1" paragraph>
                    DoDone complies with the Children's Online Privacy Protection Act (COPPA). We take children's privacy seriously:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Parents must create and manage all family accounts, including accounts for children under 13</Typography>
                    <Typography component="li" variant="body1">By creating a child's account, parents provide verifiable consent for data collection and processing in accordance with COPPA</Typography>
                    <Typography component="li" variant="body1">We collect only the minimum information necessary from children: name, task data, and profile information</Typography>
                    <Typography component="li" variant="body1">We do not require children to disclose more information than necessary to participate in the app</Typography>
                    <Typography component="li" variant="body1">Parents can review, delete, or request to stop further collection of their child's information by contacting privacy@dodoneapp.com</Typography>
                    <Typography component="li" variant="body1">If we discover a child under 13 has created an account without parental consent, we will delete the account and associated data within 24 hours</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Parental Controls
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Parents can create and manage accounts for their children</Typography>
                    <Typography component="li" variant="body1">Parents can view their children's data and make accounts inactive (account deletion requires contacting support), except for private tasks which remain visible only to the task creator</Typography>
                    <Typography component="li" variant="body1">Each user manages their own notification preferences within the app</Typography>
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    Third-Party Services
                </Typography>
                
                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Services We Use
                </Typography>
                <Typography variant="body1" paragraph>
                    Our app integrates with these third-party services:
                </Typography>

                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    Firebase (Google)
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Purpose: User authentication, push notifications, data storage, crash reporting</Typography>
                    <Typography component="li" variant="body1">Data Shared: Account information, app usage data, push notification tokens, crash logs, device information</Typography>
                    <Typography component="li" variant="body1">Privacy Policy: https://policies.google.com/privacy</Typography>
                    <Typography component="li" variant="body1">Firebase-specific Privacy: https://firebase.google.com/support/privacy</Typography>
                </Box>

                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    React Native (Meta)
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Purpose: Mobile app development framework (no data collection by framework itself)</Typography>
                    <Typography component="li" variant="body1">Data Shared: None - React Native is a development framework only and does not collect user data</Typography>
                    <Typography component="li" variant="body1">Note: This is a development tool, not a data collection service</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Apple-Specific Services (iOS App Only)
                </Typography>
                
                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    Apple Push Notification Service (APNs)
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Purpose: Deliver push notifications for task reminders and allowance updates</Typography>
                    <Typography component="li" variant="body1">Data Shared: Device token, notification content (tasks, allowances, family updates)</Typography>
                    <Typography component="li" variant="body1">Privacy Policy: https://www.apple.com/legal/privacy/</Typography>
                </Box>

                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    Apple App Store
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Purpose: App distribution, updates, and reviews</Typography>
                    <Typography component="li" variant="body1">Data Shared: App installation data, update history, reviews and ratings</Typography>
                    <Typography component="li" variant="body1">Apple collects this data independently - see Apple's App Store Privacy Policy</Typography>
                    <Typography component="li" variant="body1">Privacy Policy: https://www.apple.com/legal/privacy/</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Google Play Store Services (Android App Only)
                </Typography>
                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    Google Play Store
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Purpose: App distribution, updates, and reviews</Typography>
                    <Typography component="li" variant="body1">Data Shared: App installation data, update history, reviews and ratings</Typography>
                    <Typography component="li" variant="body1">Privacy Policy: https://policies.google.com/privacy</Typography>
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    International Data Transfers
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Your data is stored and processed on secure cloud servers located in the United States</Typography>
                    <Typography component="li" variant="body1">Users from all countries are served from the same infrastructure</Typography>
                    <Typography component="li" variant="body1">By using DoDone, you consent to your data being processed in the United States</Typography>
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    App Store Privacy Disclosures
                </Typography>
                
                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Apple App Store Privacy Nutrition Labels
                </Typography>
                <Typography variant="body1" paragraph>
                    In accordance with Apple's App Store requirements, we disclose the following data collection:
                </Typography>

                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    Data Linked to You:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>Contact Info:</strong> Email address, name</Typography>
                    <Typography component="li" variant="body1"><strong>User Content:</strong> Photos (avatars), tasks, comments, allowance data</Typography>
                    <Typography component="li" variant="body1"><strong>Identifiers:</strong> User ID, device ID (for push notifications)</Typography>
                    <Typography component="li" variant="body1"><strong>Usage Data:</strong> Product interaction (features used, app interactions)</Typography>
                </Box>

                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    Data Not Linked to You:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>Diagnostics:</strong> Crash data, performance data (anonymized)</Typography>
                </Box>

                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    Data Used to Track You:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">None - We do not track you across apps and websites owned by other companies</Typography>
                    <Typography component="li" variant="body1">We do not use your data for advertising or marketing purposes</Typography>
                    <Typography component="li" variant="body1">We do not share your data with data brokers</Typography>
                </Box>

                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    Purpose of Data Collection:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>App Functionality:</strong> All personal data is used to provide personalized family task management and allowance tracking</Typography>
                    <Typography component="li" variant="body1"><strong>Analytics:</strong> Anonymized usage data helps us improve the app</Typography>
                    <Typography component="li" variant="body1"><strong>Product Personalization:</strong> Your data creates a customized experience for your family</Typography>
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    Cookies and Tracking
                </Typography>
                
                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Cookies We Use
                </Typography>
                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    Web App Only:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>Authentication Cookies:</strong> To keep you logged in between sessions</Typography>
                    <Typography component="li" variant="body1"><strong>Session Cookies:</strong> To maintain your login state and app preferences</Typography>
                    <Typography component="li" variant="body1"><strong>Security Cookies:</strong> To prevent unauthorized access and ensure secure sessions</Typography>
                </Box>

                <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
                    Mobile App:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Does not use traditional web cookies</Typography>
                    <Typography component="li" variant="body1">Uses secure device storage for authentication tokens</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    We Do NOT Use
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Third-party advertising cookies</Typography>
                    <Typography component="li" variant="body1">Social media tracking pixels</Typography>
                    <Typography component="li" variant="body1">Cross-site tracking cookies</Typography>
                    <Typography component="li" variant="body1">Marketing or analytics cookies from third parties</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Analytics We Use
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">First-party analytics to understand app usage</Typography>
                    <Typography component="li" variant="body1">Anonymous, aggregated data only</Typography>
                    <Typography component="li" variant="body1">No personally identifiable information in analytics</Typography>
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    California Privacy Rights (CCPA)
                </Typography>
                
                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    If You Are a California Resident
                </Typography>
                <Typography variant="body1" paragraph>
                    You have the right to:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Know what personal information we collect</Typography>
                    <Typography component="li" variant="body1">Know whether we sell your personal information (we do not)</Typography>
                    <Typography component="li" variant="body1">Request deletion of your personal information</Typography>
                    <Typography component="li" variant="body1">Receive equal service regardless of privacy choices</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    How to Exercise Your Rights
                </Typography>
                <Typography variant="body1" paragraph>
                    Email us at privacy@dodoneapp.com with your request.
                </Typography>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    European Privacy Rights (GDPR)
                </Typography>
                
                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    If You Are in the European Union
                </Typography>
                <Typography variant="body1" paragraph>
                    You have the right to:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Access your personal data</Typography>
                    <Typography component="li" variant="body1">Rectify inaccurate data</Typography>
                    <Typography component="li" variant="body1">Erase your data ("right to be forgotten")</Typography>
                    <Typography component="li" variant="body1">Restrict processing of your data</Typography>
                    <Typography component="li" variant="body1">Data portability</Typography>
                    <Typography component="li" variant="body1">Object to processing</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Legal Basis for Processing
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>Contract Performance:</strong> To provide the app services you requested</Typography>
                    <Typography component="li" variant="body1"><strong>Legitimate Interest:</strong> To improve our app and prevent abuse</Typography>
                    <Typography component="li" variant="body1"><strong>Consent:</strong> Where you have specifically agreed to processing</Typography>
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    Changes to This Privacy Policy
                </Typography>
                
                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    How We Handle Updates
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">We may update this policy to reflect changes in our practices or applicable laws</Typography>
                    <Typography component="li" variant="body1">Significant changes will be communicated via email or in-app notification</Typography>
                    <Typography component="li" variant="body1">The "Last Updated" date at the top shows when changes were made</Typography>
                    <Typography component="li" variant="body1">Continued use of the app after changes constitutes acceptance of the new policy</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Version History
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">Version 1.2 (January 17, 2026): Added comprehensive account deletion section with details on what data is deleted, anonymized, and retained; clarified administrator vs. non-administrator deletion rights</Typography>
                    <Typography component="li" variant="body1">Version 1.1 (December 23, 2025): Enhanced COPPA compliance, added Apple App Store Privacy Nutrition Labels section, expanded third-party services disclosure</Typography>
                    <Typography component="li" variant="body1">Version 1.0 (December 18, 2025): Initial privacy policy</Typography>
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    Data Breach Notification
                </Typography>
                
                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    In the Event of a Breach
                </Typography>
                <Typography variant="body1" paragraph>
                    If we experience a data breach that may affect your personal information:
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">We will notify affected users within a reasonable timeframe</Typography>
                    <Typography component="li" variant="body1">We will explain what happened and what data was affected</Typography>
                    <Typography component="li" variant="body1">We will describe steps we're taking to resolve the issue</Typography>
                    <Typography component="li" variant="body1">We will provide recommendations for protecting yourself</Typography>
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    How to Contact Us
                </Typography>
                
                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Privacy Questions and Requests
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1"><strong>Primary Contact:</strong> privacy@dodoneapp.com</Typography>
                    <Typography component="li" variant="body1"><strong>Support Questions:</strong> support@dodoneapp.com</Typography>
                    <Typography component="li" variant="body1"><strong>General Inquiries:</strong> info@dodoneapp.com</Typography>
                </Box>

                <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Response Time
                </Typography>
                <Box component="ul" sx={{ ml: 2, mb: 2 }}>
                    <Typography component="li" variant="body1">We aim to respond to privacy requests within a reasonable timeframe, typically within 5-10 business days</Typography>
                    <Typography component="li" variant="body1">Complex requests may take up to 30 days</Typography>
                    <Typography component="li" variant="body1">We will acknowledge receipt of your request within 1 business day</Typography>
                </Box>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    Governing Law and Jurisdiction
                </Typography>
                <Typography variant="body1" paragraph>
                    This Privacy Policy is governed by and construed in accordance with the laws of the State of Florida and the United States of America, without regard to conflict of law principles. Any disputes arising from this Privacy Policy or your use of the App shall be subject to the exclusive jurisdiction of the courts located in Manatee County, Florida.
                </Typography>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.primary.main }}>
                    Effective Date and Acceptance
                </Typography>
                <Typography variant="body1" paragraph>
                    This Privacy Policy is effective as of December 23, 2025. By using DoDone, you acknowledge that you have read and understood this Privacy Policy and agree to be bound by its terms.
                </Typography>
                
                <Typography variant="body1" paragraph sx={{ textAlign: 'center', mt: 3, fontWeight: 'bold' }}>
                    Questions about this Privacy Policy? Contact us at privacy@dodoneapp.com
                </Typography>

                <Box sx={{ 
                    mt: 4, 
                    pt: 3, 
                    borderTop: `1px solid ${theme.palette.divider}`,
                    textAlign: 'center'
                }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        <strong>Document Version:</strong> 1.2<br />
                        <strong>Effective Date:</strong> December 23, 2025<br />
                        <strong>Last Updated:</strong> January 17, 2026<br />
                        <strong>Applicable To:</strong> DoDone App Users Worldwide
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}
