#!/bin/bash
set -e

# Check if the .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create it with the required environment variables."
  echo "Required variables: WALLET_ADDRESS, PERMITS_SPACE_ID, PRIVATE_KEY"
  exit 1
fi

# Step 1: Update all entities to sentence case
echo "Step 1: Updating all entities to sentence case..."
chmod +x update-all-entities-to-sentence-case.sh
./update-all-entities-to-sentence-case.sh

# Check if the update was successful
if [ $? -ne 0 ]; then
  echo "Error: Failed to update entities to sentence case."
  echo "Continuing with CSV generation..."
fi

# Step 2: Generate the permit entities CSV
echo "Step 2: Generating permit entities CSV..."
node --input-type=module -e "
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

async function run() {
  try {
    await import('./generate-permit-entities-csv.js');
  } catch (error) {
    console.error('Error running script:', error);
    process.exit(1);
  }
}

run();
"

echo "Process completed successfully!"
echo "Generated files:"
echo "- permit-entities.csv: Full permit information with entity IDs and URLs"
echo "- permit-entities-simple.csv: Simplified version with just addresses, entity IDs, and URLs"
