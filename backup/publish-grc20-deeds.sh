#!/bin/bash

# Compile the TypeScript file
echo "Compiling publish-grc20-deeds.ts..."
npx tsc src/publish-grc20-deeds.ts --esModuleInterop --target es2020 --module esnext --moduleResolution node --outDir dist

# Run the compiled JavaScript file
echo "Running publish-grc20-deeds.js..."
node --experimental-modules --es-module-specifier-resolution=node dist/publish-grc20-deeds.js

echo "Done!"
