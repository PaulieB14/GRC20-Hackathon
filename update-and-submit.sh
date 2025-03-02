#!/bin/bash

# Compile the TypeScript file
echo "Compiling update-entity-ids-grc20.ts..."
npx tsc src/update-entity-ids-grc20.ts --esModuleInterop --target es2020 --module esnext --moduleResolution node --outDir dist

# Run the compiled JavaScript file with the publish flag
echo "Running update-entity-ids-grc20.js with publish flag..."
node --experimental-modules --es-module-specifier-resolution=node dist/update-entity-ids-grc20.js --publish

# Check if calldata.json exists
if [ -f "calldata.json" ]; then
  echo "Calldata generated successfully."
  
  # Extract to and data from calldata.json
  TO=$(node -e "const data = require('./calldata.json'); console.log(data.to);")
  DATA=$(node -e "const data = require('./calldata.json'); console.log(data.data);")
  
  # Submit the transaction
  echo "Submitting transaction..."
  node submit-transaction.js "$TO" "$DATA"
else
  echo "Error: calldata.json not found. Transaction not submitted."
  exit 1
fi

echo "Done!"
