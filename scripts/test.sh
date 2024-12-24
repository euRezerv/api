#!/bin/bash

echo "========== Starting Testing Environment =========="

dockerComposeFile="docker/docker-compose.test.yml"
projectName="eu_rezerv_test"
containerName="euRezerv_test"
envFile=".env.test"

# Helper function to clean up Docker containers and volumes
function cleanup() {
  echo "Cleaning up test database..."
  docker compose -f $dockerComposeFile -p $projectName --env-file $envFile down -v || {
    echo "Failed to clean up test database.";
    exit 1;
  }
}

# Start the test database
echo "Starting the test database..."
docker compose -f $dockerComposeFile -p $projectName --env-file $envFile up -d || {
  echo "Failed to start the test database.";
  exit 1;
}

# Wait for the database to become ready
echo "Waiting for the database to be ready..."
RETRIES=10
until docker exec $containerName pg_isready -U postgres >/dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
  echo "Database is not ready. Retrying in 1 second... ($RETRIES retries left)"
  sleep 1
  RETRIES=$((RETRIES - 1))
done

if [ $RETRIES -eq 0 ]; then
  echo "Database is still not ready after retries. Exiting."
  cleanup
  exit 1
fi

# Run database migrations
echo "Running database migrations..."
dotenv -e $envFile -- prisma migrate deploy || {
  echo "Failed to run migrations.";
  cleanup
  exit 1;
}

# Run Jest tests with coverage
echo "Running Jest tests..."
dotenv -e $envFile -- jest --coverage --watchAll --detectOpenHandles || {
  echo "Tests failed.";
  cleanup
  exit 1;
}

# Clean up Docker containers and volumes after tests
echo "Cleaning up..."
cleanup
