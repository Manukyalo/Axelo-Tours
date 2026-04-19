const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClient() {
  const email = 'emmanuelkyal91@gmail.com';
  console.log(`Checking for client: ${email}`);
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('email', email);

  if (error) {
    console.error('Error fetching client:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Client found:', data[0]);
  } else {
    console.log('Client not found in database.');
  }

  // Check auth
  const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
  const user = authUser?.users.find(u => u.email === email);
  
  if (user) {
    console.log('Auth user exists:', user.id);
  } else {
    console.log('Auth user does not exist.');
  }
}

checkClient();
