#!/bin/bash

# This script compiles and runs the update-entity-mapping.ts script

# Compile the TypeScript file
echo "Compiling TypeScript..."
npx tsc src/core/update-entity-mapping.ts --esModuleInterop --module commonjs --moduleResolution node --target es2020 --outDir dist

# Run the compiled JavaScript file
echo "Running script..."
node dist/core/update-entity-mapping.js

echo "Done!"
