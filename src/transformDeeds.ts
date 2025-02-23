import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { Id, type ValueType } from '@graphprotocol/grc-20';

// System attribute IDs
const NAME_ATTRIBUTE = 'LuBWqZAu6pz54eiJS5mLv8';
const DESCRIPTION_ATTRIBUTE = 'LA1DqP5v6QAdsgLPXGF3YA';
const SELLER_ATTRIBUTE = 'SyaPQfHTf3uxTAqwhuMHHa';
const BUYER_ATTRIBUTE = 'DfjyQFDy6k4dW9XaSgYttn';
const PROPERTY_DETAILS_ATTRIBUTE = '5yDjGNQEErVNpVZ3c61Uib';
const DOC_TYPE_ATTRIBUTE = '3UP1qvruj8SipH9scUz1EY';

export function transformDeeds() {
  // Read and parse CSV
  const csvData = readFileSync('data/deeds.csv', 'utf-8');
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
            value: record['InstrumentNumber']
          }
        },
        {
          attributeId: SELLER_ATTRIBUTE,
          entityId,
          value: {
            type: 'TEXT' as ValueType,
            value: record['DirectName'] || ''
          }
        },
        {
          attributeId: BUYER_ATTRIBUTE,
          entityId,
          value: {
            type: 'TEXT' as ValueType,
            value: record['IndirectName'] || ''
          }
        },
        {
          attributeId: PROPERTY_DETAILS_ATTRIBUTE,
          entityId,
          value: {
            type: 'TEXT' as ValueType,
            value: record['Comments'] || ''
          }
        },
        {
          attributeId: DOC_TYPE_ATTRIBUTE,
          entityId,
          value: {
            type: 'TEXT' as ValueType,
            value: record['DocTypeDescription'] || ''
          }
        }
      ]
    };
  });

  // Write transformed data
  writeFileSync('data/deeds-triples.json', JSON.stringify(entities, null, 2));
  console.log('Transformed deeds data written to data/deeds-triples.json');
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  transformDeeds();
}
