#!/bin/bash
# Setup script for WebToApp development environment

set -e

echo "Setting up WebToApp development environment..."

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Start Docker services
echo "Starting Docker services..."
docker compose up -d db redis

# Wait for database
echo "Waiting for database..."
sleep 5

# Run migrations
echo "Running database migrations..."
docker compose run --rm backend alembic upgrade head

# Seed database
echo "Seeding database..."
docker compose run --rm backend python -m app.seed

# Start all services
echo "Starting all services..."
docker compose up -d

echo ""
echo "Setup complete!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/api/docs"
echo ""
echo "Default admin: admin@webtoapp.com / admin123"
