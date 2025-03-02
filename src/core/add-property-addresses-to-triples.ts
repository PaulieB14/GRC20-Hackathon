import { readFileSync, writeFileSync } from 'fs';

// Map of instrument numbers to property addresses
const propertyAddresses: Record<string, string> = {
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

/**
 * Adds property addresses to the existing triples
 */
function addPropertyAddressesToTriples(): void {
  try {
    // Read the deeds-triples-updated.json file
    const deedsTriples = JSON.parse(readFileSync('data/deeds-triples-updated.json', 'utf-8'));
    
    console.log(`Read ${deedsTriples.length} entities from deeds-triples-updated.json`);
    
    // Add property addresses to each entity
    for (const entity of deedsTriples) {
      // Find the instrument number for this entity
      const instrumentTriple = entity.triples.find(
        (triple: any) => triple.attributeId === 'LuBWqZAu6pz54eiJS5mLv8'
      );
      
      if (instrumentTriple) {
        const instrumentNumber = instrumentTriple.value.value;
        
        // Add property address if available
        if (propertyAddresses[instrumentNumber]) {
          entity.triples.push({
            attributeId: 'PropertyAddress', // This will be the property ID
            entityId: entity.entityId,
            value: {
              type: 'TEXT',
              value: propertyAddresses[instrumentNumber]
            }
          });
          
          console.log(`Added property address "${propertyAddresses[instrumentNumber]}" to entity ${entity.entityId}`);
        }
      } else {
        console.log(`No instrument number found for entity ${entity.entityId}`);
      }
    }
    
    // Write the updated triples back to the file
    writeFileSync('data/deeds-triples-updated.json', JSON.stringify(deedsTriples, null, 2));
    
    console.log(`Updated ${deedsTriples.length} entities and saved to data/deeds-triples-updated.json`);
  } catch (error) {
    console.error('Failed to add property addresses to triples:', error);
  }
}

// Execute the function
addPropertyAddressesToTriples();
