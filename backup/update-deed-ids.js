import fs from 'fs';

// Read the deeds-triples.json file
const deedsData = fs.readFileSync('data/deeds-triples.json', 'utf8');
const deeds = JSON.parse(deedsData);

// Define the correct entity IDs for each instrument number
// Only include the entity IDs that work
const correctEntityIds = {
  '2025035356': 'HsviSN53psykkDCir7kvtJ',
  '2025035369': 'MTGWsZYuBnqkT2a2rUjpCZ',
  '2025035398': 'ERy6XnDt3nZuFFiGkfUdit'
};

// Update the entity IDs in the deeds-triples.json file
for (const deed of deeds) {
  const instrumentNumberTriple = deed.triples.find(t => 
    t.value && t.value.type === 'TEXT' && /^\d+$/.test(t.value.value)
  );
  
  if (instrumentNumberTriple) {
    const instrumentNumber = instrumentNumberTriple.value.value;
    const correctEntityId = correctEntityIds[instrumentNumber];
    
    if (correctEntityId && correctEntityId !== deed.entityId) {
      console.log(`Updating entity ID for ${instrumentNumber}: ${deed.entityId} -> ${correctEntityId}`);
      
      // Update the entity ID in the deed object
      deed.entityId = correctEntityId;
      
      // Update the entity ID in all triples
      for (const triple of deed.triples) {
        if (triple.entityId) {
          triple.entityId = correctEntityId;
        }
      }
    }
  }
}

// Write the updated deeds-triples.json file
fs.writeFileSync('data/deeds-triples.json', JSON.stringify(deeds, null, 2));
console.log('Updated deeds-triples.json with correct entity IDs');

// Update the working-deed-ids.json file with the working entity IDs
const workingDeedIds = Object.values(correctEntityIds);
fs.writeFileSync('data/working-deed-ids.json', JSON.stringify(workingDeedIds, null, 2));
console.log('Updated working-deed-ids.json with working entity IDs');
