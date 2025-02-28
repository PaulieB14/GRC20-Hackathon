#!/bin/bash

# Script to create and publish a governance accept edit

# Check if CID is provided
if [ -z "$1" ]; then
  echo "Error: CID not provided"
  echo "Usage: ./accept-edit.sh <CID>"
  exit 1
fi

CID=$1

# Build the TypeScript files
echo "Building TypeScript files..."
npm run build

# Run the governance accept edit creation script
echo "Creating and publishing governance accept edit for CID: $CID"
node dist/create-governance-edit.js "$CID"
