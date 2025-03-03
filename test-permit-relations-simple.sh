#!/bin/bash
set -e

echo "Creating dist-test directory if it doesn't exist..."
mkdir -p dist-test

echo "Compiling just the transformPermits.ts file..."
npx tsc src/core/transformPermits.ts --outDir dist-test --module NodeNext --moduleResolution NodeNext --target ES2022 --esModuleInterop

echo "Compiling test-permit-relations.ts..."
npx tsc src/test-permit-relations.ts --outDir dist-test --module NodeNext --moduleResolution NodeNext --target ES2022 --esModuleInterop

echo "Running permit relations test..."
node dist-test/test-permit-relations.js

echo "Done!"
