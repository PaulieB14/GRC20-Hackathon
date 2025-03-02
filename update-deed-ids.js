// update-deed-ids.js
const fs = require('fs');

// Read the original file with incorrect structure
const deedsData = JSON.parse(fs.readFileSync('data/deeds-triples.json', 'utf8'));

// New entity IDs to use
const newEntityIds = [
  "UoeeHD2neY2ZhPv5a1dEin", 
  "5iCf2TeCxAd1qCVc2g8NpS",
  "RJvcQDXzjaq9ErtDweServ",
  "SzrDiKQb5QL1LpwvSyoF3K",
  "7hdmabUF9VKmPXRfAYcKt6",
  "EjxDt8w3UgTcFGrJoVdKX3",
  "KjCcZvcDveVsBQoC8HWBd1",
  "PL4JWESg9iPxGm67WnymCY",
  "MDZZcN1ECuLc86ZjjcVen8"
];

// Map of instrument numbers to property addresses
const propertyAddresses = {
  '2025035356': '3461 10TH AVE N, ST PETERSBURG, FL 33713',
  '2025035363': '4715 BAY ST NE APT 123, SAINT PETERSBURG, FL 33703',
  '2025035367': '755 119TH AVE, TREASURE ISLAND, FL 33706',
  '2025035368': '125 DOLPHIN DR S, OLDSMAR, FL 34677',
  '2025035369': '18500 GULF BOULEVARD, UNIT 108, INDIAN SHORES, FL 33785',
  '2025035383': '2326 MELROSE AVE S, ST. PETERSBURG, FL 33712',
  '2025035390': '2818 55TH ST N, ST PETERSBURG, FL 33710',
  '2025035391': '5136 52ND LN N, ST PETERSBURG, FL 33710',
  '2025035398': '1900 59TH AVE N # 216, ST PETERSBURG, FL 33714'
};

// Flatten and update entity IDs
const updatedEntities = [];
const idMapping = {};
let idIndex = 0;

// First pass: build ID mapping based on instrument numbers
deedsData.forEach(entity => {
  const instrumentTriple = entity.triples.find(
    triple => triple.attributeId === 'LuBWqZAu6pz54eiJS5mLv8'
  );
  
  if (instrumentTriple) {
    const instrumentNumber = instrumentTriple.value.value;
    const oldId = entity.entityId;
    
    if (!idMapping[oldId] && idIndex < newEntityIds.length) {
      idMapping[oldId] = newEntityIds[idIndex];
      idIndex++;
    }
  }
});

// Second pass: create new entities with updated IDs and add property addresses
deedsData.forEach(entity => {
  const oldId = entity.entityId;
  const newId = idMapping[oldId] || oldId; // Use new ID if available, otherwise keep old
  
  // Find instrument number for property address
  const instrumentTriple = entity.triples.find(
    triple => triple.attributeId === 'LuBWqZAu6pz54eiJS5mLv8'
  );
  
  // Create updated entity
  const updatedEntity = {
    entityId: newId,
    triples: entity.triples.map(triple => ({
      ...triple,
      entityId: newId
    }))
  };
  
  // Add property address if available
  if (instrumentTriple) {
    const instrumentNumber = instrumentTriple.value.value;
    if (propertyAddresses[instrumentNumber]) {
      updatedEntity.triples.push({
        attributeId: 'PropertyAddress',
        entityId: newId,
        value: {
          type: 'TEXT',
          value: propertyAddresses[instrumentNumber]
        }
      });
    }
  }
  
  updatedEntities.push(updatedEntity);
});

// Write the updated entities
fs.writeFileSync('data/deeds-triples-updated.json', JSON.stringify(updatedEntities, null, 2));

// Show mapping for reference
console.log("Entity ID mapping:");
for (const [oldId, newId] of Object.entries(idMapping)) {
  console.log(`${oldId} -> ${newId}`);
}

console.log(`Updated ${updatedEntities.length} entities with ${Object.keys(idMapping).length} new entity IDs.`);
console.log('Saved to data/deeds-triples-updated.json');
