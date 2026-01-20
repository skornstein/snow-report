
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function debugStratton() {
    const url = 'https://www.stratton.com/the-mountain/mountain-report';
    console.log(`Fetching ${url}...`);
    try {
        const { stdout } = await execAsync(`curl -s -L "${url}" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"`);
        console.log('--- Length ---');
        console.log(stdout.length);
        console.log('--- Title ---');
        const title = stdout.match(/<title>(.*?)<\/title>/i);
        console.log(title ? title[1] : 'No title');

        // Check for common Alterra patterns or JSON blobs
        console.log('--- JSON Search ---');
        const scriptTags = stdout.match(/<script[\s\S]*?>[\s\S]*?<\/script>/gi) || [];
        console.log(`Found ${scriptTags.length} script tags`);

        // Dump first few lines
        console.log('--- Head ---');
        console.log(stdout.substring(0, 500));

    } catch (e) {
        console.error('Error:', e);
    }
}

debugStratton();
