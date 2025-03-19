'use strict';
const bcrypt = require('bcrypt');
const { PlaceCategorie } = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    try {
      // Categories first
      console.log('Seeding categories...');
      await queryInterface.bulkInsert('categories', [
        { id: 1, name: 'Beaches', icon: '🏖️', createdAt: now, updatedAt: now },
        { id: 2, name: 'Mountains', icon: '⛰️', createdAt: now, updatedAt: now },
        { id: 3, name: 'Tents', icon: '⛺', createdAt: now, updatedAt: now },
        { id: 4, name: 'Cooking Gear', icon: '🍳', createdAt: now, updatedAt: now },
        { id: 5, name: 'Sleeping Gear', icon: '🛌', createdAt: now, updatedAt: now }
      ]);

      // Places next
      console.log('Seeding places...');
      await queryInterface.bulkInsert('places', [
        {
          id: 1,
          name: 'Camping Sidi El Barrak',
          description: 'Beautiful lakeside camping site surrounded by pine forests. Perfect for family camping with facilities for swimming, fishing, and hiking. Features clean amenities and designated BBQ areas.',
          location: 'Nefza, Béja Governorate',
          images: JSON.stringify(['https://tse4.mm.bing.net/th?id=OIP.4NCKP0mz0yyWSV9A0YvQUgHaEn&pid=Api&P=0&h=180', 'https://tse4.mm.bing.net/th?id=OIP.D6sedfp1iELYgVbJjwp8BwHaEL&pid=Api&P=0&h=180', 'https://tse2.mm.bing.net/th?id=OIP.viaBXMo6i_IcSFZ1FH5y_wHaD4&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          name: 'Ain Draham Forest Camp',
          description: 'Mountain camping in Tunisia\'s most beautiful cork oak forest. Experience cool mountain air and stunning views. Ideal for nature lovers and hikers.',
          location: 'Ain Draham, Jendouba',
          images: JSON.stringify(['https://tse2.mm.bing.net/th?id=OIP.K2x67hQ69-pwC-YodDsU_AHaEK&pid=Api&P=0&h=180', 'https://tse4.mm.bing.net/th?id=OIP.QH1tMVKIwYPJG02bWuZAPAHaF8&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 3,
          name: 'Cap Serrat Beach Camp',
          description: 'Pristine beachfront camping location with crystal clear waters. Perfect for snorkeling and beach activities. Offers both tent and cabin accommodations.',
          location: 'Cap Serrat, Bizerte',
          images: JSON.stringify(['https://tse3.mm.bing.net/th?id=OIP.L8b9V_JBXTED_fXyo3HBMwHaEO&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 4,
          name: 'Zaghouan Mountain Retreat',
          description: 'High-altitude camping site near the ancient Roman temple. Excellent for rock climbing and mountain biking. Spectacular sunrise views over the mountains.',
          location: 'Zaghouan Mountains',
          images: JSON.stringify(['https://tse2.mm.bing.net/th?id=OIP.kC7t2HXoLKoFb_Du_zeKjAHaEy&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 5,
          name: 'El Haouaria Beach Camp',
          description: 'Coastal camping ground with views of the Mediterranean. Famous for bird watching and wind sports. Close to ancient Punic caves.',
          location: 'El Haouaria, Cap Bon',
          images: JSON.stringify(['https://tse4.mm.bing.net/th?id=OIP.o4RErH7oNDsUEfbZuHfn2AHaE8&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 6,
          name: 'Ichkeul National Park Camp',
          description: 'UNESCO World Heritage site offering unique ecosystem camping. Home to diverse bird species and lake views. Educational nature trails available.',
          location: 'Ichkeul, Bizerte',
          images: JSON.stringify(['https://tse3.mm.bing.net/th?id=OIP.008BML1vqjxr9JlRjT8vvQHaFj&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 7,
          name: 'Tabarka Pine Forest Camp',
          description: 'Seaside forest camping combining beach and woodland experiences. Close to coral reefs and historic Genoese fort. Excellent for diving enthusiasts.',
          location: 'Tabarka, Jendouba',
          images: JSON.stringify(['https://tse1.mm.bing.net/th?id=OIP.-SRgaUg8bfBFBVg9HSVdAQHaEK&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 8,
          name: 'Beni Mtir Lake Camp',
          description: 'Peaceful lakeside camping in the heart of Kroumirie. Surrounded by dense forests and offering water activities. Perfect for fishing and kayaking.',
          location: 'Beni Mtir, Jendouba',
          images: JSON.stringify(['https://tse2.mm.bing.net/th?id=OIP.ZbLNphhEfXC_6gV2yQDpAAHaFj&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 9,
          name: 'Djebel Ressas Eco Camp',
          description: 'Eco-friendly mountain camping site with panoramic views of Tunis. Popular for climbing and hiking. Traditional Berber hospitality experience.',
          location: 'Djebel Ressas, Ben Arous',
          images: JSON.stringify(['https://tse4.mm.bing.net/th?id=OIP.-A2pBpuqXaMNSFwhc6g0aAHaEK&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 10,
          name: 'Bizerte Lakes Camp',
          description: 'Unique camping experience between the Mediterranean Sea and Bizerte Lake. Rich in marine life and bird watching opportunities. Water sports facilities available.',
          location: 'Bizerte',
          images: JSON.stringify(['https://tse1.mm.bing.net/th?id=OIP.ZX7GnxeyaHJD8fLr8TlrvAAAAA&pid=Api&P=0&h=180']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        }
      ]);

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
          profile_image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDJzEaxLN-jGRYYUO65pWu7Q9GXoNt4LUSSA&s',
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
          profile_image: 'https://plus.unsplash.com/premium_photo-1683121366070-5ceb7e007a97?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8dXNlcnxlbnwwfHwwfHx8MA%3D%3D',
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
          profile_image: null,
          bio: 'Travel enthusiast',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 4,
          email: 'sarah@example.com',
          password: await bcrypt.hash('sarah123', 10),
          first_name: 'Sarah',
          last_name: 'Smith',
          role: 'user',
          points: 200,
          profile_image: 'https://wac-cdn.atlassian.com/dam/jcr:ba03a215-2f45-40f5-8540-b2015223c918/Max-R_Headshot%20(1).jpg?cdnVersion=2582',
          bio: 'Adventure seeker and photographer',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 5,
          email: 'mike@example.com',
          password: await bcrypt.hash('mike123', 10),
          first_name: 'Mike',
          last_name: 'Johnson',
          role: 'user',
          points: 150,
          profile_image: null,
          bio: 'Nature enthusiast',
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

      // Events
      console.log('Seeding events...');
      await queryInterface.bulkInsert('events', [
        {
          id: 1,
          title: 'Beach Party',
          description: 'Annual summer beach party',
          date: new Date('2025-07-01'),
          location: 'Cap Serrat Beach',
          images: JSON.stringify(['https://tse4.mm.bing.net/th?id=OIP.WlpjsOtn3uHbLUJeM7TOyAHaE7&pid=Api&P=0&h=180']),
          status: 'approved',
          advisorId: 1,
          created_at: now,
          updated_at: now
        },
        {
          id: 2,
          title: 'Mountain Hiking Event',
          description: 'Group hiking in the mountains',
          date: new Date('2025-08-15'),
          location: 'Ain Draham Mountains',
          images: JSON.stringify(['https://tse2.mm.bing.net/th?id=OIP.K2x67hQ69-pwC-YodDsU_AHaEK&pid=Api&P=0&h=180']),
          status: 'approved',
          advisorId: 1,
          created_at: now,
          updated_at: now
        },
        {
          id: 3,
          title: 'Forest Camping Weekend',
          description: 'Weekend camping in the beautiful forests of Tabarka',
          date: new Date('2025-09-20'),
          location: 'Tabarka Forest',
          images: JSON.stringify(['https://tse1.mm.bing.net/th?id=OIP.-SRgaUg8bfBFBVg9HSVdAQHaEK&pid=Api&P=0&h=180']),
          status: 'approved',
          advisorId: 1,
          created_at: now,
          updated_at: now
        },
        {
          id: 4,
          title: 'Desert Adventure',
          description: 'Explore the Sahara desert with experienced guides',
          date: new Date('2025-10-10'),
          location: 'Douz Desert',
          images: JSON.stringify(['https://tse2.mm.bing.net/th?id=OIP.kC7t2HXoLKoFb_Du_zeKjAHaEy&pid=Api&P=0&h=180']),
          status: 'approved',
          advisorId: 1,
          created_at: now,
          updated_at: now
        },
        {
          id: 5,
          title: 'Lake Fishing Tournament',
          description: 'Annual fishing competition at Ichkeul Lake',
          date: new Date('2025-11-01'),
          location: 'Ichkeul Lake',
          images: JSON.stringify(['https://tse3.mm.bing.net/th?id=OIP.008BML1vqjxr9JlRjT8vvQHaFj&pid=Api&P=0&h=180']),
          status: 'approved',
          advisorId: 1,
          created_at: now,
          updated_at: now
        },
        {
          id: 6,
          title: 'Bird Watching Expedition',
          description: 'Guided tour to observe migratory birds',
          date: new Date('2025-12-15'),
          location: 'El Haouaria',
          images: JSON.stringify(['https://tse4.mm.bing.net/th?id=OIP.o4RErH7oNDsUEfbZuHfn2AHaE8&pid=Api&P=0&h=180']),
          status: 'approved',
          advisorId: 1,
          created_at: now,
          updated_at: now
        },
        {
          id: 7,
          title: 'Winter Camping Experience',
          description: 'Experience camping in the winter mountains',
          date: new Date('2026-01-20'),
          location: 'Zaghouan Mountains',
          images: JSON.stringify(['https://tse4.mm.bing.net/th?id=OIP.-A2pBpuqXaMNSFwhc6g0aAHaEK&pid=Api&P=0&h=180']),
          status: 'approved',
          advisorId: 1,
          created_at: now,
          updated_at: now
        },
        {
          id: 8,
          title: 'Spring Nature Walk',
          description: 'Guided nature walk through blooming landscapes',
          date: new Date('2026-03-15'),
          location: 'Beni Mtir',
          images: JSON.stringify(['https://tse2.mm.bing.net/th?id=OIP.ZbLNphhEfXC_6gV2yQDpAAHaFj&pid=Api&P=0&h=180']),
          status: 'approved',
          advisorId: 1,
          created_at: now,
          updated_at: now
        }
      ]);

      // Blogs
      console.log('Seeding blogs...');
      const blogs = await queryInterface.bulkInsert('blogs', [
        {
          id: 1,
          title: 'Top 10 Beach Destinations',
          content: 'Discover the most beautiful beaches...',
          image: 'https://www.visitstpeteclearwater.com/sites/default/files/styles/large_horizontal_wide/public/2021-05/STANDARD-VSPC2014-D4-Bonfire-0037_R.jpg?h=c3635fa2&itok=0lKUIJra',
          likes: 150,
          userId: 2,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          title: 'Best Mountain Trails',
          content: 'Explore the top mountain trails...',
          image: 'https://bloghiiker.files.wordpress.com/2023/07/shutterstock_688964890.jpg',
          likes: 75,
          userId: 3,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 3,
          title: 'Desert Camping Guide',
          content: 'Everything you need to know about camping in the Sahara...',
          image: 'https://mybayutcdn.bayut.com/mybayut/wp-content/uploads/shutterstock_1056187661-1024x640.jpg',
          likes: 120,
          userId: 2,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 4,
          title: 'Best Camping Gear 2024',
          content: 'A comprehensive guide to essential camping equipment...',
          image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9t8gqLxbqLmVVPQzNbZbAU2k8lDBwTHj7Gg&s',
          likes: 95,
          userId: 4,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 5,
          title: 'Hidden Gems: Secret Camping Spots',
          content: 'Discover Tunisia\'s lesser-known camping locations...',
          image: 'https://www.usatoday.com/gcdn/-mm-/0fda231a973d99460286fb318b4ecb54f1a3418f/c=0-484-3985-2736/local/-/media/2017/08/17/USATODAY/USATODAY/636385814865818731-20170609-USAT-0376.jpg?width=1733&height=975&fit=crop&format=pjpg&auto=webp',
          likes: 180,
          userId: 5,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 6,
          title: 'Beginner\'s Guide to Coastal Camping',
          content: 'Tips and tricks for your first beach camping adventure...',
          image: 'https://www.trespass.com/advice/wp-content/uploads/2018/08/Top-Tips-to-Survive-Family-Camping-Trips-1200x900.png',
          likes: 85,
          userId: 1,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 7,
          title: 'Wildlife Watching While Camping',
          content: 'Best spots and safety tips for observing wildlife...',
          image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8Rb6HKLXokRV1uLpdg2ExWiInSeaJJPNtyg&s',
          likes: 110,
          userId: 2,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 8,
          title: 'Eco-Friendly Camping Practices',
          content: 'How to camp sustainably and leave no trace...',
          image: 'https://www.undp.org/sites/g/files/zskgke326/files/migration/pk/PK-Eco-Camping.jpg',
          likes: 145,
          userId: 3,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 9,
          title: 'Winter Camping Essentials',
          content: 'Stay warm and safe during cold-weather camping...',
          image: 'https://www.miyaradventures.com/wp-content/uploads/2022/02/img1.jpg',
          likes: 90,
          userId: 4,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 10,
          title: 'Stargazing Camping Spots',
          content: 'Best locations for night sky observation while camping...',
          image: 'https://cdn.mos.cms.futurecdn.net/Yad64zizbbNCtXS5eZGMgB.jpg',
          likes: 130,
          userId: 5,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 11,
          title: 'Family Camping Adventures',
          content: 'How to plan a fun camping trip with kids...',
          image: 'https://www.mbizi.co.za/wp-content/uploads/2024/12/family-camping-checklist.png',
          likes: 105,
          userId: 1,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 12,
          title: 'Cooking Outdoors: Best Camping Recipes',
          content: 'Delicious meals to make over a campfire...',
          image: 'https://intrepidcampgear.com/cdn/shop/articles/iStock-965001994.jpg?v=1648255865',
          likes: 125,
          userId: 2,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 13,
          title: 'Solo Camping: Tips for Safety and Fun',
          content: 'Guide to enjoying a solo camping experience...',
          image: 'https://cdn.sanity.io/images/a8njjy3d/production/11524d7a6ce22ae75c8abab6ec4fcfbf27b812eb-2000x1061.jpg?fm=webp&q=80&auto=format',
          likes: 80,
          userId: 3,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 14,
          title: 'Photography Tips for Camping',
          content: 'Capture stunning nature shots on your next trip...',
          image: 'https://www.bestoflanka.com/images/camp1.jpg',
          likes: 115,
          userId: 4,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 15,
          title: 'Camping with Pets: What You Need to Know',
          content: 'Bringing your furry friends along for the adventure...',
          image: 'https://theexpertcamper.co.uk/wp-content/uploads/2024/06/tips-for-camping-with-dogs-what-you-need-to-know-pE.jpeg',
          likes: 95,
          userId: 5,
          createdAt: now,
          updatedAt: now
        }
      ], { returning: true });

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
        { placeId: 2, categorieId: 2, createdAt: now, updatedAt: now }, // Sidi El Barrak - Tents
        { placeId: 3, categorieId: 3, createdAt: now, updatedAt: now }, // Ain Draham - Mountains
        { placeId: 4, categorieId: 4, createdAt: now, updatedAt: now }, // Ain Draham - Tents
        { placeId: 5, categorieId: 5, createdAt: now, updatedAt: now }, // Cap Serrat - Beaches
        { placeId: 6, categorieId: 1, createdAt: now, updatedAt: now }, // Cap Serrat - Tents
        { placeId: 7, categorieId: 2, createdAt: now, updatedAt: now }, // Zaghouan - Mountains
        { placeId: 8, categorieId: 3, createdAt: now, updatedAt: now }, // Zaghouan - Sleeping Gear
        { placeId: 9, categorieId: 4, createdAt: now, updatedAt: now }, // El Haouaria - Beaches
        { placeId: 10, categorieId: 5, createdAt: now, updatedAt: now }, // El Haouaria - Tents
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
        { rating: 5, placeId: 2, userId: 3, createdAt: now, updatedAt: now }
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
        },
        {
          url: 'https://example.com/marketplace-item-photo.jpg',
          type: 'image',
          userId: 2,
          placeId: 3, // Add a valid placeId (e.g., Cap Serrat Beach Camp)
          marketplaceItemId: 1,
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

      // Comments for blogs
      console.log('Seeding comments...');
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
        },
        {
          content: 'This desert guide saved my trip!',
          userId: 4,
          blogId: 3,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'Thanks for the gear recommendations',
          userId: 5,
          blogId: 4,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'I visited one of these hidden spots - amazing!',
          userId: 1,
          blogId: 5,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'Great tips for beginners',
          userId: 3,
          blogId: 4,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'Planning to visit next month',
          userId: 2,
          blogId: 5,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'Perfect guide for my first camping trip!',
          userId: 4,
          blogId: 6,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'Saw amazing birds thanks to this!',
          userId: 5,
          blogId: 7,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'Love the eco-friendly tips',
          userId: 1,
          blogId: 8,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'These winter tips are spot on',
          userId: 2,
          blogId: 9,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'Cant wait to try these stargazing spots',
          userId: 3,
          blogId: 10,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'Really helpful sustainability advice',
          userId: 4,
          blogId: 8,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'The wildlife safety tips were great',
          userId: 5,
          blogId: 7,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'Adding these to my camping list!',
          userId: 1,
          blogId: 10,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'My kids loved the ideas in this post!',
          userId: 2,
          blogId: 11,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'These recipes are a game-changer',
          userId: 3,
          blogId: 12,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'Solo camping feels less daunting now',
          userId: 4,
          blogId: 13,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'Got some amazing shots thanks to this!',
          userId: 5,
          blogId: 14,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'Perfect for my dogs first camping trip',
          userId: 1,
          blogId: 15,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'Cant wait to try the campfire stew',
          userId: 4,
          blogId: 12,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'Great advice for family outings',
          userId: 5,
          blogId: 11,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'These photo tips are awesome',
          userId: 2,
          blogId: 14,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'Feeling more confident going solo',
          userId: 1,
          blogId: 13,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          content: 'My cat will love this trip!',
          userId: 3,
          blogId: 15,
          created_at: now,
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
      const tables = [
        'event_ratings',
        'favorites',
        'critiria',
        'chats',
        'media',
        'reviews',
        'placeUsers',
        'placeCategories',
        'marketplace_item_categories',
        'marketplace_items',
        'comments',
        'blogs',
        'events',
        'places',
        'categories',
        'advisors',
        'users'
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
