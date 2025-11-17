# Development Setup for Atlas Notebooks

This document explains how to set up a development environment with live reload for the Atlas Notebooks project.

## Quick Start (Recommended)

The easiest way to get live reload working is to use Quarto's built-in preview:

```bash
./dev-simple.sh
```

This will:

- Build the site
- Start a development server at http://localhost:4200
- Automatically reload when you make changes to any files

## Advanced Development Setup

For more control over the development environment, use the full development script:

```bash
./dev.sh
```

This will:

- Build the site initially
- Start a custom development server at http://localhost:8000
- Watch for file changes and automatically rebuild
- Use WebSocket connections for instant reloading

## Manual Setup

If you prefer to run commands manually:

### Option 1: Quarto Preview (Simplest)

```bash
quarto preview --port 4200 --no-browser
```

### Option 2: Custom Development Server

```bash
# Build the site
quarto render

# Start the development server with live reload
deno run --allow-net --allow-read --allow-write --allow-run dev-watch.ts
```

## What Gets Watched

The development server watches for changes in:

- `./notebooks/` - All notebook files
- `./helpers/` - Helper scripts and components
- `./data/` - Data files
- `./images/` - Image assets
- `./styles.css` - Main stylesheet
- `./_quarto.yml` - Quarto configuration

## Troubleshooting

### Live Reload Not Working

1. Make sure you're using one of the development scripts
2. Check that your browser allows WebSocket connections
3. Try refreshing the page manually first

### Build Errors

1. Check the console output for specific error messages
2. Ensure all dependencies are installed
3. Verify your Quarto configuration in `_quarto.yml`

### Port Already in Use

If you get a "port already in use" error:

- Change the port in the script (e.g., `--port 4201`)
- Or kill the process using that port

## File Structure

```
atlas_notebooks/
├── dev.sh              # Full development script
├── dev-simple.sh       # Simple development script
├── dev-watch.ts        # Custom development server with file watching
├── dev-server.ts       # Basic development server
└── DEVELOPMENT.md      # This file
```

## Tips

1. **Use the simple script first** - It's the most reliable way to get live reload working
2. **Keep the terminal open** - The development server needs to stay running
3. **Check the browser console** - Any JavaScript errors will appear there
4. **Save files frequently** - Changes are detected when files are saved

## Stopping the Development Server

Press `Ctrl+C` in the terminal where the development server is running.
