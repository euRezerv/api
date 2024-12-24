#!/bin/bash

echo "========== Starting Development Environment =========="

dockerComposeFile="docker/docker-compose.yml"
projectName="eu_rezerv"
containerName="euRezerv"
envFile=".env"

# Start the database container
echo "Starting the database container..."
docker compose -f $dockerComposeFile -p $projectName --env-file $envFile up -d

# Trap SIGINT (Ctrl+C) to stop the database and clean up
trap cleanup SIGINT

cleanup() {
  echo "Stopping the database container..."
  docker compose -f $dockerComposeFile -p $projectName --env-file $envFile stop
  exit
}

# Start the development server
echo "Starting the development server..."
nodemon -r tsconfig-paths/register src/index.ts
