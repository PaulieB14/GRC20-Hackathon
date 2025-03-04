#!/bin/bash
set -e

# Check if the .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create it with the required environment variables."
  echo "Required variables: WALLET_ADDRESS, PERMITS_SPACE_ID, PRIVATE_KEY"
  exit 1
fi

echo "Pushing hard-coded permit entities to GRC20..."

# Run the push-hard-coded-permit-entities.js script
node --input-type=module -e "
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

async function run() {
  try {
    await import('./push-hard-coded-permit-entities.js');
  } catch (error) {
    console.error('Error running script:', error);
    process.exit(1);
  }
}

run();
"

echo "Process completed successfully!"
echo "Generated files:"
echo "- push-hard-coded-permit-ops.json: Operations to push hard-coded permit entities"
echo "- push-hard-coded-permit-calldata.json: Calldata for the transaction"
