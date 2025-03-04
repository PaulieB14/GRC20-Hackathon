import { account } from "./wallet.js";
import 'dotenv/config';
async function submitTransaction() {
    try {
        // Get transaction details from command line arguments
        const to = process.argv[2];
        const data = process.argv[3];
        if (!to || !data) {
            console.error('Usage: node submit-transaction.js <to> <data>');
            process.exit(1);
        }
        console.log('Submitting transaction...');
        console.log('Using account:', account.address);
        console.log('To:', to);
        console.log('Data length:', data.length);
        // Submit transaction
        console.log('\n[Transaction] Submitting to network...');
        try {
            console.log('[Transaction] Preparing transaction...');
            const tx = {
                to: to,
                value: 0n,
                data: data
            };
            console.log('[Transaction] Transaction details:', JSON.stringify(tx, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
            console.log('[Transaction] Sending transaction...');
            const hash = await account.sendTransaction(tx);
            console.log('\n✅ [Transaction] Submitted:', { hash });
            // The account.sendTransaction method already waits for confirmation
            // and logs the receipt, so we don't need to do it again here
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
    submitTransaction().catch(error => {
        console.error('\n❌ [Error]:', error);
        process.exit(1);
    });
}
