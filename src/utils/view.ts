import { Graph } from '@graphprotocol/grc-20';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import dotenv from 'dotenv';

dotenv.config();

const PERMITS_SPACE_ID = 'XPZ8fnf3DvNMRDbFgxEZi2';
const DEEDS_SPACE_ID = 'P77ioa8U9EipVASzVHBA9B';

async function view() {
  try {
    // Open the spaces in the browser
    console.log('Opening spaces in browser...');
    
    const permitsUrl = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${PERMITS_SPACE_ID}`;
    const deedsUrl = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${DEEDS_SPACE_ID}`;

    console.log('\nPermits Space:');
    console.log(permitsUrl);
    
    console.log('\nDeeds Space:');
    console.log(deedsUrl);

    // Open in browser
    const command = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    const { exec } = await import('child_process');
    exec(`${command} ${permitsUrl}`);
    exec(`${command} ${deedsUrl}`);

  } catch (error) {
    console.error('Failed to view spaces:', error);
    throw error;
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  view()
    .then(() => {
      console.log('\nSpaces opened in browser');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to view spaces:', error);
      process.exit(1);
    });
}
