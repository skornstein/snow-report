
import { getStrattonData } from '../src/lib/stratton';

async function verifyStratton() {
    console.log('Fetching Stratton Data...');
    try {
        const data = await getStrattonData();
        console.log('--- Mountain ---');
        console.log(data.mountain);
        console.log('--- Snow Report ---');
        console.log(data.snowReport);
        console.log('--- Lifts & Terrain ---');
        console.log(`Open Trails: ${data.liftsTerrain.trailsOpen} / ${data.liftsTerrain.trailsTotal}`);
        console.log(`Open Lifts: ${data.liftsTerrain.liftsOpen} / ${data.liftsTerrain.liftsTotal}`);
        console.log(`Sample Trail:`, data.liftsTerrain.trails[0]);
        console.log(`Sample Lift:`, data.liftsTerrain.lifts[0]);

        if (data.liftsTerrain.trails.length > 0 && data.snowReport.snow24hIn >= 0) {
            console.log('VERIFICATION PASSED');
        } else {
            console.log('VERIFICATION FAILED: Missing data');
        }
    } catch (e) {
        console.error('Verification Error:', e);
    }
}

verifyStratton();
