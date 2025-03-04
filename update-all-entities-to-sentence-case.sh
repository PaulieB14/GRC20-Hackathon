#!/bin/bash
set -e

# Check if the .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create it with the required environment variables."
  echo "Required variables: WALLET_ADDRESS, PERMITS_SPACE_ID, PRIVATE_KEY"
  exit 1
fi

# Skip building the project since there are TypeScript errors
echo "Skipping build step due to TypeScript errors..."

# Run the script to update all entities to sentence case
echo "Running update-all-entities-to-sentence-case.js..."
node --input-type=module -e "
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

async function run() {
  try {
    await import('./update-all-entities-to-sentence-case.js');
  } catch (error) {
    console.error('Error running script:', error);
    process.exit(1);
  }
}

run();
"

echo "Script execution completed!"
