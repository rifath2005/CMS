# Test API Endpoints for Member 2 Work
# Make sure server is running: npm run dev

$baseUrl = "http://localhost:3000/api/v1"

Write-Host "Testing Canteen Management System API..." -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n1. Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET
    Write-Host "✓ Server is healthy" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "✗ Server not responding" -ForegroundColor Red
    exit
}

# Test 2: API Info
Write-Host "`n2. API Endpoints..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl" -Method GET
    Write-Host "✓ Available endpoints:" -ForegroundColor Green
    $response.endpoints | ConvertTo-Json
} catch {
    Write-Host "✗ Failed to get endpoints" -ForegroundColor Red
}

Write-Host "`n✓ Basic tests complete!" -ForegroundColor Green
Write-Host "Server is ready for testing Member 2 features." -ForegroundColor Cyan
