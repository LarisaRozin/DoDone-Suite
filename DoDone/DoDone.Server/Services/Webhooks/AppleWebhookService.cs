/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using DoDone.Server.Dtos.Webhooks;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;

namespace DoDone.Server.Services.Webhooks;

public interface IAppleWebhookService
{
    Task<AppleNotificationPayload?> VerifyAndDecodeJwsAsync(string signedPayload);
    AppleTransactionInfo? DecodeTransactionInfoAsync(string signedTransactionInfo);
    Task<AppleReceiptValidationResponse?> VerifyReceiptAsync(string receiptData);
    Task<AppleTransactionInfo?> VerifyStoreKit2TransactionAsync(string signedTransactionInfo);
}

public class AppleWebhookService : IAppleWebhookService
{
    private readonly ILogger<AppleWebhookService> _logger;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private readonly JwtSecurityTokenHandler _jwtHandler;

    // Apple's root certificates for JWS verification
    // https://www.apple.com/certificateauthority/
    private const string AppleRootCAG3Url = "https://www.apple.com/certificateauthority/AppleRootCA-G3.cer";
    private const string AppleRootCAG2Url = "https://www.apple.com/certificateauthority/AppleRootCA-G2.cer";
    
    // Cache for Apple's root certificates (thread-safe)
    private static readonly SemaphoreSlim _certCacheLock = new SemaphoreSlim(1, 1);
    private static X509Certificate2? _cachedAppleRootG3;
    private static X509Certificate2? _cachedAppleRootG2;
    private static DateTime _cacheExpiration = DateTime.MinValue;

    public AppleWebhookService(
        ILogger<AppleWebhookService> logger,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _configuration = configuration;
        _httpClient = httpClientFactory.CreateClient();
        _jwtHandler = new JwtSecurityTokenHandler();
    }

    public async Task<AppleNotificationPayload?> VerifyAndDecodeJwsAsync(string signedPayload)
    {
        try
        {
            if (string.IsNullOrEmpty(signedPayload))
            {
                _logger.LogWarning("Empty signed payload received");
                return null;
            }

            _logger.LogInformation("VerifyAndDecodeJwsAsync received payload of length: {Length}, first 50 chars: {FirstChars}",
                signedPayload.Length, 
                signedPayload.Length > 50 ? signedPayload.Substring(0, 50) : signedPayload);

            // Decode the JWT without validation (for development)
            // In production, enable signature validation
            var skipValidation = _configuration.GetValue<bool>("Subscription:Apple:SkipJwsValidation", false);

            if (skipValidation)
            {
                _logger.LogWarning("Skipping JWS signature validation - NOT RECOMMENDED FOR PRODUCTION");
                
                var jwtToken = _jwtHandler.ReadJwtToken(signedPayload);
                var payload = jwtToken.Payload.SerializeToJson();
                var notification = JsonSerializer.Deserialize<AppleNotificationPayload>(payload);

                return notification;
            }

            // Production: Verify JWS signature
            // This requires downloading and validating Apple's certificates
            var validatedPayload = await VerifyJwsSignatureAsync(signedPayload);
            
            if (validatedPayload == null)
            {
                _logger.LogError("Failed to verify JWS signature");
                return null;
            }

            return validatedPayload;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying and decoding Apple JWS");
            return null;
        }
    }

    public AppleTransactionInfo? DecodeTransactionInfoAsync(string signedTransactionInfo)
    {
        try
        {
            if (string.IsNullOrEmpty(signedTransactionInfo))
            {
                return null;
            }

            // Decode the signed transaction info JWT
            var jwtToken = _jwtHandler.ReadJwtToken(signedTransactionInfo);
            var payload = jwtToken.Payload.SerializeToJson();
            var transactionInfo = JsonSerializer.Deserialize<AppleTransactionInfo>(payload);

            _logger.LogInformation("Decoded Apple transaction info: {TransactionId}", 
                transactionInfo?.TransactionId);

            return transactionInfo;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error decoding Apple transaction info");
            return null;
        }
    }

    public async Task<AppleTransactionInfo?> VerifyStoreKit2TransactionAsync(string signedTransactionInfo)
    {
        try
        {
            if (string.IsNullOrEmpty(signedTransactionInfo))
            {
                _logger.LogWarning("Empty signedTransactionInfo received");
                return null;
            }

            _logger.LogInformation("VerifyStoreKit2TransactionAsync received JWT of length: {Length}",
                signedTransactionInfo.Length);

            // Check if JWS signature validation should be skipped (for development)
            var skipValidation = _configuration.GetValue<bool>("Subscription:Apple:SkipJwsValidation", false);

            if (skipValidation)
            {
                _logger.LogWarning("Skipping StoreKit 2 JWT signature validation - NOT RECOMMENDED FOR PRODUCTION");
                return DecodeTransactionInfoAsync(signedTransactionInfo);
            }

            // Production: Verify JWT signature using Apple certificates
            var transactionInfo = await VerifyStoreKit2JwtAsync(signedTransactionInfo);
            
            if (transactionInfo == null)
            {
                _logger.LogError("Failed to verify StoreKit 2 JWT signature");
                return null;
            }

            _logger.LogInformation("StoreKit 2 transaction verified successfully: {TransactionId}",
                transactionInfo.TransactionId);

            return transactionInfo;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying StoreKit 2 transaction");
            return null;
        }
    }

    private async Task<AppleTransactionInfo?> VerifyStoreKit2JwtAsync(string signedTransactionInfo)
    {
        try
        {
            // Read the JWT to extract the header containing the certificate chain
            var jwtToken = _jwtHandler.ReadJwtToken(signedTransactionInfo);

            // Extract the x5c claim (certificate chain)
            string?[]? x5cArray;
            if (jwtToken.Header.TryGetValue("x5c", out var x5cObject) && x5cObject is IList<object> x5cList)
            {
                x5cArray = x5cList.Select(o => o.ToString()).ToArray();
            }
            else
            {
                _logger.LogError("JWT header missing x5c certificate chain or is in an invalid format");
                return null;
            }

            _logger.LogInformation("Found {Count} certificates in x5c chain", x5cArray.Length);

            // Build certificate chain from x5c
            var certificateChain = new List<X509Certificate2>();
            foreach (var certBase64 in x5cArray)
            {
                try
                {
                    if (string.IsNullOrEmpty(certBase64))
                    {
                        _logger.LogWarning("Skipping empty certificate in x5c chain");
                        continue;
                    }
                    var certBytes = Convert.FromBase64String(certBase64);
                    var cert = X509CertificateLoader.LoadCertificate(certBytes);
                    certificateChain.Add(cert);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to parse certificate from x5c chain");
                    return null;
                }
            }

            if (certificateChain.Count == 0)
            {
                _logger.LogError("No valid certificates found in x5c chain");
                return null;
            }

            // First certificate in chain is the leaf certificate containing the signing key
            var leafCertificate = certificateChain[0];

            // Verify certificate chain validity
            if (!await VerifyCertificateChainAsync(certificateChain))
            {
                _logger.LogError("Certificate chain validation failed");
                return null;
            }

            // Verify certificate is not expired
            var now = DateTime.UtcNow;
            if (now < leafCertificate.NotBefore || now > leafCertificate.NotAfter)
            {
                _logger.LogError("Leaf certificate is not valid at current time");
                return null;
            }

            // Extract public key from leaf certificate (Apple uses ES256 for StoreKit 2)
            SecurityKey? securityKey = null;
            var ecdsaPublicKey = leafCertificate.GetECDsaPublicKey();
            if (ecdsaPublicKey != null)
            {
                securityKey = new ECDsaSecurityKey(ecdsaPublicKey);
                _logger.LogInformation("Using ECDSA public key from leaf certificate");
            }
            else
            {
                var rsaPublicKey = leafCertificate.GetRSAPublicKey();
                if (rsaPublicKey != null)
                {
                    securityKey = new RsaSecurityKey(rsaPublicKey);
                    _logger.LogInformation("Using RSA public key from leaf certificate");
                }
            }

            if (securityKey == null)
            {
                _logger.LogError("Failed to extract ECDSA or RSA public key from leaf certificate");
                return null;
            }

            // Validate JWT signature using the public key
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = securityKey,
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                RequireExpirationTime = false,
                ClockSkew = TimeSpan.FromMinutes(5)
            };

            try
            {
                var principal = _jwtHandler.ValidateToken(signedTransactionInfo, validationParameters, out var validatedToken);
                _logger.LogInformation("StoreKit 2 JWT signature successfully validated");

                // Decode and return the transaction info
                var payload = jwtToken.Payload.SerializeToJson();
                var transactionInfo = JsonSerializer.Deserialize<AppleTransactionInfo>(payload);

                return transactionInfo;
            }
            catch (SecurityTokenException ex)
            {
                _logger.LogError(ex, "JWT signature validation failed");
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in StoreKit 2 JWT verification");
            return null;
        }
    }

    public async Task<AppleReceiptValidationResponse?> VerifyReceiptAsync(string receiptData)
    {
        try
        {
            var sharedSecret = _configuration["Subscription:Apple:SharedSecret"];
            
            if (string.IsNullOrEmpty(sharedSecret))
            {
                _logger.LogError("Apple shared secret not configured");
                return null;
            }

            var request = new AppleReceiptValidationRequest
            {
                ReceiptData = receiptData,
                Password = sharedSecret,
                ExcludeOldTransactions = true
            };

            // Try production endpoint first
            var environment = _configuration["Subscription:Apple:Environment"] ?? "production";
            var endpoint = environment == "sandbox" 
                ? "https://sandbox.itunes.apple.com/verifyReceipt"
                : "https://buy.itunes.apple.com/verifyReceipt";

            var response = await SendReceiptValidationRequestAsync(endpoint, request);

            // Status 21007 means the receipt is from sandbox, try sandbox endpoint
            if (response?.Status == 21007)
            {
                _logger.LogInformation("Receipt is from sandbox environment, retrying with sandbox endpoint");
                endpoint = "https://sandbox.itunes.apple.com/verifyReceipt";
                response = await SendReceiptValidationRequestAsync(endpoint, request);
            }

            if (response?.Status == 0)
            {
                _logger.LogInformation("Successfully verified Apple receipt");
                return response;
            }
            else
            {
                _logger.LogWarning("Apple receipt validation failed with status: {Status}", response?.Status);
                return response;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying Apple receipt");
            return null;
        }
    }

    private async Task<AppleReceiptValidationResponse?> SendReceiptValidationRequestAsync(
        string endpoint, 
        AppleReceiptValidationRequest request)
    {
        try
        {
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var httpResponse = await _httpClient.PostAsync(endpoint, content);
            httpResponse.EnsureSuccessStatusCode();

            var responseJson = await httpResponse.Content.ReadAsStringAsync();
            var response = JsonSerializer.Deserialize<AppleReceiptValidationResponse>(responseJson);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending receipt validation request to {Endpoint}", endpoint);
            return null;
        }
    }

    private async Task<AppleNotificationPayload?> VerifyJwsSignatureAsync(string signedPayload)
    {
        try
        {
            _logger.LogInformation("VerifyJwsSignatureAsync: Payload length={Length}, first 50 chars: {FirstChars}",
                signedPayload.Length,
                signedPayload.Length > 50 ? signedPayload.Substring(0, 50) : signedPayload);

            // Check if payload looks like a valid JWT (should have 3 parts separated by dots)
            if (signedPayload.Count(c => c == '.') != 2)
            {
                _logger.LogError("Payload does not appear to be a valid JWT. Expected 3 parts separated by dots, but got {DotCount} dots. Payload length: {Length}",
                    signedPayload.Count(c => c == '.'), signedPayload.Length);
                return null;
            }

            // Read the JWT to extract the header containing the certificate chain
            var jwtToken = _jwtHandler.ReadJwtToken(signedPayload);

            // Extract the x5c claim directly as a list
            string?[]? x5cArray;
            if (jwtToken.Header.TryGetValue("x5c", out var x5cObject) && x5cObject is IList<object> x5cList)
            {
                // Convert the list of objects (which are strings) into an array of strings
                x5cArray = x5cList.Select(o => o.ToString()).ToArray();
            }
            else
            {
                _logger.LogError("JWS header missing x5c certificate chain or is in an invalid format");
                return null;
            }





            // // Extract x5c (X.509 Certificate Chain) from JWT header
            // if (!jwtToken.Header.TryGetValue("x5c", out var x5cObject))
            // {
            //     _logger.LogError("JWS header missing x5c certificate chain");
            //     return null;
            // }

            // // Parse certificate chain from x5c header
            // var x5cArray = JsonSerializer.Deserialize<string[]>(x5cObject.ToString() ?? "[]");
            // if (x5cArray == null || x5cArray.Length == 0)
            // {
            //     _logger.LogError("Invalid or empty x5c certificate chain");
            //     return null;
            // }

            _logger.LogInformation("Found {Count} certificates in x5c chain", x5cArray.Length);

            // Build certificate chain from x5c
            var certificateChain = new List<X509Certificate2>();
            foreach (var certBase64 in x5cArray)
            {
                try
                {
                    if (string.IsNullOrEmpty(certBase64))
                    {
                        _logger.LogWarning("Skipping empty certificate in x5c chain");
                        continue;
                    }
                    var certBytes = Convert.FromBase64String(certBase64);
                    var cert = X509CertificateLoader.LoadCertificate(certBytes);
                    certificateChain.Add(cert);
                    _logger.LogInformation("Certificate: Subject={Subject}, Issuer={Issuer}, NotAfter={NotAfter}",
                        cert.Subject, cert.Issuer, cert.NotAfter);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to parse certificate from x5c chain");
                    return null;
                }
            }

            if (certificateChain.Count == 0)
            {
                _logger.LogError("No valid certificates found in x5c chain");
                return null;
            }

            // First certificate in chain is the leaf certificate containing the signing key
            var leafCertificate = certificateChain[0];

            // Verify certificate chain validity
            if (!await VerifyCertificateChainAsync(certificateChain))
            {
                _logger.LogError("Certificate chain validation failed");
                return null;
            }

            // Verify certificate is not expired
            var now = DateTime.UtcNow;
            if (now < leafCertificate.NotBefore || now > leafCertificate.NotAfter)
            {
                _logger.LogError("Leaf certificate is not valid at current time. NotBefore={NotBefore}, NotAfter={NotAfter}, Now={Now}",
                    leafCertificate.NotBefore, leafCertificate.NotAfter, now);
                return null;
            }

            // Extract public key from leaf certificate (Apple uses ES256 for JWS)
            SecurityKey? securityKey = null;
            var rsaPublicKey = leafCertificate.GetRSAPublicKey();
            if (rsaPublicKey != null)
            {
                securityKey = new RsaSecurityKey(rsaPublicKey);
                _logger.LogInformation("Using RSA public key from leaf certificate");
            }
            else
            {
                var ecdsaPublicKey = leafCertificate.GetECDsaPublicKey();
                if (ecdsaPublicKey != null)
                {
                    securityKey = new ECDsaSecurityKey(ecdsaPublicKey);
                    _logger.LogInformation("Using ECDSA public key from leaf certificate");
                }
            }

            if (securityKey == null)
            {
                _logger.LogError("Failed to extract RSA or ECDSA public key from leaf certificate");
                return null;
            }

            // Validate JWT signature using the public key
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = securityKey,
                ValidateIssuer = false,  // Apple doesn't use standard issuer claim
                ValidateAudience = false,  // Apple doesn't use standard audience claim
                ValidateLifetime = true,
                RequireExpirationTime = false,  // Apple notifications may not have exp claim
                ClockSkew = TimeSpan.FromMinutes(5)
            };

            try
            {
                var principal = _jwtHandler.ValidateToken(signedPayload, validationParameters, out var validatedToken);
                _logger.LogInformation("JWS signature successfully validated");

                // Decode and return the payload
                var payload = jwtToken.Payload.SerializeToJson();
                var notification = JsonSerializer.Deserialize<AppleNotificationPayload>(payload);

                return notification;
            }
            catch (SecurityTokenException ex)
            {
                _logger.LogError(ex, "JWT signature validation failed");
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in JWS signature verification");
            return null;
        }
    }

    private async Task<bool> VerifyCertificateChainAsync(List<X509Certificate2> certificateChain)
    {
        try
        {
            if (certificateChain.Count == 0)
            {
                _logger.LogError("Certificate chain is empty");
                return false;
            }

            // Download and cache Apple root certificates
            var rootG3 = await GetAppleRootCertificateAsync(AppleRootCAG3Url);
            var rootG2 = await GetAppleRootCertificateAsync(AppleRootCAG2Url);

            if (rootG3 == null && rootG2 == null)
            {
                _logger.LogError("Failed to obtain Apple root certificates");
                return false;
            }

            // Build X509Chain for validation
            using var chain = new X509Chain();
            chain.ChainPolicy.RevocationMode = X509RevocationMode.Online;
            chain.ChainPolicy.RevocationFlag = X509RevocationFlag.ExcludeRoot;
            chain.ChainPolicy.VerificationFlags = X509VerificationFlags.NoFlag;
            chain.ChainPolicy.VerificationTime = DateTime.Now;
            chain.ChainPolicy.UrlRetrievalTimeout = TimeSpan.FromSeconds(30);

            // Use Apple roots as trusted roots to avoid UntrustedRoot in container/cloud environments
            chain.ChainPolicy.TrustMode = X509ChainTrustMode.CustomRootTrust;
            if (rootG3 != null)
            {
                chain.ChainPolicy.CustomTrustStore.Add(rootG3);
                chain.ChainPolicy.ExtraStore.Add(rootG3);
            }
            if (rootG2 != null)
            {
                chain.ChainPolicy.CustomTrustStore.Add(rootG2);
                chain.ChainPolicy.ExtraStore.Add(rootG2);
            }

            // Add intermediate certificates from the x5c chain to the extra store
            for (int i = 1; i < certificateChain.Count; i++)
            {
                chain.ChainPolicy.ExtraStore.Add(certificateChain[i]);
            }

            // Verify the leaf certificate
            var leafCert = certificateChain[0];
            var isValid = chain.Build(leafCert);

            if (!isValid)
            {
                _logger.LogWarning("Certificate chain validation returned false. Chain status:");
                foreach (var status in chain.ChainStatus)
                {
                    _logger.LogWarning("  Status: {Status}, Info: {StatusInformation}",
                        status.Status, status.StatusInformation);
                }

                // Check if the only error is about revocation checking
                // In some environments, revocation checking may fail due to network restrictions
                var hasOnlyRevocationErrors = chain.ChainStatus.All(s =>
                    s.Status == X509ChainStatusFlags.RevocationStatusUnknown ||
                    s.Status == X509ChainStatusFlags.OfflineRevocation);

                if (hasOnlyRevocationErrors && _configuration.GetValue<bool>("Subscription:Apple:AllowRevocationCheckFailure", false))
                {
                    _logger.LogWarning("Allowing certificate chain validation despite revocation check failures");
                    return true;
                }

                return false;
            }

            // Verify chain ends with Apple root certificate
            var rootCert = chain.ChainElements[chain.ChainElements.Count - 1].Certificate;
            var isAppleRoot = (rootG3 != null && rootCert.Thumbprint == rootG3.Thumbprint) ||
                              (rootG2 != null && rootCert.Thumbprint == rootG2.Thumbprint);

            if (!isAppleRoot)
            {
                _logger.LogError("Certificate chain does not end with Apple root certificate. Root thumbprint: {Thumbprint}",
                    rootCert.Thumbprint);
                return false;
            }

            _logger.LogInformation("Certificate chain validated successfully. Chain length: {Length}", chain.ChainElements.Count);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying certificate chain");
            return false;
        }
    }

    private async Task<X509Certificate2?> GetAppleRootCertificateAsync(string url)
    {
        try
        {
            await _certCacheLock.WaitAsync();

            try
            {
                // Check cache validity (cache for 24 hours)
                if (DateTime.UtcNow < _cacheExpiration)
                {
                    if (url == AppleRootCAG3Url && _cachedAppleRootG3 != null)
                    {
                        _logger.LogDebug("Using cached Apple Root CA-G3 certificate");
                        return _cachedAppleRootG3;
                    }
                    if (url == AppleRootCAG2Url && _cachedAppleRootG2 != null)
                    {
                        _logger.LogDebug("Using cached Apple Root CA-G2 certificate");
                        return _cachedAppleRootG2;
                    }
                }

                // Download certificate
                _logger.LogInformation("Downloading Apple root certificate from {Url}", url);
                var certBytes = await _httpClient.GetByteArrayAsync(url);
                var certificate = X509CertificateLoader.LoadCertificate(certBytes);

                // Cache the certificate
                if (url == AppleRootCAG3Url)
                {
                    _cachedAppleRootG3 = certificate;
                }
                else if (url == AppleRootCAG2Url)
                {
                    _cachedAppleRootG2 = certificate;
                }

                // Set cache expiration to 24 hours from now
                _cacheExpiration = DateTime.UtcNow.AddHours(24);

                _logger.LogInformation("Successfully downloaded and cached Apple root certificate: {Subject}",
                    certificate.Subject);

                return certificate;
            }
            finally
            {
                _certCacheLock.Release();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download Apple root certificate from {Url}", url);
            return null;
        }
    }
}
