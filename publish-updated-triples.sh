#!/bin/bash

# Compile the TypeScript file
echo "Compiling publish-updated-triples.ts..."
npx tsc src/core/publish-updated-triples.ts --esModuleInterop --target es2020 --module esnext --moduleResolution node --outDir dist/core

# Run the compiled JavaScript file
echo "Running publish-updated-triples.js..."
node --experimental-modules --es-module-specifier-resolution=node dist/core/publish-updated-triples.js

echo "Done!"
