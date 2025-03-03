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
          name: 'Beautiful Beach Resort',
          description: 'A stunning beach resort with white sand',
          location: 'Coastal City',
          images: JSON.stringify(['beach1.jpg', 'beach2.jpg']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          name: 'Mountain Retreat',
          description: 'A cozy retreat in the mountains',
          location: 'Mountain Valley',
          images: JSON.stringify(['mountain1.jpg']),
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
          location: 'Beach Resort',
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
      ], { returning: true });

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
      await queryInterface.bulkInsert('marketplace_items', [
        {
          id: 1,
          title: 'Two-Person Camping Tent',
          description: 'Lightweight tent, perfect for backpacking',
          price: 49.99,
          status: 'available',
          sellerId: 3,
          buyerId: null,
          location: 'Portland, OR',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          title: 'Sleeping Bag (0°C)',
          description: 'Warm sleeping bag for cold nights',
          price: 29.50,
          status: 'sold',
          sellerId: 2,
          buyerId: 1,
          location: 'Seattle, WA',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 3,
          title: 'Portable Camping Stove',
          description: 'Compact stove for outdoor cooking',
          price: 19.99,
          status: 'pending',
          sellerId: 3,
          buyerId: 2,
          location: 'Bend, OR',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 4,
          title: 'Camping Lantern',
          description: 'Bright LED lantern with long battery life',
          price: 15.00,
          status: 'available',
          sellerId: 2,
          buyerId: null,
          location: 'Boise, ID',
          createdAt: now,
          updatedAt: now
        }
      ]);

      // Marketplace Item Categories
      console.log('Seeding marketplace_item_categories...');
      await queryInterface.bulkInsert('marketplace_item_categories', [
        { marketplaceItemId: 1, categorieId: 3, createdAt: now, updatedAt: now },
        { marketplaceItemId: 2, categorieId: 5, createdAt: now, updatedAt: now },
        { marketplaceItemId: 3, categorieId: 4, createdAt: now, updatedAt: now },
        { marketplaceItemId: 4, categorieId: 4, createdAt: now, updatedAt: now }
      ]);

      // Place-Category Associations
      console.log('Seeding placeCategories...');
      await queryInterface.bulkInsert('placeCategories', [
        { placeId: 1, categorieId: 1, createdAt: now, updatedAt: now },
        { placeId: 2, categorieId: 2, createdAt: now, updatedAt: now }
      ]);

      // PlaceUser Associations
      console.log('Seeding placeUsers...');
      await queryInterface.bulkInsert('placeUsers', [
        { placeId: 1, userId: 1, rating: 5, createdAt: now, updatedAt: now },
        { placeId: 2, userId: 3, rating: 5, createdAt: now, updatedAt: now }
      ]);

      // Reviews
      console.log('Seeding reviews...');
      await queryInterface.bulkInsert('reviews', [
        { rating: 5, placeId: 1, userId: 1, createdAt: now, updatedAt: now },
        { rating: 4, placeId: 2, userId: 3, createdAt: now, updatedAt: now },
        { rating: 5, eventId: 2, userId: 3, createdAt: now, updatedAt: now }
      ]);

      // Media
      console.log('Seeding media...');
      await queryInterface.bulkInsert('media', [
        { url: 'https://example.com/beach-photo.jpg', type: 'image', userId: 1, placeId: 1, createdAt: now, updatedAt: now },
        { url: 'https://example.com/event-video.mp4', type: 'video', eventId: 1, createdAt: now, updatedAt: now },
        { url: 'https://example.com/mountain-photo.jpg', type: 'image', userId: 3, placeId: 2, createdAt: now, updatedAt: now }
      ]);

      // Chats
      console.log('Seeding chats...');
      await queryInterface.bulkInsert('chats', [
        { message: 'Hello, I have a question about the beach resort.', createdAt: now, updatedAt: now },
        { message: 'Sure, I can help you with that!', createdAt: now, updatedAt: now }
      ]);

      // Criteria (using original table name 'critiria')
      console.log('Seeding critiria...');
      await queryInterface.bulkInsert('critiria', [
        { name: 'Cleanliness', purcent: 25, placeUserId: 1, createdAt: now, updatedAt: now },
        { name: 'Service', purcent: 30, placeUserId: 1, createdAt: now, updatedAt: now },
        { name: 'Location', purcent: 20, placeUserId: 2, createdAt: now, updatedAt: now }
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
        'event_ratings',
        'favorites',
        'critiria', // Reverted to original name
        'chats',
        'media',
        'reviews',
        'placeUsers',
        'placeCategories',
        'marketplace_item_categories',
        'marketplace_items',
        'blogs',
        'events',
        'places',
        'categories',
        'advisors',
        'users'
      ];

      for (const table of tables) {
        console.log(`Deleting ${table}...`);
        await queryInterface.bulkDelete(table, null, {});
      }

      console.log('✅ Seeds reverted successfully!');
    } catch (error) {
      console.error('❌ Seed reversion failed:', error);
      throw error;
    }
  }
};