const { query } = require('./db');

async function testConnection() {
  try {
    console.log('Testing Supabase database connection...');

    // Test basic connection with a simple query
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Connection successful!');
    console.log('Current database time:', result.rows[0].current_time);

    // Test if users table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'users'
      ) as table_exists
    `);

    if (tableCheck.rows[0].table_exists) {
      console.log('✅ Users table exists');

      // Check if there are any users
      const userCount = await query('SELECT COUNT(*) as count FROM users');
      console.log(`📊 Users in database: ${userCount.rows[0].count}`);
    } else {
      console.log('❌ Users table does not exist. Please run the database.sql script in Supabase.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Please check your .env file and Supabase credentials.');
    process.exit(1);
  }
}

testConnection();
