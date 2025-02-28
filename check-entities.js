#!/usr/bin/env node

import fetch from 'node-fetch';
import 'dotenv/config';

// Space IDs
const DEEDS_SPACE_ID = 'P77ioa8U9EipVASzVHBA9B';
const PERMITS_SPACE_ID = 'XPZ8fnf3DvNMRDbFgxEZi2';

async function checkEntities() {
  try {
    // Check deeds space
    console.log('\n=== Checking Deeds Space ===');
    console.log(`Space ID: ${DEEDS_SPACE_ID}`);
    console.log(`URL: https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${DEEDS_SPACE_ID}`);
    
    const deedsResponse = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${DEEDS_SPACE_ID}/edits`);
    const deedsText = await deedsResponse.text();
    console.log('\nDeeds response text:', deedsText);
    
    let deedsEdits = [];
    try {
      deedsEdits = JSON.parse(deedsText);
      console.log(`\nFound ${deedsEdits.length} edits`);
      if (deedsEdits.length > 0) {
        console.log('Latest edit:', deedsEdits[0]);
      }
    } catch (error) {
      console.error('Error parsing deeds edits:', error.message);
    }
    
    // Check permits space
    console.log('\n=== Checking Permits Space ===');
    console.log(`Space ID: ${PERMITS_SPACE_ID}`);
    console.log(`URL: https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${PERMITS_SPACE_ID}`);
    
    const permitsResponse = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${PERMITS_SPACE_ID}/edits`);
    const permitsText = await permitsResponse.text();
    console.log('\nPermits response text:', permitsText);
    
    let permitsEdits = [];
    try {
      permitsEdits = JSON.parse(permitsText);
      console.log(`\nFound ${permitsEdits.length} edits`);
      if (permitsEdits.length > 0) {
        console.log('Latest edit:', permitsEdits[0]);
      }
    } catch (error) {
      console.error('Error parsing permits edits:', error.message);
    }
    
    // Get entities from the latest edit
    if (permitsEdits.length > 0) {
      const latestEditCid = permitsEdits[0].cid;
      console.log(`\nFetching entities from latest permits edit: ${latestEditCid}`);
      
      try {
        const entitiesResponse = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${PERMITS_SPACE_ID}/entities`);
        const entitiesText = await entitiesResponse.text();
        console.log('\nEntities response text:', entitiesText);
        
        let entities = [];
        try {
          entities = JSON.parse(entitiesText);
          console.log(`\nFound ${entities.length} entities in permits space`);
          if (entities.length > 0) {
            console.log('First 3 entities:');
            entities.slice(0, 3).forEach(entity => {
              console.log(`- Entity ID: ${entity.id}`);
              console.log(`  URL: https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${PERMITS_SPACE_ID}/entity/${entity.id}`);
            });
          }
        } catch (error) {
          console.error('Error parsing entities:', error.message);
        }
      } catch (error) {
        console.error('Error fetching entities:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEntities().catch(console.error);
