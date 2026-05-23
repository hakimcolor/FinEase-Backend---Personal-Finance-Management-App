// Automated Admin Setup Script
// This script sets admin role for users in MongoDB

const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_Password}@cluster0.wcellxl.mongodb.net/?retryWrites=true&w=majority`;

async function setupAdmin() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('\n🔗 Connected to MongoDB Atlas\n');

    const db = client.db('Personal_Finance_Management_App');
    const userCollection = db.collection('user');

    console.log('⚙️  Setting up admin users...\n');

    // Set your existing account as admin
    const result1 = await userCollection.updateOne(
      { email: 'hakimcolor777@gmail.com' },
      {
        $set: {
          role: 'admin',
          updatedAt: new Date(),
        },
      }
    );

    if (result1.matchedCount > 0) {
      console.log('✅ hakimcolor777@gmail.com → Admin role set');
    } else {
      console.log(
        '⚠️  hakimcolor777@gmail.com → User not found (register first)'
      );
    }

    // Set admin@fintrack.com as admin (if exists)
    const result2 = await userCollection.updateOne(
      { email: 'admin@fintrack.com' },
      {
        $set: {
          role: 'admin',
          updatedAt: new Date(),
        },
      }
    );

    if (result2.matchedCount > 0) {
      console.log('✅ admin@fintrack.com → Admin role set');
    } else {
      console.log('⚠️  admin@fintrack.com → User not found (register first)');
    }

    // Display all admin users
    console.log('\n📋 Current Admin Users:\n');
    const admins = await userCollection.find({ role: 'admin' }).toArray();

    if (admins.length === 0) {
      console.log('   No admin users found. Please register users first.\n');
    } else {
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.firstName}`);
        console.log(`      Email: ${admin.email}`);
        console.log(`      Role: ${admin.role}`);
        console.log('');
      });
    }

    // Display credentials
    console.log('🔐 Admin Credentials:\n');
    console.log('   Primary Admin:');
    console.log('   Email: admin@fintrack.com');
    console.log('   Password: Admin@123456');
    console.log('   (Register this user in app first)\n');

    console.log('   Your Account:');
    console.log('   Email: hakimcolor777@gmail.com');
    console.log('   Password: (your existing password)\n');

    console.log('📍 Dashboard URLs:\n');
    console.log('   User Dashboard: http://localhost:5173/user-dashboard');
    console.log('   Admin Dashboard: http://localhost:5173/admin-dashboard\n');

    console.log('✅ Setup complete!\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. MongoDB connection string in .env');
    console.error('2. Database name is correct');
    console.error('3. Internet connection\n');
  } finally {
    await client.close();
  }
}

// Run the setup
setupAdmin();
