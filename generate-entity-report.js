import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to read the entity data from various files
function readEntityData() {
  const entities = {};
  const relations = [];
  
  // Read sentence-case-entities.csv
  try {
    const data = fs.readFileSync('sentence-case-entities.csv', 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');
    
    // Skip header lines
    for (let i = 2; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 3) {
        const type = parts[0];
        const name = parts[1].replace(/"/g, ''); // Remove quotes
        const id = parts[2];
        const url = parts[3];
        
        entities[id] = {
          id,
          name,
          type,
          url,
          properties: [],
          incomingRelations: [],
          outgoingRelations: []
        };
      }
    }
  } catch (error) {
    console.error('Error reading sentence-case-entities.csv:', error);
  }
  
  // Read type-entity-url.csv
  try {
    const data = fs.readFileSync('type-entity-url.csv', 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');
    
    // Skip header lines
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 3) {
        const type = parts[0];
        const name = parts[1];
        const id = parts[2];
        const url = parts[3];
        
        if (!entities[id]) {
          entities[id] = {
            id,
            name,
            type,
            url,
            properties: [],
            incomingRelations: [],
            outgoingRelations: []
          };
        }
      }
    }
  } catch (error) {
    console.error('Error reading type-entity-url.csv:', error);
  }
  
  // Read data/permit-entity-ids.json
  try {
    const data = fs.readFileSync('data/permit-entity-ids.json', 'utf8');
    const jsonData = JSON.parse(data);
    
    // Add permit entities
    if (jsonData.permitEntities) {
      jsonData.permitEntities.forEach(id => {
        if (!entities[id]) {
          entities[id] = {
            id,
            name: `Permit ${id}`,
            type: 'Permit Entity',
            url: `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/XPZ8fnf3DvNMRDbFgxEZi2/${id}`,
            properties: [],
            incomingRelations: [],
            outgoingRelations: []
          };
        }
      });
    }
    
    // Add record type entities
    if (jsonData.recordTypeEntities) {
      jsonData.recordTypeEntities.forEach(id => {
        if (!entities[id]) {
          entities[id] = {
            id,
            name: `Record Type ${id}`,
            type: 'Record Type Entity',
            url: `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/XPZ8fnf3DvNMRDbFgxEZi2/${id}`,
            properties: [],
            incomingRelations: [],
            outgoingRelations: []
          };
        }
      });
    }
    
    // Add status entities
    if (jsonData.statusEntities) {
      jsonData.statusEntities.forEach(id => {
        if (!entities[id]) {
          entities[id] = {
            id,
            name: `Status ${id}`,
            type: 'Status Entity',
            url: `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/XPZ8fnf3DvNMRDbFgxEZi2/${id}`,
            properties: [],
            incomingRelations: [],
            outgoingRelations: []
          };
        }
      });
    }
  } catch (error) {
    console.error('Error reading data/permit-entity-ids.json:', error);
  }
  
  // Read data/permit-relations.json to extract relations
  try {
    const data = fs.readFileSync('data/permit-relations.json', 'utf8');
    const lines = data.split('\n');
    
    let currentRelation = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('"type": "CREATE_RELATION"')) {
        currentRelation = {};
      } else if (currentRelation && line.includes('"id": "')) {
        currentRelation.id = line.split('"')[3];
      } else if (currentRelation && line.includes('"type": "') && !line.includes('"type": "CREATE_RELATION"')) {
        currentRelation.type = line.split('"')[3];
      } else if (currentRelation && line.includes('"fromEntity": "')) {
        currentRelation.fromEntity = line.split('"')[3];
      } else if (currentRelation && line.includes('"toEntity": "')) {
        currentRelation.toEntity = line.split('"')[3];
        
        // Complete relation
        if (currentRelation.id && currentRelation.type && currentRelation.fromEntity && currentRelation.toEntity) {
          relations.push(currentRelation);
          
          // Add to entities if they exist
          if (entities[currentRelation.fromEntity]) {
            entities[currentRelation.fromEntity].outgoingRelations.push({
              id: currentRelation.id,
              type: currentRelation.type,
              toEntity: currentRelation.toEntity
            });
          }
          
          if (entities[currentRelation.toEntity]) {
            entities[currentRelation.toEntity].incomingRelations.push({
              id: currentRelation.id,
              type: currentRelation.type,
              fromEntity: currentRelation.fromEntity
            });
          }
          
          currentRelation = null;
        }
      } else if (line.includes('"attribute": "') && line.includes('"entity": "')) {
        // This is a property
        const attributeMatch = line.match(/"attribute": "([^"]+)"/);
        const entityMatch = line.match(/"entity": "([^"]+)"/);
        
        if (attributeMatch && entityMatch) {
          const attributeId = attributeMatch[1];
          const entityId = entityMatch[1];
          
          // Get the value from the next few lines
          let valueMatch = null;
          for (let j = i + 1; j < i + 5 && j < lines.length; j++) {
            const valueLine = lines[j].trim();
            if (valueLine.includes('"value": "')) {
              valueMatch = valueLine.match(/"value": "([^"]+)"/);
              break;
            }
          }
          
          if (valueMatch && entities[entityId]) {
            entities[entityId].properties.push({
              attributeId,
              value: valueMatch[1]
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading data/permit-relations.json:', error);
  }
  
  return { entities, relations };
}

// Function to generate a comprehensive CSV report
function generateCSVReport(entities, relations) {
  // Create entities CSV
  let entitiesCsv = 'Entity ID,Entity Name,Entity Type,URL,Properties,Incoming Relations,Outgoing Relations\n';
  
  for (const id in entities) {
    const entity = entities[id];
    
    // Format properties
    const propertiesStr = entity.properties.map(p => `${p.attributeId}:${p.value}`).join('; ');
    
    // Format incoming relations
    const incomingRelationsStr = entity.incomingRelations.map(r => {
      const fromEntityName = entities[r.fromEntity] ? entities[r.fromEntity].name : r.fromEntity;
      return `${fromEntityName} (${r.type})`;
    }).join('; ');
    
    // Format outgoing relations
    const outgoingRelationsStr = entity.outgoingRelations.map(r => {
      const toEntityName = entities[r.toEntity] ? entities[r.toEntity].name : r.toEntity;
      return `${toEntityName} (${r.type})`;
    }).join('; ');
    
    entitiesCsv += `"${entity.id}","${entity.name}","${entity.type}","${entity.url}","${propertiesStr}","${incomingRelationsStr}","${outgoingRelationsStr}"\n`;
  }
  
  // Create relations CSV
  let relationsCsv = 'Relation ID,Relation Type,From Entity ID,From Entity Name,To Entity ID,To Entity Name\n';
  
  for (const relation of relations) {
    const fromEntityName = entities[relation.fromEntity] ? entities[relation.fromEntity].name : relation.fromEntity;
    const toEntityName = entities[relation.toEntity] ? entities[relation.toEntity].name : relation.toEntity;
    
    relationsCsv += `"${relation.id}","${relation.type}","${relation.fromEntity}","${fromEntityName}","${relation.toEntity}","${toEntityName}"\n`;
  }
  
  return { entitiesCsv, relationsCsv };
}

// Main function
function main() {
  try {
    console.log('Reading entity data...');
    const { entities, relations } = readEntityData();
    
    console.log(`Found ${Object.keys(entities).length} entities and ${relations.length} relations.`);
    
    console.log('Generating CSV reports...');
    const { entitiesCsv, relationsCsv } = generateCSVReport(entities, relations);
    
    // Save to project directory
    try {
      fs.writeFileSync('entities-report.csv', entitiesCsv);
      console.log('Saved entities-report.csv to project directory');
      fs.writeFileSync('relations-report.csv', relationsCsv);
      console.log('Saved relations-report.csv to project directory');
    } catch (error) {
      console.error('Error saving to project directory:', error);
    }
    
    // Save to desktop
    try {
      const desktopPath = path.join(os.homedir(), 'Desktop');
      console.log('Desktop path:', desktopPath);
      fs.writeFileSync(path.join(desktopPath, 'grc20-entities-report.csv'), entitiesCsv);
      console.log(`Saved grc20-entities-report.csv to ${desktopPath}`);
      fs.writeFileSync(path.join(desktopPath, 'grc20-relations-report.csv'), relationsCsv);
      console.log(`Saved grc20-relations-report.csv to ${desktopPath}`);
    } catch (error) {
      console.error('Error saving to desktop:', error);
    }
    
    console.log('CSV reports generated successfully!');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main();
