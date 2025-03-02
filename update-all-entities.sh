#!/bin/bash

# Compile the TypeScript file
echo "Compiling update-all-entities.ts..."
npx tsc src/update-all-entities.ts --esModuleInterop --target es2020 --module esnext --moduleResolution node --outDir dist

# Run the compiled JavaScript file
echo "Running update-all-entities.js..."
node --experimental-modules --es-module-specifier-resolution=node dist/update-all-entities.js

echo "Done!"
