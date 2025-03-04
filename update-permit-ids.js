// update-permit-ids.js
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the original file with incorrect structure
const permitsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'permits-triples.json'), 'utf8'));

// Function to generate a new entity ID
function generateEntityId() {
  return crypto.randomBytes(16).toString('hex');
}

// Map of record numbers to property addresses
const propertyAddresses = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'permit-addresses.json'), 'utf8'));

// Flatten and update entity IDs
const updatedEntities = [];
const idMapping = {};

// First pass: build ID mapping based on record numbers
permitsData.forEach(entity => {
  const recordNumberTriple = entity.triples.find(
    triple => triple.attributeId === 'LuBWqZAu6pz54eiJS5mLv8' || 
              (triple.attribute && triple.attribute === 'LuBWqZAu6pz54eiJS5mLv8')
  );
  
  if (recordNumberTriple) {
    const recordNumber = recordNumberTriple.value.value;
    const oldId = entity.entityId;
    
    if (!idMapping[oldId]) {
      // Try to load existing mapping from permit-entity-id-mapping.json
      try {
        const existingMapping = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'permit-entity-id-mapping.json'), 'utf8'));
        if (existingMapping[oldId]) {
          idMapping[oldId] = existingMapping[oldId];
        } else {
          idMapping[oldId] = generateEntityId();
        }
      } catch (error) {
        // If the file doesn't exist or there's an error, generate a new ID
        idMapping[oldId] = generateEntityId();
      }
    }
  }
});

// Second pass: create new entities with updated IDs and add property addresses
permitsData.forEach(entity => {
  const oldId = entity.entityId;
  const newId = idMapping[oldId] || oldId; // Use new ID if available, otherwise keep old
  
  // Find record number for property address
  const recordNumberTriple = entity.triples.find(
    triple => triple.attributeId === 'LuBWqZAu6pz54eiJS5mLv8' || 
              (triple.attribute && triple.attribute === 'LuBWqZAu6pz54eiJS5mLv8')
  );
  
  // Create updated entity
  const updatedEntity = {
    entityId: newId,
    triples: entity.triples.map(triple => {
      // Handle both formats of triples
      if (triple.attributeId) {
        return {
          ...triple,
          entityId: newId
        };
      } else if (triple.attribute) {
        return {
          ...triple,
          entity: newId
        };
      }
      return triple;
    })
  };
  
  // Add property address if available and not already present
  if (recordNumberTriple) {
    const recordNumber = recordNumberTriple.value.value;
    
    // Check if property address already exists
    const hasPropertyAddress = updatedEntity.triples.some(
      triple => (triple.attributeId === 'DfjyQFDy6k4dW9XaSgYttn' || 
                (triple.attribute && triple.attribute === 'DfjyQFDy6k4dW9XaSgYttn'))
    );
    
    if (!hasPropertyAddress && propertyAddresses[recordNumber]) {
      // Add property address based on the format of the triples
      if (updatedEntity.triples[0].attributeId) {
        updatedEntity.triples.push({
          attributeId: 'DfjyQFDy6k4dW9XaSgYttn',
          entityId: newId,
          value: {
            type: 'TEXT',
            value: propertyAddresses[recordNumber]
          }
        });
      } else if (updatedEntity.triples[0].attribute) {
        updatedEntity.triples.push({
          attribute: 'DfjyQFDy6k4dW9XaSgYttn',
          entity: newId,
          value: {
            type: 'TEXT',
            value: propertyAddresses[recordNumber]
          }
        });
      }
    }
  }
  
  updatedEntities.push(updatedEntity);
});

// Write the updated entities
fs.writeFileSync(path.join(__dirname, 'data', 'permits-triples-updated.json'), JSON.stringify(updatedEntities, null, 2));

// Save the ID mapping for future reference
fs.writeFileSync(path.join(__dirname, 'data', 'permit-entity-id-mapping.json'), JSON.stringify(idMapping, null, 2));

// Show mapping for reference
console.log("Entity ID mapping:");
for (const [oldId, newId] of Object.entries(idMapping)) {
  console.log(`${oldId} -> ${newId}`);
}

console.log(`Updated ${updatedEntities.length} entities with ${Object.keys(idMapping).length} new entity IDs.`);
console.log('Saved to data/permits-triples-updated.json');
console.log('ID mapping saved to data/permit-entity-id-mapping.json');

// Create a log entry for auditing
const logEntry = {
  timestamp: new Date().toISOString(),
  action: 'update-permit-ids',
  entitiesUpdated: updatedEntities.length,
  newIdsGenerated: Object.keys(idMapping).length,
  mapping: idMapping
};

// Append to log file
const logFilePath = path.join(__dirname, 'data', 'entity-updates.log');
let logs = [];
try {
  if (fs.existsSync(logFilePath)) {
    logs = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
  }
} catch (error) {
  console.error(`Error reading log file: ${error.message}`);
}

logs.push(logEntry);
fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
console.log(`Log entry added to ${logFilePath}`);
