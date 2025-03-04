#!/bin/bash
set -e

echo "Creating dist-test directory if it doesn't exist..."
mkdir -p dist-test

echo "Compiling update-type-names.ts..."
npx tsc src/update-type-names.ts --outDir dist-test --module NodeNext --moduleResolution NodeNext --target ES2022 --esModuleInterop

echo "Running update-type-names.js..."
node dist-test/update-type-names.js

echo "Done!"
