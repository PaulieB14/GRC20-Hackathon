#!/bin/bash

# Compile the TypeScript file
echo "Compiling update-entity-ids-grc20.ts..."
npx tsc src/update-entity-ids-grc20.ts --esModuleInterop --target es2020 --module esnext --moduleResolution node --outDir dist

# Run the compiled JavaScript file
echo "Running update-entity-ids-grc20.js..."
node --experimental-modules --es-module-specifier-resolution=node dist/update-entity-ids-grc20.js

echo "Done!"
