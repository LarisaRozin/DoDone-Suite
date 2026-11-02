/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Google.Cloud.Storage.V1;
using DoDone.Server.Dtos;
using DoDone.Db.Repositories;
using Microsoft.Extensions.Options;

namespace DoDone.Server.Services;

public interface IAvatarService
{
    Task<DataResponse<string>> UploadAvatarAsync(long userId, IFormFile file);
    Task<ResponseBase> DeleteAvatarAsync(long userId);
    Task<(Stream? FileStream, string ContentType)> GetAvatarAsync(string fileName);
}

public class AvatarService : IAvatarService
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<AvatarService> _logger;
    private readonly ICurrentUserService _currentUser;
    private readonly AvatarStorageConfiguration _config;
    private readonly BlobContainerClient? _blobContainerClient;
    private readonly StorageClient? _googleStorageClient;
    private readonly string? _localPath;
    private readonly bool _useAzureStorage;
    private readonly bool _useGoogleCloudStorage;

    public AvatarService(
        IUserRepository userRepository, 
        ICurrentUserService currentUser, 
        ILogger<AvatarService> logger,
        IOptions<AvatarStorageConfiguration> config)
    {
        _userRepository = userRepository;
        _currentUser = currentUser;
        _logger = logger;
        _config = config.Value;
        
        _useAzureStorage = _config.StorageType.Equals("azure", StringComparison.OrdinalIgnoreCase);
        _useGoogleCloudStorage = _config.StorageType.Equals("googlecloud", StringComparison.OrdinalIgnoreCase);
        
        if (_useAzureStorage)
        {
            if (string.IsNullOrEmpty(_config.AzureConnectionString))
            {
                throw new InvalidOperationException("Azure Storage connection string is required when StorageType is 'azure'");
            }
            
            var blobServiceClient = new BlobServiceClient(_config.AzureConnectionString);
            _blobContainerClient = blobServiceClient.GetBlobContainerClient(_config.AzureContainerName);
            _blobContainerClient.CreateIfNotExists(PublicAccessType.Blob);
            
            _logger.LogInformation("Avatar service initialized with Azure Blob Storage (container: {Container})", _config.AzureContainerName);
        }
        else if (_useGoogleCloudStorage)
        {
            if (string.IsNullOrEmpty(_config.GoogleCloudBucketName))
            {
                throw new InvalidOperationException("GoogleCloudBucketName is required when StorageType is 'googlecloud'");
            }
            
            _googleStorageClient = StorageClient.Create();
            
            _logger.LogInformation("Avatar service initialized with Google Cloud Storage (bucket: {Bucket})", _config.GoogleCloudBucketName);
        }
        else
        {
            if (string.IsNullOrEmpty(_config.LocalPath))
            {
                throw new InvalidOperationException("LocalPath is required when StorageType is 'local'");
            }
            
            _localPath = _config.LocalPath;
            Directory.CreateDirectory(_localPath);
            
            _logger.LogInformation("Avatar service initialized with local file storage (path: {Path})", _localPath);
        }
    }

    public async Task<DataResponse<string>> UploadAvatarAsync(long userId, IFormFile file)
    {
        if (!_currentUser.IsAdmin && _currentUser.UserId != userId)
        {
            throw new UnauthorizedAccessException("You do not have permission to change this user's avatar.");
        }

        var response = new DataResponse<string>();
        try
        {
            var user = await _userRepository.GetAsync(userId);
            if (user == null)
            {
                response.Success = false;
                response.Message = "User not found";
                return response;
            }

            // Delete old avatar if exists
            if (!string.IsNullOrEmpty(user.AvatarUri))
            {
                await DeleteAvatarFileAsync(user.AvatarUri);
            }

            // Generate unique filename
            var fileExtension = Path.GetExtension(file.FileName).ToLower();
            var fileName = $"{userId}_{Guid.NewGuid()}{fileExtension}";

            // Upload based on storage type
            if (_useAzureStorage)
            {
                await UploadToAzureAsync(fileName, file);
            }
            else if (_useGoogleCloudStorage)
            {
                await UploadToGoogleCloudAsync(fileName, file);
            }
            else
            {
                await UploadToLocalAsync(fileName, file);
            }

            // Update user record
            user.AvatarUri = fileName;
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();

            response.Success = true;
            response.Data = fileName;
            response.Message = "Avatar uploaded successfully";
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading avatar for user {UserId}", userId);
            response.Success = false;
            response.Message = "Failed to upload avatar";
            return response;
        }
    }

    public async Task<ResponseBase> DeleteAvatarAsync(long userId)
    {
        if (!_currentUser.IsAdmin && _currentUser.UserId != userId)
        {
            throw new UnauthorizedAccessException("You do not have permission to delete this avatar.");
        }

        var response = new ResponseBase();

        try
        {
            var user = await _userRepository.GetAsync(userId);
            if (user == null)
            {
                response.Success = false;
                response.Message = "User not found";
                return response;
            }

            if (!string.IsNullOrEmpty(user.AvatarUri))
            {
                await DeleteAvatarFileAsync(user.AvatarUri);
                user.AvatarUri = null;
                user.UpdatedAt = DateTime.UtcNow;
                await _userRepository.UpdateAsync(user);
                await _userRepository.SaveChangesAsync();
            }

            response.Success = true;
            response.Message = "Avatar deleted successfully";
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting avatar for user {UserId}", userId);
            response.Success = false;
            response.Message = "Failed to delete avatar";
            return response;
        }
    }

    public async Task<(Stream? FileStream, string ContentType)> GetAvatarAsync(string fileName)
    {
        try
        {
            if (_useAzureStorage)
            {
                return await GetFromAzureAsync(fileName);
            }
            else if (_useGoogleCloudStorage)
            {
                return await GetFromGoogleCloudAsync(fileName);
            }
            else
            {
                return await GetFromLocalAsync(fileName);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving avatar file {FileName}", fileName);
            return (null, string.Empty);
        }
    }

    private async Task DeleteAvatarFileAsync(string fileName)
    {
        try
        {
            if (_useAzureStorage)
            {
                await DeleteFromAzureAsync(fileName);
            }
            else if (_useGoogleCloudStorage)
            {
                await DeleteFromGoogleCloudAsync(fileName);
            }
            else
            {
                DeleteFromLocal(fileName);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting avatar file {FileName}", fileName);
        }
    }

    // Azure Storage methods
    private async Task UploadToAzureAsync(string fileName, IFormFile file)
    {
        if (_blobContainerClient == null)
            throw new InvalidOperationException("Blob container client not initialized");

        var blobClient = _blobContainerClient.GetBlobClient(fileName);
        var contentType = GetContentType(fileName);
        
        await using var stream = file.OpenReadStream();
        await blobClient.UploadAsync(stream, new BlobHttpHeaders { ContentType = contentType });
        
        _logger.LogInformation("Uploaded avatar {FileName} to Azure Blob Storage", fileName);
    }

    private async Task<(Stream? FileStream, string ContentType)> GetFromAzureAsync(string fileName)
    {
        if (_blobContainerClient == null)
            return (null, string.Empty);

        var blobClient = _blobContainerClient.GetBlobClient(fileName);
        
        if (!await blobClient.ExistsAsync())
        {
            return (null, string.Empty);
        }

        var download = await blobClient.DownloadAsync();
        var contentType = download.Value.ContentType;
        
        return (download.Value.Content, contentType);
    }

    private async Task DeleteFromAzureAsync(string fileName)
    {
        if (_blobContainerClient == null)
            return;

        var blobClient = _blobContainerClient.GetBlobClient(fileName);
        await blobClient.DeleteIfExistsAsync();
        
        _logger.LogInformation("Deleted avatar {FileName} from Azure Blob Storage", fileName);
    }

    // Google Cloud Storage methods
    private async Task UploadToGoogleCloudAsync(string fileName, IFormFile file)
    {
        if (_googleStorageClient == null)
            throw new InvalidOperationException("Google Cloud Storage client not initialized");

        var contentType = GetContentType(fileName);
        
        await using var stream = file.OpenReadStream();
        
        await _googleStorageClient.UploadObjectAsync(_config.GoogleCloudBucketName, fileName, contentType, stream);
        
        _logger.LogInformation("Uploaded avatar {FileName} to Google Cloud Storage bucket {Bucket}", fileName, _config.GoogleCloudBucketName);
    }

    private async Task<(Stream? FileStream, string ContentType)> GetFromGoogleCloudAsync(string fileName)
    {
        if (_googleStorageClient == null)
            return (null, string.Empty);

        try
        {
            var stream = new MemoryStream();
            await _googleStorageClient.DownloadObjectAsync(_config.GoogleCloudBucketName, fileName, stream);
            stream.Position = 0;
            
            var contentType = GetContentType(fileName);
            return (stream, contentType);
        }
        catch (Google.GoogleApiException ex) when (ex.HttpStatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return (null, string.Empty);
        }
    }

    private async Task DeleteFromGoogleCloudAsync(string fileName)
    {
        if (_googleStorageClient == null)
            return;

        try
        {
            await _googleStorageClient.DeleteObjectAsync(_config.GoogleCloudBucketName, fileName);
            _logger.LogInformation("Deleted avatar {FileName} from Google Cloud Storage bucket {Bucket}", fileName, _config.GoogleCloudBucketName);
        }
        catch (Google.GoogleApiException ex) when (ex.HttpStatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Avatar {FileName} not found in Google Cloud Storage bucket {Bucket} for deletion", fileName, _config.GoogleCloudBucketName);
        }
    }

    // Local file system methods
    private async Task UploadToLocalAsync(string fileName, IFormFile file)
    {
        if (_localPath == null)
            throw new InvalidOperationException("Local path not configured");

        var filePath = Path.Combine(_localPath, fileName);
        
        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);
        
        _logger.LogInformation("Uploaded avatar {FileName} to local storage", fileName);
    }

    private Task<(Stream? FileStream, string ContentType)> GetFromLocalAsync(string fileName)
    {
        if (_localPath == null)
            return Task.FromResult<(Stream?, string)>((null, string.Empty));

        var filePath = Path.Combine(_localPath, fileName);
        
        if (!File.Exists(filePath))
        {
            return Task.FromResult<(Stream?, string)>((null, string.Empty));
        }

        var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        var contentType = GetContentType(fileName);
        
        return Task.FromResult<(Stream?, string)>((fileStream, contentType));
    }

    private void DeleteFromLocal(string fileName)
    {
        if (_localPath == null)
            return;

        var filePath = Path.Combine(_localPath, fileName);
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
            _logger.LogInformation("Deleted avatar {FileName} from local storage", fileName);
        }
    }

    private static string GetContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLower();
        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            _ => "application/octet-stream"
        };
    }
}
