import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { Graph, type Op } from '@graphprotocol/grc-20';

interface DeedRecord {
  InstrumentNumber: string;
  DirectName?: string;
  IndirectName?: string;
  Comments?: string;
  DocTypeDescription?: string;
  Address?: string; // Added address field
}

// Mapping of seller names to addresses
const addressMapping: Record<string, string> = {
  'WATERMAN WANETA DECEASED': '3461 10TH AVE N, ST PETERSBURG, FL 33713',
  'KIGER SUSAN DIANE': '4715 BAY ST NE APT 123, SAINT PETERSBURG, FL 33703',
  'CHRIST MARY J': '755 119TH AVE, TREASURE ISLAND, FL 33706',
  'RICCARDO JAMES C': '125 DOLPHIN DR S, OLDSMAR, FL 34677',
  'GARCIA DEBORAH NEELEY': '18500 GULF BOULEVARD, INDIAN SHORES, FL',
  'DENNARD BREHT K SR': '2326 MELROSE AVE S, ST. PETERSBURG, FL',
  'CHIRIBOGA FANNY MARTHA': '2818 55TH ST N, ST PETERSBURG, FL 33710',
  'BRITO JANET': '5136 52ND LN N, ST PETERSBURG, FL 33710',
  'LEONELLO MICHELE': '1900 59TH AVE N # 216, ST PETERSBURG, FL 33714'
};

/**
 * Transforms deeds.csv into a set of Graph operations using the GRC-20 SDK.
 * Creates properties, types, and entities for deed records.
 */
export async function transformDeeds(): Promise<Op[]> {
  try {
    // Read and parse CSV
    const csvData = readFileSync('data/deeds.csv', 'utf-8');
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    }) as DeedRecord[];

    if (!records.length) {
      throw new Error('No records found in deeds.csv');
    }

    const ops: Op[] = [];

    // Create properties for deed fields
    console.log('Creating properties...');
    const { id: instrumentNumberId, ops: instrumentNumberOps } = Graph.createProperty({
      name: 'Instrument Number',
      type: 'TEXT',
    });
    ops.push(...instrumentNumberOps);

    const { id: sellerId, ops: sellerOps } = Graph.createProperty({
      name: 'Seller',
      type: 'TEXT',
    });
    ops.push(...sellerOps);

    const { id: buyerId, ops: buyerOps } = Graph.createProperty({
      name: 'Buyer',
      type: 'TEXT',
    });
    ops.push(...buyerOps);

    const { id: propertyDetailsId, ops: propertyDetailsOps } = Graph.createProperty({
      name: 'Property Details',
      type: 'TEXT',
    });
    ops.push(...propertyDetailsOps);

    const { id: docTypeId, ops: docTypeOps } = Graph.createProperty({
      name: 'Document Type',
      type: 'TEXT',
    });
    ops.push(...docTypeOps);

    const { id: addressId, ops: addressOps } = Graph.createProperty({
      name: 'Property Address',
      type: 'TEXT',
    });
    ops.push(...addressOps);

    // Create deed type
    console.log('Creating deed type...');
    const { id: deedTypeId, ops: deedTypeOps } = Graph.createType({
      name: 'Deed',
      properties: [
        instrumentNumberId,
        sellerId,
        buyerId,
        propertyDetailsId,
        docTypeId,
        addressId,
      ],
    });
    ops.push(...deedTypeOps);

    // Create entities for each deed record and store their IDs
    console.log('Creating deed entities...');
    const deedEntities = [];
    for (const record of records) {
      // Get address from mapping if available
      const sellerName = record.DirectName || '';
      const address = addressMapping[sellerName] || '';

      const { id: deedId, ops: entityOps } = Graph.createEntity({
        name: record.InstrumentNumber,
        types: [deedTypeId],
        properties: {
          [instrumentNumberId]: {
            type: 'TEXT',
            value: record.InstrumentNumber,
          },
          [sellerId]: {
            type: 'TEXT',
            value: sellerName,
          },
          [buyerId]: {
            type: 'TEXT',
            value: record.IndirectName || '',
          },
          [propertyDetailsId]: {
            type: 'TEXT',
            value: record.Comments || '',
          },
          [docTypeId]: {
            type: 'TEXT',
            value: record.DocTypeDescription || '',
          },
          [addressId]: {
            type: 'TEXT',
            value: address,
          },
        },
      });
      ops.push(...entityOps);
      deedEntities.push({
        id: deedId,
        instrumentNumber: record.InstrumentNumber,
        seller: sellerName,
        buyer: record.IndirectName || '',
        propertyDetails: record.Comments || '',
        docType: record.DocTypeDescription || '',
        address: address
      });
    }

    // Log the created entities with their IDs
    console.log('\nCreated deed entities:', {
      count: deedEntities.length,
      firstEntity: deedEntities.length > 0 ? JSON.stringify(deedEntities[0], null, 2) : 'none',
      lastEntity: deedEntities.length > 0 ? JSON.stringify(deedEntities[deedEntities.length - 1], null, 2) : 'none',
    });

    console.log(`Transformed ${records.length} deeds into ${ops.length} operations`);
    return ops;
  } catch (error) {
    console.error('Transformation failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  transformDeeds().catch(error => {
    console.error('Failed to transform deeds:', error);
    process.exit(1);
  });
}
