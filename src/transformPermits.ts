import { readFileSync, writeFileSync } from 'fs';
import { parse } from '@fast-csv/parse';
import { Id, Triple, ValueType } from '@graphprotocol/grc-20';

// System attribute IDs
const NAME_ATTRIBUTE = 'LuBWqZAu6pz54eiJS5mLv8';
const DESCRIPTION_ATTRIBUTE = 'LA1DqP5v6QAdsgLPXGF3YA';
const RECORD_TYPE_ATTRIBUTE = 'SyaPQfHTf3uxTAqwhuMHHa';
const ADDRESS_ATTRIBUTE = 'DfjyQFDy6k4dW9XaSgYttn';
const PROJECT_NAME_ATTRIBUTE = '5yDjGNQEErVNpVZ3c61Uib';
const STATUS_ATTRIBUTE = '3UP1qvruj8SipH9scUz1EY';

interface PermitRecord {
  'Record Number': string;
  'Description'?: string;
  'Record Type'?: string;
  'Address'?: string;
  'Project Name'?: string;
  'Status'?: string;
}

export interface LocalTriple {
  attributeId: string;
  value: { type: ValueType; value: string };
}

export interface Entity {
  entityId: string;
  triples: LocalTriple[];
}

/**
 * Transforms permits.csv into a JSON structure of entities with triples for IPFS and GRC-20.
 * Outputs to data/permits-triples.json.
 */
export async function transformPermits() {
  try {
    // Read and parse CSV
    const csvData = readFileSync('data/permits.csv', 'utf-8');
    const records: PermitRecord[] = [];
    
    await new Promise((resolve, reject) => {
      const parser = parse({ headers: true });
      parser.on('data', (row: PermitRecord) => records.push(row));
      parser.on('error', reject);
      parser.on('end', resolve);
      parser.write(csvData);
      parser.end();
    });

    if (!records.length) {
      throw new Error('No records found in permits.csv');
    }

    // Validate required fields
    records.forEach((record, index) => {
      if (!record['Record Number']) {
        throw new Error(`Missing required field "Record Number" in CSV at row ${index + 1}`);
      }
    });

    // Transform records to triples
    const entities = records.map(record => {
      const entityId = Id.generate();

      // Create triples
      const triples = [
        {
          entity: entityId,
          attribute: NAME_ATTRIBUTE,
          value: {
            type: 'TEXT',
            value: record['Record Number']
          }
        },
        {
          entity: entityId,
          attribute: DESCRIPTION_ATTRIBUTE,
          value: {
            type: 'TEXT',
            value: record['Description'] || ''
          }
        },
        {
          entity: entityId,
          attribute: RECORD_TYPE_ATTRIBUTE,
          value: {
            type: 'TEXT',
            value: record['Record Type'] || ''
          }
        },
        {
          entity: entityId,
          attribute: ADDRESS_ATTRIBUTE,
          value: {
            type: 'TEXT',
            value: record['Address'] || ''
          }
        },
        {
          entity: entityId,
          attribute: PROJECT_NAME_ATTRIBUTE,
          value: {
            type: 'TEXT',
            value: record['Project Name'] || ''
          }
        },
        {
          entity: entityId,
          attribute: STATUS_ATTRIBUTE,
          value: {
            type: 'TEXT',
            value: record['Status'] || ''
          }
        }
      ];

      return {
        entityId,
        triples
      };
    });

    // Write transformed data with proper JSON structure
    const jsonString = JSON.stringify(entities, (key, value) => {
      if (typeof value === 'string') {
        // Preserve spaces in text values
        return value;
      }
      return value;
    }, 2);
    console.log('Output size:', Buffer.byteLength(jsonString, 'utf-8'), 'bytes');
    writeFileSync('data/permits-triples.json', jsonString);
    console.log('Transformed permits data written to data/permits-triples.json');

    return entities;
  } catch (error) {
    console.error('Transformation failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  transformPermits().catch(error => {
    console.error('Failed to transform permits:', error);
    process.exit(1);
  });
}
