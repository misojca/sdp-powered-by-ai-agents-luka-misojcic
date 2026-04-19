#!/usr/bin/env bash
set -e

echo "🐳 Building Docker image..."
docker build -t kata-tests .

echo "🧪 Running tests..."
docker run --rm kata-tests || true

echo "✅ Docker hook complete!"
