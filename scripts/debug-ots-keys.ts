
import { exec } from 'child_process';
import { promisify } from 'util';
import * as cheerio from 'cheerio';

const execAsync = promisify(exec);
const otsUrl = 'https://www.onthesnow.com/vermont/stratton-mountain/skireport';

async function run() {
    try {
        console.log(`Fetching ${otsUrl}...`);
        const { stdout } = await execAsync(`curl -s -L "${otsUrl}" -H "User-Agent: Mozilla/5.0"`);
        const $ = cheerio.load(stdout);
        const nextDataScript = $('#__NEXT_DATA__').html();

        if (nextDataScript) {
            const json = JSON.parse(nextDataScript);
            const fullResort = json.props?.pageProps?.fullResort;

            if (fullResort) {
                console.log('--- fullResort.snow Keys & Values ---');
                console.log(JSON.stringify(fullResort.snow, null, 2));

                console.log('\n--- fullResort.depths Keys & Values ---');
                console.log(JSON.stringify(fullResort.depths, null, 2));

                // Check for other candidates
                console.log('\n--- Searching entire JSON object for "88" or "84" or "80" ---');
                const jsonStr = JSON.stringify(fullResort);
                // Look for fields with value 80-90
                const regex = /"([a-zA-Z0-9_]+)":\s*(8[0-9])/g;
                let match;
                while ((match = regex.exec(jsonStr)) !== null) {
                    console.log(`Found candidate: "${match[1]}": ${match[2]}`);
                }
            }
        }
    } catch (e: any) {
        console.error(e);
    }
}

run();
