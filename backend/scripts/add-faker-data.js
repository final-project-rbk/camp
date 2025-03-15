require('dotenv').config();
const { connection, User, Place, MarketplaceItem, Blog, Review, PlaceCategorie } = require('../models');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

async function addFakerData() {
  try {
    console.log('Starting to add fake data...');
    const now = new Date();

    // Generate additional users
    console.log('Adding more users...');
    const additionalUsers = [];
    for (let i = 21; i <= 30; i++) {
      // Make every 5th user an advisor
      const role = i % 5 === 0 ? 'advisor' : 'user';
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      
      additionalUsers.push({
        id: i,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        password: await bcrypt.hash('password123', 10),
        first_name: firstName,
        last_name: lastName,
        role,
        points: faker.number.int({ min: 0, max: 500 }),
        profile_image: faker.helpers.maybe(() => faker.image.avatar(), { probability: 0.7 }),
        bio: faker.lorem.paragraph(2),
        experience: faker.helpers.maybe(() => faker.lorem.paragraph(1), { probability: 0.5 }),
        token: null,
        created_at: now,
        updated_at: now,
        isBanned: false,
        createdAt: now,
        updatedAt: now
      });
    }
    
    await User.bulkCreate(additionalUsers, { ignoreDuplicates: true });
    console.log(`✅ Added ${additionalUsers.length} new users`);

    // Generate additional marketplace items
    console.log('Adding more marketplace items...');
    const additionalItems = [];
    
    for (let i = 21; i <= 30; i++) {
      const sellerId = faker.number.int({ min: 1, max: 10 });
      
      additionalItems.push({
        id: i,
        title: faker.commerce.productName() + ' for Camping',
        description: faker.commerce.productDescription(),
        imageURL: faker.image.urlLoremFlickr({ width: 640, height: 480, category: 'nature' }),
        price: parseFloat(faker.commerce.price({ min: 15, max: 200 })),
        status: faker.helpers.arrayElement(['available', 'available', 'available', 'sold', 'pending']),
        sellerId,
        buyerId: faker.helpers.maybe(() => {
          const buyerId = faker.number.int({ min: 1, max: 10 });
          return buyerId === sellerId ? buyerId + 1 : buyerId;
        }, { probability: 0.3 }),
        location: faker.helpers.arrayElement(['Tunis', 'Sousse', 'Bizerte', 'Hammamet', 'Sfax']),
        createdAt: now,
        updatedAt: now
      });
    }
    
    await MarketplaceItem.bulkCreate(additionalItems, { ignoreDuplicates: true });
    console.log(`✅ Added ${additionalItems.length} new marketplace items`);

    // Generate additional blog posts
    console.log('Adding more blog posts...');
    const additionalBlogs = [];
    
    for (let i = 16; i <= 25; i++) {
      const userId = faker.number.int({ min: 1, max: 10 });
      const topics = ['camping tips', 'outdoor cooking', 'survival skills', 'hiking trails', 'gear reviews', 'wildlife', 'camping with kids', 'photography', 'stargazing'];
      const topic = faker.helpers.arrayElement(topics);
      
      const titlePrefixes = ['Ultimate Guide to', 'Top 10', 'How to', 'Essential', 'Best Practices for', 'Exploring', 'Adventures in', 'Secrets of', 'Discovering'];
      const titlePrefix = faker.helpers.arrayElement(titlePrefixes);
      
      additionalBlogs.push({
        id: i,
        title: `${titlePrefix} ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
        content: faker.lorem.paragraphs(5),
        image: faker.image.urlLoremFlickr({ width: 800, height: 600, category: 'nature' }),
        likes: faker.number.int({ min: 0, max: 200 }),
        userId,
        createdAt: now,
        updatedAt: now
      });
    }
    
    await Blog.bulkCreate(additionalBlogs, { ignoreDuplicates: true });
    console.log(`✅ Added ${additionalBlogs.length} new blog posts`);

    // Add more reviews - making sure to generate more reviews
    await addReviews();

    console.log('✅ Faker data added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to add faker data:', error);
    process.exit(1);
  }
}

// Add more reviews - making sure to generate more reviews
async function addReviews() {
  // Get places count
  const placeCount = await Place.count();
  const userCount = await User.count();
  
  // Define now for timestamps
  const now = new Date();
  
  console.log(`Found ${placeCount} places and ${userCount} users`);
  
  // Generate 30 reviews (increased from previous amount)
  const reviews = [];
  const existingPairs = new Set();
  
  // Generate 30 unique reviews
  for (let i = 0; i < 30; i++) {
    const userId = faker.number.int({ min: 1, max: Math.min(userCount, 20) });
    const placeId = faker.number.int({ min: 1, max: Math.min(placeCount, 15) });
    const pairKey = `${userId}-${placeId}`;
    
    // Skip if we already have a review for this user-place pair
    if (existingPairs.has(pairKey)) {
      continue;
    }
    
    existingPairs.add(pairKey);
    
    reviews.push({
      userId,
      placeId,
      rating: faker.number.int({ min: 3, max: 5 }), // Mostly positive reviews
      comment: faker.lorem.paragraph(),
      created_at: now,
      updated_at: now
    });
  }
  
  console.log(`Adding ${reviews.length} reviews`);
  
  if (reviews.length > 0) {
    await Review.bulkCreate(reviews);
  }
}

addFakerData(); 