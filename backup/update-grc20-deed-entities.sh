#!/bin/bash

# Compile the TypeScript files
echo "Compiling TypeScript files..."
npx tsc src/update-grc20-deeds.ts src/publish-grc20-deed-updates.ts --esModuleInterop --target es2020 --module esnext --moduleResolution node --outDir dist

# Run the compiled JavaScript file
echo "Running publish-grc20-deed-updates.js..."
node --experimental-modules --es-module-specifier-resolution=node dist/publish-grc20-deed-updates.js

echo "Done!"
