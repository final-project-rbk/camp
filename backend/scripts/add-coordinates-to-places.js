require('dotenv').config();
const { connection } = require('../models');

async function addCoordinatesToPlacesTable() {
  try {
    console.log('Starting migration: Adding coordinates to places table...');
    
    // Check if columns already exist
    const [columnsCheck] = await connection.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'places' 
      AND column_name IN ('latitude', 'longitude')
    `);
    
    // Add latitude column if it doesn't exist
    if (!columnsCheck.some(col => col.column_name === 'latitude')) {
      console.log('Adding latitude column to places table...');
      await connection.query(`
        ALTER TABLE places 
        ADD COLUMN latitude FLOAT DEFAULT NULL
      `);
      console.log('Latitude column added successfully');
    } else {
      console.log('Latitude column already exists');
    }
    
    // Add longitude column if it doesn't exist
    if (!columnsCheck.some(col => col.column_name === 'longitude')) {
      console.log('Adding longitude column to places table...');
      await connection.query(`
        ALTER TABLE places 
        ADD COLUMN longitude FLOAT DEFAULT NULL
      `);
      console.log('Longitude column added successfully');
    } else {
      console.log('Longitude column already exists');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the database connection
    await connection.close();
  }
}

// Execute the migration
addCoordinatesToPlacesTable(); 