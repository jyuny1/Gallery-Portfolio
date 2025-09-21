#!/bin/bash

# Gallery Update Script
# Generates WebP previews and updates gallery index from R2 storage

echo "🎯 Gallery Update Script Started"
echo "================================="

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed or not in PATH"
    exit 1
fi

# Function to check command success
check_command() {
    if [ $? -eq 0 ]; then
        echo "✅ $1 completed successfully"
    else
        echo "❌ $1 failed"
        exit 1
    fi
}

echo ""
echo "📸 Step 1: Generating WebP previews from R2 storage..."
echo "-----------------------------------------------------"
npm run r2:generate-previews
check_command "WebP preview generation"

echo ""
echo "📊 Step 2: Generating gallery index..."
echo "-------------------------------------"
npm run r2:generate-index
check_command "Gallery index generation"

echo ""
echo "🎉 Gallery update completed successfully!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Review the updated gallery-index.json"
echo "2. Commit changes: git add . && git commit -m 'update: refresh gallery'"
echo "3. Push to GitHub: git push origin main"
echo ""