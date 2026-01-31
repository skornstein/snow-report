
import { getVailResortData } from '../src/lib/vail-resorts';
import { getStrattonData } from '../src/lib/stratton';

async function main() {
    console.log('--- Debugging Lift Data ---');

    try {
        console.log('\nFetching Mount Snow...');
        const mountSnow = await getVailResortData('mount-snow');
        console.log('Mount Snow Lifts:', mountSnow.liftsTerrain);
    } catch (e) {
        console.error('Mount Snow Error:', e);
    }

    try {
        console.log('\nFetching Okemo...');
        const okemo = await getVailResortData('okemo');
        console.log('Okemo Lifts:', okemo.liftsTerrain);
    } catch (e) {
        console.error('Okemo Error:', e);
    }

    try {
        console.log('\nFetching Stratton...');
        const stratton = await getStrattonData();
        console.log('Stratton Lifts:', stratton.liftsTerrain);
    } catch (e) {
        console.error('Stratton Error:', e);
    }
}

main();
