#!/bin/bash
set -e

# Check if the .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create it with the required environment variables."
  echo "Required variables: WALLET_ADDRESS, PERMITS_SPACE_ID, PRIVATE_KEY"
  exit 1
fi

# Step 1: Publish the permits to GRC20 and capture the entity IDs
echo "Step 1: Publishing permits to GRC20 and capturing entity IDs..."

# Create a JavaScript file to publish and capture entity IDs
cat > publish-and-capture.js << 'EOF'
import { Ipfs } from "@graphprotocol/grc-20";
import { createPublicClient, createWalletClient, http, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const grc20Testnet = {
  id: 19411,
  name: 'Geogenesis Testnet',
  network: 'geogenesis-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz/'] },
    public: { http: ['https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz/'] },
  },
};

async function publishAndCapture() {
  try {
    if (!process.env.WALLET_ADDRESS) {
      throw new Error('WALLET_ADDRESS not set in environment');
    }
    if (!process.env.PERMITS_SPACE_ID) {
      throw new Error('PERMITS_SPACE_ID not set in environment');
    }
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY not set in environment');
    }

    const spaceId = process.env.PERMITS_SPACE_ID;
    
    // Import the transformPermits module
    console.log('\n[Transform] Getting ops from transformPermits...');
    const transformPermitsModule = await import('./dist-test/core/transformPermits.js');
    const ops = await transformPermitsModule.transformPermits();
    
    if (!ops) {
      throw new Error('Failed to transform permits to ops');
    }
    console.log('\n✅ [Transform] Got ops:', { count: ops.length });
    
    // Extract entity IDs directly from the ops
    console.log('\n[Extract] Extracting entity IDs from ops...');
    
    // We'll extract the permit entities directly from the transformation output
    // The transformPermits function logs the created permit entities
    const permitEntities = [];
    const recordTypeEntities = [];
    const statusEntities = [];
    
    // Find the permit type ID, record type type ID, and status type ID
    let permitTypeId = null;
    let recordTypeTypeId = null;
    let statusTypeId = null;
    
    for (const op of ops) {
      if (op.type === 'CREATE_TYPE') {
        if (op.name === 'Building permit') {
          permitTypeId = op.id;
        } else if (op.name === 'Record type') {
          recordTypeTypeId = op.id;
        } else if (op.name === 'Status') {
          statusTypeId = op.id;
        }
      }
    }
    
    console.log('Type IDs:', {
      permitTypeId,
      recordTypeTypeId,
      statusTypeId
    });
    
    // Now find all entities with these types
    for (const op of ops) {
      if (op.type === 'CREATE_ENTITY') {
        const entityId = op.id;
        const entityName = op.name;
        const entityTypes = op.types || [];
        
        if (permitTypeId && entityTypes.includes(permitTypeId)) {
          permitEntities.push({
            id: entityId,
            name: entityName
          });
        } else if (recordTypeTypeId && entityTypes.includes(recordTypeTypeId)) {
          recordTypeEntities.push({
            id: entityId,
            name: entityName
          });
        } else if (statusTypeId && entityTypes.includes(statusTypeId)) {
          statusEntities.push({
            id: entityId,
            name: entityName
          });
        }
      }
    }
    
    console.log('Found entities:', {
      permits: permitEntities.length,
      recordTypes: recordTypeEntities.length,
      statuses: statusEntities.length
    });
    
    // Save the entity IDs to a file
    const entityData = {
      permitEntities: permitEntities.map(e => e.id),
      recordTypeEntities: recordTypeEntities.map(e => e.id),
      statusEntities: statusEntities.map(e => e.id)
    };
    
    fs.writeFileSync('data/current-entity-ids.json', JSON.stringify(entityData, null, 2));
    console.log(`Saved ${permitEntities.length} permit entities, ${recordTypeEntities.length} record type entities, and ${statusEntities.length} status entities to data/current-entity-ids.json`);
    
    // Create a CSV file with entity IDs and URLs
    const csvHeader = 'Type,Name,Entity ID,URL';
    const csvRows = [];
    
    // Add permit entities
    for (const entity of permitEntities) {
      const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entity.id}`;
      csvRows.push(`Permit,"${entity.name}",${entity.id},${url}`);
    }
    
    // Add record type entities
    for (const entity of recordTypeEntities) {
      const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entity.id}`;
      csvRows.push(`Record Type,"${entity.name}",${entity.id},${url}`);
    }
    
    // Add status entities
    for (const entity of statusEntities) {
      const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entity.id}`;
      csvRows.push(`Status,"${entity.name}",${entity.id},${url}`);
    }
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    fs.writeFileSync('current-entity-urls.csv', csvContent);
    console.log(`Generated current-entity-urls.csv with ${csvRows.length} entities`);
    
    // Publish edit to IPFS using Graph SDK
    console.log('\n[IPFS] Publishing edit...');
    const cid = await Ipfs.publishEdit({
      name: 'Add GRC20 Building Permits with Relations',
      ops: ops,
      author: process.env.WALLET_ADDRESS
    });
    console.log('\n✅ [IPFS] Published edit:', { cid });

    // Get calldata using API
    console.log('\n[API] Getting calldata...');
    const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ 
        cid: cid,
        network: "TESTNET"
      }),
    });

    if (!result.ok) {
      const text = await result.text();
      throw new Error(`Failed to get calldata: ${result.statusText}\n${text}`);
    }

    const { to, data } = await result.json();
    console.log('\n✅ [API] Got calldata:', {
      to,
      dataLength: data.length
    });

    // Submit transaction
    console.log('\n[Transaction] Submitting to network...');
    const account = privateKeyToAccount(process.env.PRIVATE_KEY);
    
    const publicClient = createPublicClient({
      chain: grc20Testnet,
      transport: http()
    });

    const walletClient = createWalletClient({
      account,
      chain: grc20Testnet,
      transport: http()
    });

    // Get nonce
    console.log('\n[Transaction] Getting nonce...');
    const nonce = await publicClient.getTransactionCount({
      address: account.address
    });
    console.log('Nonce:', nonce);

    // Use gas settings from successful transaction
    const gasLimit = 13_000_000n;
    const baseGasPrice = parseGwei('0.01');

    // Send transaction
    console.log('\n[Transaction] Sending transaction...');
    const hash = await walletClient.sendTransaction({
      account,
      chain: grc20Testnet,
      to: to,
      data: data,
      gas: gasLimit,
      maxFeePerGas: baseGasPrice,
      maxPriorityFeePerGas: baseGasPrice,
      nonce,
      value: 0n
    });
    console.log('\n✅ [Transaction] Submitted:', { hash });

    // Wait for confirmation
    console.log('\n[Transaction] Waiting for confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('\n✅ [Transaction] Confirmed:', receipt);
    
    // No need to query the API anymore, we already have the entity IDs

    return hash;
  } catch (error) {
    console.error('\n❌ [Error]:', error);
    throw error;
  }
}

// Execute if running directly
publishAndCapture().catch(error => {
  console.error('\n❌ [Error]:', error);
  process.exit(1);
});
EOF

# Run the JavaScript file
node --input-type=module -e "
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

async function run() {
  try {
    await import('./publish-and-capture.js');
  } catch (error) {
    console.error('Error running script:', error);
    process.exit(1);
  }
}

run();
"

# Step 2: Generate the permit entities CSV using the captured entity IDs
echo "Step 2: Generating permit entities CSV with current entity IDs..."

# Create a JavaScript file to generate the CSV
cat > generate-current-permit-entities-csv.js << 'EOF'
import fs from 'fs';
import dotenv from 'dotenv';
import * as os from 'os';
import * as path from 'path';

dotenv.config();

// Function to generate the CSV file
async function generatePermitEntitiesCsv() {
  try {
    // Read the current-entity-ids.json file
    const entityIdsPath = 'data/current-entity-ids.json';
    if (!fs.existsSync(entityIdsPath)) {
      throw new Error(`${entityIdsPath} does not exist. Please run the publish-and-capture.js script first.`);
    }
    
    const entityIds = JSON.parse(fs.readFileSync(entityIdsPath, 'utf-8'));
    
    // Read the permits.csv file to get the permit data
    const permitsData = fs.readFileSync('data/permits.csv', 'utf-8');
    const permits = permitsData.split('\n').slice(1).filter(line => line.trim() !== '');
    
    // Get the space ID from the .env file
    const spaceId = process.env.PERMITS_SPACE_ID || 'XPZ8fnf3DvNMRDbFgxEZi2'; // Default space ID if not found
    
    // Create an array to store the permit data
    const permitData = [];
    
    // Process each permit
    for (let i = 0; i < Math.min(permits.length, entityIds.permitEntities.length); i++) {
      const permitLine = permits[i];
      const entityId = entityIds.permitEntities[i];
      
      // Parse the CSV line
      const columns = permitLine.split(',');
      const address = columns[0].replace(/"/g, '');
      const recordNumber = columns[1].replace(/"/g, '');
      const recordType = columns[2].replace(/"/g, '');
      const status = columns[3].replace(/"/g, '');
      const projectName = columns[4] ? columns[4].replace(/"/g, '') : '';
      
      // Generate the URL for the entity
      const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entityId}`;
      
      // Add the permit data to the array
      permitData.push({
        address,
        recordNumber,
        recordType,
        status,
        projectName,
        entityId,
        url
      });
    }
    
    // Sort the permit data by address
    permitData.sort((a, b) => a.address.localeCompare(b.address));
    
    // Create the CSV content
    const csvHeader = 'Address,Record Number,Record Type,Status,Project Name,Entity ID,URL';
    const csvRows = permitData.map(permit => 
      `"${permit.address}","${permit.recordNumber}","${permit.recordType}","${permit.status}","${permit.projectName}","${permit.entityId}","${permit.url}"`
    );
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Write the CSV file
    fs.writeFileSync('current-permit-entities.csv', csvContent);
    
    console.log(`Generated current-permit-entities.csv with ${permitData.length} permits`);
    
    // Also create a simplified version with just address, entity ID, and URL
    const simpleCsvHeader = 'Address,Entity ID,URL';
    const simpleCsvRows = permitData.map(permit => 
      `"${permit.address}","${permit.entityId}","${permit.url}"`
    );
    
    const simpleCsvContent = [simpleCsvHeader, ...simpleCsvRows].join('\n');
    
    // Write the simplified CSV file
    fs.writeFileSync('current-permit-entities-simple.csv', simpleCsvContent);
    
    console.log(`Generated current-permit-entities-simple.csv with ${permitData.length} permits`);
    
    // Copy the CSV files to the desktop
    try {
      const homedir = os.homedir();
      const desktopPath = path.join(homedir, 'Desktop');
      
      fs.copyFileSync('current-permit-entities.csv', path.join(desktopPath, 'current-permit-entities.csv'));
      fs.copyFileSync('current-permit-entities-simple.csv', path.join(desktopPath, 'current-permit-entities-simple.csv'));
      
      console.log(`Copied CSV files to desktop: ${desktopPath}`);
    } catch (error) {
      console.error('Error copying CSV files to desktop:', error);
    }
    
    return permitData.length;
  } catch (error) {
    console.error('Error generating permit entities CSV:', error);
    throw error;
  }
}

// Execute the function
generatePermitEntitiesCsv()
  .then(count => {
    console.log(`Successfully generated CSV files with ${count} permits`);
  })
  .catch(error => {
    console.error('Failed to generate CSV files:', error);
    process.exit(1);
  });
EOF

# Run the JavaScript file
node --input-type=module -e "
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

async function run() {
  try {
    await import('./generate-current-permit-entities-csv.js');
  } catch (error) {
    console.error('Error running script:', error);
    process.exit(1);
  }
}

run();
"

echo "Process completed successfully!"
echo "Generated files:"
echo "- current-entity-urls.csv: All entities with their IDs and URLs"
echo "- current-permit-entities.csv: Full permit information with current entity IDs and URLs"
echo "- current-permit-entities-simple.csv: Simplified version with just addresses, entity IDs, and URLs"
