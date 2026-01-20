
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function debugOtsStratton() {
    const url = 'https://www.onthesnow.com/vermont/stratton-mountain/skireport';
    console.log(`Fetching ${url}...`);
    try {
        const { stdout } = await execAsync(`curl -s -L "${url}" -H "User-Agent: Mozilla/5.0"`);

        console.log('--- JSON Search ---');
        // OTS often has a __NEXT_DATA__ blob
        const nextData = stdout.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
        if (nextData && nextData[1]) {
            console.log('Found __NEXT_DATA__!');
            const data = JSON.parse(nextData[1]);
            const pp = data.props.pageProps;
            console.log('--- props.pageProps Keys ---', Object.keys(pp));

            if (pp.fullResort) {
                console.log('--- fullResort.snow ---', JSON.stringify(pp.fullResort.snow));
                console.log('--- fullResort.depths ---', JSON.stringify(pp.fullResort.depths));
                console.log('--- fullResort.status ---', JSON.stringify(pp.fullResort.status));
            }

            if (pp.resort) {
                console.log('--- resort Keys ---', Object.keys(pp.resort));
                if (pp.resort.snow_report) console.log('resort.snow_report:', pp.resort.snow_report);
            }

            if (pp.fullResort && pp.fullResort.terrain && pp.fullResort.terrain.runs && pp.fullResort.terrain.runs.details) {
                const trails = pp.fullResort.terrain.runs.details;
                console.log(`Total items in runs.details: ${trails.length}`);
                console.log('--- Sample Trail Object Keys ---');
                if (trails.length > 0) console.log(Object.keys(trails[0]));

                console.log('--- All Trail Names & Diff ---');
                trails.forEach((t: any) => {
                    console.log(`[${t.difficulty}] ${t.name} (Status: ${t.status})`);
                });
            }

            // Dump a bit more of 'resort' to see structure
            console.log('--- Resort Snippet ---');
            console.log(JSON.stringify(data.props.pageProps.resort || {}).substring(0, 500));
        } else {
            console.log('No __NEXT_DATA__ found. Dumping body snippet...');
            console.log(stdout.substring(0, 1000));
        }

    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

debugOtsStratton();
