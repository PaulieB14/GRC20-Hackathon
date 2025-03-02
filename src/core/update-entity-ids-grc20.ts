ds/**
 * Update Entity IDs in GRC-20
 * 
 * This script updates entity IDs in the GRC-20 system to match the working entity IDs.
 * It creates operations to update the entity IDs and publishes them to IPFS and the blockchain.
 */

import fs from 'fs';
import { Triple, Ipfs, type Op } from '@graphprotocol/grc-20';
import dotenv from 'dotenv';

dotenv.config();

interface Triple {
  attributeId: string;
  entityId: string;
  value: {
    type: string;
    value: string;
  };
}

interface Entity {
  entityId: string;
  triples: Triple[];
}

/**
 * Updates entity IDs in the GRC-20 system
 * @returns Array of operations to publish
 */
async function updateEntityIds(): Promise<Op[]> {
  try {
    // Read the current triples file
    const deedsData = fs.readFileSync('data/GRC20_Deeds.csv', 'utf-8');
import { parse } from 'csv-parse/sync';

const propertyIds = {
  instrumentNumber: 'LuBWqZAu6pz54eiJS5mLv8',
  directName: 'SyaPQfHTf3uxTAqwhuMHHa',
  indirectName: 'DfjyQFDy6k4dW9XaSgYttn',
  recordDate: '5yDjGNQEErVNpVZ3c61Uib',
  docType: '3UP1qvruj8SipH9scUz1EY',
  bookType: 'Ej4Ry9Aq9Ry9Aq9Ry9Aq9Ry9', 
  bookPage: 'Ej4Ry9Aq9Ry9Aq9Ry9Aq9Ry9',
  legalDescription: '5yDjGNQEErVNpVZ3c61Uib'
};

interface DeedRecord {
  InstrumentNumber: string;
  DirectName: string;
  IndirectName: string;
  RecordDate: string; 
  DocTypeDescription: string;
  BookType: string;
  BookPage: string;
  LegalDescription: string;
}

    const deeds = parse(deedsData, {
      columns: true,
      skip_empty_lines: true,
      fromLine: 2 // Skip header row
    });

    const propertyIds = await fetchPropertyIds();

    const ops: Op[] = [];
    const existingEntityIds = new Set(workingIds);
    const existingEntityTriples = await fetchExistingTriples(existingEntityIds);

    for (const deed of deeds) {
      const { InstrumentNumber, DirectName, IndirectName, RecordDate, DocTypeDescription, BookType, BookPage, LegalDescription } = deed;
      
      const existingTriples = existingEntityTriples.get(InstrumentNumber) || [];

      const newTriples: Triple[] = [
        Triple.make({
          entityId: InstrumentNumber,
          attributeId: propertyIds.instrumentNumber,
          value: { type: 'TEXT', value: InstrumentNumber }
        }),
        Triple.make({
          entityId: InstrumentNumber, 
          attributeId: propertyIds.directName,
          value: { type: 'TEXT', value: DirectName }
        }),
        Triple.make({
          entityId: InstrumentNumber,
          attributeId: propertyIds.indirectName,
          value: { type: 'TEXT', value: IndirectName }
        }),
        Triple.make({
          entityId: InstrumentNumber,
          attributeId: propertyIds.recordDate,
          value: { type: 'TEXT', value: RecordDate }
        }),
        Triple.make({
          entityId: InstrumentNumber,
          attributeId: propertyIds.docType,
          value: { type: 'TEXT', value: DocTypeDescription }
        }),
        Triple.make({
          entityId: InstrumentNumber,
          attributeId: propertyIds.bookType,
          value: { type: 'TEXT', value: BookType }
        }),
        Triple.make({
          entityId: InstrumentNumber,
          attributeId: propertyIds.bookPage,
          value: { type: 'TEXT', value: BookPage }
        }),
        Triple.make({
          entityId: InstrumentNumber,
          attributeId: propertyIds.legalDescription,
          value: { type: 'TEXT', value: LegalDescription }
        })
      ];

      ops.push(...existingTriples, ...newTriples);
    }

    console.log(`Created ${ops.length} update operations for ${existingEntityIds.size} existing entities`);

    // Read the working deed IDs
    const workingIdsData = fs.readFileSync('data/working-deed-ids.json', 'utf-8');
    const workingIds: string[] = JSON.parse(workingIdsData);
    console.log(`Read ${workingIds.length} working entity IDs from working-deed-ids.json`);

    const ops: Op[] = [];
    const updatedEntities: string[] = [];

    // Process each deed
    for (const deed of deeds) {
      // Find the instrument number triple
      const instrumentNumberTriple = deed.triples.find(t => 
        t.value && t.value.type === 'TEXT' && /^\d+$/.test(t.value.value)
      );
      
      if (!instrumentNumberTriple) {
        console.log(`Entity ${deed.entityId} has no instrument number triple`);
        continue;
      }

      const instrumentNumber = instrumentNumberTriple.value.value;
      
      // Create operations to update all triples for this entity
      for (const triple of deed.triples) {
        // Create a set triple operation to update the entity ID
        const setTripleOp = Triple.make({
          entityId: deed.entityId,
          attributeId: triple.attributeId,
          value: {
            type: triple.value.type === 'TEXT' ? 'TEXT' : 'TEXT',
            value: triple.value.value,
          },
        });

        ops.push(setTripleOp);
      }

      updatedEntities.push(instrumentNumber);
      console.log(`Created update operations for entity with instrument number ${instrumentNumber}: ${deed.entityId}`);
    }

    console.log(`\nCreated ${ops.length} update operations for ${updatedEntities.length} entities`);
    return ops;
  } catch (error) {
    console.error('Update failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Publishes the updates to IPFS and the blockchain
 * @param ops Operations to publish
 */
async function publishUpdates(ops: Op[]): Promise<void> {
  try {
    if (ops.length === 0) {
      console.log('No updates to publish');
      return;
    }

    // Publish to IPFS
    console.log('\nPublishing updates to IPFS...');
    const cid = await Ipfs.publishEdit({
      name: 'Update entity IDs',
      ops: ops,
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
    console.error('Publishing failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Main function to update entity IDs and publish the changes
 */
async function main() {
  try {
    console.log('Updating entity IDs in GRC-20...');
    const ops = await updateEntityIds();
    
    if (ops.length > 0) {
      const shouldPublish = process.argv.includes('--publish');
      if (shouldPublish) {
        await publishUpdates(ops);
      } else {
        console.log('\nTo publish these updates, run:');
        console.log('node dist/update-entity-ids-grc20.js --publish');
      }
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  main().catch(console.error);
}
