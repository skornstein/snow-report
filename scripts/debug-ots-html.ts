
import { exec } from 'child_process';
import { promisify } from 'util';
import * as cheerio from 'cheerio';

const execAsync = promisify(exec);
const otsUrl = 'https://www.onthesnow.com/vermont/stratton-mountain/skireport';

async function run() {
    try {
        console.log(`Fetching ${otsUrl}...`);
        const { stdout } = await execAsync(`curl -s -L "${otsUrl}" -H "User-Agent: Mozilla/5.0"`);

        // Regex search for Season Total
        const seasonTotalRegex = /Season Total.*?(\d+)["']|(\d+)\s*["']?\s*Season Total/i;
        const match = stdout.match(seasonTotalRegex);

        if (match) {
            console.log('Found Season Total via Regex:', match[0]);
        } else {
            console.log('Season Total string not found via simple regex.');
        }

        // Cheerio search
        const $ = cheerio.load(stdout);

        $('div, span, p, strong, b').each((i, el) => {
            const text = $(el).text().trim();
            if (text.toLowerCase().includes('season total')) {
                console.log(`Found element with "Season Total":`, text);
                // Try to find the number nearby
                const parent = $(el).parent().text();
                console.log(`Parent text:`, parent.substring(0, 100));
            }
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
