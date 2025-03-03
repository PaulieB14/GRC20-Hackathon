// This script captures the permit entity IDs from the permit-relations.json file
// and outputs them in a format that can be used to check the published content

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the permit-relations.json file
const permitRelationsPath = path.join(__dirname, 'data', 'permit-relations.json');
const permitRelations = JSON.parse(fs.readFileSync(permitRelationsPath, 'utf8'));

// Extract entity IDs
const entityIds = new Set();
const recordTypeIds = new Set();
const statusIds = new Set();

// Function to determine entity type
function getEntityType(entity) {
  // Check if it's a permit entity
  if (entity.type === 'SET_TRIPLE' && 
      entity.triple && 
      entity.triple.attribute === 'LuBWqZAu6pz54eiJS5mLv8') {
    
    // Check if it's a record type entity
    if (entity.triple.value && 
        entity.triple.value.type === 'TEXT' && 
        ['Residential Demolition', 'Commercial Electrical', 'Express Building Permit', 
         'Residential Plumbing', 'Residential Electrical', 'Residential Revision-Supplement',
         'Commercial Demolition'].includes(entity.triple.value.value)) {
      return 'Record Type';
    }
    
    // Check if it's a status entity
    if (entity.triple.value && 
        entity.triple.value.type === 'TEXT' && 
        ['Awaiting Plans', 'Incomplete Submittal', 'Issued', 'N/A', 
         'Closed - Withdrawn', 'Closed - Supp-Rev Approved', 'Submitted', 
         'In Review'].includes(entity.triple.value.value)) {
      return 'Status';
    }
    
    // Check if it's a permit entity (has a longer description)
    if (entity.triple.value && 
        entity.triple.value.type === 'TEXT' && 
        entity.triple.value.value.length > 20) {
      return 'Permit';
    }
  }
  
  return 'Other';
}

// Process each operation
permitRelations.forEach(op => {
  if (op.type === 'SET_TRIPLE') {
    const entityType = getEntityType(op);
    
    if (entityType === 'Permit') {
      entityIds.add(op.triple.entity);
    } else if (entityType === 'Record Type') {
      recordTypeIds.add(op.triple.entity);
    } else if (entityType === 'Status') {
      statusIds.add(op.triple.entity);
    }
  }
});

// Get the permits space ID from the .env file
let spaceId = '';
try {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/PERMITS_SPACE_ID=([^\r\n]+)/);
  if (match) {
    spaceId = match[1];
  }
} catch (error) {
  console.error('Error reading .env file:', error);
}

// Output the results
console.log('=== Permit Entities ===');
console.log(`Found ${entityIds.size} permit entities, ${recordTypeIds.size} record type entities, and ${statusIds.size} status entities.`);

console.log('\n=== URLs to Check Permit Entities ===');
if (spaceId) {
  console.log('Space ID:', spaceId);
  console.log('\nPermit Entities:');
  [...entityIds].slice(0, 5).forEach(id => {
    console.log(`https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${id}`);
  });
  
  console.log('\nRecord Type Entities:');
  [...recordTypeIds].slice(0, 5).forEach(id => {
    console.log(`https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${id}`);
  });
  
  console.log('\nStatus Entities:');
  [...statusIds].slice(0, 5).forEach(id => {
    console.log(`https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${id}`);
  });
} else {
  console.log('Space ID not found in .env file. Please add SPACE_ID to your .env file.');
  console.log('Then you can check the entities at:');
  console.log('https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/[spaceId]/[entityId]');
}

// Save the entity IDs to a file
const output = {
  permitEntities: [...entityIds],
  recordTypeEntities: [...recordTypeIds],
  statusEntities: [...statusIds]
};

fs.writeFileSync(
  path.join(__dirname, 'data', 'permit-entity-ids.json'), 
  JSON.stringify(output, null, 2)
);

console.log('\nEntity IDs saved to data/permit-entity-ids.json');
