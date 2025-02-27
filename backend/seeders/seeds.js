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
          name: 'Camping Sidi El Barrak',
          description: 'Beautiful lakeside camping site surrounded by pine forests. Perfect for nature lovers with facilities for tents and caravans. Features include fishing opportunities and hiking trails.',
          location: 'Nefza, Béja Governorate',
          images: JSON.stringify(['https://tse1.mm.bing.net/th?id=OIP.MY-smMH1_QwxSgN_7qqS6AAAAA&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          name: 'Ain Draham Forest Camping',
          description: 'Mountain camping in Tunisia\'s most beautiful cork oak forest. Cool climate year-round with excellent hiking opportunities and wildlife viewing.',
          location: 'Ain Draham, Jendouba',
          images: JSON.stringify(['https://tse3.mm.bing.net/th?id=OIP.y0Gjlm0ru4qOJpxUQupXWQHaE9&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 3,
          name: 'Desert Oasis Camp Douz',
          description: 'Authentic Sahara desert camping experience with traditional Bedouin-style tents. Offers camel treks, stargazing, and traditional music around the campfire.',
          location: 'Douz, Kebili',
          images: JSON.stringify(['https://tse4.mm.bing.net/th?id=OIP.nERywcqXC9uEPA-oDEVPHQHaFb&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 4,
          name: 'Cap Serrat Beach Camp',
          description: 'Coastal camping site with pristine beaches and crystal-clear waters. Perfect for snorkeling and beach activities.',
          location: 'Cap Serrat, Bizerte',
          images: JSON.stringify(['https://tse4.mm.bing.net/th?id=OIP.vuna-0qz5d5m1j1NhEopVQHaE7&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 5,
          name: 'Camping Le Kef',
          description: 'Mountain camping site offering panoramic views of the surrounding valleys. Great base for exploring Roman ruins and traditional Berber villages.',
          location: 'Le Kef',
          images: JSON.stringify(['https://tse2.mm.bing.net/th?id=OIP.KIsx9ZYw3T4R1otiXqHQZQHaE6&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 6,
          name: 'Ichkeul Lake Camp',
          description: 'Eco-camping near UNESCO World Heritage site. Perfect for birdwatching and nature photography.',
          location: 'Ichkeul National Park, Bizerte',
          images: JSON.stringify(['https://tse2.mm.bing.net/th?id=OIP.tOcDJMOAUFfA7T2UiwS9HQHaE7&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 7,
          name: 'Zaghouan Mountain Camp',
          description: 'High-altitude camping in the Zaghouan mountains. Close to the Roman Temple of Waters with excellent climbing opportunities.',
          location: 'Zaghouan',
          images: JSON.stringify(['https://tse2.mm.bing.net/th?id=OIP.vfiSwEDbe5pZr3T4qDqjeQHaE8&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 8,
          name: 'Tabarka Forest Camp',
          description: 'Coastal forest camping combining beach access with woodland serenity. Famous for its coral reefs and water activities.',
          location: 'Tabarka, Jendouba',
          images: JSON.stringify(['https://tse2.mm.bing.net/th?id=OIP.-rXJAEenmMwOtGQRt4dTMAHaD4&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 9,
          name: 'Chott El Jerid Camp',
          description: 'Unique camping experience on the edge of Tunisia\'s salt lake. Spectacular sunset views and otherworldly landscapes.',
          location: 'Tozeur',
          images: JSON.stringify(['https://example.com/chott-el-jerid.jpg']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 10,
          name: 'Beni Mtir Lake Camp',
          description: 'Peaceful lakeside camping in the mountains. Excellent for fishing and water sports.',
          location: 'Beni Mtir, Jendouba',
          images: JSON.stringify(['https://example.com/beni-mtir.jpg']),
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
          location: 'Beach ',
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
          message: 'Hello, I have a question about the beach .',
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
