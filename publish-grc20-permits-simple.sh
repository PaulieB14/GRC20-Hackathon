#!/bin/bash
set -e

echo "Creating dist-test directory if it doesn't exist..."
mkdir -p dist-test/core

echo "Compiling only the necessary files..."
npx tsc src/core/transformPermits.ts --outDir dist-test/core --module NodeNext --moduleResolution NodeNext --target ES2022 --esModuleInterop
npx tsc src/core/publish-grc20-permits.ts --outDir dist-test/core --module NodeNext --moduleResolution NodeNext --target ES2022 --esModuleInterop

echo "Publishing GRC20 permits with relationship-based structure..."
# Temporarily set SPACE_ID to PERMITS_SPACE_ID for the script
PERMITS_SPACE_ID=$(grep PERMITS_SPACE_ID .env | cut -d '=' -f2)
ORIGINAL_SPACE_ID=$(grep "^SPACE_ID=" .env | cut -d '=' -f2)

# Create a temporary .env file with SPACE_ID set to PERMITS_SPACE_ID
cp .env .env.bak
sed -i.bak "s/^SPACE_ID=.*/SPACE_ID=$PERMITS_SPACE_ID/" .env

# Run the script
node dist-test/core/publish-grc20-permits.js

# Restore the original .env file
mv .env.bak .env

echo "Done!"
