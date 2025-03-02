#!/bin/bash

# This script compiles and runs the push-entities-with-addresses.ts script

# Compile the TypeScript file
echo "Compiling TypeScript..."
npx tsc src/core/push-entities-with-addresses.ts --esModuleInterop --module esnext --moduleResolution node --target es2020 --outDir dist

# Run the compiled JavaScript file
echo "Running script..."
node --experimental-modules dist/core/push-entities-with-addresses.js

echo "Done!"
