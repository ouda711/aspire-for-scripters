#!/bin/bash

# Navigate to project directory
cd "$(dirname "$0")"

echo "🚀 Starting Express.js API Demo with PostgreSQL..."
echo ""

# Set environment variables
export NODE_ENV=development
export PORT=3000
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=1234
export POSTGRES_DB=postgres
export REDIS_HOST=localhost
export REDIS_PORT=6379
export JWT_SECRET=dev-secret-key-change-in-production

echo "📊 Configuration:"
echo "   PORT: $PORT"
echo "   DATABASE: postgresql://$POSTGRES_USER:****@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"
echo ""

# Start the server
node dist/index.js
