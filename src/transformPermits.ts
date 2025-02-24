import { readFileSync } from 'fs';
import { parse } from '@fast-csv/parse';
import { Graph, type Op } from '@graphprotocol/grc-20';

interface PermitRecord {
  'Record Number': string;
  'Description'?: string;
  'Record Type'?: string;
  'Address'?: string;
  'Project Name'?: string;
  'Status'?: string;
}

/**
 * Transforms permits.csv into a set of Graph operations using the GRC-20 SDK.
 * Creates properties, types, and entities for permit records.
 */
export async function transformPermits(): Promise<Op[]> {
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

    const ops: Op[] = [];

    // Create properties for permit fields
    console.log('Creating properties...');
    const { id: recordNumberId, ops: recordNumberOps } = Graph.createProperty({
      name: 'Record Number',
      type: 'TEXT',
    });
    ops.push(...recordNumberOps);

    const { id: descriptionId, ops: descriptionOps } = Graph.createProperty({
      name: 'Description',
      type: 'TEXT',
    });
    ops.push(...descriptionOps);

    const { id: recordTypeId, ops: recordTypeOps } = Graph.createProperty({
      name: 'Record Type',
      type: 'TEXT',
    });
    ops.push(...recordTypeOps);

    const { id: addressId, ops: addressOps } = Graph.createProperty({
      name: 'Address',
      type: 'TEXT',
    });
    ops.push(...addressOps);

    const { id: projectNameId, ops: projectNameOps } = Graph.createProperty({
      name: 'Project Name',
      type: 'TEXT',
    });
    ops.push(...projectNameOps);

    const { id: statusId, ops: statusOps } = Graph.createProperty({
      name: 'Status',
      type: 'TEXT',
    });
    ops.push(...statusOps);

    // Create permit type
    console.log('Creating permit type...');
    const { id: permitTypeId, ops: permitTypeOps } = Graph.createType({
      name: 'Permit',
      properties: [
        recordNumberId,
        descriptionId,
        recordTypeId,
        addressId,
        projectNameId,
        statusId,
      ],
    });
    ops.push(...permitTypeOps);

    // Create entities for each permit record
    console.log('Creating permit entities...');
    for (const record of records) {
      const { ops: entityOps } = Graph.createEntity({
        name: record['Record Number'],
        types: [permitTypeId],
        properties: {
          [recordNumberId]: {
            type: 'TEXT',
            value: record['Record Number'],
          },
          [descriptionId]: {
            type: 'TEXT',
            value: record['Description'] || '',
          },
          [recordTypeId]: {
            type: 'TEXT',
            value: record['Record Type'] || '',
          },
          [addressId]: {
            type: 'TEXT',
            value: record['Address'] || '',
          },
          [projectNameId]: {
            type: 'TEXT',
            value: record['Project Name'] || '',
          },
          [statusId]: {
            type: 'TEXT',
            value: record['Status'] || '',
          },
        },
      });
      ops.push(...entityOps);
    }

    console.log(`Transformed ${records.length} permits into ${ops.length} operations`);
    return ops;
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
