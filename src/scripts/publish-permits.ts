/**
 * Publish Permits Script
 * 
 * This script reads permit data from CSV, adds addresses from the mapping file,
 * and publishes the combined data to the GRC-20 space using a relationship-based model.
 * 
 * Usage:
 *   npx ts-node src/scripts/publish-permits.ts [--space-id <id>]
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
interface Permit {
  Date: string;
  'Record Type': string;
  'Record Number': string;
  Status: string;
  Address: string;
  'Project Name': string;
  'Expiration Date': string;
  Description: string;
  MappedAddress?: string;
}

interface PermitAddresses {
  [recordNumber: string]: string;
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
 * Add mapped addresses to permits
 * 
 * @param permits The array of permits
 * @param addresses The permit addresses mapping
 * @returns The permits with mapped addresses
 */
function addAddressesToPermits(permits: Permit[], addresses: PermitAddresses): Permit[] {
  return permits.map(permit => {
    const recordNumber = permit['Record Number'];
    const mappedAddress = addresses[recordNumber];
    
    if (mappedAddress) {
      return {
        ...permit,
        MappedAddress: mappedAddress
      };
    }
    
    return permit;
  });
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
 * Generate operations for publishing permits using a relationship-based model
 * 
 * @param permits The array of permits with mapped addresses
 * @returns The operations for publishing permits
 */
function generatePermitOps(permits: Permit[]): EntityOp[] {
  const ops: EntityOp[] = [];
  
  // Track unique record types and statuses to avoid duplicates
  const recordTypes = new Set<string>();
  const statuses = new Set<string>();
  
  // For each permit, create an entity with properties and relations
  permits.forEach(permit => {
    // Generate a unique ID for the permit
    const permitId = `permit-${permit['Record Number']}`;
    
    // Create a more descriptive entity name
    let entityName: string;
    const address = permit.MappedAddress || permit.Address;
    
    if (address) {
      entityName = `Permit at ${address}`;
    } else if (permit['Project Name']) {
      entityName = `Permit for ${toSentenceCase(permit['Project Name'])}`;
    } else if (permit['Record Type']) {
      entityName = `${toSentenceCase(permit['Record Type'])} Permit #${permit['Record Number']}`;
    } else {
      entityName = `Permit ${permit['Record Number']}`;
    }
    
    // Create the permit entity with descriptive name
    ops.push({
      type: 'CREATE_ENTITY',
      id: permitId,
      name: entityName,
      types: ['permit-type-id'],
    });
    
    // Add properties to the permit entity
    ops.push({
      type: 'SET_PROPERTY',
      entityId: permitId,
      propertyId: 'record-number-property-id',
      value: {
        type: 'TEXT',
        value: permit['Record Number'],
      },
    });
    
    ops.push({
      type: 'SET_PROPERTY',
      entityId: permitId,
      propertyId: 'date-property-id',
      value: {
        type: 'TEXT',
        value: permit.Date,
      },
    });
    
    // Use mapped address if available, otherwise use the original address
    ops.push({
      type: 'SET_PROPERTY',
      entityId: permitId,
      propertyId: 'address-property-id',
      value: {
        type: 'TEXT',
        value: address,
      },
    });
    
    ops.push({
      type: 'SET_PROPERTY',
      entityId: permitId,
      propertyId: 'project-name-property-id',
      value: {
        type: 'TEXT',
        value: permit['Project Name'],
      },
    });
    
    ops.push({
      type: 'SET_PROPERTY',
      entityId: permitId,
      propertyId: 'expiration-date-property-id',
      value: {
        type: 'TEXT',
        value: permit['Expiration Date'],
      },
    });
    
    ops.push({
      type: 'SET_PROPERTY',
      entityId: permitId,
      propertyId: 'description-property-id',
      value: {
        type: 'TEXT',
        value: permit.Description,
      },
    });
    
    // Add a comprehensive description property
    let description = '';
    if (permit['Record Type']) description += `${toSentenceCase(permit['Record Type'])} `;
    if (permit['Record Number']) description += `#${permit['Record Number']} `;
    if (permit.Status) description += `(${toSentenceCase(permit.Status)}) `;
    if (permit['Project Name']) description += `for ${toSentenceCase(permit['Project Name'])} `;
    if (address) description += `at ${address} `;
    if (permit.Description) description += `- ${permit.Description}`;
    
    if (description) {
      ops.push({
        type: 'SET_PROPERTY',
        entityId: permitId,
        propertyId: 'full-description-property-id',
        value: {
          type: 'TEXT',
          value: description.trim(),
        },
      });
    }
    
    // Create record type entity if it doesn't exist
    const recordType = permit['Record Type'];
    const recordTypeId = `record-type-${recordType.replace(/\s+/g, '-').toLowerCase()}`;
    
    if (!recordTypes.has(recordType)) {
      ops.push({
        type: 'CREATE_ENTITY',
        id: recordTypeId,
        name: toSentenceCase(recordType),
        types: ['record-type-type-id'],
      });
      
      recordTypes.add(recordType);
    }
    
    // Create status entity if it doesn't exist
    const status = permit.Status;
    const statusId = `status-${status.replace(/\s+/g, '-').toLowerCase()}`;
    
    if (!statuses.has(status)) {
      ops.push({
        type: 'CREATE_ENTITY',
        id: statusId,
        name: toSentenceCase(status),
        types: ['status-type-id'],
      });
      
      statuses.add(status);
    }
    
    // Create relations
    ops.push({
      type: 'CREATE_RELATION',
      id: `relation-record-type-${permit['Record Number']}`,
      fromId: permitId,
      toId: recordTypeId,
      relationTypeId: 'record-type-relation-type-id',
    });
    
    ops.push({
      type: 'CREATE_RELATION',
      id: `relation-status-${permit['Record Number']}`,
      fromId: permitId,
      toId: statusId,
      relationTypeId: 'status-relation-type-id',
    });
  });
  
  return ops;
}

/**
 * Publish permits to GRC-20 space
 * 
 * @param spaceId The space ID
 * @param permits The array of permits with mapped addresses
 * @returns A promise that resolves when the permits are published
 */
async function publishPermits(spaceId: string, permits: Permit[]): Promise<void> {
  console.log(`Publishing ${permits.length} permits to space ${spaceId}...`);
  
  // Generate operations for publishing permits
  const ops = generatePermitOps(permits);
  
  // Split operations into batches
  const batches = TransactionService.splitIntoBatches(ops);
  
  // Check if space exists
  console.log(`Checking if space ${spaceId} exists...`);
  const spaceExists = await TransactionService.spaceExists(spaceId);
  
  if (!spaceExists) {
    console.log(`Space ${spaceId} does not exist. Creating it...`);
    const newSpaceId = await TransactionService.createSpace('Permits Space');
    console.log(`Created new space with ID: ${newSpaceId}`);
    spaceId = newSpaceId;
  } else {
    console.log(`Space ${spaceId} exists.`);
  }
  
  // Submit batches to the GRC-20 space
  console.log(`Submitting ${batches.length} batches to space ${spaceId}...`);
  const txHashes = await TransactionService.submitOperationBatches(spaceId, batches);
  
  console.log(`Published ${permits.length} permits to space ${spaceId} in ${batches.length} batches.`);
  console.log(`Transaction hashes: ${txHashes.join(', ')}`);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let spaceId = SpaceIds.PERMITS;
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--space-id' && i + 1 < args.length) {
        spaceId = args[++i];
      }
    }
    
    if (!spaceId) {
      throw new Error('Space ID is required. Set PERMITS_SPACE_ID in .env file or provide it with --space-id.');
    }
    
    console.log(`Using space ID: ${spaceId}`);
    
    // Read permit data from CSV
    const permitsPath = path.resolve(process.cwd(), 'data/input/permits.csv');
    console.log(`Reading permits from ${permitsPath}...`);
    const permits = await readCsv<Permit>(permitsPath);
    console.log(`Read ${permits.length} permits.`);
    
    // Read permit addresses from JSON
    const addressesPath = path.resolve(process.cwd(), 'data/mapping/permit-addresses.json');
    console.log(`Reading permit addresses from ${addressesPath}...`);
    const addresses = readJson<PermitAddresses>(addressesPath);
    console.log(`Read ${Object.keys(addresses).length} permit addresses.`);
    
    // Add mapped addresses to permits
    const permitsWithAddresses = addAddressesToPermits(permits, addresses);
    console.log(`Added mapped addresses to permits.`);
    
    // Publish permits to GRC-20 space
    await publishPermits(spaceId, permitsWithAddresses);
    
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
