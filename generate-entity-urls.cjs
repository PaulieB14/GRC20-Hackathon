#!/usr/bin/env node

const fs = require('fs');

try {
  console.log("Starting URL generation...");
  
  // Read the entity ID mapping
  console.log("Reading entity ID mapping...");
  const entityIdMappingPath = 'data/entity-id-mapping.json';
  if (!fs.existsSync(entityIdMappingPath)) {
    console.error(`Error: File not found: ${entityIdMappingPath}`);
    process.exit(1);
  }
  
  const entityIdMapping = JSON.parse(fs.readFileSync(entityIdMappingPath, 'utf8'));
  console.log(`Found ${Object.keys(entityIdMapping).length} entity mappings`);
  
  // Read the original entity data to get instrument numbers
  console.log("Reading deeds triples...");
  const deedsTriplespath = 'data/deeds-triples-updated.json';
  if (!fs.existsSync(deedsTriplespath)) {
    console.error(`Error: File not found: ${deedsTriplespath}`);
    process.exit(1);
  }
  
  const deedsTriples = JSON.parse(fs.readFileSync(deedsTriplespath, 'utf8'));
  console.log(`Found ${deedsTriples.length} deed entities`);
  
  // Create a mapping of entity ID to instrument number
  console.log("Creating entity to instrument number mapping...");
  const entityToInstrument = {};
  for (const entity of deedsTriples) {
    const instrumentNumberTriple = entity.triples.find(triple => 
      triple.attributeId === "LuBWqZAu6pz54eiJS5mLv8"
    );
    
    if (instrumentNumberTriple) {
      entityToInstrument[entity.entityId] = instrumentNumberTriple.value.value;
    }
  }
  
  // Generate URLs for the new entities
  console.log("\nEntity URLs for the new relation-based entities:");
  console.log("================================================");
  
  for (const [oldEntityId, newEntityId] of Object.entries(entityIdMapping)) {
    const instrumentNumber = entityToInstrument[oldEntityId] || "Unknown";
    console.log(`Instrument Number: ${instrumentNumber}`);
    console.log(`Old Entity URL: https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/P77ioa8U9EipVASzVHBA9B/entity/${oldEntityId}`);
    console.log(`New Entity URL: https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/P77ioa8U9EipVASzVHBA9B/entity/${newEntityId}`);
    console.log();
  }
  
  // Also generate URLs for the person and document type entities
  console.log("To view person and document type entities, you'll need to navigate from the deed entities");
  console.log("through their relations. The relations should be visible on the entity page.");
  
  console.log("\nURL generation completed successfully.");
} catch (error) {
  console.error("Error generating URLs:", error);
}
