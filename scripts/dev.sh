#!/bin/bash

echo "========== Starting Development Environment =========="

# Start the database container
echo "Starting the database container..."
docker compose -f docker-compose.yml up -d

# Trap SIGINT (Ctrl+C) to stop the database and clean up
trap cleanup SIGINT

cleanup() {
  echo "Stopping the database container..."
  docker compose -f docker-compose.yml stop
  exit
}

# Start the development server
echo "Starting the development server..."
nodemon -r tsconfig-paths/register src/index.ts
