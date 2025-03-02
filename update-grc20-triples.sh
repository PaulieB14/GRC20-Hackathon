#!/bin/bash

# Compile the TypeScript file
echo "Compiling update-grc20-triples.ts..."
npx tsc src/core/update-grc20-triples.ts --esModuleInterop --target es2020 --module esnext --moduleResolution node --outDir dist/core

# Run the compiled JavaScript file
echo "Running update-grc20-triples.js..."
node --experimental-modules --es-module-specifier-resolution=node dist/core/update-grc20-triples.js

echo "Done!"
