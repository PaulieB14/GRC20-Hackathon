#!/bin/bash

# This script updates the deed entity IDs, adds property addresses, and publishes to the knowledge graph

# Update the deed entity IDs and add property addresses
echo "Updating deed entity IDs and adding property addresses..."
node update-deed-ids.js

# Compile the TypeScript files
echo "Compiling TypeScript files..."
npx tsc src/publish.ts --esModuleInterop --target es2020 --module esnext --moduleResolution node --outDir dist

# Set the space ID for deeds
export SPACE_ID=P77ioa8U9EipVASzVHBA9B

# Use the updated triples file
echo "Copying updated triples file..."
cp data/deeds-triples-updated.json data/deeds-triples.json

# Run the publish script
echo "Publishing deeds with updated entity IDs and property addresses..."
node --experimental-modules --es-module-specifier-resolution=node dist/publish.js

echo "Deed publication complete!"
