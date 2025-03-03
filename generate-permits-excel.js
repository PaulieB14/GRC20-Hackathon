// Script to generate a CSV file with permit data including GRC-20 entity IDs and URLs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the permits space ID from the .env file
const PERMITS_SPACE_ID = process.env.PERMITS_SPACE_ID || 'XPZ8fnf3DvNMRDbFgxEZi2';
const GRC20_URL_BASE = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${PERMITS_SPACE_ID}`;

// Read the original permits CSV file
const permitsPath = path.join(__dirname, 'data', 'permits.csv');
const permitsData = fs.readFileSync(permitsPath, 'utf-8');
const permits = parse(permitsData, { columns: true, skip_empty_lines: true });

// Read the permit entity IDs
const entityIdsPath = path.join(__dirname, 'data', 'permit-entity-ids.json');
const entityIdsData = fs.readFileSync(entityIdsPath, 'utf-8');
const entityIds = JSON.parse(entityIdsData);

// Read the permit relations to get the mapping between permits and their record types and statuses
const relationsPath = path.join(__dirname, 'data', 'permit-relations.json');
const relationsData = fs.readFileSync(relationsPath, 'utf-8');
const relations = JSON.parse(relationsData);

// Create a mapping of permit descriptions to entity IDs
const permitDescriptionToEntityId = {};
const permitRecordNumberToEntityId = {};
const entityIdToRecordType = {};
const entityIdToStatus = {};

// Extract permit entity IDs based on description and record number
relations.forEach(op => {
  if (op.type === 'SET_TRIPLE' && op.triple && op.triple.attribute === 'LHH2tQcXogAyzLkFFyfkMK') {
    // This is a description triple
    permitDescriptionToEntityId[op.triple.value.value] = op.triple.entity;
  }
  
  if (op.type === 'SET_TRIPLE' && op.triple && op.triple.attribute === 'HNrpgDeC2GBKTwaBfMGDgy') {
    // This is a record number triple
    permitRecordNumberToEntityId[op.triple.value.value] = op.triple.entity;
  }
});

// Extract record type and status relations
relations.forEach(op => {
  if (op.type === 'CREATE_RELATION' && op.relation && op.relation.type === 'QrqocRvYswo3XBSwDHTVj5') {
    // This is a "Has Record Type" relation
    entityIdToRecordType[op.relation.fromEntity] = op.relation.toEntity;
  }
  
  if (op.type === 'CREATE_RELATION' && op.relation && op.relation.type === '2m2hsyQwq6GfLQp9J7Cvjb') {
    // This is a "Has Status" relation
    entityIdToStatus[op.relation.fromEntity] = op.relation.toEntity;
  }
});

// Create a mapping of record type and status entity IDs to their names
const entityIdToName = {};
relations.forEach(op => {
  if (op.type === 'SET_TRIPLE' && op.triple && op.triple.attribute === 'LuBWqZAu6pz54eiJS5mLv8') {
    // This is a name triple
    entityIdToName[op.triple.entity] = op.triple.value.value;
  }
});

// Generate the CSV header
let csvContent = 'Date,Record Type,Record Number,Status,Address,Description,Entity ID,Entity URL,Record Type Entity ID,Record Type URL,Status Entity ID,Status URL\n';

// Generate the CSV rows
permits.forEach(permit => {
  const recordNumber = permit['Record Number'];
  const description = permit['Description'];
  const status = permit['Status'];
  const address = permit['Address'];
  const recordType = permit['Record Type'];
  
  // Find the entity ID for this permit
  let entityId = permitRecordNumberToEntityId[recordNumber] || '';
  if (!entityId && description) {
    entityId = permitDescriptionToEntityId[description] || '';
  }
  
  // Find the record type and status entity IDs
  const recordTypeEntityId = entityId ? entityIdToRecordType[entityId] || '' : '';
  const statusEntityId = entityId ? entityIdToStatus[entityId] || '' : '';
  
  // Get the record type and status names from their entity IDs
  const recordTypeName = recordTypeEntityId ? entityIdToName[recordTypeEntityId] || recordType : recordType;
  const statusName = statusEntityId ? entityIdToName[statusEntityId] || status : status;
  
  // Generate the URLs
  const entityUrl = entityId ? `${GRC20_URL_BASE}/${entityId}` : '';
  const recordTypeUrl = recordTypeEntityId ? `${GRC20_URL_BASE}/${recordTypeEntityId}` : '';
  const statusUrl = statusEntityId ? `${GRC20_URL_BASE}/${statusEntityId}` : '';
  
  // Add the row to the CSV
  csvContent += `${permit['Date'] || ''},${recordTypeName || ''},${recordNumber || ''},${statusName || ''},${address || ''},${description || ''},${entityId || ''},${entityUrl || ''},${recordTypeEntityId || ''},${recordTypeUrl || ''},${statusEntityId || ''},${statusUrl || ''}\n`;
});

// Write the CSV file
const outputPath = path.join(__dirname, 'data', 'permits-with-entities.csv');
fs.writeFileSync(outputPath, csvContent);

console.log(`CSV file with permit data and entity IDs generated at: ${outputPath}`);
console.log('You can now import this file into Excel.');
