import { transformPermits } from './transformPermits.js';
import { transformDeeds } from './transformDeeds.js';
async function transform() {
    try {
        console.log('Transforming permits...');
        transformPermits();
        console.log('Transforming deeds...');
        transformDeeds();
        console.log('Transformation completed successfully');
    }
    catch (error) {
        console.error('Transformation failed:', error);
        throw error;
    }
}
// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
    transform()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
