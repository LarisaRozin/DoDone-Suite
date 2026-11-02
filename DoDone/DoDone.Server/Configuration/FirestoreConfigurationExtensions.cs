/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

using Microsoft.Extensions.Configuration;

namespace DoDone.Server.Configuration
{
    /// <summary>
    /// Extension methods for adding Firestore configuration to the configuration builder.
    /// </summary>
    public static class FirestoreConfigurationExtensions
    {
        /// <summary>
        /// Adds Google Cloud Firestore as a configuration source.
        /// Configuration is loaded from a Firestore document in the "config" collection,
        /// with the document ID matching the environment name.
        /// </summary>
        /// <param name="builder">The configuration builder</param>
        /// <param name="environment">Environment name (e.g., "production", "sandbox")</param>
        /// <param name="projectId">GCP Project ID. If null, uses GOOGLE_CLOUD_PROJECT env var or application default.</param>
        /// <param name="databaseId">Firestore database ID (default: "(default)")</param>
        /// <param name="reloadOnChange">Enable dynamic configuration reloading (default: true)</param>
        /// <param name="cacheTtlSeconds">Cache time-to-live in seconds (default: 30)</param>
        /// <returns>The configuration builder for chaining</returns>
        public static IConfigurationBuilder AddFirestoreConfiguration(
            this IConfigurationBuilder builder,
            string environment,
            string? projectId = null,
            string? databaseId = null,
            bool reloadOnChange = true,
            int cacheTtlSeconds = 30)
        {
            var source = new FirestoreConfigurationSource
            {
                Environment = environment,
                ProjectId = projectId,
                DatabaseId = string.IsNullOrWhiteSpace(databaseId) ? "(default)" : databaseId,
                ReloadOnChange = reloadOnChange,
                CacheTtlSeconds = cacheTtlSeconds
            };

            return builder.Add(source);
        }
    }
}
