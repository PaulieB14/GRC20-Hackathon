import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { Graph, type Op } from '@graphprotocol/grc-20';

interface DeedRecord {
  InstrumentNumber: string;
  DirectName?: string;
  IndirectName?: string;
  Comments?: string;
  DocTypeDescription?: string;
}

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
      ],
    });
    ops.push(...deedTypeOps);

    // Create entities for each deed record and store their IDs
    console.log('Creating deed entities...');
    const deedEntities = [];
    for (const record of records) {
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
            value: record.DirectName || '',
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
        },
      });
      ops.push(...entityOps);
      deedEntities.push({
        id: deedId,
        instrumentNumber: record.InstrumentNumber,
        seller: record.DirectName || '',
        buyer: record.IndirectName || '',
        propertyDetails: record.Comments || '',
        docType: record.DocTypeDescription || ''
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
