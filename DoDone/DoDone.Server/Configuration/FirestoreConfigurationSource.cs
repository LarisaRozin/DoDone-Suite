/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

using Microsoft.Extensions.Configuration;

namespace DoDone.Server.Configuration
{
    /// <summary>
    /// Configuration source for loading and reloading configuration from Google Cloud Firestore.
    /// Supports dynamic configuration updates without container restart.
    /// </summary>
    public class FirestoreConfigurationSource : IConfigurationSource
    {
        public string Environment { get; set; } = "production";
        public int CacheTtlSeconds { get; set; } = 30;
        public string? ProjectId { get; set; }
        public string DatabaseId { get; set; } = "(default)";
        public bool ReloadOnChange { get; set; } = true;

        public IConfigurationProvider Build(IConfigurationBuilder builder)
        {
            return new FirestoreConfigurationProvider(this);
        }
    }
}
