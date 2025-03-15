require('dotenv').config();
const { connection, User, Blog, Review, MarketplaceItem } = require('../models');

async function checkDataCounts() {
  try {
    console.log('Connecting to database...');
    
    // User count
    const userCount = await User.count();
    console.log(`Users: ${userCount}`);
    
    // Blog count
    const blogCount = await Blog.count();
    console.log(`Blogs: ${blogCount}`);
    
    // Review count
    const reviewCount = await Review.count();
    console.log(`Reviews: ${reviewCount}`);
    
    // MarketplaceItem count
    const itemCount = await MarketplaceItem.count();
    console.log(`Marketplace Items: ${itemCount}`);
    
    console.log('✅ Data check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Data check failed:', error);
    process.exit(1);
  }
}

checkDataCounts(); 