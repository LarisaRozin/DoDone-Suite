# PowerShell script to generate CSV with load test credentials using API
# This script uses the API to get team data and generate credentials

param(
    [string]$BaseUrl = "http://localhost:5214",
    [string]$AdminEmail = "k6loadtest2@example.com", # An existing admin user that can access team data
    [string]$AdminPassword = "LoadTest123!",
    [string]$OutputFile = "loadtest-credentials.csv"
)

Write-Host "Generating load test credentials CSV using API..." -ForegroundColor Green

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
        Write-Host "API Error: $($_.Exception.Message)" -ForegroundColor Red
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

# Login to get admin token
Write-Host "Authenticating admin user..." -ForegroundColor Yellow
$loginRequest = @{
    UserName = $AdminEmail
    Password = $AdminPassword
}

$loginResult = Invoke-ApiRequest -Url "$BaseUrl/api/auth/login" -Method "POST" -Body $loginRequest

if (-not $loginResult.Success) {
    Write-Host "Failed to authenticate admin user: $($loginResult.Error)" -ForegroundColor Red
    exit 1
}

$adminToken = $loginResult.Data.token
$headers = @{
    "Authorization" = "Bearer $adminToken"
}

Write-Host "Getting user data..." -ForegroundColor Yellow

# Since we can't easily query all teams, we'll generate the CSV based on the known pattern
# from the SQL script: teams 251-271 and 8276-10276, each with 5 users, first user is admin

$csvContent = @("TeamId,TeamName,UserId,UserName,Email,FirstName,LastName,Password")
$generatedUsers = 0

# Generate for known team ranges based on the LoadTestDataGeneration.sql script
$teamRanges = @(
    @{ Start = 251; End = 271 },
    @{ Start = 8276; End = 10276 }
)

Write-Host "Generating credentials for known team ranges..." -ForegroundColor Yellow

foreach ($range in $teamRanges) {
    for ($teamId = $range.Start; $teamId -le $range.End; $teamId++) {
        # Calculate user counter based on team position
        # From SQL: user_counter starts at 105 and increments by 5 for each team
        $teamPosition = if ($teamId -le 271) { $teamId - 251 + 22 } else { $teamId - 8276 + 22 + 21 }
        $baseUserCounter = 105 + (($teamPosition - 22) * 5)
        
        # First user in each team is admin (team_user_counter = 1)
        $adminUserCounter = $baseUserCounter
        $adminUserName = "loadtest_user_$adminUserCounter"  # This is what login expects
        $adminEmail = "loadtest.user2$adminUserCounter@dodone.com"
        $teamName = "LoadTest Team $teamId"
        
        # For this approach, we'll use calculated user IDs
        # In production, you might want to query the API to get actual user IDs
        
        $csvLine = "$teamId,$teamName,CALC_$adminUserCounter,$adminUserName,$adminEmail,TestUser$adminUserCounter,LoadTest,LoadTest123!"
        $csvContent += $csvLine
        $generatedUsers++
        
        if ($generatedUsers % 100 -eq 0) {
            Write-Host "Generated $generatedUsers admin credentials..." -ForegroundColor Gray
        }
    }
}

# Write CSV file
$csvContent | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host "Successfully generated $OutputFile with $generatedUsers admin users" -ForegroundColor Green
Write-Host "File location: $(Resolve-Path $OutputFile)" -ForegroundColor Cyan

# Show preview
Write-Host "`nPreview of generated file:" -ForegroundColor Yellow
Get-Content $OutputFile -First 5 | ForEach-Object { Write-Host $_ -ForegroundColor White }
if ($generatedUsers -gt 4) {
    Write-Host "... and $($generatedUsers - 4) more entries" -ForegroundColor Gray
}


Write-Host "`nNext steps:" -ForegroundColor Magenta
Write-Host "1. Run: k6 run DoDone.Server/k6_tests/taskItemUpdateTestsMultiTeam.js" -ForegroundColor White
Write-Host "2. Each virtual user will pick a random team admin and authenticate" -ForegroundColor White
Write-Host "3. Testing will be distributed across $generatedUsers different teams" -ForegroundColor White
