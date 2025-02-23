import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { Id, type ValueType } from '@graphprotocol/grc-20';

// System attribute IDs
const NAME_ATTRIBUTE = 'LuBWqZAu6pz54eiJS5mLv8';
const DESCRIPTION_ATTRIBUTE = 'LA1DqP5v6QAdsgLPXGF3YA';
const RECORD_TYPE_ATTRIBUTE = 'SyaPQfHTf3uxTAqwhuMHHa';
const ADDRESS_ATTRIBUTE = 'DfjyQFDy6k4dW9XaSgYttn';
const PROJECT_NAME_ATTRIBUTE = '5yDjGNQEErVNpVZ3c61Uib';
const STATUS_ATTRIBUTE = '3UP1qvruj8SipH9scUz1EY';

export function transformPermits() {
  // Read and parse CSV
  const csvData = readFileSync('data/permits.csv', 'utf-8');
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true
  });

  // Transform records to triples
  const entities = records.map((record: any) => {
    const entityId = Id.generate();

    return {
      entityId,
      triples: [
        {
          attributeId: NAME_ATTRIBUTE,
          entityId,
          value: {
            type: 'TEXT' as ValueType,
            value: record['Record Number']
          }
        },
        {
          attributeId: DESCRIPTION_ATTRIBUTE,
          entityId,
          value: {
            type: 'TEXT' as ValueType,
            value: record['Description'] || ''
          }
        },
        {
          attributeId: RECORD_TYPE_ATTRIBUTE,
          entityId,
          value: {
            type: 'TEXT' as ValueType,
            value: record['Record Type'] || ''
          }
        },
        {
          attributeId: ADDRESS_ATTRIBUTE,
          entityId,
          value: {
            type: 'TEXT' as ValueType,
            value: record['Address'] || ''
          }
        },
        {
          attributeId: PROJECT_NAME_ATTRIBUTE,
          entityId,
          value: {
            type: 'TEXT' as ValueType,
            value: record['Project Name'] || ''
          }
        },
        {
          attributeId: STATUS_ATTRIBUTE,
          entityId,
          value: {
            type: 'TEXT' as ValueType,
            value: record['Status'] || ''
          }
        }
      ]
    };
  });

  // Write transformed data
  writeFileSync('data/permits-triples.json', JSON.stringify(entities, null, 2));
  console.log('Transformed permits data written to data/permits-triples.json');
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  transformPermits();
}
