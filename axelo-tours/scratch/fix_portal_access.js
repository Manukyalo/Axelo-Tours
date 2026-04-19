const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupClientAccess() {
  const email = 'emmanuelkyal91@gmail.com';
  const password = 'AxeloSafar1_2024'; 
  const fullName = 'Emmanuel Kyalo';

  console.log(`--- PORTAL SETUP INITIATED ---`);
  
  // 1. Get User ID
  console.log(`1. Resolving Auth user: ${email}...`);
  const { data: userData } = await supabase.auth.admin.listUsers();
  let user = userData?.users.find(u => u.email === email);
  let userId;

  if (user) {
    console.log('   User found. Resetting password...');
    userId = user.id;
    await supabase.auth.admin.updateUserById(userId, { password });
  } else {
    console.log('   User not found. Creating new auth user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });
    if (createError) {
      console.error('   Error creating user:', createError.message);
      return;
    }
    userId = newUser.user.id;
  }

  console.log(`   User ID: ${userId}`);

  // 2. Link to Clients Table
  console.log(`2. Linking to clients table...`);
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .upsert({
      user_id: userId,
      full_name: fullName,
      email: email
    }, { onConflict: 'email' })
    .select()
    .single();

  if (clientError) {
    console.error('   Client Table Error:', clientError.message);
    return;
  }
  console.log('   Client profile linked!');
  const clientId = clientData.id;

  // 3. Seed a dummy booking
  console.log(`3. Seeding your first booking...`);
  const { data: pkg } = await supabase.from('packages').select('id').limit(1).single();
  if (pkg) {
    const { error: bookingError } = await supabase
      .from('bookings')
      .upsert({
        client_id: clientId,
        package_id: pkg.id,
        travel_date: '2024-12-15',
        return_date: '2024-12-19',
        num_adults: 2,
        num_children: 1,
        total_amount: 1250,
        currency: 'USD',
        status: 'confirmed',
        payment_status: 'paid'
      });
    
    if (bookingError) {
        console.error('   Booking Error:', bookingError.message);
    } else {
        console.log('   Safari booking seeded successfully!');
    }
  } else {
      console.log('   No packages found. Seeding a package first...');
      const { data: newPkg, error: pkgError } = await supabase.from('packages').insert({
          name: 'The Great Migration Explorer', 
          slug: 'great-migration-explorer', 
          destination: 'Maasai Mara', 
          duration_days: 4, 
          price_usd: 1250, 
          price_kes: 165000, 
          highlights: ['Big Five Sightings', 'Luxury Tented Camp'],
          images: ['https://images.unsplash.com/photo-1516422317778-958bd73a7174?q=80&w=1000']
      }).select().single();

      if (pkgError) {
          console.error('   Package Seeding Error:', pkgError.message);
      } else {
          console.log('   Package seeded. Now seeding booking...');
          await supabase.from('bookings').insert({
              client_id: clientId,
              package_id: newPkg.id,
              travel_date: '2024-12-15',
              total_amount: 1250,
              status: 'confirmed',
              payment_status: 'paid'
          });
          console.log('   Safari booking seeded!');
      }
  }

  console.log(`--- SETUP COMPLETE ---`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

setupClientAccess();
