$body = @{
    userName = "newuser123"
    password = "TestPass123!"
    email = "test@example.com"  # Use existing email
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5214/api/auth/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Success Response:"
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "Error Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Error Status Description: $($_.Exception.Response.StatusDescription)"
    
    # Try to read the error response body
    if ($_.Exception.Response) {
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $streamReader.ReadToEnd()
        $streamReader.Close()
        Write-Host "Error Response Body:"
        Write-Host $errorBody
    }
}