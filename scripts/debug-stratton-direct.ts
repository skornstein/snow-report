
import { exec } from 'child_process';
import { promisify } from 'util';
import * as cheerio from 'cheerio';

const execAsync = promisify(exec);
const targetUrl = 'https://www.stratton.com/the-mountain/mountain-report';

async function run() {
    try {
        console.log(`Attempting to fetch ${targetUrl}...`);
        // Mimic a real browser to bypass basic WAF
        const cmd = `curl -s -L "${targetUrl}" \
        -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
        -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8" \
        -H "Accept-Language: en-US,en;q=0.9" \
        -H "Cache-Control: no-cache" \
        --max-time 10`;

        const { stdout } = await execAsync(cmd);
        console.log(`Response length: ${stdout.length}`);

        if (stdout.length < 500) {
            console.log('Response suspicious (too short):');
            console.log(stdout);
            return;
        }

        const $ = cheerio.load(stdout);

        // Stratton.com usually puts stats in specific blocks.
        // Search for "Season Total" or "Snowfall"
        const pageText = $('body').text();
        const seasonTotalRegex = /Season Total\s*(\d+)["']|(\d+)["']\s*Season Total/i;
        const match = pageText.match(seasonTotalRegex);

        if (match) {
            console.log(`Found Season Total via Regex: ${match[0]}`);
        } else {
            console.log('Regex did not find "Season Total". Dump of likely stats blocks:');
            // Try to find elements with "Season" or "Snow" class or text
            $('*').each((i, el) => {
                const t = $(el).text().trim().replace(/\s+/g, ' ');
                if (t.includes('Season Total') && t.length < 50) {
                    console.log(`Found concise element: "${t}"`);
                }
            });
        }

    } catch (error: any) {
        console.error('Fetch Error:', error.message);
    }
}

run();
