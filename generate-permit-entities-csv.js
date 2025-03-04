// This script generates a CSV file with permit information, entity IDs, and URLs
import fs from 'fs';
import dotenv from 'dotenv';
import * as os from 'os';
import * as path from 'path';

dotenv.config();

// Function to generate the CSV file
async function generatePermitEntitiesCsv() {
  try {
    // Read the permits-triples.json file
    const permitsTriples = JSON.parse(fs.readFileSync('data/permits-triples.json', 'utf-8'));
    
    // Get the space ID from the .env file
    const spaceId = process.env.PERMITS_SPACE_ID || 'XPZ8fnf3DvNMRDbFgxEZi2'; // Default space ID if not found
    
    // Create an array to store the permit data
    const permitData = [];
    
    // Process each permit entity
    for (const permit of permitsTriples) {
      const entityId = permit.entityId;
      
      // Find the address, record number, record type, and status triples
      const addressTriple = permit.triples.find(t => t.attribute === 'DfjyQFDy6k4dW9XaSgYttn');
      const recordNumberTriple = permit.triples.find(t => t.attribute === 'LuBWqZAu6pz54eiJS5mLv8');
      const recordTypeTriple = permit.triples.find(t => t.attribute === 'SyaPQfHTf3uxTAqwhuMHHa');
      const statusTriple = permit.triples.find(t => t.attribute === '3UP1qvruj8SipH9scUz1EY');
      const projectNameTriple = permit.triples.find(t => t.attribute === '5yDjGNQEErVNpVZ3c61Uib');
      
      // Extract the values
      const address = addressTriple ? addressTriple.value.value : '';
      const recordNumber = recordNumberTriple ? recordNumberTriple.value.value : '';
      const recordType = recordTypeTriple ? recordTypeTriple.value.value : '';
      const status = statusTriple ? statusTriple.value.value : '';
      const projectName = projectNameTriple ? projectNameTriple.value.value : '';
      
      // Convert record type and status to sentence case
      const sentenceCaseRecordType = toSentenceCase(recordType);
      const sentenceCaseStatus = toSentenceCase(status);
      
      // Generate the URL for the entity
      // Using the correct URL format provided by the user
      const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entityId}`;
      
      // Add the permit data to the array
      permitData.push({
        address,
        recordNumber,
        recordType: sentenceCaseRecordType,
        status: sentenceCaseStatus,
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
    fs.writeFileSync('permit-entities.csv', csvContent);
    
    console.log(`Generated permit-entities.csv with ${permitData.length} permits`);
    
    // Also create a simplified version with just address, entity ID, and URL
    const simpleCsvHeader = 'Address,Entity ID,URL';
    const simpleCsvRows = permitData.map(permit => 
      `"${permit.address}","${permit.entityId}","${permit.url}"`
    );
    
    const simpleCsvContent = [simpleCsvHeader, ...simpleCsvRows].join('\n');
    
    // Write the simplified CSV file
    fs.writeFileSync('permit-entities-simple.csv', simpleCsvContent);
    
    console.log(`Generated permit-entities-simple.csv with ${permitData.length} permits`);
    
    // Copy the CSV files to the desktop
    try {
      const homedir = os.homedir();
      const desktopPath = path.join(homedir, 'Desktop');
      
      fs.copyFileSync('permit-entities.csv', path.join(desktopPath, 'permit-entities.csv'));
      fs.copyFileSync('permit-entities-simple.csv', path.join(desktopPath, 'permit-entities-simple.csv'));
      
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

/**
 * Converts a string to sentence case (first letter capitalized, rest lowercase)
 * Handles hyphenated words by keeping the hyphen and lowercasing the letter after it
 */
function toSentenceCase(str) {
  if (!str || typeof str !== 'string') return str;
  
  // Split by hyphens to handle hyphenated words
  const parts = str.split('-');
  
  // Process each part
  const processedParts = parts.map((part, index) => {
    // For the first part or if it's a single character, capitalize first letter
    if (index === 0 || part.length === 1) {
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }
    // For subsequent parts in a hyphenated word, lowercase everything
    return part.toLowerCase();
  });
  
  // Join back with hyphens
  return processedParts.join('-');
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
