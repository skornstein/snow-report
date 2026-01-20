
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
                // Determine Raw Trails
                let rawTrails: any[] = [];
                const terrain = fullResort.terrain || {};
                const runs = fullResort.runs || {};

                if (Array.isArray(terrain.runs)) {
                    rawTrails = terrain.runs;
                } else if (Array.isArray(fullResort.runs)) {
                    rawTrails = fullResort.runs;
                } else if (runs.details && Array.isArray(runs.details)) {
                    rawTrails = runs.details;
                } else {
                    rawTrails = Object.values(runs);
                }

                console.log(`Raw Count: ${rawTrails.length}`);

                // My current filter
                const filtered = rawTrails.filter((t: any) => {
                    if (!t || !t.name) return false;
                    const n = t.name;
                    return !n.includes(',') && !n.includes('&') && !n.includes('Uphill');
                });

                console.log(`Current Filter Count: ${filtered.length}`);

                // Dump all names to find the extra ones
                console.log('--- Filtered Trail Names ---');
                filtered.forEach(t => console.log(t.name));
            }
        }
    } catch (e: any) {
        console.error(e);
    }
}

run();
