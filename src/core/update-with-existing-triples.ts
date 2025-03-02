import fs from 'fs';
import { Triple, Ipfs, type Op } from '@graphprotocol/grc-20';
import dotenv from 'dotenv';
import { transformDeeds } from './transformGRC20Deeds.js';

dotenv.config();

interface TripleData {
  attributeId: string;
  entityId: string;
  value: {
    type: string;
    value: string;
  };
}

interface EntityTriples {
  entityId: string;
  triples: TripleData[];
}

/**
 * Updates the knowledge graph with existing triples from deeds-triples.json
 * and new InstrumentNumber triples from GRC20_Deeds.csv
 */
async function updateWithExistingTriples(): Promise<void> {
  try {
    console.log('Reading existing triples from deeds-triples.json...');
    const deedsTriples: EntityTriples[] = JSON.parse(
      fs.readFileSync('data/deeds-triples.json', 'utf-8')
    );
    console.log(`Read ${deedsTriples.length} entities from deeds-triples.json`);

    // Flatten the triples array
    const existingTriples: Op[] = [];
    for (const entity of deedsTriples) {
      for (const triple of entity.triples) {
        existingTriples.push(
          Triple.make({
            entityId: triple.entityId,
            attributeId: triple.attributeId,
            value: {
              type: triple.value.type as any,
              value: triple.value.value
            }
          })
        );
      }
    }
    console.log(`Extracted ${existingTriples.length} triples from existing entities`);

    // Generate new InstrumentNumber triples
    console.log('\nGenerating InstrumentNumber triples from GRC20_Deeds.csv...');
    const newTriples = await transformDeeds();
    console.log(`Generated ${newTriples.length} InstrumentNumber triples`);

    // Combine existing and new triples
    const allTriples = [...existingTriples, ...newTriples];
    console.log(`\nCombined ${allTriples.length} triples for publishing`);

    // Publish to IPFS
    console.log('\nPublishing combined triples to IPFS...');
    const cid = await Ipfs.publishEdit({
      name: 'Update with existing triples',
      ops: allTriples,
      author: process.env.WALLET_ADDRESS || '',
    });
    console.log(`Published to IPFS with CID: ${cid}`);

    // Get calldata for blockchain transaction
    console.log('\nGetting calldata for blockchain transaction...');
    const spaceId = process.env.SPACE_ID || '';
    const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ 
        cid: cid,
        network: "TESTNET",
      }),
    });

    if (!result.ok) {
      throw new Error(`Failed to get calldata: ${result.statusText}`);
    }

    const { to, data } = await result.json();
    console.log(`\nCalldata ready for transaction:`);
    console.log(`To: ${to}`);
    console.log(`Data: ${data}`);
    
    // Save to a file for easy access
    fs.writeFileSync('calldata.json', JSON.stringify({ to, data }, null, 2));
    console.log(`\nCalldata saved to calldata.json`);
    
    console.log('\nTo complete the update:');
    console.log(`1. Use the submit-transaction.js script with the above calldata`);
    console.log(`2. After the transaction is confirmed, run the capture-entity-ids.js script to verify entity IDs`);
  } catch (error) {
    console.error('Update failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  updateWithExistingTriples().catch(error => {
    console.error('Failed to update with existing triples:', error);
    process.exit(1);
  });
}
