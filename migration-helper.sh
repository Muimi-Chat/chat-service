#!/bin/bash

# NOTE: For windows user, save this as LF, not CRLF
# (On VSCode, check the bottom-right)

# Run the generate-sql command and capture its output
output=$(npm run generate-sql)

# Check if the output contains the specific to determine if there are any migrations to perform...
if echo "$output" | grep -q "No schema changes, nothing to migrate"; then
  echo "No schema changes, nothing to migrate"
  exit 0
else
  echo "Schema changes detected. Running migrations..."
  npm run migrate
fi