import { readFileSync, writeFileSync } from 'fs';

// Map of old entity IDs to new entity IDs
const entityIdMap: Record<string, string> = {
  '7tzYRxS8QES1fQQLoUpc8U': 'UoeeHD2neY2ZhPv5a1dEin', // 2025035356
  'PbuL6TM19rdkFoEh31VyQq': '5iCf2TeCxAd1qCVc2g8NpS', // 2025035363
  'GXSWc9tEJp5iP1idJDyuYC': 'RJvcQDXzjaq9ErtDweServ', // 2025035367
  'QQ2Cb5L4yNTUfva7aEXYdk': 'SzrDiKQb5QL1LpwvSyoF3K', // 2025035368
  'JUtVFrszpHccyEQPkURtUj': '7hdmabUF9VKmPXRfAYcKt6', // 2025035369
  'JSvDqnQxpXqdVYDm3G9Zyy': 'EjxDt8w3UgTcFGrJoVdKX3', // 2025035383
  'YB7z9V1fXtBv1LU5kpY2i8': 'KjCcZvcDveVsBQoC8HWBd1', // 2025035390
  '4a2Y9zUyeknUBCu8afhyds': 'PL4JWESg9iPxGm67WnymCY', // 2025035391
  '8b6w38q92qaxvbvgrvJPNh': 'MDZZcN1ECuLc86ZjjcVen8'  // 2025035398
};

/**
 * Updates the entity IDs in deeds-triples-updated.json to use the new entity IDs
 */
function updateEntityIdsInTriples(): void {
  try {
    // Read the deeds-triples-updated.json file
    const deedsTriples = JSON.parse(readFileSync('data/deeds-triples-updated.json', 'utf-8'));
    
    console.log(`Read ${deedsTriples.length} entities from deeds-triples-updated.json`);
    
    // Create a new array to store the updated triples
    const updatedDeedsTriples = [];
    
    // Update entity IDs
    for (const entity of deedsTriples) {
      const oldEntityId = entity.entityId;
      const newEntityId = entityIdMap[oldEntityId];
      
      if (newEntityId) {
        // Create a new entity with the new ID
        const updatedEntity = {
          entityId: newEntityId,
          triples: entity.triples.map((triple: any) => ({
            ...triple,
            entityId: newEntityId
          }))
        };
        
        updatedDeedsTriples.push(updatedEntity);
        console.log(`Updated entity ${oldEntityId} to ${newEntityId}`);
      } else {
        console.log(`No mapping found for entity ${oldEntityId}`);
        updatedDeedsTriples.push(entity);
      }
    }
    
    // Write the updated triples to the file
    writeFileSync('data/deeds-triples-updated.json', JSON.stringify(updatedDeedsTriples, null, 2));
    
    console.log(`Updated ${updatedDeedsTriples.length} entities and saved to data/deeds-triples-updated.json`);
  } catch (error) {
    console.error('Failed to update entity IDs in triples:', error);
  }
}

// Execute the function
updateEntityIdsInTriples();
