# Gallery Update Script for PowerShell
# Generates WebP previews and updates gallery index from R2 storage

Write-Host "🎯 Gallery Update Script Started" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is available
try {
    npm --version | Out-Null
} catch {
    Write-Host "❌ Error: npm is not installed or not in PATH" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Function to check command success
function Invoke-CommandWithCheck {
    param(
        [string]$Command,
        [string]$Description
    )

    Write-Host ""
    Write-Host "📸 $Description..." -ForegroundColor Yellow
    Write-Host ("-" * 50) -ForegroundColor Gray

    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Description completed successfully" -ForegroundColor Green
        } else {
            throw "Command failed with exit code $LASTEXITCODE"
        }
    } catch {
        Write-Host "❌ $Description failed" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Step 1: Generate WebP previews
Invoke-CommandWithCheck -Command "npm run r2:generate-previews" -Description "Step 1: Generating WebP previews from R2 storage"

# Step 2: Generate gallery index
Invoke-CommandWithCheck -Command "npm run r2:generate-index" -Description "Step 2: Generating gallery index"

Write-Host ""
Write-Host "🎉 Gallery update completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the updated gallery-index.json" -ForegroundColor White
Write-Host "2. Commit changes: git add . && git commit -m 'update: refresh gallery'" -ForegroundColor White
Write-Host "3. Push to GitHub: git push origin main" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"