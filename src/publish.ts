import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import transformPermits from './transformPermits';
import transformDeeds from './transformDeeds';

dotenv.config();

interface PublishResult {
  hash: string;
  status: string;
  spaceId?: string;
}

async function publishToSpace(): Promise<PublishResult[]> {
  // Validate environment configuration
  if (!process.env.SPACE_ID) {
    throw new Error('SPACE_ID must be set in .env file');
  }

  const spaceId = process.env.SPACE_ID;

  try {
    // Transform and publish permits
    const permitHashes = await transformPermits('./data/permits.csv');
    console.log('Permits processed:', permitHashes);

    // Transform and publish deed transfers
    const deedHashes = await transformDeeds('./data/deeds.csv');
    console.log('Deed transfers processed:', deedHashes);

    // Combine all hashes for potential batch publishing
    const allHashes = [...permitHashes, ...deedHashes];

    // Simulate space publishing
    const publishResults: PublishResult[] = allHashes.map(hash => {
      console.log(`Publishing hash ${hash} to space ${spaceId}`);
      
      return {
        hash,
        status: 'published',
        spaceId
      };
    });
    
    console.log('Publication Summary:');
    publishResults.forEach(result => {
      console.log(`- Hash: ${result.hash}, Status: ${result.status}`);
    });

    return publishResults;

  } catch (error) {
    console.error('Error during publication process:', error);
    throw error;
  }
}

// Execute publication if script is run directly
if (require.main === module) {
  publishToSpace()
    .then(() => console.log('Publication completed successfully'))
    .catch(error => {
      console.error('Publication failed:', error);
      process.exit(1);
    });
}

export default publishToSpace;
