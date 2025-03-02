import fs from 'fs';

// Read the deeds-triples.json file
const data = fs.readFileSync('data/deeds-triples.json', 'utf8');
const deeds = JSON.parse(data);

// Read the working-deed-ids.json file
const workingIdsData = fs.readFileSync('data/working-deed-ids.json', 'utf8');
const workingIds = JSON.parse(workingIdsData);

// Print the entity IDs and instrument numbers
console.log('Entity IDs in deeds-triples.json:');
for (const deed of deeds) {
  const instrumentNumberTriple = deed.triples.find(t => 
    t.value && t.value.type === 'TEXT' && /^\d+$/.test(t.value.value)
  );
  
  if (instrumentNumberTriple) {
    console.log(`Entity ID: ${deed.entityId}, Instrument Number: ${instrumentNumberTriple.value.value}`);
  }
}

console.log('\nWorking entity IDs:');
console.log(workingIds);

// Check for missing and extra entity IDs
const deedEntityIds = deeds.map(deed => deed.entityId);
const missingIds = workingIds.filter(id => !deedEntityIds.includes(id));
const extraIds = deedEntityIds.filter(id => !workingIds.includes(id));

console.log('\nMissing entity IDs (in working-deed-ids.json but not in deeds-triples.json):');
console.log(missingIds);

console.log('\nExtra entity IDs (in deeds-triples.json but not in working-deed-ids.json):');
console.log(extraIds);
