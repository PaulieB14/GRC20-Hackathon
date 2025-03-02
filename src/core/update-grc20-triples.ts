import { readFileSync, writeFileSync } from 'fs';

/**
 * Updates the deeds-triples.json file with the new entity IDs from grc20-deeds-triples.json
 */
async function updateGRC20Triples(): Promise<void> {
  try {
    // Read the existing deeds-triples.json file
    const deedsTriples = JSON.parse(readFileSync('data/deeds-triples.json', 'utf-8'));
    
    // Read the new GRC20 deeds triples
    const grc20DeedsTriples = JSON.parse(readFileSync('data/grc20-deeds-triples.json', 'utf-8'));
    
    // Create a mapping from instrument number to entity ID
    const instrumentNumberToEntityId = new Map<string, string>();
    
    // Extract instrument numbers and entity IDs from GRC20 deeds triples
    for (const entity of grc20DeedsTriples) {
      const instrumentNumberTriple = entity.triples.find(
        (triple: any) => triple.attributeId === 'instrumentNumberId'
      );
      
      if (instrumentNumberTriple) {
        const instrumentNumber = instrumentNumberTriple.value.value;
        instrumentNumberToEntityId.set(instrumentNumber, entity.entityId);
      }
    }
    
    // Create a mapping from old entity ID to new entity ID
    const oldToNewEntityId = new Map<string, string>();
    
    // Match old entity IDs to new entity IDs based on instrument number
    for (const entity of deedsTriples) {
      const instrumentNumberTriple = entity.triples.find(
        (triple: any) => triple.attributeId === 'LuBWqZAu6pz54eiJS5mLv8'
      );
      
      if (instrumentNumberTriple) {
        const instrumentNumber = instrumentNumberTriple.value.value;
        const newEntityId = instrumentNumberToEntityId.get(instrumentNumber);
        
        if (newEntityId) {
          oldToNewEntityId.set(entity.entityId, newEntityId);
        }
      }
    }
    
    // Update the deeds-triples.json file with the new entity IDs
    const updatedDeedsTriples = deedsTriples.map((entity: any) => {
      const newEntityId = oldToNewEntityId.get(entity.entityId);
      
      if (newEntityId) {
        return {
          ...entity,
          entityId: newEntityId,
          triples: entity.triples.map((triple: any) => ({
            ...triple,
            entityId: newEntityId
          }))
        };
      }
      
      return entity;
    });
    
    // Write the updated deeds-triples.json file
    writeFileSync('data/deeds-triples-updated.json', JSON.stringify(updatedDeedsTriples, null, 2));
    
    console.log('Updated deeds-triples.json with new entity IDs');
    console.log('Old to new entity ID mapping:');
    
    // Log the mapping from old to new entity IDs
    for (const [oldId, newId] of oldToNewEntityId.entries()) {
      console.log(`${oldId} -> ${newId}`);
    }
  } catch (error) {
    console.error('Failed to update GRC20 triples:', error);
    throw error;
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  updateGRC20Triples().catch(error => {
    console.error('Failed to update GRC20 triples:', error);
    process.exit(1);
  });
}
