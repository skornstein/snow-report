
import { exec } from 'child_process';
import { promisify } from 'util';
import * as cheerio from 'cheerio';

const execAsync = promisify(exec);
// SnoCountry URL for Stratton
const targetUrl = 'https://snocountry.com/snow-report/vermont/stratton-mountain-resort/';

async function run() {
    try {
        console.log(`Fetching ${targetUrl}...`);
        const cmd = `curl -s -L "${targetUrl}" -H "User-Agent: Mozilla/5.0" --max-time 10`;
        const { stdout } = await execAsync(cmd);

        const $ = cheerio.load(stdout);

        // Find element containing "Season Total"
        console.log('--- Inspecting "Season Total" Context ---');
        $('*').each((i, el) => {
            // Check direct text node of this element only
            const directText = $(el).clone().children().remove().end().text().trim();
            if (directText.toLowerCase().includes('season total')) {
                console.log(`\n[Match ${i}] Tag: <${(el as any).tagName}> Class: "${$(el).attr('class')}"`);
                console.log(`Direct Text: "${directText}"`);

                // Log the confusing structure
                console.log('HTML Snippet:');
                console.log($.html(el).substring(0, 300));

                // Log Parent HTML
                console.log('Parent HTML Snippet (Extended):');
                console.log($.html($(el).parent()).substring(0, 1000));

                const next = $(el).next();
                console.log(`Explicit Next Sibling ID: "${next.attr('id')}"`);
                console.log(`Explicit Next Sibling Text: "${next.text().trim()}"`);
            }
        });

    } catch (error: any) {
        console.error('Fetch Error:', error.message);
    }
}

run();
