#!/bin/bash

# Production deployment script
# This script ensures all required directories exist before starting the server

echo "🚀 Starting production deployment..."

# Create necessary directories
mkdir -p public/temp
echo "📁 Created public/temp directory"

# Set permissions (if on Linux/Unix)
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    chmod 755 public/temp
    echo "🔒 Set permissions for temp directory"
fi

echo "✅ Production setup complete!"
