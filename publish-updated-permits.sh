#!/bin/bash

# This script updates the permit entity IDs, adds property addresses, and publishes to the knowledge graph

# Update the permit entity IDs and add property addresses
echo "Updating permit entity IDs and adding property addresses..."
node update-permit-ids.js

# Compile the TypeScript files
echo "Compiling TypeScript files..."
npx tsc src/core/publish-updated-triples.ts --esModuleInterop --target es2020 --module esnext --moduleResolution node --outDir dist

# Set the space ID for permits
export SPACE_ID=XPZ8fnf3DvNMRDbFgxEZi2

# Use the updated triples file
echo "Copying updated triples file..."
cp data/permits-triples-updated.json data/permits-triples.json

# Run the publish script
echo "Publishing permits with updated entity IDs and property addresses..."
node --experimental-modules --es-module-specifier-resolution=node dist/core/publish-updated-triples.js

echo "Permit publication complete!"
