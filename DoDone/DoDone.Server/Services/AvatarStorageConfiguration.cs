/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
namespace DoDone.Server.Services;

public class AvatarStorageConfiguration
{
    /// <summary>
    /// Storage type: "local" for file system (development), "azure" for Azure Blob Storage, "googlecloud" for Google Cloud Storage (production)
    /// </summary>
    public string StorageType { get; set; } = "local";

    /// <summary>
    /// Local file system path for avatar storage (used when StorageType = "local")
    /// </summary>
    public string LocalPath { get; set; } = string.Empty;

    /// <summary>
    /// Azure Blob Storage connection string (used when StorageType = "azure")
    /// </summary>
    public string AzureConnectionString { get; set; } = string.Empty;

    /// <summary>
    /// Azure Blob Storage container name for avatars (used when StorageType = "azure")
    /// </summary>
    public string AzureContainerName { get; set; } = "avatars";

    /// <summary>
    /// Google Cloud Storage bucket name for avatars (used when StorageType = "googlecloud")
    /// </summary>
    public string GoogleCloudBucketName { get; set; } = string.Empty;

    /// <summary>
    /// Base URL for accessing avatars (used for Azure CDN, Google Cloud CDN, or custom domain)
    /// </summary>
    public string? BaseUrl { get; set; }
}
