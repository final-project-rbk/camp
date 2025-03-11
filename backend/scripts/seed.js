require('dotenv').config();
const { connection } = require('../models');
const seeds = require('../seeders/seeds');

async function runSeeds() {
  try {
    // First sync the database to create tables
    console.log('Syncing database tables...');
    await connection.sync({ force: true });
    console.log('✅ Database tables synced successfully');

    // Run seeds in order
    console.log('Starting seeding process...');
    
    // Initialize associations
    Object.values(connection.models).forEach(model => {
      if (typeof model.associate === 'function') {
        model.associate(connection.models);
      }
    });

    // Run the seeds
    await seeds.up(connection.getQueryInterface(), connection.Sequelize);
    console.log('✅ Seeds added successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

runSeeds();