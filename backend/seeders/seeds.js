const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Users
    const users = await queryInterface.bulkInsert('users', [
      {
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        rank: 'platinum',
        points: 1000,
        profile_image: 'https://example.com/admin.jpg',
        bio: 'System administrator',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        email: 'advisor@example.com',
        password: await bcrypt.hash('advisor123', 10),
        first_name: 'Travel',
        last_name: 'Advisor',
        role: 'advisor',
        rank: 'gold',
        points: 750,
        profile_image: 'https://example.com/advisor.jpg',
        bio: 'Experienced travel advisor',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });

    // Advisors
    const advisors = await queryInterface.bulkInsert('advisors', [
      {
        userId: users[1].id,
        isVerified: true,
        currentRank: 'gold',
        cin: 'AB123456',
        points: 750,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });

    // Categories
    const categories = await queryInterface.bulkInsert('categories', [
      {
        name: 'Beaches',
        icon: '🏖️',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Mountains',
        icon: '⛰️',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });

    // Places
    const places = await queryInterface.bulkInsert('places', [
      {
        name: 'Beautiful Beach Resort',
        description: 'A stunning beach resort with white sand',
        location: 'Coastal City',
        images: JSON.stringify(['beach1.jpg', 'beach2.jpg']),
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });

    // Events
    await queryInterface.bulkInsert('events', [
      {
        title: 'Beach Party',
        description: 'Annual summer beach party',
        date: new Date('2024-07-01'),
        location: 'Beach Resort',
        images: JSON.stringify(['party1.jpg']),
        status: 'approved',
        advisorId: advisors[0].id,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Blogs
    await queryInterface.bulkInsert('blogs', [
      {
        title: 'Top 10 Beach Destinations',
        content: 'Discover the most beautiful beaches...',
        image: 'beach-blog.jpg',
        likes: 150,
        comments: JSON.stringify(['Great article!', 'Very helpful']),
        userId: users[1].id,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Place-Category associations
    await queryInterface.bulkInsert('placeCategories', [
      {
        placeId: places[0].id,
        categorieId: categories[0].id,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Reviews
    await queryInterface.bulkInsert('reviews', [
      {
        rating: 5,
        placeId: places[0].id,
        userId: users[0].id,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Media
    await queryInterface.bulkInsert('media', [
      {
        url: 'https://example.com/beach-photo.jpg',
        type: 'image',
        userId: users[0].id,
        placeId: places[0].id,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        url: 'https://example.com/event-video.mp4',
        type: 'video',
        eventId: events[0].id,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Chats
    await queryInterface.bulkInsert('chats', [
      {
        message: 'Hello, I have a question about the beach resort.',
        created_at: new Date()
      },
      {
        message: 'Sure, I can help you with that!',
        created_at: new Date()
      }
    ]);

    // Criteria
    await queryInterface.bulkInsert('critirias', [
      {
        name: 'Cleanliness',
        purcent: 25,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Service',
        purcent: 30,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Location',
        purcent: 20,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Favorites
    await queryInterface.bulkInsert('favorites', [
      {
        userId: users[0].id,
        placeId: places[0].id,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Ranks (Event Ratings)
    await queryInterface.bulkInsert('event_ratings', [
      {
        name: 'Bronze',
        targetPoints: 100,
        totalPoints: 0,
        advisorId: advisors[0].id,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Silver',
        targetPoints: 500,
        totalPoints: 250,
        advisorId: advisors[0].id,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // Delete all seeded data in reverse order
    await queryInterface.bulkDelete('event_ratings', null, {});
    await queryInterface.bulkDelete('favorites', null, {});
    await queryInterface.bulkDelete('critirias', null, {});
    await queryInterface.bulkDelete('chats', null, {});
    await queryInterface.bulkDelete('media', null, {});
    await queryInterface.bulkDelete('reviews', null, {});
    await queryInterface.bulkDelete('placeCategories', null, {});
    await queryInterface.bulkDelete('blogs', null, {});
    await queryInterface.bulkDelete('events', null, {});
    await queryInterface.bulkDelete('places', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('advisors', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
}; 