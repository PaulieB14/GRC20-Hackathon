#!/bin/bash
set -e

echo "Compiling TypeScript..."
npx tsc

echo "Running permit relations test..."
node dist-test/test-permit-relations.js

echo "Done!"
