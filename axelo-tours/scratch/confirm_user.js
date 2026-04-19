const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceConfirmUser() {
  const email = 'emmanuelkyal91@gmail.com';
  const password = 'AxeloSafar1_2024'; 

  console.log(`--- FORCE CONFIRMING USER ---`);
  
  const { data: userData } = await supabase.auth.admin.listUsers();
  let user = userData?.users.find(u => u.email === email);

  if (user) {
    console.log(`User found: ${user.id}. Confirming email and resetting password...`);
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, { 
      password: password,
      email_confirm: true 
    });

    if (error) {
        console.error('Error confirming user:', error.message);
    } else {
        console.log('User successfully confirmed and password reset!');
    }
  } else {
      console.log('User not found. Try running the full setup script first.');
  }

  console.log(`--- COMPLETE ---`);
}

forceConfirmUser();
