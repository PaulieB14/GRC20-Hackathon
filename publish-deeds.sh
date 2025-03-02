#!/bin/bash

# Compile the TypeScript files
echo "Compiling TypeScript files..."
npx tsc src/transformDeeds.ts src/publish.ts --esModuleInterop --target es2020 --module esnext --moduleResolution node --outDir dist

# Set the space ID for deeds
export SPACE_ID=P77ioa8U9EipVASzVHBA9B

# Run the publish script
echo "Publishing deeds..."
node --experimental-modules --es-module-specifier-resolution=node dist/publish.js

echo "Deed publication complete!"
