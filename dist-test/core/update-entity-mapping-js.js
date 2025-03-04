import { readFileSync, writeFileSync } from 'fs';
// Map of old entity IDs to new entity IDs
const entityIdMap = {
    '7tzYRxS8QES1fQQLoUpc8U': 'UoeeHD2neY2ZhPv5a1dEin', // 2025035356
    'PbuL6TM19rdkFoEh31VyQq': '5iCf2TeCxAd1qCVc2g8NpS', // 2025035363
    'GXSWc9tEJp5iP1idJDyuYC': 'RJvcQDXzjaq9ErtDweServ', // 2025035367
    'QQ2Cb5L4yNTUfva7aEXYdk': 'SzrDiKQb5QL1LpwvSyoF3K', // 2025035368
    'JUtVFrszpHccyEQPkURtUj': '7hdmabUF9VKmPXRfAYcKt6', // 2025035369
    'JSvDqnQxpXqdVYDm3G9Zyy': 'EjxDt8w3UgTcFGrJoVdKX3', // 2025035383
    'YB7z9V1fXtBv1LU5kpY2i8': 'KjCcZvcDveVsBQoC8HWBd1', // 2025035390
    '4a2Y9zUyeknUBCu8afhyds': 'PL4JWESg9iPxGm67WnymCY', // 2025035391
    '8b6w38q92qaxvbvgrvJPNh': 'MDZZcN1ECuLc86ZjjcVen8' // 2025035398
};
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
/**
 * Updates the entity mapping in deeds-triples-updated.json to use the new entity IDs
 * and adds property addresses
 */
function updateEntityMapping() {
    try {
        // Read the deeds-triples-updated.json file
        const deedsTriples = JSON.parse(readFileSync('data/deeds-triples-updated.json', 'utf-8'));
        console.log(`Read ${deedsTriples.length} entities from deeds-triples-updated.json`);
        // Create a new array to store the updated triples
        const updatedDeedsTriples = [];
        // Create a map of instrument numbers to entity IDs
        const instrumentToEntityId = {};
        // First pass: collect instrument numbers for each entity
        for (const entity of deedsTriples) {
            const instrumentTriple = entity.triples.find((triple) => triple.attributeId === 'LuBWqZAu6pz54eiJS5mLv8');
            if (instrumentTriple) {
                const instrumentNumber = instrumentTriple.value.value;
                instrumentToEntityId[instrumentNumber] = entity.entityId;
            }
        }
        // Second pass: update entity IDs and add property addresses
        for (const entity of deedsTriples) {
            // Find the instrument number for this entity
            const instrumentTriple = entity.triples.find((triple) => triple.attributeId === 'LuBWqZAu6pz54eiJS5mLv8');
            if (instrumentTriple) {
                const instrumentNumber = instrumentTriple.value.value;
                const newEntityId = entityIdMap[entity.entityId];
                if (newEntityId) {
                    // Create a new entity with the new ID
                    const updatedEntity = {
                        entityId: newEntityId,
                        triples: entity.triples.map((triple) => ({
                            ...triple,
                            entityId: newEntityId
                        }))
                    };
                    // Add property address if available
                    if (propertyAddresses[instrumentNumber]) {
                        updatedEntity.triples.push({
                            attributeId: 'PropertyAddress', // This will be replaced with the actual property ID
                            entityId: newEntityId,
                            value: {
                                type: 'TEXT',
                                value: propertyAddresses[instrumentNumber]
                            }
                        });
                    }
                    updatedDeedsTriples.push(updatedEntity);
                    console.log(`Updated entity ${entity.entityId} to ${newEntityId} for instrument number ${instrumentNumber}`);
                }
                else {
                    console.log(`No mapping found for entity ${entity.entityId} with instrument number ${instrumentNumber}`);
                    updatedDeedsTriples.push(entity);
                }
            }
            else {
                console.log(`No instrument number found for entity ${entity.entityId}`);
                updatedDeedsTriples.push(entity);
            }
        }
        // Write the updated triples to a new file
        writeFileSync('data/deeds-triples-with-addresses.json', JSON.stringify(updatedDeedsTriples, null, 2));
        console.log(`Updated ${updatedDeedsTriples.length} entities and saved to data/deeds-triples-with-addresses.json`);
    }
    catch (error) {
        console.error('Failed to update entity mapping:', error);
    }
}
// Execute the function
updateEntityMapping();
