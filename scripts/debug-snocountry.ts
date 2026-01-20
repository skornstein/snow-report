
import { exec } from 'child_process';
import { promisify } from 'util';
import * as cheerio from 'cheerio';

const execAsync = promisify(exec);
// SnoCountry URL for Stratton
const targetUrl = 'https://snocountry.com/snow-report/vermont/stratton-mountain-resort/';

async function run() {
    try {
        console.log(`Attempting to fetch ${targetUrl}...`);
        const cmd = `curl -s -L "${targetUrl}" -H "User-Agent: Mozilla/5.0" --max-time 10`;
        const { stdout } = await execAsync(cmd);

        console.log(`Response length: ${stdout.length}`);

        if (stdout.length < 1000) {
            console.log('Response too short/suspicious:');
            console.log(stdout.substring(0, 500));
        }

        const $ = cheerio.load(stdout);

        // SnoCountry usually lists "Season Total" in a stats grid
        // Let's dump all text that looks like a stat
        $('*').each((i, el) => {
            const text = $(el).text().trim().replace(/\s+/g, ' ');
            if (text.toLowerCase().includes('season total') || text.toLowerCase().includes('seasonal snowfall')) {
                console.log(`Found candidate (text): "${text}"`);
                // Try to find the number in siblings or children
                const parent = $(el).parent().text().trim().replace(/\s+/g, ' ');
                console.log(`  Parent context: ${parent.substring(0, 100)}`);
            }
        });

    } catch (error: any) {
        console.error('Fetch Error:', error.message);
    }
}

run();
