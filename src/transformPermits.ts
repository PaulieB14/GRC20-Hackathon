import { parse } from 'csv-parse/sync';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

interface PermitRecord {
  Date: string;
  'Record Type': string;
  'Record Number': string;
  Status: string;
  Address: string;
  'Project Name': string;
  'Expiration Date': string;
  Description: string;
}

interface Triple {
  attributeId: string;
  entityId: string;
  value: {
    type: string;
    value: string;
  };
}

async function transformPermits(filePath: string): Promise<string[]> {
  // Read CSV file
  const csvContent = fs.readFileSync(filePath, 'utf8');
  const records: PermitRecord[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });

  const transformedRecords: Array<{
    entityId: string;
    triples: Triple[];
  }> = records.map(record => {
    const entityId = uuidv4();

    const triples: Triple[] = [
      // Record Number as primary identifier
      {
        attributeId: 'name',
        entityId,
        value: { type: 'TEXT', value: record['Record Number'] }
      },
      // Additional attributes
      {
        attributeId: 'description',
        entityId,
        value: { type: 'TEXT', value: record.Description || 'No description' }
      },
      // Custom attributes
      {
        attributeId: 'record_type',
        entityId,
        value: { type: 'TEXT', value: record['Record Type'] }
      },
      {
        attributeId: 'address',
        entityId,
        value: { type: 'TEXT', value: record.Address }
      },
      {
        attributeId: 'project_name',
        entityId,
        value: { type: 'TEXT', value: record['Project Name'] || 'Unnamed Project' }
      },
      {
        attributeId: 'status',
        entityId,
        value: { type: 'TEXT', value: record.Status || 'Unknown' }
      }
    ];

    return { entityId, triples };
  });

  // Simulate IPFS publishing
  const publishResults = transformedRecords.map(record => {
    console.log(`Processing permit: ${record.entityId}`);
    console.log('Triples:', record.triples);
    
    // Simulated hash generation
    const hash = `permit-${record.entityId}`;
    
    console.log(`Processed permit ${record.entityId}. Hash: ${hash}`);
    return hash;
  });

  return publishResults;
}

// Usage
const filePath = './data/permits.csv';
transformPermits(filePath)
  .then(hashes => console.log('All permits processed:', hashes))
  .catch(error => console.error('Error processing permits:', error));

export default transformPermits;
