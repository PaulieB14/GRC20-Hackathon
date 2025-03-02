#!/bin/bash

# Compile the TypeScript file
echo "Compiling push-entities-with-properties.ts..."
npx tsc src/core/push-entities-with-properties.ts --esModuleInterop --target es2020 --module esnext --moduleResolution node --outDir dist/core

# Run the compiled JavaScript file
echo "Running push-entities-with-properties.js..."
node --experimental-modules --es-module-specifier-resolution=node dist/core/push-entities-with-properties.js

echo "Done!"
