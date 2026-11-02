/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace DoDone.Server.Services;

public class EmailSettings
{
    public const string SectionName = "Email";

    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string SmtpUser { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty;
    public bool UseSsl { get; set; } = true;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = "DoDone App";
    public bool IsEnabled { get; set; } = true;
    public string DownloadOnTheAppStoreImgLink { get; set; } = string.Empty;
    public string ResetPasswordBaseUrl { get; set; } = string.Empty;
    public string ServerBaseUrl { get; set; } = string.Empty;
    public string AppDeepLinkScheme { get; set; } = "dodone://";
    public string UniversalLinkDomain { get; set; } = string.Empty; // For iOS Universal Links
    public bool UseSmartRedirect { get; set; } = true; // Use a smart redirect page that detects platform
}

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string email, string token, bool isBusiness = false, string expiration = "1 hour");
    Task SendWelcomeEmailWithPasswordResetInstructionsAsync(string email, string firstName, string token, string creatorFirstName = "", string creatorLastName = "", bool isBusiness = false);
    Task SendWelcomeEmailAsync(string email, string firstName, bool IsBusiness = false);
    Task SendAccountDeletionByUserEmailAsync(string email, string firstName, bool isBusiness = false, bool isTeamDeleted = false);
    Task SendAccountDeletionByAdminEmailAsync(string email, string firstName, bool isBusiness = false, bool isTeamDeleted = false);

    Task SendSubscriptionEmailAsync(string email, string firstName, string subject, string message, bool isBusiness = false);
    Task SendTrialWelcomeEmailAsync(string email, string firstName, bool isBusiness, bool isGrandfathered, int gracePeriodDays);
    Task SendTrial3DayWarningEmailAsync(string email, string firstName, bool isBusiness, bool isGrandfathered, int gracePeriodDays);
    Task SendTrial1DayWarningEmailAsync(string email, string firstName, bool isBusiness, bool isGrandfathered, int gracePeriodDays);
    Task SendTrialEndedWarningEmailAsync(string email, string firstName, bool isBusiness, bool isGrandfathered, int gracePeriodDays);
}

public class EmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<EmailService> _logger;
    private readonly ICurrentUserService _currentUser;
    private readonly SubscriptionSettings _subscriptionSettings;

    public EmailService(IOptions<EmailSettings> emailSettings, IOptions<SubscriptionSettings> subscriptionSettings, ICurrentUserService currentUser, ILogger<EmailService> logger)
    {
        _emailSettings = emailSettings.Value;
        _subscriptionSettings = subscriptionSettings.Value;
        _currentUser = currentUser;
        _logger = logger;

        // Override with environment variables if present
        var envSmtpUser = Environment.GetEnvironmentVariable("SMTP_USER");
        var envSmtpPassword = Environment.GetEnvironmentVariable("SMTP_PASSWORD");
        var envFromEmail = Environment.GetEnvironmentVariable("FROM_EMAIL");
        var envSmtpHost = Environment.GetEnvironmentVariable("SMTP_HOST");

        if (!string.IsNullOrEmpty(envSmtpUser))
            _emailSettings.SmtpUser = envSmtpUser;
        if (!string.IsNullOrEmpty(envSmtpPassword))
            _emailSettings.SmtpPassword = envSmtpPassword;
        if (!string.IsNullOrEmpty(envFromEmail))
            _emailSettings.FromEmail = envFromEmail;
        if (!string.IsNullOrEmpty(envSmtpHost))
            _emailSettings.SmtpHost = envSmtpHost;
    }

    private (MimeMessage message, string resetUrl, string appDeepLink, string primaryLink, string universalLink) GetMessageAndLinks(string email, string token)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_emailSettings.FromName, _emailSettings.FromEmail));
        message.To.Add(new MailboxAddress("", email));
        message.Subject = "Password Reset - DoDone App";

        string resetUrl = $"{_emailSettings.ResetPasswordBaseUrl}?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(email)}";
        string appDeepLink = $"{_emailSettings.AppDeepLinkScheme}reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(email)}";

        // Create a redirect URL that will attempt to open the app
        var serviceBaseUrl =  _emailSettings.ServerBaseUrl;
        var redirectUrl = $"{serviceBaseUrl}/api/redirect/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(email)}";

        // Choose the primary link based on configuration
        string primaryLink = _emailSettings.UseSmartRedirect ? redirectUrl : resetUrl;
        var hasUniversalLinks = !string.IsNullOrEmpty(_emailSettings.UniversalLinkDomain);
        var universalLink = hasUniversalLinks
            ? $"https://{_emailSettings.UniversalLinkDomain}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(email)}"
            : resetUrl;

        return (message, resetUrl, appDeepLink, primaryLink, universalLink);
    }

    private string GetCreatorName(string creatorFirstName, string creatorLastName)
    {
        var creatorName = !string.IsNullOrEmpty(creatorFirstName) || !string.IsNullOrEmpty(creatorLastName)
            ? $"{creatorFirstName} {creatorLastName}".Trim()
            : $"{_currentUser.FirstName} {_currentUser.LastName}".Trim();

        if (string.IsNullOrEmpty(creatorName))
        {
            creatorName = "An administrator";
        }

        return creatorName;
    }

    private async Task SendEmail(MimeMessage message)
    {
        // Check if recipient is a loadtest user and skip sending
        var recipientEmail = message.To.Mailboxes.FirstOrDefault()?.Address;
        if (!string.IsNullOrEmpty(recipientEmail))
        {
            if (recipientEmail.StartsWith("loadtest.user", StringComparison.OrdinalIgnoreCase) || 
                recipientEmail.EndsWith("@example.com", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogInformation("Skipping email send to loadtest/example user: {Email}", recipientEmail);
                return;
            }
        }
        
        using var client = new SmtpClient();
        await client.ConnectAsync(_emailSettings.SmtpHost, _emailSettings.SmtpPort, _emailSettings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None);
        
        if (!string.IsNullOrEmpty(_emailSettings.SmtpUser))
        {
            await client.AuthenticateAsync(_emailSettings.SmtpUser, _emailSettings.SmtpPassword);  
        }
        
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    public async Task SendPasswordResetEmailAsync(string email, string token, bool isBusiness = false, string expiration = "1 hour")
    {
        try
        {
            if (!_emailSettings.IsEnabled)
            {
                _logger.LogInformation("Email is disabled. Password reset email would be sent to {Email} with token {Token}", email, token);
                return;
            }
            var (message, resetUrl, appDeepLink, primaryLink, universalLink) = GetMessageAndLinks(email, token);

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
                    <html>
                    <head>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
                            .fredoka {{ font-family: 'Fredoka', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }}
                        </style>
                    </head>
                    <body style='font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background-color: #FFF8E1;'>
                        <div style='background: linear-gradient(135deg, #F57C00 0%, #E65100 100%); padding: 40px 20px; text-align: center; border-radius: 0 0 20px 20px;'>
                            <h1 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 42px; margin: 0 0 10px 0; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);'>
                                🎯 DoDone
                            </h1>
                            <p style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 18px; margin: 0; font-weight: 500; opacity: 0.95;'>
                                Password Reset Request
                            </p>
                        </div>
                        
                        <div style='padding: 40px 30px; background-color: #ffffff; margin: 0 20px; border-radius: 16px; margin-top: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);'>
                            <h2 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #E65100; font-size: 28px; margin: 0 0 20px 0; text-align: center; font-weight: 600;'>
                                Reset Your Password 🔐
                            </h2>
                            
                            <p style='color: #424242; font-size: 16px; line-height: 1.6; margin-bottom: 20px; text-align: center;'>
                                We received a request to reset your password for your DoDone account.
                            </p>
                            
                            <div style='background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid #2196F3;'>
                                <h3 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #1565C0; font-size: 20px; margin: 0 0 15px 0; text-align: center; font-weight: 600;'>
                                    🚀 Reset Your Password
                                </h3>
                                
                                <p style='color: #1565C0; font-size: 16px; line-height: 1.5; margin-bottom: 20px; text-align: center;'>
                                    Click the button below to reset your password:
                                </p>
                                
                                <div style='text-align: center; margin: 20px 0;'>
                                    <a href='{primaryLink}' 
                                       style='background-color: #2196F3; color: white; padding: 12px 30px; 
                                              text-decoration: none; border-radius: 8px; display: inline-block;
                                              font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(33,150,243,0.3);'>
                                        🔒 Reset Password
                                    </a>
                                </div>
                                
                                {(!_emailSettings.UseSmartRedirect ? $@"
                                <div style='text-align: center; margin: 15px 0;'>
                                    <p style='color: #666; font-size: 14px; margin-bottom: 10px;'>
                                        Or open in your browser:
                                    </p>
                                    <a href='{resetUrl}' 
                                       style='background-color: #6c757d; color: white; padding: 8px 20px; 
                                              text-decoration: none; border-radius: 8px; display: inline-block;
                                              font-size: 14px; box-shadow: 0 4px 12px rgba(108,117,125,0.3);'>
                                        🌐 Open in Browser
                                    </a>
                                </div>" : "")}
                                
                                {(!string.IsNullOrEmpty(_emailSettings.UniversalLinkDomain) ? $@"
                                <div style='text-align: center; margin: 15px 0;'>
                                    <p style='color: #666; font-size: 14px; margin-bottom: 10px;'>
                                        iPhone users can also use:
                                    </p>
                                    <a href='{universalLink}' 
                                       style='background-color: #17a2b8; color: white; padding: 8px 20px; 
                                              text-decoration: none; border-radius: 8px; display: inline-block;
                                              font-size: 14px; box-shadow: 0 4px 12px rgba(23,162,184,0.3);'>
                                        📱 Open via Universal Link
                                    </a>
                                </div>" : "")}
                                
                                <p style='color: #666; font-size: 14px; line-height: 1.5; margin-top: 20px; text-align: center;'>
                                    If the buttons don't work, you can copy and paste this link into your browser:
                                </p>
                                <p style='color: #2196F3; font-size: 14px; word-break: break-all; text-align: center; background-color: #F5F5F5; padding: 10px; border-radius: 6px; margin: 10px 0;'>
                                    {resetUrl}
                                </p>
                            </div>
                        </div>
                        
                        <div style='background-color: #FF5722; padding: 30px 20px; margin: 20px; border-radius: 16px; text-align: center;'>
                            <h3 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 20px; margin: 0 0 15px 0; font-weight: 600;'>
                                🛡️ Security Notice
                            </h3>
                            <p style='color: #ffffff; font-size: 14px; line-height: 1.5; margin: 10px 0; opacity: 0.95;'>
                                If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                            </p>
                            <p style='color: #ffffff; font-size: 14px; line-height: 1.5; margin: 10px 0; opacity: 0.95;'>
                                This password reset link will expire in {expiration} for security reasons.
                            </p>
                        </div>
                        
                        <div style='text-align: center; padding: 20px; color: #999; font-size: 12px; line-height: 1.5;'>
                            <p style='margin: 5px 0;'>
                                <strong style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #F57C00; font-size: 16px;'>DoDone</strong> - 
                                Making productivity fun for families and teams worldwide
                            </p>
                            <p style='margin: 5px 0;'>
                                © {DateTime.Now.Year} DoDone App. All rights reserved.
                            </p>
                        </div>
                    </body>
                    </html>",
                TextBody = $@"
DoDone App - Password Reset Request

We received a request to reset your password for your DoDone account.

To reset your password, please use one of the following options:

1. Open in DoDone app: {appDeepLink}

2. Open in web browser: {resetUrl}

{(!string.IsNullOrEmpty(_emailSettings.UniversalLinkDomain) ? $"3. iPhone Universal Link: {universalLink}" : "")}

If you didn't request this password reset, please ignore this email.

This password reset link will expire in {expiration} for security reasons.

-- 
DoDone App Team"
            };

            message.Body = bodyBuilder.ToMessageBody();
            await SendEmail(message);

            _logger.LogInformation("Password reset email sent successfully to {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to {Email}", email);
            throw new InvalidOperationException($"Failed to send password reset email: {ex.Message}", ex);
        }
    }

    public async Task SendWelcomeEmailWithPasswordResetInstructionsAsync(string email, string firstName, string token, string creatorFirstName = "", string creatorLastName = "", bool isBusiness = false)
    {
        try
        {
            if (!_emailSettings.IsEnabled)
            {
                _logger.LogInformation("Email is disabled. Welcome email would be sent to {Email} with token {Token}", email, token);
                return;
            }

            var (message, resetUrl, appDeepLink, primaryLink, universalLink) = GetMessageAndLinks(email, token);
            var creatorName = GetCreatorName(creatorFirstName, creatorLastName);
            var teamOrFamily = isBusiness ? "Team" : "Family";

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
                    <html>
                    <head>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
                            .fredoka {{ font-family: 'Fredoka', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }}
                        </style>
                    </head>
                    <body style='font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background-color: #FFF8E1;'>
                        <div style='background: linear-gradient(135deg, #F57C00 0%, #E65100 100%); padding: 40px 20px; text-align: center; border-radius: 0 0 20px 20px;'>
                            <h1 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 42px; margin: 0 0 10px 0; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);'>
                                🎯 DoDone
                            </h1>
                            <p style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 18px; margin: 0; font-weight: 500; opacity: 0.95;'>
                                Welcome to DoDone!
                            </p>
                        </div>
                        
                        <div style='padding: 40px 30px; background-color: #ffffff; margin: 0 20px; border-radius: 16px; margin-top: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);'>
                            <h2 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #E65100; font-size: 28px; margin: 0 0 20px 0; text-align: center; font-weight: 600;'>
                                Welcome to the {teamOrFamily}, {firstName}! 🎉
                            </h2>
                            
                            <p style='color: #424242; font-size: 16px; line-height: 1.6; margin-bottom: 20px; text-align: center;'>
                                Hi {firstName},
                            </p>
                            
                            <p style='color: #424242; font-size: 16px; line-height: 1.6; margin-bottom: 20px; text-align: center;'>
                                Welcome to DoDone! {creatorName} created a DoDone account for you. 
                                If you have not yet installed the app, do it before proceeding. You can find it in the App Store or on Google Play.
                                Once you have the app installed, you'll need to set your password to start using it.
                            </p>
                            
                            <div style='background: linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid #4CAF50;'>
                                <h3 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #2E7D32; font-size: 20px; margin: 0 0 15px 0; text-align: center; font-weight: 600;'>
                                    🚀 Set Your Password & Get Started!
                                </h3>
                                
                                <p style='color: #1565C0; font-size: 16px; line-height: 1.5; margin-bottom: 20px; text-align: center;'>
                                    Click the button below to set your password and start using DoDone:
                                </p>
                                
                                <div style='text-align: center; margin: 20px 0;'>
                                    <a href='{primaryLink}' 
                                       style='background-color: #4CAF50; color: white; padding: 12px 30px; 
                                              text-decoration: none; border-radius: 8px; display: inline-block;
                                              font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(76,175,80,0.3);'>
                                        🔐 Set Your Password
                                    </a>
                                </div>
                                
                                {(!_emailSettings.UseSmartRedirect ? $@"
                                <div style='text-align: center; margin: 15px 0;'>
                                    <p style='color: #666; font-size: 14px; margin-bottom: 10px;'>
                                        Or open in your browser:
                                    </p>
                                    <a href='{resetUrl}' 
                                       style='background-color: #6c757d; color: white; padding: 8px 20px; 
                                              text-decoration: none; border-radius: 8px; display: inline-block;
                                              font-size: 14px; box-shadow: 0 4px 12px rgba(108,117,125,0.3);'>
                                        🌐 Open in Browser
                                    </a>
                                </div>" : "")}
                                
                                {(!string.IsNullOrEmpty(_emailSettings.UniversalLinkDomain) ? $@"
                                <div style='text-align: center; margin: 15px 0;'>
                                    <p style='color: #666; font-size: 14px; margin-bottom: 10px;'>
                                        iPhone users can also use:
                                    </p>
                                    <a href='{universalLink}' 
                                       style='background-color: #17a2b8; color: white; padding: 8px 20px; 
                                              text-decoration: none; border-radius: 8px; display: inline-block;
                                              font-size: 14px; box-shadow: 0 4px 12px rgba(23,162,184,0.3);'>
                                        📱 Open via Universal Link
                                    </a>
                                </div>" : "")}
                                
                                <p style='color: #666; font-size: 14px; line-height: 1.5; margin-top: 20px; text-align: center;'>
                                    If the buttons don't work, you can copy and paste this link into your browser:
                                </p>
                                <p style='color: #4CAF50; font-size: 14px; word-break: break-all; text-align: center; background-color: #F5F5F5; padding: 10px; border-radius: 6px; margin: 10px 0;'>
                                    {resetUrl}
                                </p>
                            </div>
                            
                            <div style='background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid #FFB74D;'>
                                <h3 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #F57C00; font-size: 18px; margin: 0 0 15px 0; text-align: center; font-weight: 600;'>
                                    📱 Don't Have the App Yet?
                                </h3>
                                
                                <p style='color: #1565C0; font-size: 14px; line-height: 1.5; margin-bottom: 15px; text-align: center;'>
                                    If you haven't already done so, install the DoDone app first, then log in with your account credentials to start creating tasks and having fun!
                                </p>
                                
                                <div style='text-align: center; margin: 15px 0;'>
                                    <div style='display: inline-block; margin: 0 5px;'>
                                        <a href='#' style='display: inline-block; margin: 3px;'>
                                            <img src='{_emailSettings.DownloadOnTheAppStoreImgLink}' 
                                                 alt='Download on App Store' style='height: 35px; border-radius: 6px;'>
                                        </a>
                                        <a href='#' style='display: inline-block; margin: 3px;'>
                                            <img src='https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png' 
                                                 alt='Get it on Google Play' style='height: 35px; border-radius: 6px;'>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div style='background-color: #2196F3; padding: 30px 20px; margin: 20px; border-radius: 16px; text-align: center;'>
                            <h3 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 20px; margin: 0 0 15px 0; font-weight: 600;'>
                                🛡️ Security Notice
                            </h3>
                            <p style='color: #ffffff; font-size: 14px; line-height: 1.5; margin: 10px 0; opacity: 0.95;'>
                                If you didn't expect this welcome email, please contact support.
                            </p>
                            <p style='color: #ffffff; font-size: 14px; line-height: 1.5; margin: 10px 0; opacity: 0.95;'>
                                This password setup link will expire in 24 hours for security reasons.
                            </p>
                        </div>
                        
                        <div style='text-align: center; padding: 20px; color: #999; font-size: 12px; line-height: 1.5;'>
                            <p style='margin: 5px 0;'>
                                <strong style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #F57C00; font-size: 16px;'>DoDone</strong> - 
                                Making productivity fun for families and teams worldwide
                            </p>
                            <p style='margin: 5px 0;'>
                                © {DateTime.Now.Year} DoDone App. All rights reserved.
                            </p>
                        </div>
                    </body>
                    </html>",
                TextBody = $@"
DoDone App - Welcome!

Hi {firstName},

Welcome to DoDone! Your account has been created successfully. To start using the app, you'll need to set your password.

To set your password, please use one of the following options:

1. Open in DoDone app: {appDeepLink}

2. Open in web browser: {resetUrl}

{(!string.IsNullOrEmpty(_emailSettings.UniversalLinkDomain) ? $"3. iPhone Universal Link: {universalLink}" : "")}

If you didn't expect this welcome email, please contact support.

This password setup link will expire in 24 hours for security reasons.

-- 
DoDone App Team"
            };

            message.Body = bodyBuilder.ToMessageBody();

            await SendEmail(message);

            _logger.LogInformation("Welcome email sent successfully to {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send welcome email to {Email}", email);
            throw new InvalidOperationException($"Failed to send welcome email: {ex.Message}", ex);
        }
    }

    public async Task SendWelcomeEmailAsync(string email, string firstName, bool isBusiness = false)
    {
        try
        {
            if (!_emailSettings.IsEnabled)
            {
                _logger.LogInformation("Email is disabled. Welcome email would be sent to {Email}", email);
                return;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_emailSettings.FromName, _emailSettings.FromEmail));
            message.To.Add(new MailboxAddress("", email));
            message.Subject = "Welcome to DoDone - Let's Get Started!";

            // Create URLs for the email links
            var appRedirectUrl = $"{_emailSettings.ServerBaseUrl}/api/redirect/welcome?email={Uri.EscapeDataString(email)}";
            var webAppUrl = _emailSettings.ResetPasswordBaseUrl.Replace("/reset-password", "");

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
                    <html>
                    <head>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
                            .fredoka {{ font-family: 'Fredoka', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }}
                        </style>
                    </head>
                    <body style='font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background-color: #FFF8E1;'>
                        <div style='background: linear-gradient(135deg, #F57C00 0%, #E65100 100%); padding: 40px 20px; text-align: center; border-radius: 0 0 20px 20px;'>
                            <h1 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 42px; margin: 0 0 10px 0; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);'>
                                🎯 DoDone
                            </h1>
                            <p style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 18px; margin: 0; font-weight: 500; opacity: 0.95;'>
                                Task Management • Rewards • Fun
                            </p>
                        </div>
                        
                        <div style='padding: 40px 30px; background-color: #ffffff; margin: 0 20px; border-radius: 16px; margin-top: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);'>
                            <h2 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #E65100; font-size: 28px; margin: 0 0 20px 0; text-align: center; font-weight: 600;'>
                                Welcome to the {(isBusiness ? "Team" : "Family")}, {firstName}! 🎉
                            </h2>
                            
                            <p style='color: #424242; font-size: 16px; line-height: 1.6; margin-bottom: 20px; text-align: center;'>
                                We love to have you on board and hope we can help you and your {(isBusiness ? "team" : "family")} stay organized, productive and motivated, and to have fun along the way!
                            </p>
                            
                            <div style='background: linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid #4CAF50;'>
                                <h3 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #2E7D32; font-size: 20px; margin: 0 0 15px 0; text-align: center; font-weight: 600;'>
                                    🚀 Ready to Start? Open DoDone Now!
                                </h3>
                                
                                <p style='color: #1565C0; font-size: 16px; line-height: 1.5; margin-bottom: 20px; text-align: center;'>
                                    If you already have the app installed, click the button below to open DoDone directly:
                                </p>
                                
                                <div style='text-align: center; margin: 20px 0;'>
                                    <a href='{appRedirectUrl}' 
                                       style='background-color: #4CAF50; color: white; padding: 12px 30px; 
                                              text-decoration: none; border-radius: 8px; display: inline-block;
                                              font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(76,175,80,0.3);'>
                                        🎯 Open DoDone App
                                    </a>
                                </div>
                                
                                <div style='text-align: center; margin: 15px 0;'>
                                    <a href='{webAppUrl}' 
                                       style='background-color: #2196F3; color: white; padding: 10px 25px; 
                                              text-decoration: none; border-radius: 8px; display: inline-block;
                                              font-weight: 500; font-size: 14px; box-shadow: 0 4px 12px rgba(33,150,243,0.3);'>
                                        🌐 Open Web Version
                                    </a>
                                </div>
                            </div>
                            
                            <div style='background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid #FFB74D;'>
                                <h3 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #F57C00; font-size: 18px; margin: 0 0 15px 0; text-align: center; font-weight: 600;'>
                                    📱 Don't Have the App Yet?
                                </h3>
                                
                                <p style='color: #1565C0; font-size: 14px; line-height: 1.5; margin-bottom: 15px; text-align: center;'>
                                    If you haven't already done so, install the DoDone app first, then log in with your account credentials to start creating tasks and having fun!
                                </p>
                                
                                <div style='text-align: center; margin: 15px 0;'>
                                    <div style='display: inline-block; margin: 0 5px;'>
                                        <a href='#' style='display: inline-block; margin: 3px;'>
                                            <img src='{_emailSettings.DownloadOnTheAppStoreImgLink}' 
                                                 alt='Download on App Store' style='height: 35px; border-radius: 6px;'>
                                        </a>
                                        <a href='#' style='display: inline-block; margin: 3px;'>
                                            <img src='https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png' 
                                                 alt='Get it on Google Play' style='height: 35px; border-radius: 6px;'>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            
                            <div style='background-color: #E8F5E8; padding: 20px; border-radius: 12px; margin: 25px 0;'>
                                <h4 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #4CAF50; font-size: 16px; margin: 0 0 10px 0; text-align: center; font-weight: 600;'>
                                    💡 DoDone Makes Everything Better
                                </h4>
                                <ul style='color: #1565C0; font-size: 14px; line-height: 1.5; margin: 10px 0; padding-left: 20px;'>
                                    <li>Turn chores into games with credits and grades</li>
                                    <li>Earn allowances and bonuses for completed tasks</li>
                                    <li>Stay organized with your family or team</li>
                                    <li>Track progress with beautiful dashboards</li>
                                    <li>Have fun while getting things done!</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div style='background-color: #2196F3; padding: 30px 20px; margin: 20px; border-radius: 16px; text-align: center;'>
                            <h3 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 20px; margin: 0 0 15px 0; font-weight: 600;'>
                                Need Help? We're Here for You! 🤝
                            </h3>
                            <div style='margin: 20px 0;'>
                                <a href='mailto:info@dodone.com' style='color: #ffffff; text-decoration: none; font-weight: 500; margin: 0 15px; font-size: 14px;'>
                                    📧 info@dodone.com
                                </a>
                                <a href='mailto:support@dodone.com' style='color: #ffffff; text-decoration: none; font-weight: 500; margin: 0 15px; font-size: 14px;'>
                                    🛠️ support@dodone.com
                                </a>
                                <a href='mailto:privacy@dodone.com' style='color: #ffffff; text-decoration: none; font-weight: 500; margin: 0 15px; font-size: 14px;'>
                                    🔒 privacy@dodone.com
                                </a>
                            </div>
                        </div>
                        
                        <div style='text-align: center; padding: 20px; color: #999; font-size: 12px; line-height: 1.5;'>
                            <p style='margin: 5px 0;'>
                                <strong style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #F57C00; font-size: 16px;'>DoDone</strong> - 
                                Making productivity fun for {(isBusiness ? "teams and businesses" : "families and teams")} worldwide
                            </p>
                            <p style='margin: 5px 0;'>
                                © {DateTime.Now.Year} DoDone App. All rights reserved.
                            </p>
                            <p style='margin: 5px 0;'>
                                You're receiving this email because you just registered for DoDone. 
                                <a href='mailto:privacy@dodone.com' style='color: #2196F3; text-decoration: none;'>Privacy Policy</a>
                            </p>
                        </div>
                    </body>
                    </html>",
                TextBody = $@"
🎯 DoDone - Welcome to the {(isBusiness ? "Team" : "Family")}!

Hi {firstName},

Welcome to DoDone! You've just joined thousands of families and teams who are getting things done while having fun!

🚀 Ready to Start? Open DoDone Now!

If you already have the app installed, use these links to open DoDone:
• Open DoDone App: {appRedirectUrl}
• Open Web Version: {webAppUrl}

📱 Don't Have the App Yet?

If you haven't already done so, install the DoDone app first, then log in with your account credentials to start creating tasks and having fun!

App Store: Coming soon
Google Play: Coming soon

💡 DoDone Makes Everything Better:
• Turn chores into games with credits and grades
• Earn allowances and bonuses for completed tasks
• Stay organized with your family or team
• Track progress with beautiful dashboards
• Have fun while getting things done!

🤝 Need Help? We're Here for You!
General Info: info@dodone.com
Technical Support: support@dodone.com
Privacy Questions: privacy@dodone.com

DoDone - Making productivity fun for {(isBusiness ? "teams and businesses" : "families and teams")} worldwide
© {DateTime.Now.Year} DoDone App. All rights reserved.

You're receiving this email because you just registered for DoDone.
For privacy questions, contact privacy@dodone.com
"
            };

            message.Body = bodyBuilder.ToMessageBody();
            await SendEmail(message);

            _logger.LogInformation("Welcome email sent successfully to {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send welcome email to {Email}", email);
            throw new InvalidOperationException($"Failed to send welcome email: {ex.Message}", ex);
        }
    }

    private string GenerateTierFeaturesHtml(bool isBusiness)
    {
        var teamOrFamily = isBusiness ? "team members" : "family members";
        var checkmark = "✓";
        
        // Define features with their FREE and PRO values
        var features = new List<(string Name, string FreeValue, string ProValue)>
        {
            ("Allowance intervals", $"Max {_subscriptionSettings.MaxFreeAllowanceIntervalsPerTeam}", "Unlimited"),
            (isBusiness ? "Team members" : "Family members", $"Max {_subscriptionSettings.MaxFreeUsersPerTeam}", "Unlimited"),
            ("Tasks", $"Max {_subscriptionSettings.MaxFreeTasksPerTeam}", "Unlimited"),
            ("Basic task management", checkmark, checkmark),
            ("GPA calculation", checkmark, checkmark),
            ("Emoji avatars", checkmark, checkmark),
            ("Basic notifications", checkmark, checkmark),
            ("Grade configuration", "", checkmark),
            ("Bonuses", "", checkmark),
            ("Image avatars", "", checkmark),
            ("Multi-select tasks", "", checkmark),
            ("Private tasks", "", checkmark),
            ("Proposed tasks", "", checkmark),
            ("Task comments", "", checkmark),
            ("Task groups, kinds, categories", "", checkmark),
            ("Celebration effects", "", checkmark),
            ("Advanced filters", "", checkmark),
            ("Email support", "", checkmark)
        };

        var rowsHtml = string.Join("", features.Select((f, index) =>
        {
            var bgColor = index % 2 == 0 ? "#F9F9F9" : "#FFFFFF";
            var freeCell = string.IsNullOrEmpty(f.FreeValue) 
                ? "" 
                : (f.FreeValue == checkmark 
                    ? $"<span style='color: #4CAF50; font-size: 16px;'>{checkmark}</span>" 
                    : $"<span style='color: #666; font-size: 12px;'>{f.FreeValue}</span>");
            var proCell = f.ProValue == checkmark 
                ? $"<span style='color: #4CAF50; font-size: 16px;'>{checkmark}</span>" 
                : $"<span style='color: #2196F3; font-weight: 500; font-size: 12px;'>{f.ProValue}</span>";
            
            return $@"
                <tr style='background-color: {bgColor};'>
                    <td class='feature-name' style='padding: 8px 6px; text-align: left; color: #424242; font-size: 13px; border-bottom: 1px solid #E0E0E0;'>{f.Name}</td>
                    <td class='feature-value' style='padding: 8px 4px; text-align: center; border-bottom: 1px solid #E0E0E0;'>{freeCell}</td>
                    <td class='feature-value' style='padding: 8px 4px; text-align: center; border-bottom: 1px solid #E0E0E0;'>{proCell}</td>
                </tr>";
        }));

        return $@"
            <div style='margin: 20px 0;'>
                <h3 class='comparison-title' style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #E65100; font-size: 18px; margin: 0 0 15px 0; font-weight: 600; text-align: center;'>
                    🎁 Plan Comparison
                </h3>
                
                <table style='width: 100%; border-collapse: collapse; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);'>
                    <thead>
                        <tr style='background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);'>
                            <th class='header-col' style='padding: 10px 6px; text-align: left; font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #1976D2; font-size: 13px; font-weight: 600; border-bottom: 2px solid #2196F3;'>FEATURES</th>
                            <th class='header-col' style='padding: 10px 4px; text-align: center; font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #757575; font-size: 12px; font-weight: 600; border-bottom: 2px solid #2196F3;'>FREE</th>
                            <th class='header-col' style='padding: 10px 4px; text-align: center; font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #1976D2; font-size: 12px; font-weight: 600; border-bottom: 2px solid #2196F3;'>⭐ PRO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rowsHtml}
                    </tbody>
                </table>
            </div>";
    }

    public async Task SendSubscriptionEmailAsync(string email, string firstName, string subject, string message, bool isBusiness = false)
    {
        try
        {
            if (!_emailSettings.IsEnabled)
            {
                _logger.LogWarning("Email service is disabled. Skipping subscription email to {Email}", email);
                return;
            }

            var mailMessage = new MimeMessage();
            mailMessage.From.Add(new MailboxAddress(_emailSettings.FromName, _emailSettings.FromEmail));
            mailMessage.To.Add(new MailboxAddress("", email));
            mailMessage.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
                        <meta http-equiv=""Content-Type"" content=""text/html; charset=UTF-8"">
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
                            .fredoka {{ font-family: 'Fredoka', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }}
                            
                            @media only screen and (max-width: 600px) {{
                                .email-container {{ max-width: 100% !important; }}
                                .header {{ padding: 20px 10px !important; border-radius: 0 !important; }}
                                .header h1 {{ font-size: 28px !important; }}
                                .header p {{ font-size: 14px !important; }}
                                .content-box {{ padding: 20px 15px !important; margin: 0 10px !important; border-radius: 12px !important; }}
                                .greeting {{ font-size: 20px !important; margin-bottom: 15px !important; }}
                                .message-box {{ padding: 15px !important; margin: 15px 0 !important; }}
                                .message-box p {{ font-size: 14px !important; }}
                                .comparison-title {{ font-size: 16px !important; }}
                                .feature-name {{ font-size: 12px !important; padding: 6px 4px !important; }}
                                .feature-value {{ padding: 6px 2px !important; }}
                                .header-col {{ font-size: 11px !important; padding: 8px 4px !important; }}
                                .thank-you {{ font-size: 14px !important; margin: 15px 0 !important; }}
                                .cta-box {{ margin: 20px 0 !important; }}
                                .cta-text {{ font-size: 14px !important; margin-bottom: 10px !important; }}
                                .cta-button {{ padding: 10px 20px !important; font-size: 14px !important; }}
                                .help-box {{ padding: 20px 15px !important; margin: 10px !important; border-radius: 12px !important; }}
                                .help-title {{ font-size: 16px !important; }}
                                .help-link {{ font-size: 12px !important; margin: 0 5px !important; display: block !important; margin: 8px 0 !important; }}
                                .footer {{ padding: 15px 10px !important; }}
                            }}
                        </style>
                    </head>
                    <body style='font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #FFF8E1;'>
                        <div class='email-container' style='max-width: 650px; margin: 0 auto;'>
                            <div class='header' style='background: linear-gradient(135deg, #F57C00 0%, #E65100 100%); padding: 30px 15px; text-align: center; border-radius: 0 0 16px 16px;'>
                                <h1 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 36px; margin: 0 0 8px 0; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);'>
                                    🎯 DoDone
                                </h1>
                                <p style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 16px; margin: 0; font-weight: 500; opacity: 0.95;'>
                                    Task Management • Rewards • Fun
                                </p>
                            </div>
                            
                            <div class='content-box' style='padding: 25px 20px; background-color: #ffffff; margin: 15px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);'>
                                <h2 class='greeting' style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #E65100; font-size: 22px; margin: 0 0 15px 0; font-weight: 600;'>
                                    Hi {firstName},
                                </h2>
                                
                                <div class='message-box' style='background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%); padding: 18px; border-radius: 10px; margin: 20px 0; border: 2px solid #2196F3;'>
                                    <p style='color: #424242; font-size: 15px; line-height: 1.5; margin: 0;'>
                                        {message}
                                    </p>
                                </div>
                                
                                {GenerateTierFeaturesHtml(isBusiness)}
                                
                                <p class='thank-you' style='color: #424242; font-size: 15px; line-height: 1.5; margin: 20px 0;'>
                                    Thank you for being a valued DoDone user! If you have any questions or need assistance, our support team is here to help.
                                </p>
                                
                                <div class='cta-box' style='text-align: center; margin: 25px 0;'>
                                    <p class='cta-text' style='color: #424242; font-size: 15px; margin-bottom: 12px;'>Manage your subscription in the app:</p>
                                    <a href='{_emailSettings.DownloadOnTheAppStoreImgLink}' 
                                       class='cta-button' style='background-color: #4CAF50; color: white; padding: 12px 24px; 
                                              text-decoration: none; border-radius: 8px; display: inline-block;
                                              font-weight: bold; font-size: 15px; box-shadow: 0 4px 12px rgba(76,175,80,0.3);'>
                                        🎯 Open DoDone App
                                    </a>
                                </div>
                            </div>
                            
                            <div class='help-box' style='background-color: #2196F3; padding: 25px 15px; margin: 15px; border-radius: 12px; text-align: center;'>
                                <h3 class='help-title' style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 18px; margin: 0 0 12px 0; font-weight: 600;'>
                                    Need Help? We're Here for You! 🤝
                                </h3>
                                <div style='margin: 15px 0;'>
                                    <a href='mailto:info@dodone.com' class='help-link' style='color: #ffffff; text-decoration: none; font-weight: 500; margin: 0 10px; font-size: 13px;'>
                                        📧 info@dodone.com
                                    </a>
                                    <br />
                                    <a href='mailto:support@dodone.com' class='help-link' style='color: #ffffff; text-decoration: none; font-weight: 500; margin: 0 10px; font-size: 13px;'>
                                        🛠️ support@dodone.com
                                    </a>
                                    <br />
                                    <a href='mailto:privacy@dodone.com' class='help-link' style='color: #ffffff; text-decoration: none; font-weight: 500; margin: 0 10px; font-size: 13px;'>
                                        🔒 privacy@dodone.com
                                    </a>
                                </div>
                            </div>
                        
                            <div class='footer' style='text-align: center; padding: 20px 15px; color: #999; font-size: 12px; line-height: 1.5;'>
                                <p style='margin: 5px 0;'>
                                    <strong style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #F57C00; font-size: 14px;'>DoDone</strong> - 
                                    Making productivity fun for {(isBusiness ? "teams and businesses" : "families and teams")} worldwide
                                </p>
                                <p style='margin: 5px 0;'>
                                    © {DateTime.Now.Year} DoDone App. All rights reserved.
                                </p>
                                <p style='margin: 5px 0;'>
                                    You're receiving this email because you have an active DoDone account. 
                                    <a href='mailto:privacy@dodone.com' style='color: #2196F3; text-decoration: none;'>Privacy Policy</a>
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>"
            };

            mailMessage.Body = bodyBuilder.ToMessageBody();
            await SendEmail(mailMessage);

            _logger.LogInformation("Subscription email sent successfully to {Email}: {Subject}", email, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send subscription email to {Email}", email);
            // Don't throw - email failures shouldn't break webhook processing
        }
    }

    public Task SendTrialWelcomeEmailAsync(string email, string firstName, bool isBusiness, bool isGrandfathered, int gracePeriodDays)
    {
        var teamOrFamily = isBusiness ? "team" : "family";
        var subject = "Welcome to DoDone PRO Free Trial!";
        var message = isGrandfathered 
            ? $"Thanks for being an early adopter! We've now launched DoDone PRO subscriptions. As our valued founding member, you'll get an exclusive {gracePeriodDays}-day grace period to continue enjoying all PRO features FREE before needing to subscribe. We hope you and your {teamOrFamily} stay motivated, organized and productive with DoDone!"
            : $"Try DoDone PRO FREE for {gracePeriodDays} days. Enjoy exploring all the features we offer to help you and your {teamOrFamily} stay motivated, organized and productive!";

        return SendSubscriptionEmailAsync(email, firstName, subject, message, isBusiness);
    }

    public Task SendTrial3DayWarningEmailAsync(string email, string firstName, bool isBusiness, bool isGrandfathered, int gracePeriodDays)
    {
        var teamOrFamily = isBusiness ? "team" : "family";
        var subject = "DoDone PRO Trial Ending Soon!";
        var message = isGrandfathered 
            ? $"Your exclusive {gracePeriodDays}-day grace period ends in 3 days. Subscribe now to continue enjoying unlimited access to all DoDone PRO features and keep your {teamOrFamily} motivated and productive! Thanks for being a valued founding member!"
            : $"Your DoDone PRO FREE trial ends in 3 days! Subscribe now to continue enjoying unlimited access to all PRO features and to keep your {teamOrFamily} motivated and productive!";

        return SendSubscriptionEmailAsync(email, firstName, subject, message, isBusiness);
    }

    public Task SendTrial1DayWarningEmailAsync(string email, string firstName, bool isBusiness, bool isGrandfathered, int gracePeriodDays)
    {
        var teamOrFamily = isBusiness ? "team" : "family";
        var subject = "Last Chance: DoDone PRO Trial Ends Tomorrow!";
        var message = isGrandfathered 
            ? $"Your exclusive {gracePeriodDays}-day grace period ends tomorrow. Subscribe now to continue enjoying unlimited access to all DoDone PRO features and keep your {teamOrFamily} motivated and productive! We appreciate you being a founding member!"
            : $"Your DoDone PRO FREE trial ends tomorrow! Subscribe now to continue enjoying unlimited access to all PRO features and keep your {teamOrFamily} motivated and productive!";

        return SendSubscriptionEmailAsync(email, firstName, subject, message, isBusiness);
    }

    public Task SendTrialEndedWarningEmailAsync(string email, string firstName, bool isBusiness, bool isGrandfathered, int gracePeriodDays)
    {
        var teamOrFamily = isBusiness ? "team" : "family";
        var subject = "DoDone PRO Trial Has Ended";
        var message = isGrandfathered 
            ? $"Your exclusive {gracePeriodDays}-day grace period has ended. To continue enjoying unlimited access to all DoDone PRO features, please subscribe now and keep your {teamOrFamily} motivated and productive! Thank you for being a valued founding member!"
            : $"Your DoDone PRO FREE trial has ended. To continue enjoying unlimited access to all PRO features, please subscribe now and keep your {teamOrFamily} motivated and productive!";

        return SendSubscriptionEmailAsync(email, firstName, subject, message, isBusiness);
    }

    public async Task SendAccountDeletionByUserEmailAsync(string email, string firstName, bool isBusiness = false, bool isTeamDeleted = false)
    {
        try
        {
            if (!_emailSettings.IsEnabled)
            {
                _logger.LogInformation("Email is disabled. Account deletion email would be sent to {Email}", email);
                return;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_emailSettings.FromName, _emailSettings.FromEmail));
            message.To.Add(new MailboxAddress("", email));
            message.Subject = "Your DoDone Account Has Been Deleted";

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
                    <html>
                    <head>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
                            .fredoka {{ font-family: 'Fredoka', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }}
                        </style>
                    </head>
                    <body style='font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background-color: #FFF8E1;'>
                        <div style='background: linear-gradient(135deg, #F57C00 0%, #E65100 100%); padding: 40px 20px; text-align: center; border-radius: 0 0 20px 20px;'>
                            <h1 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 42px; margin: 0 0 10px 0; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);'>
                                🎯 DoDone
                            </h1>
                            <p style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 18px; margin: 0; font-weight: 500; opacity: 0.95;'>
                                Account Deletion Confirmation
                            </p>
                        </div>
                        
                        <div style='padding: 40px 30px; background-color: #ffffff; margin: 0 20px; border-radius: 16px; margin-top: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);'>
                            <h2 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #E65100; font-size: 28px; margin: 0 0 20px 0; text-align: center; font-weight: 600;'>
                                Account Deleted Successfully
                            </h2>
                            
                            <p style='color: #424242; font-size: 16px; line-height: 1.6; margin-bottom: 20px;'>
                                Hi {firstName},
                            </p>
                            
                            <p style='color: #424242; font-size: 16px; line-height: 1.6; margin-bottom: 20px;'>
                                Your DoDone account has been deleted at your request. All your personal data has been permanently removed from our system.
                            </p>
                            
                            <div style='background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid #EF5350;'>
                                <h3 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #C62828; font-size: 20px; margin: 0 0 15px 0; text-align: center; font-weight: 600;'>
                                    What This Means
                                </h3>
                                <ul style='color: #424242; font-size: 14px; line-height: 1.6; margin: 10px 0; padding-left: 20px;'>
                                    <li>Your account and all associated data have been permanently deleted</li>
                                    <li>You will no longer receive emails from DoDone (except this confirmation)</li>
                                    { (isTeamDeleted ? $"<li>Your {(isBusiness ? "team" : "family")} has also been deleted. All team data is no longer accessible to other members.</li>" : "") }
                                    { (!isTeamDeleted ? $"<li>Your {(isBusiness ? "team" : "family")} data remains accessible to other members</li>" : "") }
                                    <li>This action cannot be undone</li>
                                </ul>
                            </div>
                            
                            <p style='color: #424242; font-size: 16px; line-height: 1.6; margin-bottom: 20px;'>
                                We're sorry to see you go! If you ever decide to return, you're always welcome to create a new account.
                            </p>
                            
                            <p style='color: #424242; font-size: 16px; line-height: 1.6; margin-bottom: 20px;'>
                                If you didn't request this deletion or believe this was done in error, please contact us immediately at <a href='mailto:support@dodone.com' style='color: #2196F3; text-decoration: none;'>support@dodone.com</a>.
                            </p>
                        </div>
                        
                        <div style='background-color: #2196F3; padding: 30px 20px; margin: 20px; border-radius: 16px; text-align: center;'>
                            <h3 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 20px; margin: 0 0 15px 0; font-weight: 600;'>
                                Questions? We're Here to Help! 🤝
                            </h3>
                            <div style='margin: 20px 0;'>
                                <a href='mailto:info@dodone.com' style='color: #ffffff; text-decoration: none; font-weight: 500; margin: 0 15px; font-size: 14px;'>
                                    📧 info@dodone.com
                                </a>
                                <a href='mailto:support@dodone.com' style='color: #ffffff; text-decoration: none; font-weight: 500; margin: 0 15px; font-size: 14px;'>
                                    🛠️ support@dodone.com
                                </a>
                                <a href='mailto:privacy@dodone.com' style='color: #ffffff; text-decoration: none; font-weight: 500; margin: 0 15px; font-size: 14px;'>
                                    🔒 privacy@dodone.com
                                </a>
                            </div>
                        </div>
                        
                        <div style='text-align: center; padding: 20px; color: #999; font-size: 12px; line-height: 1.5;'>
                            <p style='margin: 5px 0;'>
                                <strong style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #F57C00; font-size: 16px;'>DoDone</strong> - 
                                Making productivity fun for {(isBusiness ? "teams and businesses" : "families and teams")} worldwide
                            </p>
                            <p style='margin: 5px 0;'>
                                © {DateTime.Now.Year} DoDone App. All rights reserved.
                            </p>
                        </div>
                    </body>
                    </html>",
                TextBody = $@"
🎯 DoDone - Account Deletion Confirmation

Hi {firstName},

Your DoDone account has been deleted at your request. All your personal data has been permanently removed from our system.

What This Means:
• Your account and all associated data have been permanently deleted
• You will no longer receive emails from DoDone (except this confirmation)
{ (isTeamDeleted ? $"• Your {(isBusiness ? "team" : "family")} has also been deleted. Your team data is no longer accessible to other members\n" : "") }
{ (!isTeamDeleted ? $"• Your {(isBusiness ? "team" : "family")} data remains accessible to other members\n" : "") }
• This action cannot be undone

We're sorry to see you go! If you ever decide to return, you're always welcome to create a new account.

If you didn't request this deletion or believe this was done in error, please contact us immediately at support@dodone.com.

Questions? We're Here to Help!
General Info: info@dodone.com
Technical Support: support@dodone.com
Privacy Questions: privacy@dodone.com

DoDone - Making productivity fun for {(isBusiness ? "teams and businesses" : "families and teams")} worldwide
© {DateTime.Now.Year} DoDone App. All rights reserved.
"
            };

            message.Body = bodyBuilder.ToMessageBody();
            await SendEmail(message);

            _logger.LogInformation("Account deletion (by user) email sent successfully to {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send account deletion (by user) email to {Email}", email);
            throw new InvalidOperationException($"Failed to send account deletion email: {ex.Message}", ex);
        }
    }

    public async Task SendAccountDeletionByAdminEmailAsync(string email, string firstName, bool isBusiness = false, bool isTeamDeleted = false)
    {
        try
        {
            if (!_emailSettings.IsEnabled)
            {
                _logger.LogInformation("Email is disabled. Account deletion email would be sent to {Email}", email);
                return;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_emailSettings.FromName, _emailSettings.FromEmail));
            message.To.Add(new MailboxAddress("", email));
            message.Subject = "Your DoDone Account Has Been Deleted";

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
                    <html>
                    <head>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
                            .fredoka {{ font-family: 'Fredoka', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }}
                        </style>
                    </head>
                    <body style='font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background-color: #FFF8E1;'>
                        <div style='background: linear-gradient(135deg, #F57C00 0%, #E65100 100%); padding: 40px 20px; text-align: center; border-radius: 0 0 20px 20px;'>
                            <h1 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 42px; margin: 0 0 10px 0; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);'>
                                🎯 DoDone
                            </h1>
                            <p style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 18px; margin: 0; font-weight: 500; opacity: 0.95;'>
                                Account Deletion Notice
                            </p>
                        </div>
                        
                        <div style='padding: 40px 30px; background-color: #ffffff; margin: 0 20px; border-radius: 16px; margin-top: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);'>
                            <h2 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #E65100; font-size: 28px; margin: 0 0 20px 0; text-align: center; font-weight: 600;'>
                                Account Deleted by Administrator
                            </h2>
                            
                            <p style='color: #424242; font-size: 16px; line-height: 1.6; margin-bottom: 20px;'>
                                Hi {firstName},
                            </p>
                            
                            <p style='color: #424242; font-size: 16px; line-height: 1.6; margin-bottom: 20px;'>
                                Your DoDone account has been deleted by a {(isBusiness ? "team" : "family")} administrator. All your personal data has been permanently removed from our system.
                            </p>
                            
                            <div style='background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid #EF5350;'>
                                <h3 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #C62828; font-size: 20px; margin: 0 0 15px 0; text-align: center; font-weight: 600;'>
                                    What This Means
                                </h3>
                                <ul style='color: #424242; font-size: 14px; line-height: 1.6; margin: 10px 0; padding-left: 20px;'>
                                    <li>Your account and all associated data have been permanently deleted</li>
                                    <li>You will no longer receive emails from DoDone (except this notification)</li>
                                    { (isTeamDeleted ? $"<li>Your {(isBusiness ? "team" : "family")} has also been deleted. All team data is no longer accessible to other members.</li>" : "") }
                                    { (!isTeamDeleted ? $"<li>Your {(isBusiness ? "team" : "family")} data remains accessible to other members</li>" : "") }
                                    <li>This action cannot be undone</li>
                                </ul>
                            </div>
                            
                            <p style='color: #424242; font-size: 16px; line-height: 1.6; margin-bottom: 20px;'>
                                If you have questions about why your account was deleted, please contact your {(isBusiness ? "team" : "family")} administrator.
                            </p>
                            
                            <p style='color: #424242; font-size: 16px; line-height: 1.6; margin-bottom: 20px;'>
                                If you believe this was done in error, please contact us at <a href='mailto:support@dodone.com' style='color: #2196F3; text-decoration: none;'>support@dodone.com</a>.
                            </p>
                        </div>
                        
                        <div style='background-color: #2196F3; padding: 30px 20px; margin: 20px; border-radius: 16px; text-align: center;'>
                            <h3 style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 20px; margin: 0 0 15px 0; font-weight: 600;'>
                                Questions? We're Here to Help! 🤝
                            </h3>
                            <div style='margin: 20px 0;'>
                                <a href='mailto:info@dodone.com' style='color: #ffffff; text-decoration: none; font-weight: 500; margin: 0 15px; font-size: 14px;'>
                                    📧 info@dodone.com
                                </a>
                                <a href='mailto:support@dodone.com' style='color: #ffffff; text-decoration: none; font-weight: 500; margin: 0 15px; font-size: 14px;'>
                                    🛠️ support@dodone.com
                                </a>
                                <a href='mailto:privacy@dodone.com' style='color: #ffffff; text-decoration: none; font-weight: 500; margin: 0 15px; font-size: 14px;'>
                                    🔒 privacy@dodone.com
                                </a>
                            </div>
                        </div>
                        
                        <div style='text-align: center; padding: 20px; color: #999; font-size: 12px; line-height: 1.5;'>
                            <p style='margin: 5px 0;'>
                                <strong style='font-family: ""Fredoka"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #F57C00; font-size: 16px;'>DoDone</strong> - 
                                Making productivity fun for {(isBusiness ? "teams and businesses" : "families and teams")} worldwide
                            </p>
                            <p style='margin: 5px 0;'>
                                © {DateTime.Now.Year} DoDone App. All rights reserved.
                            </p>
                        </div>
                    </body>
                    </html>",
                TextBody = $@"
🎯 DoDone - Account Deletion Notice

Hi {firstName},

Your DoDone account has been deleted by a {(isBusiness ? "team" : "family")} administrator. All your personal data has been permanently removed from our system.

What This Means:
• Your account and all associated data have been permanently deleted
• You will no longer receive emails from DoDone (except this notification)
{ (isTeamDeleted ? $"• Your {(isBusiness ? "team" : "family")} has also been deleted. Your {(isBusiness ? "team" : "family")} data is no longer accessible to other members\n" : "") }
{ (!isTeamDeleted ? $"• Your {(isBusiness ? "team" : "family")} data remains accessible to other members\n" : "") }
• This action cannot be undone

If you have questions about why your account was deleted, please contact your {(isBusiness ? "team" : "family")} administrator.

If you believe this was done in error, please contact us at support@dodone.com.

Questions? We're Here to Help!
General Info: info@dodone.com
Technical Support: support@dodone.com
Privacy Questions: privacy@dodone.com

DoDone - Making productivity fun for {(isBusiness ? "teams and businesses" : "families and teams")} worldwide
© {DateTime.Now.Year} DoDone App. All rights reserved.
"
            };

            message.Body = bodyBuilder.ToMessageBody();
            await SendEmail(message);

            _logger.LogInformation("Account deletion (by admin) email sent successfully to {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send account deletion (by admin) email to {Email}", email);
            throw new InvalidOperationException($"Failed to send account deletion email: {ex.Message}", ex);
        }
    }
}
