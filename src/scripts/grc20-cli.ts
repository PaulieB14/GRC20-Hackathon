/**
 * GRC-20 CLI Script
 * 
 * A unified CLI script for GRC-20 operations including creating spaces,
 * publishing data, and managing ontologies.
 * 
 * Usage:
 *   npx ts-node src/scripts/grc20-cli.ts create-space --name "My Space" [--network testnet]
 *   npx ts-node src/scripts/grc20-cli.ts setup-ontology [--deed-space ID] [--permit-space ID]
 */

import dotenv from 'dotenv';
import { Graph } from '@graphprotocol/grc-20';
import { account } from '../utils/wallet.js';
import fs from 'fs';
import path from 'path';
import { OntologyService } from '../services/ontology-service.js';
import { SpaceIds } from '../config/constants.js';

// Load environment variables
dotenv.config();

/**
 * Update the .env file with a new variable
 * 
 * @param key The environment variable key
 * @param value The environment variable value
 */
function updateEnvFile(key: string, value: string): void {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    
    let envContent = '';
    
    // Read existing .env file if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Check if the key already exists
    const regex = new RegExp(`^${key}=.*`, 'm');
    
    if (regex.test(envContent)) {
      // Replace existing key
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // Add new key
      envContent += `\n${key}=${value}`;
    }
    
    // Write to .env file
    fs.writeFileSync(envPath, envContent.trim());
    console.log(`Updated ${key} in .env file`);
  } catch (error) {
    console.error(`Failed to update .env file:`, error);
  }
}

import { TransactionService } from '../services/transaction-service.js';

/**
 * Create a new GRC-20 space
 * 
 * @param options The space options
 * @returns A promise that resolves to the space ID
 */
async function createSpace(options: {
  name: string;
  network?: 'TESTNET' | 'MAINNET';
}): Promise<string> {
  console.log(`Creating space "${options.name}"...`);

  try {
    // Check if wallet address is available
    if (!account.address) {
      throw new Error('Wallet address is required. Set WALLET_ADDRESS in .env file.');
    }

    // Use the TransactionService to create a space
    console.log("Creating space using TransactionService...");
    const spaceId = await TransactionService.createSpace(options.name);
    
    return spaceId;
  } catch (error) {
    console.error('Failed to create space:', error);
    throw error;
  }
}

/**
 * Set up ontology for GRC-20 spaces
 * 
 * @param options The ontology options
 * @returns A promise that resolves when the ontology is set up
 */
async function setupOntology(options: {
  deedSpace?: string;
  permitSpace?: string;
  deedOnly?: boolean;
  permitOnly?: boolean;
}): Promise<void> {
  const deedSpaceId = options.deedSpace || SpaceIds.DEEDS;
  const permitSpaceId = options.permitSpace || SpaceIds.PERMITS;

  console.log('Setting up ontology...');

  if (options.deedOnly) {
    await OntologyService.setupDeedOntology(deedSpaceId);
  } else if (options.permitOnly) {
    await OntologyService.setupPermitOntology(permitSpaceId);
  } else {
    await OntologyService.setupOntologies(deedSpaceId, permitSpaceId);
  }

  console.log('Ontology setup complete!');
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
GRC-20 CLI - A unified CLI for GRC-20 operations

Usage:
  npx ts-node src/scripts/grc20-cli.ts <command> [options]

Commands:
  create-space     Create a new GRC-20 space
  setup-ontology   Set up ontology for GRC-20 spaces
  help             Show this help message

Options for create-space:
  --name <name>    The name of the space (required)
  --network <net>  The network to deploy to (TESTNET or MAINNET, default: TESTNET)

Options for setup-ontology:
  --deed-space <id>   The deed space ID
  --permit-space <id> The permit space ID
  --deed-only         Only set up the deed ontology
  --permit-only       Only set up the permit ontology
  `);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    printHelp();
    return;
  }

  try {
    if (command === 'create-space') {
      // Parse create-space options
      const options: {
        name: string;
        network?: 'TESTNET' | 'MAINNET';
      } = {
        name: '',
      };

      for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--name' && i + 1 < args.length) {
          options.name = args[++i];
        } else if (arg === '--network' && i + 1 < args.length) {
          const network = args[++i].toUpperCase();
          if (network === 'TESTNET' || network === 'MAINNET') {
            options.network = network as 'TESTNET' | 'MAINNET';
          } else {
            throw new Error(`Invalid network: ${network}. Must be TESTNET or MAINNET.`);
          }
        }
      }

      if (!options.name) {
        throw new Error('Space name is required. Use --name "Your Space Name"');
      }

      await createSpace(options);
    } else if (command === 'setup-ontology') {
      // Parse setup-ontology options
      const options: {
        deedSpace?: string;
        permitSpace?: string;
        deedOnly?: boolean;
        permitOnly?: boolean;
      } = {};

      for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--deed-space' && i + 1 < args.length) {
          options.deedSpace = args[++i];
        } else if (arg === '--permit-space' && i + 1 < args.length) {
          options.permitSpace = args[++i];
        } else if (arg === '--deed-only') {
          options.deedOnly = true;
        } else if (arg === '--permit-only') {
          options.permitOnly = true;
        }
      }

      await setupOntology(options);
    } else {
      console.error(`Unknown command: ${command}`);
      printHelp();
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
if (import.meta.url === new URL(import.meta.url).href) {
  main().catch(console.error);
}
