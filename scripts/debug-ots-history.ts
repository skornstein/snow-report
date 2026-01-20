
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const otsUrl = 'https://www.onthesnow.com/vermont/stratton-mountain/skireport';

async function run() {
    try {
        console.log(`Fetching ${otsUrl}...`);
        const { stdout } = await execAsync(`curl -s -L "${otsUrl}" -H "User-Agent: Mozilla/5.0"`);
        const nextData = stdout.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);

        if (nextData && nextData[1]) {
            const json = JSON.parse(nextData[1]);
            const fr = json.props?.pageProps?.fullResort || {};

            console.log('--- fullResort.history ---');
            console.log(JSON.stringify(fr.history || {}, null, 2).substring(0, 500));

            console.log('--- fullResort.depthAverages ---');
            console.log(JSON.stringify(fr.depthAverages || {}, null, 2).substring(0, 500));

            console.log('--- fullResort.statistics ---'); // Guessing key
            console.log(JSON.stringify(fr.statistics || {}, null, 2).substring(0, 500));

            // Look for large numbers in snow object again?
            console.log('--- fullResort.snow (recheck) ---');
            console.log(JSON.stringify(fr.snow || {}, null, 2));

        }
    } catch (error) {
        console.error('Error:', error);
    }
}
run();
