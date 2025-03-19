const { sequelize } = require('../models');

async function resetDatabase() {
  try {
    console.log('Dropping all tables...');
    await sequelize.drop();
    
    console.log('Syncing database...');
    await sequelize.sync({ force: true });
    
    console.log('Database reset completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase(); 