'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    try {
      // Users
      console.log('Seeding users...');
      await queryInterface.bulkInsert('users', [
        {
          id: 1,
          email: 'admin@example.com',
          password: await bcrypt.hash('admin123', 10),
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin',
          points: 1000,
          profile_image: 'https://example.com/admin.jpg',
          bio: 'System administrator',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          email: 'advisor@example.com',
          password: await bcrypt.hash('advisor123', 10),
          first_name: 'Travel',
          last_name: 'Advisor',
          role: 'advisor',
          points: 750,
          profile_image: 'https://example.com/advisor.jpg',
          bio: 'Experienced travel advisor',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 3,
          email: 'user@example.com',
          password: await bcrypt.hash('user123', 10),
          first_name: 'Regular',
          last_name: 'User',
          role: 'user',
          points: 50,
          profile_image: 'https://example.com/user.jpg',
          bio: 'Travel enthusiast',
          createdAt: now,
          updatedAt: now
        }
      ]);

      // Advisors
      console.log('Seeding advisors...');
      await queryInterface.bulkInsert('advisors', [
        {
          id: 1,
          userId: 2,
          isVerified: true,
          tokenVerification: 'VERIFIED_TOKEN_123',
          currentRank: 'gold',
          cin: 'AB123456',
          points: 750,
          createdAt: now,
          updatedAt: now
        }
      ]);

      // Categories
      console.log('Seeding categories...');
      await queryInterface.bulkInsert('categories', [
        { id: 1, name: 'Beaches', icon: '🏖️', createdAt: now, updatedAt: now },
        { id: 2, name: 'Mountains', icon: '⛰️', createdAt: now, updatedAt: now },
        { id: 3, name: 'Tents', icon: '⛺', createdAt: now, updatedAt: now },
        { id: 4, name: 'Cooking Gear', icon: '🍳', createdAt: now, updatedAt: now },
        { id: 5, name: 'Sleeping Gear', icon: '🛌', createdAt: now, updatedAt: now }
      ]);

      // Places
      console.log('Seeding places...');
      await queryInterface.bulkInsert('places', [
        {
          id: 1,
          name: 'Camping Sidi El Barrak',
          description: 'Beautiful lakeside camping site surrounded by pine forests. Perfect for family camping with facilities for swimming, fishing, and hiking. Features clean amenities and designated BBQ areas.',
          location: 'Nefza, Béja Governorate',
          images: JSON.stringify(['https://example.com/sidi-el-barrak-1.jpg', 'https://example.com/sidi-el-barrak-2.jpg']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          name: 'Ain Draham Forest Camp',
          description: 'Mountain camping in Tunisia\'s most beautiful cork oak forest. Experience cool mountain air and stunning views. Ideal for nature lovers and hikers.',
          location: 'Ain Draham, Jendouba',
          images: JSON.stringify(['https://example.com/ain-draham-1.jpg', 'https://example.com/ain-draham-2.jpg']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 3,
          name: 'Cap Serrat Beach Camp',
          description: 'Pristine beachfront camping location with crystal clear waters. Perfect for snorkeling and beach activities. Offers both tent and cabin accommodations.',
          location: 'Cap Serrat, Bizerte',
          images: JSON.stringify(['https://example.com/cap-serrat-1.jpg']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 4,
          name: 'Zaghouan Mountain Retreat',
          description: 'High-altitude camping site near the ancient Roman temple. Excellent for rock climbing and mountain biking. Spectacular sunrise views over the mountains.',
          location: 'Zaghouan Mountains',
          images: JSON.stringify(['https://example.com/zaghouan-1.jpg']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 5,
          name: 'El Haouaria Beach Camp',
          description: 'Coastal camping ground with views of the Mediterranean. Famous for bird watching and wind sports. Close to ancient Punic caves.',
          location: 'El Haouaria, Cap Bon',
          images: JSON.stringify(['https://example.com/haouaria-1.jpg']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 6,
          name: 'Ichkeul National Park Camp',
          description: 'UNESCO World Heritage site offering unique ecosystem camping. Home to diverse bird species and lake views. Educational nature trails available.',
          location: 'Ichkeul, Bizerte',
          images: JSON.stringify(['https://example.com/ichkeul-1.jpg']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 7,
          name: 'Tabarka Pine Forest Camp',
          description: 'Seaside forest camping combining beach and woodland experiences. Close to coral reefs and historic Genoese fort. Excellent for diving enthusiasts.',
          location: 'Tabarka, Jendouba',
          images: JSON.stringify(['https://example.com/tabarka-1.jpg']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 8,
          name: 'Beni Mtir Lake Camp',
          description: 'Peaceful lakeside camping in the heart of Kroumirie. Surrounded by dense forests and offering water activities. Perfect for fishing and kayaking.',
          location: 'Beni Mtir, Jendouba',
          images: JSON.stringify(['https://example.com/beni-mtir-1.jpg']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 9,
          name: 'Djebel Ressas Eco Camp',
          description: 'Eco-friendly mountain camping site with panoramic views of Tunis. Popular for climbing and hiking. Traditional Berber hospitality experience.',
          location: 'Djebel Ressas, Ben Arous',
          images: JSON.stringify(['https://example.com/djebel-ressas-1.jpg']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 10,
          name: 'Bizerte Lakes Camp',
          description: 'Unique camping experience between the Mediterranean Sea and Bizerte Lake. Rich in marine life and bird watching opportunities. Water sports facilities available.',
          location: 'Bizerte',
          images: JSON.stringify(['https://example.com/bizerte-lakes-1.jpg']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        }
      ]);

      // Events
      console.log('Seeding events...');
      await queryInterface.bulkInsert('events', [
        {
          id: 1,
          title: 'Beach Party',
          description: 'Annual summer beach party',
          date: new Date('2025-07-01'),
          location: 'Beach',
          images: JSON.stringify(['party1.jpg']),
          status: 'approved',
          advisorId: 1,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          title: 'Mountain Hiking Event',
          description: 'Group hiking in the mountains',
          date: new Date('2025-08-15'),
          location: 'Mountain Valley',
          images: JSON.stringify(['hike1.jpg']),
          status: 'pending',
          advisorId: 1,
          createdAt: now,
          updatedAt: now
        }
      ]);

      // Blogs
      console.log('Seeding blogs...');
      await queryInterface.bulkInsert('blogs', [
        {
          title: 'Top 10 Beach Destinations',
          content: 'Discover the most beautiful beaches...',
          image: 'beach-blog.jpg',
          likes: 150,
          comments: JSON.stringify(['Great article!', 'Very helpful']),
          userId: 2,
          createdAt: now,
          updatedAt: now
        },
        {
          title: 'Best Mountain Trails',
          content: 'Explore the top mountain trails...',
          image: 'mountain-blog.jpg',
          likes: 75,
          comments: JSON.stringify(['Amazing views!']),
          userId: 3,
          createdAt: now,
          updatedAt: now
        }
      ]);

      // Marketplace Items
      console.log('Seeding marketplace_items...');
      console.log('Seeding marketplace_items...');
await queryInterface.bulkInsert('marketplaceitems', [
  {
          id: 1,
          title: 'Two-Person Camping Tent',
          description: 'Lightweight and durable tent, perfect for backpacking in the mountains or beaches.',
          imageURL: 'https://example.com/tent.jpg',
          price: 49.99,
          status: 'available',
          sellerId: 3, // Regular User
          buyerId: null,
          location: 'Bizerte',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          title: 'Portable Camping Stove',
          description: 'Compact gas stove with wind protection, ideal for outdoor cooking.',
          imageURL: 'https://example.com/stove.jpg',
          price: 29.50,
          status: 'sold',
          sellerId: 2, // Travel Advisor
          buyerId: 1, // Admin
          location: 'Ain Draham, Jendouba',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 3,
          title: 'Sleeping Bag (-5°C)',
          description: 'Warm and cozy sleeping bag for cold mountain nights.',
          imageURL: 'https://example.com/sleeping-bag.jpg',
          price: 39.99,
          status: 'pending',
          sellerId: 3, // Regular User
          buyerId: 2, // Travel Advisor
          location: 'Zaghouan',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 4,
          title: 'Camping Cookware Set',
          description: 'Lightweight aluminum cookware set including pots and pans.',
          imageURL: 'https://example.com/cookware.jpg',
          price: 25.00,
          status: 'available',
          sellerId: 1, // Admin
          buyerId: null,
          location: 'Tabarka, Jendouba',
          createdAt: now,
          updatedAt: now
        }
      ]);

      // Marketplace Categories
      console.log('Seeding marketplace categories...');
      await queryInterface.bulkInsert('marketplace_categorie', [
        { 
          id: 1,
          name: 'Tents & Shelters',
          icon: '⛺',
          description: 'Camping tents, tarps, and shelter solutions',
          createdAt: now,
          updatedAt: now
        },
        { 
          id: 2,
          name: 'Sleeping Gear',
          icon: '🛏️',
          description: 'Sleeping bags, pads, and camping pillows',
          createdAt: now,
          updatedAt: now
        },
        { 
          id: 3,
          name: 'Cooking Equipment',
          icon: '🍳',
          description: 'Stoves, cookware, and kitchen accessories',
          createdAt: now,
          updatedAt: now
        },
        { 
          id: 4,
          name: 'Lighting',
          icon: '🔦',
          description: 'Lanterns, headlamps, and camping lights',
          createdAt: now,
          updatedAt: now
        },
        { 
          id: 5,
          name: 'Backpacks & Bags',
          icon: '🎒',
          description: 'Hiking backpacks and camping bags',
          createdAt: now,
          updatedAt: now
        },
        { 
          id: 6,
          name: 'Tools & Equipment',
          icon: '🔧',
          description: 'Multi-tools, knives, and camping gear',
          createdAt: now,
          updatedAt: now
        }
      ]);

      // Update marketplace item categories to use new category IDs
      console.log('Updating marketplace item categories...');
      await queryInterface.bulkInsert('marketplace_item_categories', [
        { marketplaceItemId: 1, marketplaceCategorieId: 1, createdAt: now, updatedAt: now }, // Tent -> Tents & Shelters
        { marketplaceItemId: 2, marketplaceCategorieId: 3, createdAt: now, updatedAt: now }, // Stove -> Cooking Equipment
        { marketplaceItemId: 3, marketplaceCategorieId: 2, createdAt: now, updatedAt: now }, // Sleeping Bag -> Sleeping Gear
        { marketplaceItemId: 4, marketplaceCategorieId: 3, createdAt: now, updatedAt: now }  // Cookware -> Cooking Equipment
      ]);

      // PlaceCategories
      console.log('Seeding placeCategories...');
      await queryInterface.bulkInsert('placeCategories', [
        { placeId: 1, categorieId: 1, createdAt: now, updatedAt: now }, // Sidi El Barrak - Beaches
        { placeId: 1, categorieId: 3, createdAt: now, updatedAt: now }, // Sidi El Barrak - Tents
        { placeId: 2, categorieId: 2, createdAt: now, updatedAt: now }, // Ain Draham - Mountains
        { placeId: 2, categorieId: 3, createdAt: now, updatedAt: now }, // Ain Draham - Tents
        { placeId: 3, categorieId: 1, createdAt: now, updatedAt: now }, // Cap Serrat - Beaches
        { placeId: 3, categorieId: 3, createdAt: now, updatedAt: now }, // Cap Serrat - Tents
        { placeId: 4, categorieId: 2, createdAt: now, updatedAt: now }, // Zaghouan - Mountains
        { placeId: 4, categorieId: 5, createdAt: now, updatedAt: now }, // Zaghouan - Sleeping Gear
        { placeId: 5, categorieId: 1, createdAt: now, updatedAt: now }, // El Haouaria - Beaches
        { placeId: 5, categorieId: 3, createdAt: now, updatedAt: now }, // El Haouaria - Tents
        { placeId: 6, categorieId: 2, createdAt: now, updatedAt: now }, // Ichkeul - Mountains
        { placeId: 6, categorieId: 4, createdAt: now, updatedAt: now }, // Ichkeul - Cooking Gear
        { placeId: 7, categorieId: 1, createdAt: now, updatedAt: now }, // Tabarka - Beaches
        { placeId: 7, categorieId: 3, createdAt: now, updatedAt: now }, // Tabarka - Tents
        { placeId: 8, categorieId: 2, createdAt: now, updatedAt: now }, // Beni Mtir - Mountains
        { placeId: 8, categorieId: 4, createdAt: now, updatedAt: now }, // Beni Mtir - Cooking Gear
        { placeId: 9, categorieId: 2, createdAt: now, updatedAt: now }, // Djebel Ressas - Mountains
        { placeId: 9, categorieId: 5, createdAt: now, updatedAt: now }, // Djebel Ressas - Sleeping Gear
        { placeId: 10, categorieId: 1, createdAt: now, updatedAt: now }, // Bizerte Lakes - Beaches
        { placeId: 10, categorieId: 4, createdAt: now, updatedAt: now } // Bizerte Lakes - Cooking Gear
      ]);

      // PlaceUser Associations
      console.log('Seeding placeUsers...');
      await queryInterface.bulkInsert('placeUsers', [
        { placeId: 1, userId: 1, rating: 5, createdAt: now, updatedAt: now },
        { placeId: 2, userId: 3, rating: 5, createdAt: now, updatedAt: now }
      ]);

      // Reviews
      console.log('Seeding reviews...');
      await queryInterface.bulkInsert('Reviews', [
        { 
          rating: 5, 
          comment: 'Great place!',
          placeId: 1, 
          userId: 1, 
          createdAt: now, 
          updatedAt: now 
        },
        { 
          rating: 4, 
          comment: 'Nice location',
          placeId: 2, 
          userId: 3, 
          createdAt: now, 
          updatedAt: now 
        }
      ]);

      // Media
      console.log('Seeding media...');
      await queryInterface.bulkInsert('media', [
        {
          url: 'https://example.com/beach-photo.jpg',
          type: 'image',
          userId: 1,
          placeId: 1,
          createdAt: now,
          updatedAt: now
        },
        {
          url: 'https://example.com/event-video.mp4',
          type: 'video',
          userId: 2,
          eventId: 1,
          placeId: 2,
          createdAt: now,
          updatedAt: now
        }
      ]);

      // Chats
      console.log('Seeding chats...');
      await queryInterface.bulkInsert('chats', [
        {
          message: 'Hello, I have a question about the beach.',
          createdAt: now,
          updatedAt: now
        },
        {
          message: 'Sure, I can help you with that!',
          createdAt: now,
          updatedAt: now
        }
      ]);

      // Criteria
      console.log('Seeding critiria...');
      await queryInterface.bulkInsert('critiria', [
        { name: 'Cleanliness', purcent: 25, createdAt: now, updatedAt: now },
        { name: 'Service', purcent: 30, createdAt: now, updatedAt: now },
        { name: 'Location', purcent: 20, createdAt: now, updatedAt: now }
      ]);

      // Favorites
      console.log('Seeding favorites...');
      await queryInterface.bulkInsert('favorites', [
        { userId: 1, placeId: 1, createdAt: now, updatedAt: now },
        { userId: 3, placeId: 2, createdAt: now, updatedAt: now }
      ]);

      // Event Ratings
      console.log('Seeding event_ratings...');
      await queryInterface.bulkInsert('event_ratings', [
        { name: 'Bronze', targetPoints: 100, totalPoints: 0, advisorId: 1, createdAt: now, updatedAt: now },
        { name: 'Silver', targetPoints: 500, totalPoints: 250, advisorId: 1, createdAt: now, updatedAt: now }
      ]);

      console.log('✅ Seeding completed successfully!');
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw error;
    }
  },


  
  down: async (queryInterface, Sequelize) => {
    try {
      console.log('Reverting seeds...');
      const tables = [
        'event_ratings',              // No foreign keys referencing it
        'favorites',                 // References users, places
        'critiria',                  // Referenced by placeUsers
        'chats',                     // References marketplace_items, users
        'media',                     // References users, places, events
        'Reviews',                   // References users, places, events, advisors
        'placeUsers',                // References users, places, critiria
        'placeCategories',           // References places, categories
        'marketplace_item_categories', // References marketplace_items, marketplace_categorie
        'marketplace_items',         // References users (sellerId, buyerId)
        'marketplace_categorie',     // Referenced by marketplace_item_categories
        'blogs',                     // References users
        'events',                    // References advisors
        'places',                    // Referenced by many tables
        'categories',                // Referenced by placeCategories
        'advisors',                  // References users
        'users'                      // Referenced by many tables, drop last
      ];
  
      for (const table of tables) {
        try {
          console.log(`Deleting ${table}...`);
          await queryInterface.bulkDelete(table, null, {});
        } catch (error) {
          if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
            console.log(`Table ${table} does not exist, skipping...`);
            continue;
          }
          throw error;
        }
      }
  
      console.log('✅ Seeds reverted successfully!');
    } catch (error) {
      console.error('❌ Seed reversion failed:', error);
      throw error;
    }
  }
}
