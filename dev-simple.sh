#!/bin/bash

# Simple development script using Quarto's built-in preview
# This is the easiest way to get live reload working

echo "🚀 Starting Atlas Notebooks Development (Simple Mode)"
echo "===================================================="

# Check if Quarto is installed
if ! command -v quarto &> /dev/null; then
    echo "❌ Quarto is not installed. Please install Quarto first."
    echo "   Visit: https://quarto.org/docs/get-started/"
    exit 1
fi

echo "📦 Building and previewing site..."
echo "   URL: http://localhost:4200"
echo "   Live reload: Enabled"
echo "   Press Ctrl+C to stop"
echo ""

# Use Quarto's built-in preview with live reload
quarto preview --port 4200 --no-browser
