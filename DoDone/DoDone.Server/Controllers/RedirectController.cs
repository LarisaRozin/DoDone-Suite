/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using DoDone.Server.Services;

namespace DoDone.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RedirectController : ControllerBase
{
    private readonly ILogger<RedirectController> _logger;
    private readonly EmailSettings _emailSettings;

    public RedirectController(ILogger<RedirectController> logger, IOptions<EmailSettings> emailSettings)
    {
        _logger = logger;
        _emailSettings = emailSettings.Value;
    }

    [HttpGet("reset-password")]
    public IActionResult ResetPassword([FromQuery] string token, [FromQuery] string email)
    {
        if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(email))
        {
            return BadRequest("Missing token or email");
        }

        _logger.LogInformation("Redirect request for password reset: {Email}", email);

        // Create the deep link
        var deepLink = $"dodone://reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(email)}";
        
        // Return HTML that attempts to open the app and provides fallbacks
        var html = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <title>DoDone - Opening App...</title>
    <link href='https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap' rel='stylesheet'>
    <style>
        body {{
            font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background: #FFF8E1;
            text-align: center;
            min-height: 100vh;
            color: #424242;
        }}
        .container {{
            max-width: 600px;
            margin: 50px auto;
            background: #FFECB3;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }}
        .logo {{
            font-family: 'Fredoka', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            font-size: 3rem;
            font-weight: 600;
            color: #F57C00;
            margin-bottom: 30px;
        }}
        .message {{
            color: #424242;
            margin-bottom: 30px;
            line-height: 1.6;
            font-size: 1rem;
        }}
        .button {{
            display: inline-block;
            background: #F57C00;
            color: #fff;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 12px;
            font-family: 'Fredoka', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            font-weight: 600;
            font-size: 1rem;
            margin: 10px;
            transition: background-color 0.2s ease;
        }}
        .button:hover {{
            background: #E65100;
        }}
        .button.secondary {{
            background: #2196F3;
        }}
        .button.secondary:hover {{
            background: #1565C0;
        }}
        .fallback {{
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #E0E0E0;
            color: #1565C0;
            font-size: 14px;
        }}
        .fallback a {{
            color: #F57C00;
            text-decoration: none;
            font-weight: 500;
        }}
        .fallback a:hover {{
            color: #E65100;
            text-decoration: underline;
        }}
        .loading {{
            color: #1565C0;
            font-style: italic;
            font-weight: 500;
        }}
        #debug-info {{
            background: #E8F5E8;
            border: 1px solid #4CAF50;
            padding: 15px;
            margin: 20px 0;
            font-family: 'Roboto', monospace;
            font-size: 12px;
            text-align: left;
            border-radius: 8px;
            color: #424242;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='logo'>DoDone</div>
        <div class='message'>
            <div class='loading' id='loading'>Opening DoDone app...</div>
            <div id='fallback' style='display: none;'>
                <p><strong>Having trouble opening the app?</strong></p>
                <p>Click the button below to try again, or reset your password on the web.</p>
            </div>
        </div>
        
        <a href='{deepLink}' class='button' id='appButton'>Open DoDone App</a>
        <a href='{_emailSettings.ResetPasswordBaseUrl}?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(email)}' class='button secondary'>Reset on Web</a>
        
        <div class='fallback'>
            <p>If you don't have the DoDone app installed:</p>
            <p><a href='https://play.google.com/store' target='_blank'>Download for Android</a> | 
               <a href='https://apps.apple.com' target='_blank'>Download for iOS</a></p>
        </div>
    </div>

    <script>
        function debugLog(message) {{
            console.log(message);
            const debugDiv = document.getElementById('debug-log');
            if (debugDiv) {{
                debugDiv.innerHTML += message + '<br>';
            }}
        }}

        function tryOpenApp() {{
            // debugLog('Attempting to open deep link: {deepLink}');
            // debugLog('User Agent: ' + navigator.userAgent);
            
            // Try multiple methods for different browsers
            try {{
                // Method 1: Direct assignment (works in most browsers)
                // debugLog('Trying Method 1: window.location.href');
                window.location.href = '{deepLink}';
                // debugLog('Method 1: Command executed successfully');
            }} catch (e) {{
                // debugLog('Method 1 failed: ' + e.message);
                
                // Method 2: Create and click a temporary link
                try {{
                    // debugLog('Trying Method 2: temporary link click');
                    const link = document.createElement('a');
                    link.href = '{deepLink}';
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    // debugLog('Method 2: Command executed successfully');
                }} catch (e2) {{
                    // debugLog('Method 2 failed: ' + e2.message);
                    
                    // Method 3: Try window.open
                    try {{
                        // debugLog('Trying Method 3: window.open');
                        window.open('{deepLink}', '_system');
                        // debugLog('Method 3: Command executed successfully');
                    }} catch (e3) {{
                        // debugLog('All methods failed. Method 3 error: ' + e3.message);
                    }}
                }}
            }}
        }}

        // Auto-attempt to open the app with enhanced error handling
        setTimeout(function() {{
            tryOpenApp();
        }}, 1000);

        // Show fallback after a delay
        setTimeout(function() {{
            document.getElementById('loading').style.display = 'none';
            document.getElementById('fallback').style.display = 'block';
        }}, 3000);

        // Try again if user clicks back
        document.getElementById('appButton').addEventListener('click', function(e) {{
            e.preventDefault();
            tryOpenApp();
            
            // Show fallback if app doesn't open
            setTimeout(function() {{
                document.getElementById('loading').style.display = 'none';
                document.getElementById('fallback').style.display = 'block';
            }}, 2000);
        }});

        // Add visibility change detection to see if app opened
        document.addEventListener('visibilitychange', function() {{
            if (document.hidden) {{
                // debugLog('Page became hidden - app might have opened');
            }} else {{
                // debugLog('Page became visible again');
            }}
        }});
    </script>
</body>
</html>";

        return Content(html, "text/html");
    }
}
