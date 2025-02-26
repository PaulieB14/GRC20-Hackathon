import { account } from "./wallet.js";
import { execSync } from 'child_process';
import 'dotenv/config';

async function testPublish() {
  try {
    console.log('Testing publish...');
    console.log('Using account:', account.address);

    // Create test edit JSON
    console.log('\n[IPFS] Creating edit file...');
    const edit = {
      name: 'Test Edit',
      ops: [],
      author: account.address
    };
    const editJson = JSON.stringify(edit);
    execSync(`echo '${editJson}' > edit.json`);

    // Publish edit to IPFS
    console.log('\n[IPFS] Publishing edit...');
    const ipfsCmd = `curl -s -X POST -F "file=@edit.json" "https://api.thegraph.com/ipfs/api/v0/add?stream-channels=true&progress=false"`;
    const ipfsResponse = execSync(ipfsCmd).toString();
    console.log('\n[IPFS] Response:', ipfsResponse);
    const { Hash } = JSON.parse(ipfsResponse);
    execSync('rm edit.json');

    const cid = `ipfs://${Hash}`;
    console.log('\n✅ [IPFS] Published edit:', { cid });

    // Get calldata using curl
    console.log('\n[API] Getting calldata...');
    const calldataCmd = `curl -s -X POST -H "Content-Type: application/json" -H "Accept: application/json" -d '{"cid":"${cid}","network":"TESTNET"}' "https://api-testnet.grc-20.thegraph.com/space/${process.env.SPACE_ID}/edit/calldata"`;
    console.log('\n[API] Executing command:', calldataCmd);
    const calldataResponse = execSync(calldataCmd).toString();
    console.log('\n[API] Response:', calldataResponse);
    const response = JSON.parse(calldataResponse);

    console.log('\n✅ [API] Got calldata:', {
      to: response.to,
      dataLength: response.data.length,
      timestamp: new Date().toISOString()
    });

    // Submit transaction
    console.log('\n[Transaction] Submitting to network...');
    try {
      const hash = await account.sendTransaction({
        to: response.to,
        value: 0n,
        data: response.data
      });

      console.log('\n✅ [Transaction] Submitted:', { hash });
      return hash;
    } catch (txError) {
      console.error('\n❌ [Transaction] Failed:', txError);
      throw txError;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('\n❌ [Error]:', {
        error: error.message,
        name: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
    throw error;
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  if (!process.env.SPACE_ID) {
    throw new Error('SPACE_ID not set in environment');
  }

  testPublish().catch(error => {
    console.error('\n❌ [Error]:', error);
    process.exit(1);
  });
}
