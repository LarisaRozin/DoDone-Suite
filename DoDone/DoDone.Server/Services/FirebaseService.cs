/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;

namespace DoDone.Server.Services;

public interface IFirebaseService
{
    Task<string> SendNotificationAsync(string fcmToken, string title, string body, Dictionary<string, string>? data, Func<string, Task>? onExpiredToken = null);
    Task<BatchResponse> SendMulticastNotificationAsync(List<string> fcmTokens, string title, string body, Dictionary<string, string>? data, Func<string, Task>? onExpiredToken = null);
}

public class FirebaseService : IFirebaseService
{
    private readonly ILogger<FirebaseService> _logger;
    private readonly FirebaseMessaging _messaging;
    private readonly CircuitBreaker _circuitBreaker;
    private static bool _isFirebaseInitialized = false;
    private static readonly object _lockObject = new object();

    public FirebaseService(ILogger<FirebaseService> logger, IConfiguration configuration, ICircuitBreakerFactory circuitBreakerFactory)
    {
        _logger = logger;
        _circuitBreaker = circuitBreakerFactory.CreateCircuitBreaker("Firebase");

        // Initialize Firebase Admin SDK
        var serviceAccountPath = configuration["Firebase:ServiceAccountPath"];
        
        // Use thread-safe singleton pattern to ensure Firebase is only initialized once
        lock (_lockObject)
        {
            if (!_isFirebaseInitialized)
            {
                GoogleCredential credential;
                
                // Check if service account file exists, if not try to create it from environment variable
                if (!string.IsNullOrEmpty(serviceAccountPath) && File.Exists(serviceAccountPath))
                {
                    using var stream = new FileStream(serviceAccountPath, FileMode.Open, FileAccess.Read);
                    credential = ServiceAccountCredential.FromServiceAccountData(stream).ToGoogleCredential();
                }
                else
                {
                    // Try to get Firebase service account JSON from environment variable
                    var serviceAccountJson = Environment.GetEnvironmentVariable("FIREBASE_SERVICE_ACCOUNT_JSON");
                    if (!string.IsNullOrEmpty(serviceAccountJson))
                    {
                        // Create the service account file from environment variable
                        File.WriteAllText(serviceAccountPath ?? "FirebaseServiceAccountKey.json", serviceAccountJson);
                        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(serviceAccountJson));
                        credential = ServiceAccountCredential.FromServiceAccountData(stream).ToGoogleCredential();
                        _logger.LogInformation("Firebase service account key created from environment variable");
                    }
                    else
                    {
                        // Fall back to default credentials (this will likely fail but provides better error message)
                        _logger.LogWarning("Firebase service account file not found and FIREBASE_SERVICE_ACCOUNT_JSON environment variable not set. Trying default credentials.");
                        credential = GoogleCredential.GetApplicationDefault();
                    }
                }

                FirebaseApp.Create(new AppOptions()
                {
                    Credential = credential
                });
                _isFirebaseInitialized = true;
            }
        }
        
        _messaging = FirebaseMessaging.DefaultInstance;
    }

    public async Task<string> SendNotificationAsync(string fcmToken, string title, string body, Dictionary<string, string>? data, Func<string, Task>? onExpiredToken = null)
    {
        var message = new Message()
        {
            Token = fcmToken,
            Notification = new Notification()
            {
                Title = title,
                Body = body
            },
            Data = data ?? new Dictionary<string, string>(),
            Android = new AndroidConfig()
            {
                Notification = new AndroidNotification()
                {
                    Icon = "ic_notification",
                    Color = "#4CAF50"
                }
            },
            Apns = new ApnsConfig()
            {
                Aps = new Aps()
                {
                    Alert = new ApsAlert()
                    {
                        Title = title,
                        Body = body
                    },
                    Badge = 1,
                    Sound = "default"
                }
            }
        };

        string response = string.Empty;
        try
        {
            response = await _circuitBreaker.ExecuteAsync(async () =>
            {
                // Add timeout protection to prevent hanging
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
                return await _messaging.SendAsync(message, cts.Token);
            }, "SendNotification");
            
            _logger.LogInformation($"Successfully sent message: {response}");
        }
        catch (CircuitBreakerOpenException)
        {
            _logger.LogWarning($"Firebase circuit breaker is open - skipping notification send for token: {fcmToken}");
        }
        catch (OperationCanceledException)
        {
            _logger.LogError($"Firebase notification send timeout after 30 seconds for token: {fcmToken}");
        }
        catch (FirebaseMessagingException fex) when (fex.Message.Contains("Requested entity was not found"))
        {
            _logger.LogWarning($"Firebase token not found (expired/unregistered): {fcmToken}");
            if (onExpiredToken != null)
            {
                await onExpiredToken(fcmToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending notification to token: {fcmToken}");
        }

        return response;
    }

    public async Task<BatchResponse> SendMulticastNotificationAsync(List<string> fcmTokens, string title, string body, Dictionary<string, string>? data, Func<string, Task>? onExpiredToken = null)
    {
        var message = new MulticastMessage()
        {
            Tokens = fcmTokens,
            Notification = new Notification()
            {
                Title = title,
                Body = body
            },
            Data = data ?? new Dictionary<string, string>(),
            Android = new AndroidConfig()
            {
                Notification = new AndroidNotification()
                {
                    Icon = "ic_notification",
                    Color = "#4CAF50"
                }
            },
            Apns = new ApnsConfig()
            {
                Aps = new Aps()
                {
                    Alert = new ApsAlert()
                    {
                        Title = title,
                        Body = body
                    },
                    Badge = 1,
                    Sound = "default"
                }
            }
        };

        try
        {
            var response = await _circuitBreaker.ExecuteAsync(async () =>
            {
                // Add timeout protection to prevent hanging
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
                return await _messaging.SendEachForMulticastAsync(message, cts.Token);
            }, "SendMulticastNotification");
            
            _logger.LogInformation($"Successfully sent {response.SuccessCount} messages out of {fcmTokens.Count}");
            
            // Handle expired tokens in the batch response
            if (onExpiredToken != null && response.FailureCount > 0)
            {
                for (int i = 0; i < response.Responses.Count; i++)
                {
                    var sendResponse = response.Responses[i];
                    if (!sendResponse.IsSuccess && sendResponse.Exception != null)
                    {
                        var exception = sendResponse.Exception;
                        if (exception is FirebaseMessagingException fex && 
                            fex.Message.Contains("Requested entity was not found"))
                        {
                            var expiredToken = fcmTokens[i];
                            _logger.LogWarning($"Firebase token not found (expired/unregistered): {expiredToken}");
                            await onExpiredToken(expiredToken);
                        }
                    }
                }
            }
            
            return response;
        }
        catch (CircuitBreakerOpenException)
        {
            _logger.LogWarning($"Firebase circuit breaker is open - skipping multicast notification send for {fcmTokens.Count} tokens");
            throw;
        }
        catch (OperationCanceledException)
        {
            _logger.LogError($"Firebase multicast notification send timeout after 30 seconds for {fcmTokens.Count} tokens");
            throw new TimeoutException("Firebase multicast notification send operation timed out");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending multicast notification");
            throw;
        }
    }
}