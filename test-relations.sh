#!/bin/bash

# Create a directory for our compiled file
mkdir -p dist-test

# Compile the TypeScript file directly
echo "Compiling test-relations.ts..."
npx tsc src/test-relations.ts --esModuleInterop --target es2020 --module esnext --moduleResolution node --skipLibCheck --outDir dist-test

# Check if compilation was successful
if [ $? -ne 0 ]; then
  echo "Compilation failed. Exiting."
  exit 1
fi

# Parse command line arguments
PUBLISH_FLAG=""
ALL_FLAG=""

for arg in "$@"
do
  if [ "$arg" == "--publish" ]; then
    PUBLISH_FLAG="--publish"
  fi
  if [ "$arg" == "--all" ]; then
    ALL_FLAG="--all"
  fi
done

# Run the compiled JavaScript file with the appropriate flags
echo "Running test-relations.js..."
node --experimental-modules --es-module-specifier-resolution=node dist-test/test-relations.js $PUBLISH_FLAG $ALL_FLAG

echo "Done!"
