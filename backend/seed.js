require('dotenv').config();
const { connectDB } = require('./config/database');
const seedData = require('./seeders/seedData');

const runSeeder = async () => {
  try {
    await connectDB();
    await seedData();
    process.exit(0);
  } catch (error) {
    console.error('Error running seeder:', error);
    process.exit(1);
  }
};

runSeeder();

