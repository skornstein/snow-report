
import { exec } from 'child_process';
import { promisify } from 'util';
import * as cheerio from 'cheerio';

const execAsync = promisify(exec);
// Snowpak URL for Stratton
const targetUrl = 'https://www.snowpak.com/vermont/stratton-mountain/snow-report';

async function run() {
    try {
        console.log(`Fetching ${targetUrl}...`);
        const cmd = `curl -s -L "${targetUrl}" -H "User-Agent: Mozilla/5.0" --max-time 10`;
        const { stdout } = await execAsync(cmd);

        const $ = cheerio.load(stdout);

        console.log('--- Searching for "Season" ---');
        $('*').each((i, el) => {
            const text = $(el).clone().children().remove().end().text().trim();
            if (text.toLowerCase().includes('season') && text.length < 50) {
                console.log(`\n[Match ${i}] Tag: <${(el as any).tagName}> Text: "${text}"`);
                const parent = $(el).parent().text().trim().replace(/\s+/g, ' ');
                console.log(`  Parent context: ${parent.substring(0, 100)}`);

                // Look for numbers nearby
                const nextText = $(el).next().text().trim();
                console.log(`  Next Sibling Text: "${nextText}"`);
            }
        });

    } catch (error: any) {
        console.error('Fetch Error:', error.message);
    }
}

run();
