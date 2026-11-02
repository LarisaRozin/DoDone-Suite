using DoDone.Server.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DoDone.Server.Tests;

/// <summary>
/// Simple test to verify email service functionality
/// Run this manually or with a testing framework
/// </summary>
public class EmailServiceTest
{
    public static async Task TestEmailService()
    {
        // Configure email settings for testing
        var emailSettings = new EmailSettings
        {
            SmtpHost = "localhost",
            SmtpPort = 1025, // MailHog default port
            SmtpUser = "",
            SmtpPassword = "",
            UseSsl = false,
            FromEmail = "test@localhost",
            FromName = "DoDone Test",
            IsEnabled = true,
            ResetPasswordBaseUrl = "https://localhost:5215/reset-password"
        };

        // Create a mock logger (in a real test, use a proper testing framework)
        var logger = new ConsoleLogger();

        // Create the email service
        var emailService = new EmailService(Options.Create(emailSettings), logger);

        try
        {
            // Test sending a password reset email
            await emailService.SendPasswordResetEmailAsync("test@example.com", "sample-token-123");
            Console.WriteLine("✅ Email sent successfully!");
            Console.WriteLine("📧 Check MailHog at http://localhost:8025 to see the email");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error sending email: {ex.Message}");
        }
    }

    // Simple console logger for testing
    private class ConsoleLogger : ILogger<EmailService>
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        {
            Console.WriteLine($"[{logLevel}] {formatter(state, exception)}");
        }
    }
}

// To run this test:
// 1. Start MailHog: mailhog
// 2. Add this code to a test project or console app
// 3. Call EmailServiceTest.TestEmailService().Wait();
