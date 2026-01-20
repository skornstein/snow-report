
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const apiUrl = 'https://mtnpowder.com/feed/v3.json?bearer_token=hPtaTVkbuyZQnrxvru4ApfpXnS21PJO3eTKdibDoLZE&resortId%5B%5D=1';

async function run() {
    try {
        console.log(`Fetching ${apiUrl}...`);
        const { stdout } = await execAsync(`curl -s -L "${apiUrl}" -H "User-Agent: Mozilla/5.0"`);
        const data = JSON.parse(stdout);

        console.log('--- Searching for 88 ---');
        findValue(data, '88');
        findValue(data, 88);

        console.log('--- Searching for "Season" ---');
        findKey(data, 'season');

    } catch (e: any) {
        console.error(e);
    }
}

function findValue(obj: any, target: any, path: string = '') {
    if (obj === target) {
        console.log(`Found value at: ${path}`);
    }
    if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
            findValue(obj[key], target, `${path}.${key}`);
        }
    }
}

function findKey(obj: any, targetSnippet: string, path: string = '') {
    if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
            if (key.toLowerCase().includes(targetSnippet)) {
                console.log(`Found key "${key}" at: ${path}.${key} -> ${JSON.stringify(obj[key]).substring(0, 50)}...`);
            }
            findKey(obj[key], targetSnippet, `${path}.${key}`);
        }
    }
}

run();
