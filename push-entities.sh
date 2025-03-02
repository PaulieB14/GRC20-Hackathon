#!/bin/bash

# Compile the TypeScript file
echo "Compiling push-entities.ts..."
npx tsc src/core/push-entities.ts --esModuleInterop --target es2020 --module esnext --moduleResolution node --outDir dist

# Run the compiled JavaScript file
echo "Running push-entities.js..."
node --experimental-modules --es-module-specifier-resolution=node dist/core/push-entities.js

echo "Done!"
