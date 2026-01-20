
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function debugStrattonStrategies() {
    const urls = [
        { name: 'Report - Googlebot', url: 'https://www.stratton.com/the-mountain/mountain-report', ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
        { name: 'Report - Bingbot', url: 'https://www.stratton.com/the-mountain/mountain-report', ua: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' },
        { name: 'API Status', url: 'https://www.stratton.com/api/v1/dor/status', ua: '' }, // Try no UA for API
        { name: 'Feed', url: 'https://www.stratton.com/feed/lift-status', ua: '' },
        { name: 'OnTheSnow', url: 'https://www.onthesnow.com/vermont/stratton-mountain/skireport', ua: 'Mozilla/5.0' }
    ];

    for (const strategy of urls) {
        console.log(`\n--- Testing ${strategy.name} ---`);
        try {
            const cmd = `curl -s -L "${strategy.url}" ${strategy.ua ? `-H "User-Agent: ${strategy.ua}"` : ''}`;
            const { stdout } = await execAsync(cmd);

            if (stdout.includes('_Incapsula_Resource')) {
                console.log('Result: BLOCKED');
            } else if (stdout.length < 500) {
                console.log('Result: Short response (likely blocked or empty)');
                console.log(stdout);
            } else {
                console.log('Result: SUCCESS (Potentially)');
                console.log(`Length: ${stdout.length}`);
                console.log(`Title: ${stdout.match(/<title>(.*?)<\/title>/i)?.[1]}`);
            }
        } catch (e: any) {
            console.log(`Result: ERROR - ${e.message}`);
        }
    }
}

debugStrattonStrategies();
