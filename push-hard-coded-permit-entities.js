// This script pushes the hard-coded permit entities to GRC20
import { Ipfs } from "@graphprotocol/grc-20";
import { createPublicClient, createWalletClient, http, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Import the hard-coded permit entities
import { permitEntities } from './hard-coded-permit-entities.js';

// GRC20 Testnet configuration
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

async function pushHardCodedPermitEntities() {
  try {
    // Check for required environment variables
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
    
    // Create operations to create the entities
    const ops = [];
    
    // For each permit entity, create operations to create the entity and set its triples
    for (const permitEntity of permitEntities) {
      const entityId = permitEntity.entityId;
      
      // Create an operation to create the entity
      ops.push({
        type: 'CREATE_ENTITY',
        id: entityId,
        name: `${permitEntity.recordType} - ${permitEntity.recordNumber}`
      });
      
      // Create operations to set the triples for the entity
      ops.push({
        type: 'SET_TRIPLE',
        triple: {
          entity: entityId,
          attribute: 'LuBWqZAu6pz54eiJS5mLv8', // Record Number
          value: {
            type: 'TEXT',
            value: permitEntity.recordNumber
          }
        }
      });
      
      ops.push({
        type: 'SET_TRIPLE',
        triple: {
          entity: entityId,
          attribute: 'SyaPQfHTf3uxTAqwhuMHHa', // Record Type
          value: {
            type: 'TEXT',
            value: permitEntity.recordType
          }
        }
      });
      
      ops.push({
        type: 'SET_TRIPLE',
        triple: {
          entity: entityId,
          attribute: 'DfjyQFDy6k4dW9XaSgYttn', // Address
          value: {
            type: 'TEXT',
            value: permitEntity.address
          }
        }
      });
      
      ops.push({
        type: 'SET_TRIPLE',
        triple: {
          entity: entityId,
          attribute: '5yDjGNQEErVNpVZ3c61Uib', // Project Name
          value: {
            type: 'TEXT',
            value: permitEntity.projectName
          }
        }
      });
      
      ops.push({
        type: 'SET_TRIPLE',
        triple: {
          entity: entityId,
          attribute: '3UP1qvruj8SipH9scUz1EY', // Status
          value: {
            type: 'TEXT',
            value: permitEntity.status
          }
        }
      });
      
      console.log(`Will create entity ${entityId} with name "${permitEntity.recordType} - ${permitEntity.recordNumber}"`);
    }
    
    // Save the operations to a file for reference
    fs.writeFileSync('push-hard-coded-permit-ops.json', JSON.stringify(ops, null, 2));
    console.log(`Generated ${ops.length} operations to push hard-coded permit entities`);
    
    // Publish the operations to IPFS
    console.log('\n[IPFS] Publishing edit...');
    const cid = await Ipfs.publishEdit({
      name: 'Push Hard-Coded Permit Entities',
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

    // Save the calldata to a file for reference
    fs.writeFileSync('push-hard-coded-permit-calldata.json', JSON.stringify({ to, data }, null, 2));

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
    
    console.log('\nHard-coded permit entities pushed successfully!');
    
    return hash;
  } catch (error) {
    console.error('\n❌ [Error]:', error);
    throw error;
  }
}

// Execute if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  pushHardCodedPermitEntities().catch(error => {
    console.error('\n❌ [Error]:', error);
    process.exit(1);
  });
}

export { pushHardCodedPermitEntities };
