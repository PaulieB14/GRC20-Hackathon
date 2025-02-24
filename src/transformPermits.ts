import { Graph, Id } from "@graphprotocol/grc-20";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";

type Permit = {
  recordNumber: string;
  description: string;
  recordType: string;
  address: string;
  projectName: string;
  status: string;
};

/**
 * Transforms permit CSV data into GRC-20 operations.
 * Following guide from: https://www.npmjs.com/package/@graphprotocol/grc-20
 * 
 * @returns Array of operations for creating permit data
 */
export async function transformPermits() {
  try {
    console.log('Starting permit transformation...');
    console.log('Reading permits from CSV...');
    const permits = readPermits();
    console.log(`Read ${permits.length} permits from CSV`);
    console.log('First permit:', JSON.stringify(permits[0], null, 2));
    console.log('Last permit:', JSON.stringify(permits[permits.length - 1], null, 2));

    const ops = [];

    // Step 1: Create properties
    console.log('\nStep 1: Creating properties...');

    console.log('Creating Record Number property...');
    const { id: recordNumberPropertyId, ops: recordNumberOps } = Graph.createProperty({
      name: 'Record Number',
      type: 'TEXT',
    });
    console.log('Created Record Number property:', { id: recordNumberPropertyId });
    ops.push(...recordNumberOps);

    console.log('Creating Description property...');
    const { id: descriptionPropertyId, ops: descriptionOps } = Graph.createProperty({
      name: 'Description',
      type: 'TEXT',
    });
    console.log('Created Description property:', { id: descriptionPropertyId });
    ops.push(...descriptionOps);

    console.log('Creating Record Type property...');
    const { id: recordTypePropertyId, ops: recordTypeOps } = Graph.createProperty({
      name: 'Record Type',
      type: 'TEXT',
    });
    console.log('Created Record Type property:', { id: recordTypePropertyId });
    ops.push(...recordTypeOps);

    console.log('Creating Address property...');
    const { id: addressPropertyId, ops: addressOps } = Graph.createProperty({
      name: 'Address',
      type: 'TEXT',
    });
    console.log('Created Address property:', { id: addressPropertyId });
    ops.push(...addressOps);

    console.log('Creating Project Name property...');
    const { id: projectNamePropertyId, ops: projectNameOps } = Graph.createProperty({
      name: 'Project Name',
      type: 'TEXT',
    });
    console.log('Created Project Name property:', { id: projectNamePropertyId });
    ops.push(...projectNameOps);

    console.log('Creating Status property...');
    const { id: statusPropertyId, ops: statusOps } = Graph.createProperty({
      name: 'Status',
      type: 'TEXT',
    });
    console.log('Created Status property:', { id: statusPropertyId });
    ops.push(...statusOps);

    console.log('\nProperty creation summary:', {
      recordNumberPropertyId,
      descriptionPropertyId,
      recordTypePropertyId,
      addressPropertyId,
      projectNamePropertyId,
      statusPropertyId,
      totalOps: ops.length,
    });

    // Step 2: Create permit type
    console.log('\nStep 2: Creating permit type...');
    const { id: permitTypeId, ops: permitTypeOps } = Graph.createType({
      name: 'Permit',
      properties: [
        recordNumberPropertyId,
        descriptionPropertyId,
        recordTypePropertyId,
        addressPropertyId,
        projectNamePropertyId,
        statusPropertyId,
      ],
    });
    console.log('Created Permit type:', {
      id: permitTypeId,
      propertyCount: permitTypeOps.length,
    });
    ops.push(...permitTypeOps);

    // Step 3: Create permit entities
    console.log('\nStep 3: Creating permit entities...');
    for (const [index, permit] of permits.entries()) {
      console.log(`\nCreating entity for permit ${index + 1}/${permits.length}:`, {
        recordNumber: permit.recordNumber,
      });

      const { ops: permitOps } = Graph.createEntity({
        name: permit.recordNumber,
        types: [permitTypeId],
        properties: {
          [recordNumberPropertyId]: {
            type: 'TEXT',
            value: permit.recordNumber,
          },
          [descriptionPropertyId]: {
            type: 'TEXT',
            value: permit.description,
          },
          [recordTypePropertyId]: {
            type: 'TEXT',
            value: permit.recordType,
          },
          [addressPropertyId]: {
            type: 'TEXT',
            value: permit.address,
          },
          [projectNamePropertyId]: {
            type: 'TEXT',
            value: permit.projectName,
          },
          [statusPropertyId]: {
            type: 'TEXT',
            value: permit.status,
          },
        },
      });

      console.log('Created permit entity:', {
        recordNumber: permit.recordNumber,
        opsCount: permitOps.length,
      });

      ops.push(...permitOps);
    }

    console.log('\nTransformation complete:', {
      totalPermits: permits.length,
      totalOps: ops.length,
      firstOp: JSON.stringify(ops[0], null, 2),
      lastOp: JSON.stringify(ops[ops.length - 1], null, 2),
    });

    return ops;
  } catch (error) {
    console.error('Permit transformation failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: 'cause' in error ? error.cause : undefined,
      });
    }
    throw error;
  }
}

function readPermits(): Permit[] {
  try {
    console.log('Reading permits.csv...');
    const csvData = readFileSync('data/permits.csv', 'utf-8');
    console.log('CSV data loaded, parsing...');
    
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    });
    console.log(`Parsed ${records.length} records from CSV`);

    const permits = records.map((record: any) => ({
      recordNumber: record['Record Number'],
      description: record['Description'],
      recordType: record['Record Type'],
      address: record['Address'],
      projectName: record['Project Name'],
      status: record['Status'],
    }));

    console.log('CSV parsing complete:', {
      totalPermits: permits.length,
      firstPermit: JSON.stringify(permits[0], null, 2),
      lastPermit: JSON.stringify(permits[permits.length - 1], null, 2),
    });

    return permits;
  } catch (error) {
    console.error('Failed to read permits:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: 'cause' in error ? error.cause : undefined,
      });
    }
    throw error;
  }
}
