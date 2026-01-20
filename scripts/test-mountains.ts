import { getVailResortData } from '../src/lib/vail-resorts';
import * as fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

async function testOkemo() {
    console.log('\n--- Testing OKEMO ---');
    try {
        const data = await getVailResortData('okemo');
        console.log('Success! Okemo Data Snippet:');
        console.log(JSON.stringify(data.snowReport, null, 2));
        console.log(`Lifts Open: ${data.liftsTerrain.liftsOpen}/${data.liftsTerrain.liftsTotal}`);
    } catch (e) {
        console.error('Okemo Test Failed (Data issue):', e);
    }

    // Dump Okemo HTMl to debug
    try {
        const { stdout } = await execAsync(`curl -s -L -A "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1" "https://www.okemo.com"`);
        fs.writeFileSync('okemo-dump.html', stdout);
        console.log('Saved okemo-dump.html');
    } catch (e) { console.error(e); }
}

async function fetchStratton() {
    console.log('\n--- Fetching STRATTON ---');
    const url = 'https://www.stratton.com/the-mountain/mountain-report';
    // Use the same curl trick as Vail for now
    try {
        const { stdout } = await execAsync(`curl -s -L -A "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1" "${url}"`);
        console.log(`Fetched Stratton: ${stdout.length} bytes`);
        fs.writeFileSync('stratton-dump.html', stdout);
        console.log('Saved to stratton-dump.html');

        // Quick check for keywords
        if (stdout.includes('snow')) console.log('Contains "snow"');
        if (stdout.includes('lifts')) console.log('Contains "lifts"');
    } catch (e) {
        console.error('Stratton Fetch Failed:', e);
    }
}

async function run() {
    await testOkemo();
    await fetchStratton();
}

run();
