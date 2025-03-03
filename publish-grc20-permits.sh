#!/bin/bash
set -e

echo "Compiling TypeScript..."
npx tsc

echo "Publishing GRC20 permits with relationship-based structure..."
node dist-test/core/publish-grc20-permits.js

echo "Done!"
