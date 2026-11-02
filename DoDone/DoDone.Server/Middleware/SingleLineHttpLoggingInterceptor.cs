/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Serilog.Core;
using Serilog.Events;

namespace DoDone.Server.Middleware;

/// <summary>
/// Serilog enricher that converts multi-line HTTP logging messages into single-line format
/// by replacing newlines with pipe separators.
/// </summary>
public class SingleLineHttpLoggingEnricher : ILogEventEnricher
{
    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        // Only process messages from the HTTP logging middleware
        if (logEvent.Properties.TryGetValue("SourceContext", out var sourceContext))
        {
            var sourceContextValue = sourceContext.ToString().Trim('"');
            if (sourceContextValue == "Microsoft.AspNetCore.HttpLogging.HttpLoggingMiddleware")
            {
                // Get the original message
                var message = logEvent.RenderMessage();
                
                // Replace newlines with pipe separator and clean up whitespace
                var singleLine = message
                    .Replace("\r\n", " | ")
                    .Replace("\n", " | ")
                    .Replace("\r", " | ");
                
                // Replace the message with the single-line version
                var messageProperty = propertyFactory.CreateProperty("Message", singleLine);
                logEvent.AddOrUpdateProperty(messageProperty);
            }
        }
    }
}
