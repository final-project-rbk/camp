require('dotenv').config();
const { connection } = require('../models');
const seeds = require('../seeders/seeds');

async function runSeeds() {
  try {
    // First disable foreign key checks
    console.log('Disabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Then sync the database to create tables
    console.log('Syncing database tables...');
    await connection.sync({ force: true });
    console.log('✅ Database tables synced successfully');

    // Then run the seeds
    await seeds.down(connection.getQueryInterface(), connection.Sequelize);
    console.log('✅ Old seeds removed successfully');

    await seeds.up(connection.getQueryInterface(), connection.Sequelize);
    console.log('✅ New seeds added successfully');
    
    // Re-enable foreign key checks
    console.log('Re-enabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    
    // Make sure to re-enable foreign key checks even if there's an error
    try {
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (err) {
      console.error('Error re-enabling foreign key checks:', err);
    }
    
    process.exit(1);
  }
}

runSeeds();
