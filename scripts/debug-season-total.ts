
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function debugSeasonTotal() {
    const url = 'https://www.mountsnow.com/the-mountain/mountain-conditions/weather-report.aspx';
    console.log(`Fetching ${url}...`);
    try {
        const { stdout } = await execAsync(`curl -s -L "${url}"`);
        const match = stdout.match(/FR\.snowReportData\s*=\s*({[\s\S]*?});/);
        if (match && match[1]) {
            const data = JSON.parse(match[1]);
            console.log('--- FR.snowReportData Keys ---');
            console.log(Object.keys(data));
            console.log('--- CurrentSeason ---');
            console.log(JSON.stringify(data.CurrentSeason, null, 2));
            console.log('--- Full Data (Truncated) ---');
            // console.log(match[1].substring(0, 500)); 
        } else {
            console.error('FR.snowReportData not found');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

debugSeasonTotal();
