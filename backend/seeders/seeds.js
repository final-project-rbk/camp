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
          id: 1, // Explicitly set IDs
          email: 'admin@example.com',
          password: await bcrypt.hash('admin123', 10),
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin',
          // rank: 'platinum',
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
          // rank: 'gold',
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
          // rank: 'bronze',
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
          userId: 2, // Reference to advisor user
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
        {
          id: 1,
          name: 'Beaches',
          icon: '🏖️',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          name: 'Mountains',
          icon: '⛰️',
          createdAt: now,
          updatedAt: now
        }
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
      const events = await queryInterface.bulkInsert('events', [
        {id:1,
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
        {id:2,
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
      const blogs = await queryInterface.bulkInsert('blogs', [
        {
          id: 1,
          title: 'Top 10 Beach Destinations',
          content: 'Discover the most beautiful beaches...',
          image: 'beach-blog.jpg',
          likes: 150,
          userId: 2,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          title: 'Best Mountain Trails',
          content: 'Explore the top mountain trails...',
          image: 'mountain-blog.jpg',
          likes: 75,
          userId: 3,
          createdAt: now,
          updatedAt: now
        }
      ], { returning: true });

      // Comments
      await queryInterface.bulkInsert('comments', [
        {
          content: 'Great article!',
          userId: 1,
          blogId: 1,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'Very helpful',
          userId: 3,
          blogId: 1,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'Amazing views!',
          userId: 2,
          blogId: 2,
          created_at: now,
          createdAt: now,
          updatedAt: now
        }
      ]);

      // Place-Category associations
      await queryInterface.bulkInsert('placeCategories', [
        {
          placeId: 1,
          categorieId: 1,
          createdAt: now,
          updatedAt: now
        },
        {
          placeId: 2,
          categorieId: 2,
          createdAt: now,
          updatedAt: now
        }
      ]);

      // PlaceUser associations
      await queryInterface.bulkInsert('placeUsers', [
        {
          placeId: 1,
          userId: 1,
          rating: 5,

          createdAt: now,
          updatedAt: now
        },
        {
          placeId: 2,
          userId: 3,
          rating: 5,

          createdAt: now,
          updatedAt: now
        }
      ]);

      // Reviews
      await queryInterface.bulkInsert('reviews', [
        {
          rating: 5,
          placeId: 1,
          userId: 1,
          createdAt: now,
          updatedAt: now
        },
        {
          rating: 4,
          placeId: 2,
          userId: 3,
          createdAt: now,
          updatedAt: now
        },
        {
          rating: 5,
          eventId: 2,
          userId: 3,
          createdAt: now,
          updatedAt: now
        }
      ]);

      // Media
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
          eventId: 1,
          createdAt: now,
          updatedAt: now
        },
        {
          url: 'https://example.com/mountain-photo.jpg',
          type: 'image',
          userId: 3,
          placeId: 2,
          createdAt: now,
          updatedAt: now
        }
      ]);

      // Chats
      await queryInterface.bulkInsert('chats', [
        {
          message: 'Hello, I have a question about the beach resort.',
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
      await queryInterface.bulkInsert('critiria', [
        {
          name: 'Cleanliness',
          purcent: 25,
          placeUserId: 1, // Assuming first PlaceUser record
          createdAt: now,
          updatedAt: now
        },
        {
          name: 'Service',
          purcent: 30,
          placeUserId: 1,
          createdAt: now,
          updatedAt: now
        },
        {
          name: 'Location',
          purcent: 20,
          placeUserId: 2,
          createdAt: now,
          updatedAt: now
        }
      ]);

      // Favorites
      await queryInterface.bulkInsert('favorites', [
        {
          userId: 1,
          placeId: 1,
          createdAt: now,
          updatedAt: now
        },
        {
          userId: 3,
          placeId: 2,
          createdAt: now,
          updatedAt: now
        }
      ]);

      // Ranks (Event Ratings)
      await queryInterface.bulkInsert('event_ratings', [
        {
          name: 'Bronze',
          targetPoints: 100,
          totalPoints: 0,
          advisorId: 1,
          createdAt: now,
          updatedAt: now
        },
        {
          name: 'Silver',
          targetPoints: 500,
          totalPoints: 250,
          advisorId: 1,
          createdAt: now,
          updatedAt: now
        }
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
      // Delete in reverse order to handle foreign key constraints
      const tables = [
        'event_ratings',
        'favorites',
        'critiria',
        'chats',
        'media',
        'reviews',
        'placeUsers',
        'placeCategories',
        'comments',
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
