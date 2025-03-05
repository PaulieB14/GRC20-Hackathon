/**
 * Publish Deeds Script
 * 
 * This script reads deed data from CSV, adds property addresses from the mapping file,
 * and publishes the combined data to the GRC-20 space.
 * 
 * Usage:
 *   npx ts-node src/scripts/publish-deeds.ts [--space-id <id>]
 */

import fs from 'fs';
import path from 'path';
import { TransactionService } from '../services/transaction-service.js';
import { SpaceIds } from '../config/constants.js';
import dotenv from 'dotenv';
import { EntityOp } from '../core/graph.js';

// Load environment variables
dotenv.config();

// Log environment variables for debugging
console.log('Environment variables:');
console.log('DEEDS_SPACE_ID:', process.env.DEEDS_SPACE_ID);
console.log('PERMITS_SPACE_ID:', process.env.PERMITS_SPACE_ID);
console.log('SpaceIds.DEEDS:', SpaceIds.DEEDS);
console.log('SpaceIds.PERMITS:', SpaceIds.PERMITS);

// Define types
interface Deed {
  DirectName: string;
  IndirectName: string;
  RecordDate: string;
  DocTypeDescription: string;
  BookType: string;
  BookPage: string;
  LegalDescription: string;
  InstrumentNumber: string;
  PropertyAddress?: string;
}

interface PropertyAddresses {
  [instrumentNumber: string]: string;
}

/**
 * Read CSV file and return array of objects
 * 
 * @param filePath The path to the CSV file
 * @returns A promise that resolves to an array of objects
 */
async function readCsv<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    const headers: string[] = [];
    let isFirstLine = true;
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Parse CSV line (handling quoted values)
      const values: string[] = [];
      let currentValue = '';
      let insideQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      // Add the last value
      values.push(currentValue);
      
      // Process headers or data
      if (isFirstLine) {
        // Remove quotes from headers
        for (const value of values) {
          headers.push(value.replace(/"/g, ''));
        }
        isFirstLine = false;
      } else {
        // Create object from headers and values
        const obj: any = {};
        for (let i = 0; i < headers.length; i++) {
          if (i < values.length) {
            obj[headers[i]] = values[i].replace(/"/g, '');
          } else {
            obj[headers[i]] = '';
          }
        }
        results.push(obj as T);
      }
    }
    
    resolve(results);
  });
}

/**
 * Read JSON file and return object
 * 
 * @param filePath The path to the JSON file
 * @returns The parsed JSON object
 */
function readJson<T>(filePath: string): T {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContent) as T;
}

/**
 * Add property addresses to deeds
 * 
 * @param deeds The array of deeds
 * @param addresses The property addresses mapping
 * @returns The deeds with property addresses
 */
function addAddressesToDeeds(deeds: Deed[], addresses: PropertyAddresses): Deed[] {
  return deeds.map(deed => {
    const instrumentNumber = deed.InstrumentNumber;
    const address = addresses[instrumentNumber];
    
    if (address) {
      return {
        ...deed,
        PropertyAddress: address
      };
    }
    
    return deed;
  });
}

/**
 * Generate operations for publishing deeds
 * 
 * @param deeds The array of deeds with property addresses
 * @returns The operations for publishing deeds
 */
function generateDeedOps(deeds: Deed[]): EntityOp[] {
  const ops: EntityOp[] = [];
  
  // For each deed, create an entity with properties and relations
  deeds.forEach(deed => {
    // Generate a unique ID for the deed
    const deedId = `deed-${deed.InstrumentNumber}`;
    
    // Create a more descriptive entity name
    let entityName: string;
    
    if (deed.PropertyAddress) {
      entityName = `Deed at ${deed.PropertyAddress}`;
    } else if (deed.DirectName && deed.IndirectName) {
      entityName = `Deed from ${toSentenceCase(deed.DirectName)} to ${toSentenceCase(deed.IndirectName)}`;
    } else if (deed.BookPage) {
      entityName = `Deed #${deed.BookPage}`;
    } else {
      entityName = `Deed ${deed.InstrumentNumber}`;
    }
    
    // Create the deed entity with descriptive name
    ops.push({
      type: 'CREATE_ENTITY',
      id: deedId,
      name: entityName,
      types: ['deed-type-id'],
    });
    
    // Add properties to the deed entity
    ops.push({
      type: 'SET_PROPERTY',
      entityId: deedId,
      propertyId: 'instrument-number-property-id',
      value: {
        type: 'TEXT',
        value: deed.InstrumentNumber,
      },
    });
    
    ops.push({
      type: 'SET_PROPERTY',
      entityId: deedId,
      propertyId: 'record-date-property-id',
      value: {
        type: 'TEXT',
        value: deed.RecordDate,
      },
    });
    
    ops.push({
      type: 'SET_PROPERTY',
      entityId: deedId,
      propertyId: 'book-type-property-id',
      value: {
        type: 'TEXT',
        value: deed.BookType,
      },
    });
    
    ops.push({
      type: 'SET_PROPERTY',
      entityId: deedId,
      propertyId: 'book-page-property-id',
      value: {
        type: 'TEXT',
        value: deed.BookPage,
      },
    });
    
    // Add legal description
    ops.push({
      type: 'SET_PROPERTY',
      entityId: deedId,
      propertyId: 'legal-description-property-id',
      value: {
        type: 'TEXT',
        value: deed.LegalDescription,
      },
    });
    
    // Add property address if available
    if (deed.PropertyAddress) {
      ops.push({
        type: 'SET_PROPERTY',
        entityId: deedId,
        propertyId: 'property-address-property-id',
        value: {
          type: 'TEXT',
          value: deed.PropertyAddress,
        },
      });
    }
    
    // Add a description property with more details
    let description = '';
    if (deed.DocTypeDescription) description += `${toSentenceCase(deed.DocTypeDescription)} `;
    if (deed.BookPage) description += `#${deed.BookPage} `;
    if (deed.DirectName && deed.IndirectName) description += `from ${toSentenceCase(deed.DirectName)} to ${toSentenceCase(deed.IndirectName)} `;
    if (deed.LegalDescription) description += `for ${deed.LegalDescription} `;
    if (deed.PropertyAddress) description += `at ${deed.PropertyAddress}`;
    
    if (description) {
      ops.push({
        type: 'SET_PROPERTY',
        entityId: deedId,
        propertyId: 'description-property-id',
        value: {
          type: 'TEXT',
          value: description.trim(),
        },
      });
    }
    
    // Create buyer entity with sentence case name
    const buyerId = `person-buyer-${deed.InstrumentNumber}`;
    ops.push({
      type: 'CREATE_ENTITY',
      id: buyerId,
      name: toSentenceCase(deed.IndirectName),
      types: ['person-type-id'],
    });
    
    // Create seller entity with sentence case name
    const sellerId = `person-seller-${deed.InstrumentNumber}`;
    ops.push({
      type: 'CREATE_ENTITY',
      id: sellerId,
      name: toSentenceCase(deed.DirectName),
      types: ['person-type-id'],
    });
    
    // Create document type entity with sentence case name
    const docTypeId = `document-type-${deed.DocTypeDescription.replace(/\s+/g, '-').toLowerCase()}`;
    ops.push({
      type: 'CREATE_ENTITY',
      id: docTypeId,
      name: toSentenceCase(deed.DocTypeDescription),
      types: ['document-type-type-id'],
    });
    
    // Create relations
    ops.push({
      type: 'CREATE_RELATION',
      id: `relation-buyer-${deed.InstrumentNumber}`,
      fromId: deedId,
      toId: buyerId,
      relationTypeId: 'buyer-relation-type-id',
    });
    
    ops.push({
      type: 'CREATE_RELATION',
      id: `relation-seller-${deed.InstrumentNumber}`,
      fromId: deedId,
      toId: sellerId,
      relationTypeId: 'seller-relation-type-id',
    });
    
    ops.push({
      type: 'CREATE_RELATION',
      id: `relation-document-type-${deed.InstrumentNumber}`,
      fromId: deedId,
      toId: docTypeId,
      relationTypeId: 'document-type-relation-type-id',
    });
  });
  
  return ops;
}

/**
 * Convert a string to sentence case (first letter capitalized, rest lowercase)
 * 
 * @param str The string to convert
 * @returns The string in sentence case
 */
function toSentenceCase(str: string): string {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Publish deeds to GRC-20 space
 * 
 * @param spaceId The space ID
 * @param deeds The array of deeds with property addresses
 * @returns A promise that resolves when the deeds are published
 */
async function publishDeeds(spaceId: string, deeds: Deed[]): Promise<void> {
  console.log(`Publishing ${deeds.length} deeds to space ${spaceId}...`);
  
  // Generate operations for publishing all deeds
  console.log('Generating operations...');
  const ops = generateDeedOps(deeds);
  console.log(`Generated ${ops.length} operations.`);
  console.log('First few operations:', JSON.stringify(ops.slice(0, 3), null, 2));
  
  // Split operations into batches
  console.log('Splitting operations into batches...');
  const batches = TransactionService.splitIntoBatches(ops, 10); // Use smaller batch size for testing
  console.log(`Split into ${batches.length} batches.`);
  
  // Check if space exists
  console.log(`Checking if space ${spaceId} exists...`);
  const spaceExists = await TransactionService.spaceExists(spaceId);
  
  if (!spaceExists) {
    console.log(`Space ${spaceId} does not exist. Creating it...`);
    const newSpaceId = await TransactionService.createSpace('Deeds Space');
    console.log(`Created new space with ID: ${newSpaceId}`);
    spaceId = newSpaceId;
  } else {
    console.log(`Space ${spaceId} exists.`);
  }
  
  // Submit batches to the GRC-20 space
  console.log(`Submitting ${batches.length} batches to space ${spaceId}...`);
  const txHashes = await TransactionService.submitOperationBatches(spaceId, batches);
  
  console.log(`Published ${deeds.length} deeds to space ${spaceId} in ${batches.length} batches.`);
  console.log(`Transaction hashes: ${txHashes.join(', ')}`);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let spaceId = SpaceIds.DEEDS;
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--space-id' && i + 1 < args.length) {
        spaceId = args[++i];
      }
    }
    
    if (!spaceId) {
      throw new Error('Space ID is required. Set DEEDS_SPACE_ID in .env file or provide it with --space-id.');
    }
    
    console.log(`Using space ID: ${spaceId}`);
    
    // Read deed data from CSV
    const deedsPath = path.resolve(process.cwd(), 'data/input/GRC20_Deeds.csv');
    console.log(`Reading deeds from ${deedsPath}...`);
    const deeds = await readCsv<Deed>(deedsPath);
    console.log(`Read ${deeds.length} deeds.`);
    
    // Read property addresses from JSON
    const addressesPath = path.resolve(process.cwd(), 'data/mapping/property-addresses.json');
    console.log(`Reading property addresses from ${addressesPath}...`);
    const addresses = readJson<PropertyAddresses>(addressesPath);
    console.log(`Read ${Object.keys(addresses).length} property addresses.`);
    
    // Add property addresses to deeds
    const deedsWithAddresses = addAddressesToDeeds(deeds, addresses);
    console.log(`Added property addresses to deeds.`);
    
    // Publish deeds to GRC-20 space
    await publishDeeds(spaceId, deedsWithAddresses);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
if (import.meta.url === new URL(import.meta.url).href) {
  main().catch(console.error);
}
