
import { getVailResortData } from '../src/lib/vail-resorts';
import { getStrattonData } from '../src/lib/stratton';

async function main() {
    console.log('--- Checking Lift Counts ---');

    try {
        const ms = await getVailResortData('mount-snow');
        console.log(`Mount Snow: Lifts ${ms.liftsTerrain.liftsOpen}/${ms.liftsTerrain.liftsTotal}, Trails ${ms.liftsTerrain.trailsOpen}/${ms.liftsTerrain.trailsTotal}`);
    } catch (e) {
        console.error('Mount Snow Error:', e);
    }

    try {
        const ok = await getVailResortData('okemo');
        console.log(`Okemo: Lifts ${ok.liftsTerrain.liftsOpen}/${ok.liftsTerrain.liftsTotal}, Trails ${ok.liftsTerrain.trailsOpen}/${ok.liftsTerrain.trailsTotal}`);
    } catch (e) {
        console.error('Okemo Error:', e);
    }

    try {
        const st = await getStrattonData();
        console.log(`Stratton: Lifts ${st.liftsTerrain.liftsOpen}/${st.liftsTerrain.liftsTotal}, Trails ${st.liftsTerrain.trailsOpen}/${st.liftsTerrain.trailsTotal}`);
    } catch (e) {
        console.error('Stratton Error:', e);
    }
}

main();
