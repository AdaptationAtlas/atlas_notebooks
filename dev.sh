#!/bin/bash

# Development script for Atlas Notebooks with live reload
# This script sets up a development environment with automatic rebuilding

echo "🚀 Starting Atlas Notebooks Development Server"
echo "=============================================="

# Check if Quarto is installed
if ! command -v quarto &> /dev/null; then
    echo "❌ Quarto is not installed. Please install Quarto first."
    echo "   Visit: https://quarto.org/docs/get-started/"
    exit 1
fi

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo "❌ Deno is not installed. Please install Deno first."
    echo "   Visit: https://deno.land/manual/getting_started/installation"
    exit 1
fi

# Build the site initially
echo "📦 Building site..."
quarto render

if [ $? -ne 0 ]; then
    echo "❌ Initial build failed. Please check your Quarto configuration."
    exit 1
fi

echo "✅ Site built successfully"
echo ""

# Start the development server
echo "🌐 Starting development server..."
echo "   URL: http://localhost:8000"
echo "   Live reload: Enabled"
echo "   Press Ctrl+C to stop"
echo ""

# Start the server with live reload
deno run --allow-net --allow-read --allow-write --allow-run dev-watch.ts
