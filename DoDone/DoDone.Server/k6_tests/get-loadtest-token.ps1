# PowerShell script to get JWT token for load testing
# This script registers a test user and gets a JWT token for k6 load tests

param(
    [string]$BaseUrl = "https://localhost:5215",
    [string]$Email = "loadtest.user1@dodone.com",
    [string]$UserName = "",
    [string]$Password = "LoadTest123!",
    [string]$FirstName = "LoadTest",
    [string]$LastName = "User"
)

# Default UserName to Email if not provided
if ([string]::IsNullOrEmpty($UserName)) {
    $UserName = $Email
}

Write-Host "Getting JWT token for load testing..." -ForegroundColor Green
Write-Host "Using UserName: $UserName" -ForegroundColor Yellow

# Function to make HTTP requests
function Invoke-ApiRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    try {
        $splat = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
            Headers = $Headers
        }
        
        if ($Body) {
            $splat.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @splat
        return @{
            Success = $true
            Data = $response
        }
    }
    catch {
        $errorDetails = $_.Exception.Response
        $statusCode = if ($errorDetails) { $errorDetails.StatusCode } else { "Unknown" }
        
        # More detailed error information
        Write-Host "HTTP Error Details:" -ForegroundColor Red
        Write-Host "URL: $Url" -ForegroundColor Yellow
        Write-Host "Method: $Method" -ForegroundColor Yellow
        Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
        Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Yellow
        
        if ($_.Exception.Response) {
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $responseBody = $reader.ReadToEnd()
                Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
            }
            catch {
                Write-Host "Could not read response body" -ForegroundColor Yellow
            }
        }
        
        return @{
            Success = $false
            Error = $_.Exception.Message
            StatusCode = $statusCode
        }
    }
}

# Try to login first (in case user already exists)
Write-Host "Attempting to login with existing user..." -ForegroundColor Yellow

$loginRequest = @{
    UserName = $UserName
    Password = $Password
}

$loginResult = Invoke-ApiRequest -Url "$BaseUrl/api/auth/login" -Method "POST" -Body $loginRequest

if ($loginResult.Success) {
    Write-Host "Login successful!" -ForegroundColor Green
    $token = $loginResult.Data.token
}
else {
    Write-Host "Login failed, attempting to register new user..." -ForegroundColor Yellow
    
    # Register new user
    $registerRequest = @{
        UserName = $UserName
        Email = $Email
        Password = $Password
        FirstName = $FirstName
        LastName = $LastName
        DeviceId = [System.Guid]::NewGuid().ToString()
        Platform = "web"  # or "android"/"ios"
        Timezone = [System.TimeZoneInfo]::Local.Id
        TeamName = "LoadTest Team"
        TeamDescription = "Team created for load testing"
        IsBusiness = $false
    }
    
    $registerResult = Invoke-ApiRequest -Url "$BaseUrl/api/auth/register" -Method "POST" -Body $registerRequest
    
    if ($registerResult.Success) {
        Write-Host "Registration successful! Now logging in to get token..." -ForegroundColor Green
        
        # Login after successful registration
        $loginAfterRegister = Invoke-ApiRequest -Url "$BaseUrl/api/auth/login" -Method "POST" -Body $loginRequest
        
        if ($loginAfterRegister.Success) {
            Write-Host "Login after registration successful!" -ForegroundColor Green
            $token = $loginAfterRegister.Data.token
        }
        else {
            Write-Host "Login after registration failed: $($loginAfterRegister.Error)" -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "Registration failed: $($registerResult.Error)" -ForegroundColor Red
        Write-Host "Status Code: $($registerResult.StatusCode)" -ForegroundColor Red
        exit 1
    }
}

if ($token) {
    Write-Host "JWT Token obtained successfully!" -ForegroundColor Green
    Write-Host "Token: $token" -ForegroundColor Cyan
    
    # Update the k6 test file with the token
    $k6FilePath = "DoDone.Server\k6_tests\taskItemTests.js"
    
    if (Test-Path $k6FilePath) {
        Write-Host "Updating k6 test file with token..." -ForegroundColor Yellow
        
        $content = Get-Content $k6FilePath -Raw
        $updatedContent = $content -replace "const AUTH_TOKEN = 'your-jwt-token-here';", "const AUTH_TOKEN = '$token';"
        $updatedContent = $updatedContent -replace "const BASE_URL = 'http://localhost:5000';", "const BASE_URL = '$BaseUrl';"
        
        Set-Content $k6FilePath -Value $updatedContent
        Write-Host "k6 test file updated successfully!" -ForegroundColor Green
    }
    else {
        Write-Host "k6 test file not found at: $k6FilePath" -ForegroundColor Red
        Write-Host "Please manually update your k6 script with this token: $token" -ForegroundColor Yellow
    }
    
    # Test the token by making a sample API call
    Write-Host "Testing token with sample API call..." -ForegroundColor Yellow
    
    $testHeaders = @{
        "Authorization" = "Bearer $token"
    }
    
    $testResult = Invoke-ApiRequest -Url "$BaseUrl/api/taskitem/test" -Headers $testHeaders
    
    if ($testResult.Success) {
        Write-Host "Token test successful! You're ready to run load tests." -ForegroundColor Green
    }
    else {
        Write-Host "Token test failed: $($testResult.Error)" -ForegroundColor Red
        Write-Host "But you can still try running the load tests..." -ForegroundColor Yellow
    }
}
else {
    Write-Host "Failed to obtain JWT token" -ForegroundColor Red
    exit 1
}

Write-Host "`nNext steps:" -ForegroundColor Magenta
Write-Host "1. Make sure your DoDone server is running on $BaseUrl" -ForegroundColor White
Write-Host "2. Run the LoadTestDataGeneration.sql script in your database" -ForegroundColor White
Write-Host "3. Run: k6 run k6_tests/taskItemTests.js" -ForegroundColor White