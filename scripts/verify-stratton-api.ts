
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
// Discovered via browser subagent
const targetUrl = 'https://mtnpowder.com/feed/v3.json?bearer_token=hPtaTVkbuyZQnrxvru4ApfpXnS21PJO3eTKdibDoLZE&resortId%5B%5D=1';

async function run() {
    try {
        console.log(`Fetching ${targetUrl}...`);
        const { stdout } = await execAsync(`curl -s -L "${targetUrl}" -H "User-Agent: Mozilla/5.0"`);
        console.log('--- API Response ---');
        console.log(stdout.substring(0, 500)); // Print first 500 chars

        try {
            const data = JSON.parse(stdout);
            console.log('\n--- Parsed Data (Resort 0) ---');
            const resort = data.Resorts[0];
            console.log('Resort Keys:', Object.keys(resort));
            if (resort.Snowfall) console.log('Snowfall Keys:', Object.keys(resort.Snowfall));
            else if (resort.SnowReport) console.log('SnowReport Keys:', Object.keys(resort.SnowReport));

            // Dump the whole thing to be safe
            console.log(JSON.stringify(resort, null, 2));
        } catch (e) {
            console.log('Failed to parse JSON');
        }

    } catch (error: any) {
        console.error('Fetch Error:', error.message);
    }
}

run();
