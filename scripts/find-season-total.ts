
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

        // Look for any element containing "Season Total"
        console.log('Searching for "Season Total"...');
        const elements = $('*:contains("Season Total")');

        if (elements.length > 0) {
            elements.each((i, el) => {
                // Get immediate text only, not children
                const text = $(el).text().trim();
                const cleanText = text.replace(/\s+/g, ' ');
                console.log(`[Match ${i}] Tag: ${(el as any).tagName}, Text Snippet: ${cleanText.substring(0, 100)}...`);

                // Check siblings/parent for numbers
                const parent = $(el).parent();
                console.log(`  Parent Text: ${parent.text().trim().replace(/\s+/g, ' ').substring(0, 100)}...`);
                console.log(`  Next Sibling Text: ${$(el).next().text().trim()}`);
                console.log(`  Prev Sibling Text: ${$(el).prev().text().trim()}`);
            });
        } else {
            console.log('No elements found checking strict "contains". Trying case-insensitive regex on body.');
            const body = $('body').text();
            const regex = /Season Total.*?(\d+)/i;
            const match = body.match(regex);
            if (match) {
                console.log('Regex match in body text:', match[0]);
            } else {
                console.log('No regex match in body text.');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
