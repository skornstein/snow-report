
import { supabase } from '../src/lib/supabase';

async function testUpsert() {
    if (!supabase) {
        console.log('No Supabase client available (keys missing?).');
        return;
    }

    const testEmail = `test-${Date.now()}@example.com`;

    console.log(`1. Subscribing ${testEmail} (Insert)...`);
    const { error: err1 } = await supabase
        .from('subscribers')
        .upsert({
            email: testEmail,
            resorts: ['mount-snow'],
            start_date: '2025-01-01',
            end_date: '2025-01-02'
        }, { onConflict: 'email' });

    if (err1) {
        console.error('First Upsert Failed:', err1);
        return;
    }
    console.log('First Upsert Success.');

    console.log(`2. Re-Subscribing ${testEmail} (Update)...`);
    const { error: err2 } = await supabase
        .from('subscribers')
        .upsert({
            email: testEmail,
            resorts: ['okemo', 'stratton'], // Changed resorts
            start_date: '2025-02-01',
            end_date: '2025-02-02'
        }, { onConflict: 'email' });

    if (err2) {
        console.error('Second Upsert Failed (Duplicate Check):', err2);
    } else {
        console.log('Second Upsert Success (Duplicate Handled).');
    }
}

testUpsert();
