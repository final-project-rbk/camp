require('dotenv').config();
const { connection } = require('../models');
const seeds = require('../seeders/seeds');

async function runSeeds() {
  try {
    // First sync the database to create tables
    console.log('Syncing database tables...');
    await connection.sync({ force: true });
    console.log('✅ Database tables synced successfully');

    // Then run the seeds
    await seeds.down(connection.getQueryInterface(), connection.Sequelize);
    console.log('✅ Old seeds removed successfully');

    await seeds.up(connection.getQueryInterface(), connection.Sequelize);
    console.log('✅ New seeds added successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeeds();
