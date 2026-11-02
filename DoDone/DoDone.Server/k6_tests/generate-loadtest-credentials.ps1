# PowerShell script to generate CSV file with load test team admin credentials
# This script connects to the database and extracts admin users from load test teams

param(
    [string]$DatabaseHost = "localhost",
    [string]$DatabaseName = "DoDone",
    [string]$DatabaseUser = "postgres",
    [string]$DatabasePassword = "",
    [string]$OutputFile = "loadtest-credentials.csv"
)

Write-Host "Generating load test credentials CSV..." -ForegroundColor Green

# Install required module if not present
if (-not (Get-Module -ListAvailable -Name "npgsql")) {
    Write-Host "Installing npgsql module..." -ForegroundColor Yellow
    Install-Module -Name npgsql -Force -Scope CurrentUser
}

Import-Module npgsql

try {
    # Connection string
    $connectionString = "Host=$DatabaseHost;Database=$DatabaseName;Username=$DatabaseUser;Password=$DatabasePassword"
    
    Write-Host "Connecting to database..." -ForegroundColor Yellow
    $connection = New-Object Npgsql.NpgsqlConnection($connectionString)
    $connection.Open()
    
    # Query to get admin users from load test teams
    $query = @"
SELECT 
    t."Id" as TeamId,
    t."Name" as TeamName, 
    u."Id" as UserId,
    u."Email" as Email,
    u."FirstName" as FirstName,
    u."LastName" as LastName
FROM "Teams" t
INNER JOIN "AspNetUsers" u ON t."Id" = u."TeamId"
WHERE t."Name" LIKE '%LoadTest%' 
  AND u."IsAdmin" = true
  AND u."IsActive" = true
ORDER BY t."Id"
"@
    
    $command = New-Object Npgsql.NpgsqlCommand($query, $connection)
    $reader = $command.ExecuteReader()
    
    # Create CSV content
    $csvContent = @("TeamId,TeamName,UserId,Email,FirstName,LastName,Password")
    $userCount = 0
    
    while ($reader.Read()) {
        $teamId = $reader["TeamId"]
        $teamName = $reader["TeamName"]
        $userId = $reader["UserId"]
        $email = $reader["Email"]
        $firstName = $reader["FirstName"]
        $lastName = $reader["LastName"]
        $password = "LoadTest123!"  # Standard password for all load test users
        
        $csvLine = "$teamId,$teamName,$userId,$email,$firstName,$lastName,$password"
        $csvContent += $csvLine
        $userCount++
    }
    
    $reader.Close()
    $connection.Close()
    
    # Write CSV file
    $csvContent | Out-File -FilePath $OutputFile -Encoding UTF8
    
    Write-Host "Successfully generated $OutputFile with $userCount admin users" -ForegroundColor Green
    Write-Host "File location: $(Resolve-Path $OutputFile)" -ForegroundColor Cyan
    
    # Show first few lines as preview
    Write-Host "`nPreview of generated file:" -ForegroundColor Yellow
    Get-Content $OutputFile -First 5 | ForEach-Object { Write-Host $_ -ForegroundColor White }
    if ($userCount -gt 4) {
        Write-Host "... and $($userCount - 4) more entries" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nNext steps:" -ForegroundColor Magenta
Write-Host "1. Update your k6 test to use this CSV file" -ForegroundColor White
Write-Host "2. Each virtual user should pick a random admin and authenticate" -ForegroundColor White
Write-Host "3. Use the admin's team data for testing" -ForegroundColor White