const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  const { data, error } = await supabase.rpc('get_tables'); // This might fail if get_tables doesn't exist

  if (error) {
    console.log('RPC get_tables failed, trying raw query...');
    const { data: rawData, error: rawError } = await supabase
      .from('pg_tables') // Usually restricted
      .select('tablename')
      .eq('schemaname', 'public');
      
    if (rawError) {
      console.error('Could not list tables:', rawError);
      // Fallback: try to query a known table
      const tables = ['clients', 'packages', 'bookings', 'payments', 'chat_sessions'];
      for (const table of tables) {
        const { error: tError } = await supabase.from(table).select('*').limit(1);
        if (tError) {
          console.log(`Table [${table}]: MISSING (${tError.message})`);
        } else {
          console.log(`Table [${table}]: EXISTS`);
        }
      }
      return;
    }
    console.log('Tables:', rawData);
  } else {
    console.log('Tables:', data);
  }
}

listTables();
