import fs from 'fs';
import dotenv from 'dotenv';
import * as os from 'os';
import * as path from 'path';

dotenv.config();

// Function to generate the CSV file
async function generatePermitEntitiesCsv() {
  try {
    // Read the current-entity-ids.json file
    const entityIdsPath = 'data/current-entity-ids.json';
    if (!fs.existsSync(entityIdsPath)) {
      throw new Error(`${entityIdsPath} does not exist. Please run the publish-and-capture.js script first.`);
    }
    
    const entityIds = JSON.parse(fs.readFileSync(entityIdsPath, 'utf-8'));
    
    // Read the permits.csv file to get the permit data
    const permitsData = fs.readFileSync('data/permits.csv', 'utf-8');
    const permits = permitsData.split('\n').slice(1).filter(line => line.trim() !== '');
    
    // Get the space ID from the .env file
    const spaceId = process.env.PERMITS_SPACE_ID || 'XPZ8fnf3DvNMRDbFgxEZi2'; // Default space ID if not found
    
    // Create an array to store the permit data
    const permitData = [];
    
    // Process each permit
    for (let i = 0; i < Math.min(permits.length, entityIds.permitEntities.length); i++) {
      const permitLine = permits[i];
      const entityId = entityIds.permitEntities[i];
      
      // Parse the CSV line
      const columns = permitLine.split(',');
      const address = columns[0].replace(/"/g, '');
      const recordNumber = columns[1].replace(/"/g, '');
      const recordType = columns[2].replace(/"/g, '');
      const status = columns[3].replace(/"/g, '');
      const projectName = columns[4] ? columns[4].replace(/"/g, '') : '';
      
      // Generate the URL for the entity
      const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entityId}`;
      
      // Add the permit data to the array
      permitData.push({
        address,
        recordNumber,
        recordType,
        status,
        projectName,
        entityId,
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
      const homedir = os.homedir();
      const desktopPath = path.join(homedir, 'Desktop');
      
      fs.copyFileSync('current-permit-entities.csv', path.join(desktopPath, 'current-permit-entities.csv'));
      fs.copyFileSync('current-permit-entities-simple.csv', path.join(desktopPath, 'current-permit-entities-simple.csv'));
      
      console.log(`Copied CSV files to desktop: ${desktopPath}`);
    } catch (error) {
      console.error('Error copying CSV files to desktop:', error);
    }
    
    return permitData.length;
  } catch (error) {
    console.error('Error generating permit entities CSV:', error);
    throw error;
  }
}

// Execute the function
generatePermitEntitiesCsv()
  .then(count => {
    console.log(`Successfully generated CSV files with ${count} permits`);
  })
  .catch(error => {
    console.error('Failed to generate CSV files:', error);
    process.exit(1);
  });
