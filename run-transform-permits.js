import { transformPermits } from './dist-test/core/transformPermits.js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  try {
    console.log('Running transformPermits...');
    const ops = await transformPermits();
    
    console.log('Transformation complete!');
    
    // Check if the entity IDs were saved
    if (fs.existsSync('data/current-entity-ids.json')) {
      const entityData = JSON.parse(fs.readFileSync('data/current-entity-ids.json', 'utf-8'));
      console.log('Entity IDs saved successfully:');
      console.log(`- Permit entities: ${entityData.permitEntities?.length || 0}`);
      console.log(`- Record type entities: ${entityData.recordTypeEntities?.length || 0}`);
      console.log(`- Status entities: ${entityData.statusEntities?.length || 0}`);
      
      // Create a CSV file with entity IDs and URLs
      const spaceId = process.env.PERMITS_SPACE_ID || 'XPZ8fnf3DvNMRDbFgxEZi2';
      const csvHeader = 'Type,Name,Entity ID,URL';
      const csvRows = [];
      
      // Add permit entities
      for (const entity of entityData.permitEntities || []) {
        const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entity.id}`;
        csvRows.push(`Permit,"${entity.name}",${entity.id},${url}`);
      }
      
      // Add record type entities
      for (const entity of entityData.recordTypeEntities || []) {
        const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entity.id}`;
        csvRows.push(`Record Type,"${entity.name}",${entity.id},${url}`);
      }
      
      // Add status entities
      for (const entity of entityData.statusEntities || []) {
        const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entity.id}`;
        csvRows.push(`Status,"${entity.name}",${entity.id},${url}`);
      }
      
      const csvContent = [csvHeader, ...csvRows].join('\n');
      fs.writeFileSync('current-entity-urls.csv', csvContent);
      console.log(`Generated current-entity-urls.csv with ${csvRows.length} entities`);
      
      // Also create a simplified version with just address, entity ID, and URL for permit entities
      if (entityData.permitEntities?.length > 0) {
        // Read the permits.csv file to get the permit data
        const permitsData = fs.readFileSync('data/permits.csv', 'utf-8');
        const permits = permitsData.split('\n').slice(1).filter(line => line.trim() !== '');
        
        // Create an array to store the permit data
        const permitData = [];
        
        // Process each permit
        for (let i = 0; i < Math.min(permits.length, entityData.permitEntities.length); i++) {
          const permitLine = permits[i];
          const entity = entityData.permitEntities[i];
          
          // Parse the CSV line
          const columns = permitLine.split(',');
          const address = columns[0].replace(/"/g, '');
          const recordNumber = columns[1].replace(/"/g, '');
          const recordType = columns[2].replace(/"/g, '');
          const status = columns[3].replace(/"/g, '');
          const projectName = columns[4] ? columns[4].replace(/"/g, '') : '';
          
          // Generate the URL for the entity
          const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entity.id}`;
          
          // Add the permit data to the array
          permitData.push({
            address,
            recordNumber,
            recordType,
            status,
            projectName,
            entityId: entity.id,
            url
          });
        }
        
        // Sort the permit data by address
        permitData.sort((a, b) => a.address.localeCompare(b.address));
        
        // Create the CSV content
        const csvHeader = 'Address,Record Number,Record Type,Status,Project Name,Entity ID,URL';
        const csvRows = permitData.map(permit => 
          `"${permit.address}","${permit.recordNumber}","${permit.recordType}","${permit.status}","${permit.projectName}","${permit.entityId}","${permit.url}"`
        );
        
        const csvContent = [csvHeader, ...csvRows].join('\n');
        
        // Write the CSV file
        fs.writeFileSync('current-permit-entities.csv', csvContent);
        
        console.log(`Generated current-permit-entities.csv with ${permitData.length} permits`);
        
        // Also create a simplified version with just address, entity ID, and URL
        const simpleCsvHeader = 'Address,Entity ID,URL';
        const simpleCsvRows = permitData.map(permit => 
          `"${permit.address}","${permit.entityId}","${permit.url}"`
        );
        
        const simpleCsvContent = [simpleCsvHeader, ...simpleCsvRows].join('\n');
        
        // Write the simplified CSV file
        fs.writeFileSync('current-permit-entities-simple.csv', simpleCsvContent);
        
        console.log(`Generated current-permit-entities-simple.csv with ${permitData.length} permits`);
        
        // Copy the CSV files to the desktop
        try {
          const homedir = process.env.HOME || process.env.USERPROFILE;
          const desktopPath = `${homedir}/Desktop`;
          
          fs.copyFileSync('current-permit-entities.csv', `${desktopPath}/current-permit-entities.csv`);
          fs.copyFileSync('current-permit-entities-simple.csv', `${desktopPath}/current-permit-entities-simple.csv`);
          
          console.log(`Copied CSV files to desktop: ${desktopPath}`);
        } catch (error) {
          console.error('Error copying CSV files to desktop:', error);
        }
      }
    } else {
      console.log('Entity IDs were not saved to data/current-entity-ids.json');
    }
  } catch (error) {
    console.error('Error running transformPermits:', error);
  }
}

run();
