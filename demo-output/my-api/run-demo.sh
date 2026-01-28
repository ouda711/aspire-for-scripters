#!/bin/bash

# Navigate to project directory
cd "$(dirname "$0")"

echo "🚀 Starting Express.js API Demo..."
echo ""

# Set environment variables
export NODE_ENV=development
export PORT=3000
export JWT_SECRET=dev-secret-key-change-in-production

# Start the server
node dist/index.js
