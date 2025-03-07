const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'localhost', // Adjust based on your config
  username: 'root',  // Adjust based on your config
  password: 'root',      // Adjust based on your config
  database: 'campy'  // Adjust based on your config
  // Load from config/config.js if preferred
});
const seed = require('../seeders/seeds');

async function runSeeds() {
  try {
    console.log('Ensuring database tables exist...');
    await sequelize.authenticate();
    console.log('Database is connected 👌✅');
    await sequelize.sync(); // Optional: ensures tables exist
    console.log('✅ Database tables ready');

    // Clear existing data from all tables
    console.log('Clearing existing data...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0'); // Disable FK checks to avoid constraint issues
    const tables = [
      'event_ratings',
      'favorites',
      'critiria', // Note: possible typo in your DB, should it be 'criteria'?
      'chats',
      'media',
      'reviews',
      'placeusers',
      'placecategories',
      'marketplace_item_categories',
      'marketplaceitems',
      'marketplace_categorie',
      'blogs',
      'events',
      'places',
      'categories',
      'advisors',
      'users' // Keep 'users' last due to foreign key dependencies
    ];
    for (const table of tables) {
      console.log(`Truncating ${table}...`);
      await sequelize.query(`TRUNCATE TABLE ${table}`);
    }
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1'); // Re-enable FK checks
    console.log('✅ Data cleared');

    // Run the seed
    await seed.up(sequelize.getQueryInterface(), Sequelize);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

runSeeds();