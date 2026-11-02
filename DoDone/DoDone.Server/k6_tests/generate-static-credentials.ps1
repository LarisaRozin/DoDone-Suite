# PowerShell script to generate static CSV with load test credentials
# Based on the pattern from LoadTestDataGeneration.sql

param(
    [string]$OutputFile = "loadtest-credentials.csv"
)

Write-Host "Generating static load test credentials CSV..." -ForegroundColor Green

$csvContent = @("TeamId,TeamName,UserId,UserName,Email,FirstName,LastName,Password")
$generatedUsers = 0

# Team ranges from your description: 251-271 and 8276-10276
$teamRanges = @(
    @{ Start = 251; End = 271 },
    @{ Start = 8276; End = 10276 }
)

Write-Host "Generating credentials for team ranges 251-271 and 8276-10276..." -ForegroundColor Yellow

foreach ($range in $teamRanges) {
    for ($teamId = $range.Start; $teamId -le $range.End; $teamId++) {
        # From LoadTestDataGeneration.sql pattern:
        # - Teams are numbered starting from 22, but your ranges are 251-271 and 8276-10276
        # - Users start from 105 and increment by 5 for each team (5 users per team)
        # - First user in each team is admin
        
        # Calculate base user counter for this team
        if ($teamId -le 271) {
            # First range: teams 251-271 (21 teams)
            $teamIndex = $teamId - 251  # 0-based index within this range
        } else {
            # Second range: teams 8276-10276 (2001 teams)
            $teamIndex = ($teamId - 8276) + 21  # Continue after first range
        }
        
        # Each team has 5 users, starting from user_counter 105
        $baseUserCounter = 105 + ($teamIndex * 5)
        
        # First user in each team is admin
        $adminUserCounter = $baseUserCounter
        $adminUserName = "loadtest_user_$adminUserCounter"  # This is what login expects
        $adminEmail = "loadtest.user2$adminUserCounter@dodone.com"
        $teamName = "LoadTest Team $teamId"
        $firstName = "TestUser$adminUserCounter"
        $lastName = "LoadTest"
        $password = "LoadTest123!"
        
        $csvLine = "$teamId,$teamName,$adminUserCounter,$adminUserName,$adminEmail,$firstName,$lastName,$password"
        $csvContent += $csvLine
        $generatedUsers++
        
        if ($generatedUsers % 500 -eq 0) {
            Write-Host "Generated $generatedUsers admin credentials..." -ForegroundColor Gray
        }
    }
}

# Write CSV file
$csvContent | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host "Successfully generated $OutputFile with $generatedUsers admin users" -ForegroundColor Green
Write-Host "File location: $(Resolve-Path $OutputFile)" -ForegroundColor Cyan

# Show statistics
$firstRangeCount = 271 - 251 + 1  # 21 teams
$secondRangeCount = 10276 - 8276 + 1  # 2001 teams
Write-Host "`nStatistics:" -ForegroundColor Yellow
Write-Host "- Teams 251-271: $firstRangeCount admin users"
Write-Host "- Teams 8276-10276: $secondRangeCount admin users"
Write-Host "- Total: $generatedUsers admin users"

# Show preview
Write-Host "`nPreview of generated file:" -ForegroundColor Yellow
Get-Content $OutputFile -First 5 | ForEach-Object { Write-Host $_ -ForegroundColor White }
Write-Host "..."
Get-Content $OutputFile -Last 2 | ForEach-Object { Write-Host $_ -ForegroundColor White }

Write-Host "`nNext steps:" -ForegroundColor Magenta
Write-Host "1. Make sure the DoDone server is running" -ForegroundColor White
Write-Host "2. Run: k6 run DoDone.Server/k6_tests/taskItemUpdateTestsMultiTeam.js" -ForegroundColor White
Write-Host "3. Each virtual user will pick a random team admin from $generatedUsers teams" -ForegroundColor White
Write-Host "4. This should eliminate optimistic concurrency issues!" -ForegroundColor White