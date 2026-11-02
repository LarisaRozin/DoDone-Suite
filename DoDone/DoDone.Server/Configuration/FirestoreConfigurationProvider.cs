/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

using Google.Cloud.Firestore;
using Microsoft.Extensions.Configuration;
using System.Text.Json;

namespace DoDone.Server.Configuration
{
    /// <summary>
    /// Configuration provider that loads and periodically reloads configuration from Firestore.
    /// 
    /// Firestore Document Structure:
    /// Collection: config
    /// Document ID: {environment} (e.g., "production", "sandbox")
    /// Document Content: Nested JSON matching appsettings.json structure
    /// 
    /// Example Firestore document for "production":
    /// {
    ///   "Serilog": {
    ///     "MinimumLevel": {
    ///       "Default": "Information",
    ///       "Override": { ... }
    ///     }
    ///   },
    ///   "HttpLogging": { ... }
    /// }
    /// 
    /// TTL-based caching: Configuration is cached in memory and reloaded based on cacheTtlSeconds.
    /// This prevents excessive Firestore reads while ensuring relatively quick config updates.
    /// </summary>
    public class FirestoreConfigurationProvider : ConfigurationProvider, IDisposable
    {
        private readonly FirestoreConfigurationSource _source;
        private FirestoreDb? _firestoreDb;
        private DateTime _lastLoadTime = DateTime.MinValue;
        private CancellationTokenSource? _reloadCts;
        private Task? _reloadTask;

        public FirestoreConfigurationProvider(FirestoreConfigurationSource source)
        {
            _source = source;
        }

        public override void Load()
        {
            try
            {
                var config = LoadConfigurationAsync().GetAwaiter().GetResult();
                
                if (config != null && config.Count > 0)
                {
                    Data = config;
                    _lastLoadTime = DateTime.UtcNow;
                }
                else
                {
                    // If Firestore is unavailable, fall back to empty (will use other sources)
                    Console.WriteLine($"[FirestoreConfigurationProvider] No configuration found in Firestore for environment: {_source.Environment}");
                }

                // Start reload loop if enabled
                if (_source.ReloadOnChange)
                {
                    StartReloadLoop();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[FirestoreConfigurationProvider] Error loading configuration from Firestore: {ex.Message}");
                // Don't throw - allow other configuration sources to fill in the gap
            }
        }

        private async Task<IDictionary<string, string?>> LoadConfigurationAsync()
        {
            try
            {
                if (_firestoreDb == null)
                {
                    var projectId = _source.ProjectId ?? Environment.GetEnvironmentVariable("GOOGLE_CLOUD_PROJECT");
                    if (string.IsNullOrWhiteSpace(projectId))
                    {
                        throw new InvalidOperationException("Firestore project ID is not set. Provide projectId or set GOOGLE_CLOUD_PROJECT.");
                    }

                    if (_source.DatabaseId == "(default)")
                    {
                        _firestoreDb = FirestoreDb.Create(projectId);
                    }
                    else
                    {
                        _firestoreDb = new FirestoreDbBuilder
                        {
                            ProjectId = projectId,
                            DatabaseId = _source.DatabaseId
                        }.Build();
                    }
                }

                var docRef = _firestoreDb.Collection("config").Document(_source.Environment);
                var snapshot = await docRef.GetSnapshotAsync();

                if (!snapshot.Exists)
                {
                    Console.WriteLine($"[FirestoreConfigurationProvider] Firestore document 'config/{_source.Environment}' does not exist");
                    return new Dictionary<string, string?>();
                }

                var dict = new Dictionary<string, string?>();
                var data = snapshot.ToDictionary();

                // Check if there's a single 'appsettings' field containing JSON string
                if (data.ContainsKey("appsettings") && data["appsettings"] is string jsonString)
                {
                    try
                    {
                        // Parse the JSON string and flatten it
                        var jsonDoc = JsonSerializer.Deserialize<Dictionary<string, object>>(jsonString);
                        if (jsonDoc != null)
                        {
                            FlattenDictionary(jsonDoc, dict, null);
                            Console.WriteLine($"[FirestoreConfigurationProvider] Loaded configuration from 'appsettings' JSON field");
                            return dict;
                        }
                    }
                    catch (JsonException ex)
                    {
                        Console.WriteLine($"[FirestoreConfigurationProvider] Failed to parse 'appsettings' JSON field: {ex.Message}");
                        // Fall through to try standard flattening
                    }
                }

                // Standard flattening for regular Firestore document structure
                FlattenDictionary(data, dict, null);
                
                // // Debug: Log what we loaded from Firestore
                // Console.WriteLine($"[FirestoreConfigurationProvider] Loaded {dict.Count} configuration keys from Firestore");
                // foreach (var key in dict.Keys.Where(k => k.StartsWith("HttpLogging")))
                // {
                //     Console.WriteLine($"[FirestoreConfigurationProvider]   {key} = {dict[key]}");
                // }
                
                return dict;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[FirestoreConfigurationProvider] Exception loading from Firestore: {ex.GetType().Name}: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Flattens nested dictionaries into colon-separated keys for configuration binding.
        /// E.g., { "Serilog": { "MinimumLevel": { "Default": "Information" } } }
        /// becomes key "Serilog:MinimumLevel:Default" = "Information"
        /// </summary>
        private void FlattenDictionary(Dictionary<string, object> data, IDictionary<string, string?> result, string? prefix)
        {
            foreach (var kvp in data)
            {
                var key = string.IsNullOrEmpty(prefix) ? kvp.Key : $"{prefix}:{kvp.Key}";

                if (kvp.Value == null)
                {
                    result[key] = null;
                }
                else if (kvp.Value is JsonElement jsonElement)
                {
                    // Handle JsonElement (from JSON deserialization)
                    FlattenJsonElement(jsonElement, result, key);
                }
                else if (kvp.Value is string strValue)
                {
                    result[key] = strValue;
                }
                else if (kvp.Value is bool boolValue)
                {
                    result[key] = boolValue.ToString();
                }
                else if (kvp.Value is long longValue)
                {
                    result[key] = longValue.ToString();
                }
                else if (kvp.Value is double doubleValue)
                {
                    result[key] = doubleValue.ToString();
                }
                else if (kvp.Value is Dictionary<string, object> nestedDict)
                {
                    FlattenDictionary(nestedDict, result, key);
                }
                else if (kvp.Value is IEnumerable<object> listValue && !(kvp.Value is string))
                {
                    // Handle arrays
                    int index = 0;
                    foreach (var item in listValue)
                    {
                        var itemKey = $"{key}:{index}";
                        if (item is Dictionary<string, object> itemDict)
                        {
                            FlattenDictionary(itemDict, result, itemKey);
                        }
                        else
                        {
                            result[itemKey] = item?.ToString();
                        }
                        index++;
                    }
                }
                else
                {
                    // Fallback for unknown types
                    result[key] = kvp.Value.ToString();
                }
            }
        }

        /// <summary>
        /// Flattens a JsonElement (from JSON deserialization) into configuration keys
        /// </summary>
        private void FlattenJsonElement(JsonElement element, IDictionary<string, string?> result, string key)
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.Object:
                    var dict = new Dictionary<string, object>();
                    foreach (var property in element.EnumerateObject())
                    {
                        dict[property.Name] = property.Value;
                    }
                    FlattenDictionary(dict, result, key);
                    break;

                case JsonValueKind.Array:
                    int index = 0;
                    foreach (var item in element.EnumerateArray())
                    {
                        var itemKey = $"{key}:{index}";
                        FlattenJsonElement(item, result, itemKey);
                        index++;
                    }
                    break;

                case JsonValueKind.String:
                    result[key] = element.GetString();
                    break;

                case JsonValueKind.Number:
                    result[key] = element.GetRawText();
                    break;

                case JsonValueKind.True:
                case JsonValueKind.False:
                    result[key] = element.GetBoolean().ToString();
                    break;

                case JsonValueKind.Null:
                    result[key] = null;
                    break;

                default:
                    result[key] = element.GetRawText();
                    break;
            }
        }

        private void StartReloadLoop()
        {
            if (_reloadTask != null && !_reloadTask.IsCompleted)
            {
                return; // Already running
            }

            _reloadCts = new CancellationTokenSource();
            _reloadTask = Task.Run(async () => await ReloadLoop(_reloadCts.Token));
        }

        private async Task ReloadLoop(CancellationToken cancellationToken)
        {
            try
            {
                while (!cancellationToken.IsCancellationRequested)
                {
                    var elapsed = DateTime.UtcNow - _lastLoadTime;
                    var remainingWait = TimeSpan.FromSeconds(_source.CacheTtlSeconds) - elapsed;

                    if (remainingWait > TimeSpan.Zero)
                    {
                        await Task.Delay(remainingWait, cancellationToken);
                    }

                    if (cancellationToken.IsCancellationRequested)
                        break;

                    try
                    {
                        var config = await LoadConfigurationAsync();
                        if (config != null && config.Count > 0)
                        {
                            Data = config;
                            _lastLoadTime = DateTime.UtcNow;
                            OnReload(); // Notify that configuration has changed
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[FirestoreConfigurationProvider] Error during reload cycle: {ex.Message}");
                        // Continue loop even if reload fails
                    }
                }
            }
            catch (OperationCanceledException)
            {
                // Expected when disposed
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[FirestoreConfigurationProvider] Reload loop failed: {ex.Message}");
            }
        }

        public void Dispose()
        {
            _reloadCts?.Cancel();
            _reloadCts?.Dispose();
        }
    }
}
