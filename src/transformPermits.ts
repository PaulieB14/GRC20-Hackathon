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
 * 
 * @returns Array of operations for creating permit data
 */
export async function transformPermits() {
  console.log('Transforming permits...');
  const permits = readPermits();

  const ops = [];

  // Step 1: Create properties
  console.log('Creating properties...');
  const { id: recordNumberPropertyId, ops: recordNumberOps } = Graph.createProperty({
    name: 'Record Number',
    type: 'TEXT',
  });
  ops.push(...recordNumberOps);

  const { id: descriptionPropertyId, ops: descriptionOps } = Graph.createProperty({
    name: 'Description',
    type: 'TEXT',
  });
  ops.push(...descriptionOps);

  const { id: recordTypePropertyId, ops: recordTypeOps } = Graph.createProperty({
    name: 'Record Type',
    type: 'TEXT',
  });
  ops.push(...recordTypeOps);

  const { id: addressPropertyId, ops: addressOps } = Graph.createProperty({
    name: 'Address',
    type: 'TEXT',
  });
  ops.push(...addressOps);

  const { id: projectNamePropertyId, ops: projectNameOps } = Graph.createProperty({
    name: 'Project Name',
    type: 'TEXT',
  });
  ops.push(...projectNameOps);

  const { id: statusPropertyId, ops: statusOps } = Graph.createProperty({
    name: 'Status',
    type: 'TEXT',
  });
  ops.push(...statusOps);

  // Step 2: Create permit type
  console.log('Creating permit type...');
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
  ops.push(...permitTypeOps);

  // Step 3: Create permit entities
  console.log('Creating permit entities...');
  for (const permit of permits) {
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
    ops.push(...permitOps);
  }

  return ops;
}

function readPermits(): Permit[] {
  const csvData = readFileSync('data/permits.csv', 'utf-8');
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  });

  return records.map((record: any) => ({
    recordNumber: record['Record Number'],
    description: record['Description'],
    recordType: record['Record Type'],
    address: record['Address'],
    projectName: record['Project Name'],
    status: record['Status'],
  }));
}
