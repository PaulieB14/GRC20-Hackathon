import { account } from "./wallet.js";
import { execSync } from 'child_process';
import 'dotenv/config';
async function deploySpace() {
    try {
        console.log('Deploying space...');
        console.log('Using account:', account.address);
        // Get calldata using curl
        console.log('\n[API] Getting calldata...');
        const calldataCmd = `curl -s -X POST -H "Content-Type: application/json" -H "Accept: application/json" -d '{"network":"TESTNET"}' "https://api-testnet.grc-20.thegraph.com/space/create/calldata"`;
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
        }
        catch (txError) {
            console.error('\n❌ [Transaction] Failed:', txError);
            throw txError;
        }
    }
    catch (error) {
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
    deploySpace().catch(error => {
        console.error('\n❌ [Error]:', error);
        process.exit(1);
    });
}
