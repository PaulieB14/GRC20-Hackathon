import { publish } from "./publish.js";
import 'dotenv/config';
// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
    (async () => {
        try {
            console.log('Starting main script...');
            console.log('Environment:', {
                WALLET_ADDRESS: process.env.WALLET_ADDRESS ? 'Set' : 'Not set',
                SPACE_ID: process.env.SPACE_ID ? 'Set' : 'Not set',
                RPC_URL: process.env.RPC_URL ? 'Set' : 'Not set'
            });
            if (!process.env.WALLET_ADDRESS) {
                throw new Error('WALLET_ADDRESS not set in environment');
            }
            if (!process.env.SPACE_ID) {
                throw new Error('SPACE_ID not set in environment');
            }
            console.log('\nStarting publish...');
            const txHash = await publish({
                spaceId: process.env.SPACE_ID,
                editName: 'Add Building Permits',
                author: process.env.WALLET_ADDRESS
            });
            console.log('\n✅ Transaction complete:', { txHash });
            process.exit(0);
        }
        catch (error) {
            console.error('\n❌ Main script failed:', error);
            if (error instanceof Error) {
                console.error('Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
            }
            process.exit(1);
        }
    })().catch(error => {
        console.error('\n❌ Unhandled error:', error);
        process.exit(1);
    });
}
