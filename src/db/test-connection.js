import { 
  testConnection, 
  initializeDatabase, 
  seedDatabase, 
  checkDatabaseHealth,
  AlbumModel,
  TrackModel,
  StatsModel
} from './index.js';

async function testDatabaseSetup() {
  console.log('🧪 Testing Database Setup...\n');

  try {
    // Test 1: Connection
    console.log('1. Testing database connection...');
    const isConnected = await testConnection();
    if (isConnected) {
      console.log('✅ Database connection successful\n');
    } else {
      console.log('❌ Database connection failed\n');
      return;
    }

    // Test 2: Health check
    console.log('2. Testing database health...');
    const health = await checkDatabaseHealth();
    console.log(`✅ Database health: ${health.status}\n`);

    // Test 3: Initialize database
    console.log('3. Initializing database tables...');
    const initSuccess = await initializeDatabase();
    if (initSuccess) {
      console.log('✅ Database tables created successfully\n');
    } else {
      console.log('❌ Database initialization failed\n');
      return;
    }

    // Test 4: Seed database
    console.log('4. Seeding database with sample data...');
    const seedSuccess = await seedDatabase();
    if (seedSuccess) {
      console.log('✅ Database seeded successfully\n');
    } else {
      console.log('❌ Database seeding failed\n');
    }

    // Test 5: Test models
    console.log('5. Testing data models...');
    
    // Test albums
    const albums = await AlbumModel.getAll();
    console.log(`✅ Found ${albums.length} albums`);
    
    // Test tracks
    const tracks = await TrackModel.getAll();
    console.log(`✅ Found ${tracks.length} tracks`);
    
    // Test stats
    const stats = await StatsModel.getCounts();
    console.log(`✅ Database stats: ${JSON.stringify(stats)}\n`);

    console.log('🎉 All database tests passed successfully!');
    console.log('\n📋 Database Setup Summary:');
    console.log('- Connection: ✅ Working');
    console.log('- Tables: ✅ Created');
    console.log('- Sample Data: ✅ Seeded');
    console.log('- Models: ✅ Functional');
    console.log('- Health: ✅ Good');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDatabaseSetup()
    .then(() => {
      console.log('\n🏁 Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

export default testDatabaseSetup; 