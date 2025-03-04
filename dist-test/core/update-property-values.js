/**
 * Update Property Values
 *
 * This script demonstrates how to update property values for existing entities
 * without changing their entity IDs, based on the Discord confirmation:
 * "For updates, you can set new triples with the same entity ID and the desired property ID
 * to overwrite and that will replace the old value"
 */
import fs from 'fs';
import { Triple, Ipfs } from '@graphprotocol/grc-20';
import dotenv from 'dotenv';
dotenv.config();
/**
 * Updates property values for existing entities
 * @param updates List of property updates to apply
 * @returns Array of operations to publish
 */
async function updatePropertyValues(updates) {
    try {
        // Read the current triples file
        const data = fs.readFileSync('data/deeds-triples.json', 'utf-8');
        const entities = JSON.parse(data);
        console.log(`Read ${entities.length} entities from deeds-triples.json`);
        const ops = [];
        const updatedEntities = [];
        // Process each update
        for (const update of updates) {
            // Find the entity with the matching instrument number
            const entity = entities.find(e => {
                const instrumentNumberTriple = e.triples.find(t => t.value && t.value.type === 'TEXT' && /^\d+$/.test(t.value.value) &&
                    t.value.value === update.instrumentNumber);
                return !!instrumentNumberTriple;
            });
            if (!entity) {
                console.log(`Entity with instrument number ${update.instrumentNumber} not found`);
                continue;
            }
            // Create a set triple operation to update the property
            const setTripleOp = Triple.make({
                entityId: entity.entityId,
                attributeId: update.propertyId,
                value: {
                    type: 'TEXT',
                    value: update.newValue,
                },
            });
            ops.push(setTripleOp);
            updatedEntities.push(update.instrumentNumber);
            console.log(`Created update operation for entity ${entity.entityId} (${update.instrumentNumber}): ${update.propertyName} = ${update.newValue}`);
        }
        console.log(`\nCreated ${ops.length} update operations for ${updatedEntities.length} entities`);
        return ops;
    }
    catch (error) {
        console.error('Update failed:', error instanceof Error ? error.message : String(error));
        throw error;
    }
}
/**
 * Publishes the updates to IPFS and the blockchain
 * @param ops Operations to publish
 */
async function publishUpdates(ops) {
    try {
        if (ops.length === 0) {
            console.log('No updates to publish');
            return;
        }
        // Publish to IPFS
        console.log('\nPublishing updates to IPFS...');
        const cid = await Ipfs.publishEdit({
            name: 'Update property values',
            ops: ops,
            author: process.env.WALLET_ADDRESS || '',
        });
        console.log(`Published to IPFS with CID: ${cid}`);
        // Get calldata for blockchain transaction
        console.log('\nGetting calldata for blockchain transaction...');
        const spaceId = process.env.SPACE_ID || '';
        const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
            method: "POST",
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
    }
    catch (error) {
        console.error('Publishing failed:', error instanceof Error ? error.message : String(error));
        throw error;
    }
}
/**
 * Main function to update property values and publish the changes
 */
async function main() {
    try {
        // Get the property ID for "Property Address" from transformDeeds.ts
        // This is a simplified approach - in production, you'd want to fetch this from the API
        const addressPropertyId = 'Eo9Lm4Nf2iqZnCQVXJZPAP'; // Replace with your actual property ID
        // Updates with all addresses from the image
        const updates = [
            {
                instrumentNumber: '2025035356',
                propertyName: 'Property Address',
                propertyId: addressPropertyId,
                newValue: '3461 10TH AVE N, ST PETERSBURG, FL 33713'
            },
            {
                instrumentNumber: '2025035383',
                propertyName: 'Property Address',
                propertyId: addressPropertyId,
                newValue: '2326 MELROSE AVE S, ST. PETERSBURG, FL'
            },
            {
                instrumentNumber: '2025035398',
                propertyName: 'Property Address',
                propertyId: addressPropertyId,
                newValue: '1900 59TH AVE N # 216, ST PETERSBURG, FL 33714'
            },
            {
                instrumentNumber: '2025035397',
                propertyName: 'Property Address',
                propertyId: addressPropertyId,
                newValue: '5136 52ND LN N, ST PETERSBURG, FL 33710'
            },
            {
                instrumentNumber: '2025035396',
                propertyName: 'Property Address',
                propertyId: addressPropertyId,
                newValue: '2818 55TH ST N, ST PETERSBURG, FL 33710'
            },
            {
                instrumentNumber: '2025035395',
                propertyName: 'Property Address',
                propertyId: addressPropertyId,
                newValue: '18500 GULF BOULEVARD, INDIAN SHORES, FL'
            },
            {
                instrumentNumber: '2025035394',
                propertyName: 'Property Address',
                propertyId: addressPropertyId,
                newValue: '125 DOLPHIN DR S, OLDSMAR, FL 34677'
            },
            {
                instrumentNumber: '2025035393',
                propertyName: 'Property Address',
                propertyId: addressPropertyId,
                newValue: '755 119TH AVE, TREASURE ISLAND, FL 33706'
            },
            {
                instrumentNumber: '2025035392',
                propertyName: 'Property Address',
                propertyId: addressPropertyId,
                newValue: '4715 BAY ST NE APT 123, SAINT PETERSBURG, FL 33703'
            }
        ];
        console.log('Updating property values...');
        const ops = await updatePropertyValues(updates);
        if (ops.length > 0) {
            const shouldPublish = process.argv.includes('--publish');
            if (shouldPublish) {
                await publishUpdates(ops);
            }
            else {
                console.log('\nTo publish these updates, run:');
                console.log('node dist/update-property-values.js --publish');
            }
        }
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
    main().catch(console.error);
}
