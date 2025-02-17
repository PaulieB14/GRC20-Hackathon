import { parse } from 'csv-parse/sync';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

interface DeedRecord {
  DirectName: string;
  IndirectName: string;
  RecordDate: string;
  DocTypeDescription: string;
  BookType: string;
  BookPage: string;
  Comments: string;
  InstrumentNumber: string;
}

interface Triple {
  attributeId: string;
  entityId: string;
  value: {
    type: string;
    value: string;
  };
}

async function transformDeeds(filePath: string): Promise<string[]> {
  // Read CSV file
  const csvContent = fs.readFileSync(filePath, 'utf8');
  const records: DeedRecord[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });

  const transformedRecords: Array<{
    entityId: string;
    triples: Triple[];
  }> = records.map(record => {
    const entityId = uuidv4();

    const triples: Triple[] = [
      // Instrument Number as primary identifier
      {
        attributeId: 'name',
        entityId,
        value: { type: 'TEXT', value: record.InstrumentNumber }
      },
      // Seller information
      {
        attributeId: 'seller',
        entityId,
        value: { type: 'TEXT', value: record.DirectName }
      },
      // Buyer information
      {
        attributeId: 'buyer',
        entityId,
        value: { type: 'TEXT', value: record.IndirectName }
      },
      // Record date
      {
        attributeId: 'record_date',
        entityId,
        value: { type: 'TEXT', value: record.RecordDate }
      },
      // Property details
      {
        attributeId: 'property_details',
        entityId,
        value: { type: 'TEXT', value: record.Comments || 'No additional details' }
      },
      // Book and page reference
      {
        attributeId: 'book_reference',
        entityId,
        value: { type: 'TEXT', value: `${record.BookType} ${record.BookPage}` }
      },
      // Document type
      {
        attributeId: 'doc_type',
        entityId,
        value: { type: 'TEXT', value: record.DocTypeDescription }
      }
    ];

    return { entityId, triples };
  });

  // Simulate IPFS publishing
  const publishResults = transformedRecords.map(record => {
    console.log(`Processing deed: ${record.entityId}`);
    console.log('Triples:', record.triples);
    
    // Simulated hash generation
    const hash = `deed-${record.entityId}`;
    
    console.log(`Processed deed ${record.entityId}. Hash: ${hash}`);
    return hash;
  });

  return publishResults;
}

// Usage
const filePath = './data/deeds.csv';
transformDeeds(filePath)
  .then(hashes => console.log('All deeds processed:', hashes))
  .catch(error => console.error('Error processing deeds:', error));

export default transformDeeds;
