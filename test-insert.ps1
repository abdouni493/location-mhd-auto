$headers = @{"Content-Type" = "application/json"}
$body = @{
    rows = @(
        @{
            reservation_id = "90a870f2-59f3-45c2-812f-eb2ac945d0bb"
            type = "depart"
            date = "2025-01-17"
            mileage = 50000
            fuel = "plein"
            security = @{ airbags = $true }
            equipment = @{}
            comfort = @{}
            cleanliness = @{}
            exterior_photos = @("photo1.jpg")
            interior_photos = @()
            signature = "sig.png"
            notes = "test"
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Request body:"
Write-Host $body
Write-Host ""

$response = Invoke-WebRequest -Uri http://localhost:4000/api/from/inspections/insert `
    -Method POST `
    -Headers $headers `
    -Body $body

Write-Host "Status: $($response.StatusCode)"
Write-Host "Response:"
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5 | Write-Host
