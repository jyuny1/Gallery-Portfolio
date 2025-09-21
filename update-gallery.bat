@echo off
chcp 65001 >nul

REM Gallery Update Script for Windows
REM Generates WebP previews and updates gallery index from R2 storage

echo 🎯 Gallery Update Script Started
echo =================================

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo 📸 Step 1: Generating WebP previews from R2 storage...
echo -----------------------------------------------------
call npm run r2:generate-previews
if errorlevel 1 (
    echo ❌ WebP preview generation failed
    pause
    exit /b 1
)
echo ✅ WebP preview generation completed successfully

echo.
echo 📊 Step 2: Generating gallery index...
echo -------------------------------------
call npm run r2:generate-index
if errorlevel 1 (
    echo ❌ Gallery index generation failed
    pause
    exit /b 1
)
echo ✅ Gallery index generation completed successfully

echo.
echo 🎉 Gallery update completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Review the updated gallery-index.json
echo 2. Commit changes: git add . ^&^& git commit -m "update: refresh gallery"
echo 3. Push to GitHub: git push origin main
echo.
pause