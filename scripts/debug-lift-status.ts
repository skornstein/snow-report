
import { getVailResortData } from '../src/lib/vail-resorts';
import { getStrattonData } from '../src/lib/stratton';

async function main() {
    console.log('--- Debugging RAW Lift Status ---');

    // 1. Mount Snow (Vail)
    try {
        console.log('\nFetching Mount Snow...');
        const ms = await getVailResortData('mount-snow');
        console.log('Mount Snow Lift Statuses:');
        ms.liftsTerrain.lifts.forEach(l => {
            console.log(`  ${l.name}: "${l.status}"`);
        });
        // Note: The helper returns mapped status. I need the raw one. 
        // The current getVailResortData maps it. 
        // Wait, the function returns parsed data. 
        // If I want raw, I need to log inside the library OR print what I have.
        // If the library maps "Unknown" -> "Closed", I won't see the raw value.
        // Let's see what the current library implementation does.

        // In vail-resorts.ts:
        // status: String(l.Status !== undefined ? l.Status : 'Closed'),
        // It returns the raw status if it's not undefined! 
        // But the count filter logic is:
        // const isLiftOpen = ...

        // So seeing the output here IS valuable.
    } catch (e) {
        console.error('Mount Snow Error:', e);
    }

    // 2. Stratton
    try {
        console.log('\nFetching Stratton...');
        const st = await getStrattonData();
        // stratton.ts maps status: l.status === 2 ? 'Open' : 'Closed'
        // So I WON'T see the raw value here if it's not 2.
        // It will just say "Closed".
        // I need to modify stratton.ts to debug or trust that I can't see it without editing the file.

        console.log('Stratton Lift Statuses (Parsed):');
        st.liftsTerrain.lifts.forEach(l => {
            console.log(`  ${l.name}: "${l.status}"`);
        });
    } catch (e) {
        console.error('Stratton Error:', e);
    }
}

main();
