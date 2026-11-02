/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using System.Diagnostics;
using System.IO.Compression;
using System.Text;
using Microsoft.Extensions.Options;

namespace DoDone.Server.Middleware;

/// <summary>
/// Middleware that logs HTTP request and response bodies for debugging purposes.
/// Particularly useful for debugging webhook endpoints in production.
/// </summary>
public class HttpLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<HttpLoggingMiddleware> _logger;
    // private readonly HttpLoggingOptions _options;

    private readonly IOptionsMonitor<HttpLoggingOptions> _optionsMonitor;

    public HttpLoggingMiddleware(
        RequestDelegate next,
        ILogger<HttpLoggingMiddleware> logger,
        IOptionsMonitor<HttpLoggingOptions> optionsMonitor)
    {
        _next = next;
        _logger = logger;
        _optionsMonitor = optionsMonitor;
        
        // Debug: Log initial configuration on startup
        var initialOptions = optionsMonitor.CurrentValue;
        Console.WriteLine($"[HttpLoggingMiddleware] Initialized with Enabled={initialOptions.Enabled}");
        if (initialOptions.PathPrefixes?.Any() == true)
        {
            Console.WriteLine($"[HttpLoggingMiddleware] PathPrefixes: {string.Join(", ", initialOptions.PathPrefixes)}");
        }
        else
        {
            Console.WriteLine($"[HttpLoggingMiddleware] PathPrefixes: (none configured)");
        }
    }

    public async Task InvokeAsync(HttpContext context)
    {

        var options = _optionsMonitor.CurrentValue; // Gets latest value
        if (!options.Enabled)
        {
            await _next(context);
            return;
        }

        // Check if this request should be logged
        if (!ShouldLogRequest(context, options))
        {
            await _next(context);
            return;
        }

        var requestId = context.TraceIdentifier;
        var stopwatch = Stopwatch.StartNew();

        // Collect request data
        var requestData = await CollectRequestDataAsync(context, requestId, options);

        // Capture response
        var originalBodyStream = context.Response.Body;
        using var responseBody = new MemoryStream();
        context.Response.Body = responseBody;

        try
        {
            // Call the next middleware
            await _next(context);

            // Collect response data and log everything together
            var responseData = await CollectResponseDataAsync(context, requestId, stopwatch.ElapsedMilliseconds, options);
            
            // Log request and response together in one entry
            LogRequestAndResponse(requestData, responseData, context, stopwatch.ElapsedMilliseconds);
        }
        finally
        {
            // Copy the response back to the original stream
            await responseBody.CopyToAsync(originalBodyStream);
        }
    }

    private bool ShouldLogRequest(HttpContext context, HttpLoggingOptions options)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        // Don't log health check endpoints unless explicitly enabled
        if (!options.LogHealthChecks && path.StartsWith("/health", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        // Don't log static files
        if (path.StartsWith("/static", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".css", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".js", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".map", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        // If specific paths are configured, only log those
        if (options.PathPrefixes?.Any() == true)
        {
            return options.PathPrefixes.Any(prefix =>
                path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase));
        }
        else
        {
            return false; // only log if explicitly configured
        }
    }

    private async Task<string> CollectRequestDataAsync(HttpContext context, string requestId, HttpLoggingOptions options)
    {
        try
        {
            var request = context.Request;
            
            // Build request log
            var logBuilder = new StringBuilder();
            // logBuilder.Append($"Method: {request.Method} ");
            // logBuilder.Append($"Path: {request.Path}{request.QueryString} ");
            // logBuilder.Append($"Scheme: {request.Scheme} ");
            // logBuilder.Append($"Host: {request.Host} ");
            // logBuilder.Append($"Content-Type: {request.ContentType ?? "N/A"} ");
            logBuilder.Append($"Content-Length: {request.ContentLength ?? 0} ");

            // Log headers if enabled
            if (options.LogHeaders)
            {
                logBuilder.Append("Headers: ");
                foreach (var header in request.Headers)
                {
                    // Redact sensitive headers
                    var value = IsSensitiveHeader(header.Key)
                        ? "***REDACTED***"
                        : string.Join(", ", header.Value.ToArray());
                    logBuilder.Append($"  {header.Key}: {value} ");
                }
            }

            // Log request body if enabled and present
            if (options.LogRequestBody && request.ContentLength > 0)
            {
                request.EnableBuffering();
                var contentEncoding = request.Headers["Content-Encoding"].ToString();
                var body = await ReadBodyAsync(request.Body, options.MaxBodyLogSize, contentEncoding);
                request.Body.Position = 0; // Reset for next middleware
                
                if (!string.IsNullOrWhiteSpace(body))
                {
                    logBuilder.Append(" Body: ");
                    logBuilder.Append($"{body}");
                }
            }

            return logBuilder.ToString();
        }
        catch (Exception ex)
        {
            return $"[Error collecting request data: {ex.Message}]";
        }
    }

    private async Task<string> CollectResponseDataAsync(HttpContext context, string requestId, long elapsedMs, HttpLoggingOptions options)
    {
        try
        {
            var response = context.Response;

            // Build response log
            var logBuilder = new StringBuilder();
            // logBuilder.Append($"Status: {response.StatusCode} ");
            // logBuilder.Append($"Content-Type: {response.ContentType ?? "N/A"} ");
            logBuilder.Append($"Content-Length: {response.ContentLength ?? response.Body.Length} ");
            // logBuilder.Append($"Elapsed: {elapsedMs}ms ");

            // Log headers if enabled
            if (options.LogHeaders)
            {
                logBuilder.Append("Headers: ");
                foreach (var header in response.Headers)
                {
                    logBuilder.Append($"  {header.Key}: {string.Join(", ", header.Value.ToArray())} ");
                }
            }

            // Log response body if enabled
            if (options.LogResponseBody && response.Body.Length > 0)
            {
                if (!ShouldLogBodyContentType(response.ContentType))
                {
                    logBuilder.Append(" Body: [Skipped non-text content] ");
                }
                else
                {
                    response.Body.Position = 0;

                    // Read the body - will auto-detect gzip by magic bytes
                    var contentEncoding = response.Headers["Content-Encoding"].ToString();
                    var body = await ReadBodyAsync(response.Body, options.MaxBodyLogSize, contentEncoding);
                    response.Body.Position = 0; // Reset before copying back

                    if (!string.IsNullOrWhiteSpace(body))
                    {
                        logBuilder.Append(" Body: ");
                        logBuilder.Append($"{body}");
                    }
                }
            }

            return logBuilder.ToString();
        }
        catch (Exception ex)
        {
            return $"[Error collecting response data: {ex.Message}]";
        }
    }

    private void LogRequestAndResponse(string requestData, string responseData, HttpContext context, long elapsedMs)
    {
        var combinedLog = new StringBuilder();


        combinedLog.Append($"{context.Request.Method} ");
        combinedLog.Append($" {context.Response.StatusCode} ");
        combinedLog.Append($" {elapsedMs}ms ");
        combinedLog.Append($" {context.Request.Path}{context.Request.QueryString}");
        combinedLog.Append(" ***Request: ");
        combinedLog.Append(requestData);
        combinedLog.Append(" ***Response: ");
        combinedLog.Append(responseData);
        
        _logger.LogInformation(combinedLog.ToString());
    }

    private async Task LogRequestAsync(HttpContext context, string requestId, HttpLoggingOptions options)
    {
        try
        {
            var request = context.Request;
            
            // Build request log
            var logBuilder = new StringBuilder();
            logBuilder.Append($"HTTP Request [{requestId}] ");
            logBuilder.Append($"  Method: {request.Method} ");
            logBuilder.Append($"  Path: {request.Path}{request.QueryString} ");
            logBuilder.Append($"  Scheme: {request.Scheme} ");
            logBuilder.Append($"  Host: {request.Host} ");
            logBuilder.Append($"  Content-Type: {request.ContentType ?? "N/A"} ");
            logBuilder.Append($"  Content-Length: {request.ContentLength ?? 0} ");
            // Log headers if enabled
            if (options.LogHeaders)
            {
                logBuilder.Append("  Headers:");
                foreach (var header in request.Headers)
                {
                    // Redact sensitive headers
                    var value = IsSensitiveHeader(header.Key)
                        ? "***REDACTED***"
                        : string.Join(", ", header.Value.ToArray());
                    logBuilder.Append($"    {header.Key}: {value} ");
                }
            }

            // Log request body if enabled and present
            if (options.LogRequestBody && request.ContentLength > 0)
            {
                request.EnableBuffering();
                var contentEncoding = request.Headers["Content-Encoding"].ToString();
                var body = await ReadBodyAsync(request.Body, options.MaxBodyLogSize, contentEncoding);
                request.Body.Position = 0; // Reset for next middleware
                
                if (!string.IsNullOrWhiteSpace(body))
                {
                    logBuilder.Append(" Body: ");
                    logBuilder.Append($"{body}");
                }
            }

            _logger.LogInformation(logBuilder.ToString());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging HTTP request [{RequestId}]", requestId);
        }
    }

    private async Task LogResponseAsync(HttpContext context, string requestId, long elapsedMs, HttpLoggingOptions options)
    {
        try
        {
            var response = context.Response;

            // Build response log
            var logBuilder = new StringBuilder();
            logBuilder.Append($"HTTP Response [{requestId}] ");
            logBuilder.Append($"  Status: {response.StatusCode} ");
            logBuilder.Append($"  Content-Type: {response.ContentType ?? "N/A"} ");
            logBuilder.Append($"  Content-Length: {response.ContentLength ?? response.Body.Length} ");
            logBuilder.Append($"  Elapsed: {elapsedMs}ms ");
            // Log headers if enabled
            if (options.LogHeaders)
            {
                logBuilder.Append("  Headers:");
                foreach (var header in response.Headers)
                {
                    logBuilder.Append($"    {header.Key}: {string.Join(", ", header.Value.ToArray())} ");
                }
            }

            // Log response body if enabled
            if (options.LogResponseBody && response.Body.Length > 0)
            {
                response.Body.Position = 0;
                
                var contentEncoding = response.Headers["Content-Encoding"].ToString();
                var body = await ReadBodyAsync(response.Body, options.MaxBodyLogSize, contentEncoding);
                response.Body.Position = 0; // Reset before copying back
                
                if (!string.IsNullOrWhiteSpace(body))
                {
                    logBuilder.Append(" Body: ");
                    logBuilder.Append($"{body}");
                }
            }

            _logger.LogInformation(logBuilder.ToString());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging HTTP response [{RequestId}]", requestId);
        }
    }

    private static async Task<string> ReadBodyAsync(Stream body, int maxSize, string? contentEncoding = null)
    {
        try
        {
            if (body.Length == 0)
            {
                return "[No content]";
            }

            // Read the raw bytes first
            using var memoryStream = new MemoryStream();
            await body.CopyToAsync(memoryStream, bufferSize: 4096);
            var rawBytes = memoryStream.ToArray();
            
            if (rawBytes.Length == 0)
            {
                return "[No content]";
            }

            byte[] bodyBytes = rawBytes;

            var encoding = contentEncoding?.ToLowerInvariant();
            var hasBrotli = encoding?.Contains("br") == true;
            var hasGzip = encoding?.Contains("gzip") == true;
            var hasDeflate = encoding?.Contains("deflate") == true;

            // Auto-detect gzip by magic bytes (0x1f 0x8b) in case headers are missing
            bool isActuallyGzipped = rawBytes.Length >= 2 && rawBytes[0] == 0x1f && rawBytes[1] == 0x8b;

            if (hasBrotli || hasGzip || hasDeflate || isActuallyGzipped)
            {
                try
                {
                    using var compressedStream = new MemoryStream(rawBytes);
                    Stream decompressor = hasBrotli
                        ? new BrotliStream(compressedStream, CompressionMode.Decompress)
                        : (hasGzip || isActuallyGzipped)
                            ? new GZipStream(compressedStream, CompressionMode.Decompress)
                            : new DeflateStream(compressedStream, CompressionMode.Decompress);

                    using var decompressed = new MemoryStream();
                    await decompressor.CopyToAsync(decompressed, bufferSize: 4096);
                    bodyBytes = decompressed.ToArray();
                }
                catch (Exception ex)
                {
                    return $"[Failed to decompress body ({contentEncoding ?? "unknown"}): {ex.Message}]";
                }
            }

            // Limit bytes to read
            var bytesToDecode = Math.Min(bodyBytes.Length, maxSize);
            var truncated = bytesToDecode < bodyBytes.Length;
            
            // Decode UTF-8 with error handling to avoid unprintable characters
            var content = Encoding.UTF8.GetString(bodyBytes, 0, bytesToDecode);
            
            // Sanitize unprintable characters while preserving JSON structure
            content = SanitizeContent(content);
            
            if (truncated)
            {
                content += "... [TRUNCATED]";
            }

            return content;
        }
        catch (Exception ex)
        {
            return $"[Unable to read body: {ex.Message}]";
        }
    }

    private static string SanitizeContent(string content)
    {
        if (string.IsNullOrEmpty(content))
        {
            return content;
        }
        
        // Replace unprintable/control characters with their escape sequences
        // but preserve common whitespace like newlines and tabs
        var sanitized = new StringBuilder(content.Length);
        
        foreach (var ch in content)
        {
            if (char.IsControl(ch) && ch != '\n' && ch != '\r' && ch != '\t')
            {
                // Replace control characters with their escape sequence
                sanitized.Append($"\\u{(int)ch:X4}");
            }
            else if (char.IsSurrogate(ch))
            {
                // Replace unpaired surrogates
                sanitized.Append($"\\u{(int)ch:X4}");
            }
            else
            {
                sanitized.Append(ch);
            }
        }
        
        var cleaned = sanitized.ToString();
        return TrimSurroundingControlChars(cleaned);
    }

    private static string TrimSurroundingControlChars(string content)
    {
        if (string.IsNullOrEmpty(content))
        {
            return content;
        }

        int start = 0;
        while (start < content.Length && char.IsControl(content[start]) && content[start] != '\n' && content[start] != '\r' && content[start] != '\t')
        {
            start++;
        }

        int end = content.Length - 1;
        while (end >= start && char.IsControl(content[end]) && content[end] != '\n' && content[end] != '\r' && content[end] != '\t')
        {
            end--;
        }

        return content.Substring(start, end - start + 1);
    }

    private static bool IsSensitiveHeader(string headerName)
    {
        var sensitiveHeaders = new[]
        {
            "Authorization",
            "Cookie",
            "Set-Cookie",
            "X-API-Key",
            "X-Auth-Token"
        };

        return sensitiveHeaders.Any(h =>
            h.Equals(headerName, StringComparison.OrdinalIgnoreCase));
    }

    private static bool ShouldLogBodyContentType(string? contentType)
    {
        if (string.IsNullOrWhiteSpace(contentType))
        {
            return false;
        }

        contentType = contentType.ToLowerInvariant();

        return contentType.StartsWith("text/")
               || contentType.Contains("application/json")
               || contentType.Contains("application/problem+json")
               || contentType.Contains("application/xml")
               || contentType.Contains("application/x-www-form-urlencoded");
    }
}

/// <summary>
/// Configuration options for HTTP logging middleware
/// </summary>
public class HttpLoggingOptions
{
    /// <summary>
    /// Whether HTTP logging is enabled
    /// </summary>
    public bool Enabled { get; set; } = false;

    /// <summary>
    /// Whether to log request headers
    /// </summary>
    public bool LogHeaders { get; set; } = true;

    /// <summary>
    /// Whether to log request body
    /// </summary>
    public bool LogRequestBody { get; set; } = true;

    /// <summary>
    /// Whether to log response body
    /// </summary>
    public bool LogResponseBody { get; set; } = true;

    /// <summary>
    /// Whether to log health check endpoints
    /// </summary>
    public bool LogHealthChecks { get; set; } = false;

    /// <summary>
    /// Maximum size of body to log (in bytes)
    /// </summary>
    public int MaxBodyLogSize { get; set; } = 4096;

    /// <summary>
    /// Only log requests matching these path prefixes (if specified)
    /// Leave empty to log all requests
    /// </summary>
    public string[]? PathPrefixes { get; set; }
}
