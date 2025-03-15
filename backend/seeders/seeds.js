'use strict';
const bcrypt = require('bcrypt');
const { PlaceCategorie } = require('../models');
const { faker } = require('@faker-js/faker');

// Helper functions for generating data with Faker
const generateUser = (id, role = 'user') => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const now = new Date();
  
  return {
    id,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    password: bcrypt.hashSync('password123', 10),
    first_name: firstName,
    last_name: lastName,
    role,
    points: faker.number.int({ min: 0, max: 500 }),
    profile_image: faker.helpers.maybe(() => faker.image.avatar(), { probability: 0.7 }),
    bio: faker.helpers.maybe(() => faker.lorem.paragraph(2), { probability: 0.8 }),
    experience: faker.helpers.maybe(() => faker.lorem.paragraph(1), { probability: 0.5 }),
    token: null,
    createdAt: now,
    updatedAt: now,
    isBanned: false
  };
};

const generatePlace = (id, status = 'approved') => {
  const now = new Date();
  const categories = ['beach', 'mountain', 'forest', 'desert', 'lake'];
  const category = faker.helpers.arrayElement(categories);
  
  // Generate location names that sound Tunisian
  const tunisianCities = ['Tunis', 'Sousse', 'Sfax', 'Kairouan', 'Bizerte', 'Gabès', 
    'Ariana', 'Gafsa', 'Monastir', 'Tataouine', 'El Kef', 'Mahdia', 'Nabeul', 'Hammamet', 
    'Jendouba', 'Siliana', 'Kasserine', 'Médenine', 'Tozeur', 'Kebili', 'Béja'];
  
  // Generate themed place names based on category
  let namePrefix;
  switch(category) {
    case 'beach': namePrefix = faker.helpers.arrayElement(['Sunny', 'Blue Wave', 'Golden Sand', 'Coastal', 'Seaside']); break;
    case 'mountain': namePrefix = faker.helpers.arrayElement(['Rocky', 'Summit', 'Highland', 'Peak', 'Mountain View']); break;
    case 'forest': namePrefix = faker.helpers.arrayElement(['Pine', 'Oak', 'Shadow', 'Green Valley', 'Woodland']); break;
    case 'desert': namePrefix = faker.helpers.arrayElement(['Dune', 'Oasis', 'Sahara', 'Desert Star', 'Golden']); break;
    case 'lake': namePrefix = faker.helpers.arrayElement(['Lakeside', 'Blue Water', 'Serene', 'Tranquil', 'Crystal']); break;
    default: namePrefix = faker.helpers.arrayElement(['Adventure', 'Nature', 'Eco', 'Wild', 'Safari']);
  }
  
  const location = faker.helpers.arrayElement(tunisianCities) + ', Tunisia';
  const name = `${namePrefix} ${category.charAt(0).toUpperCase() + category.slice(1)} Camp`;
  
  // Generate appropriate images based on category
  const imageCount = faker.number.int({ min: 1, max: 3 });
  const images = [];
  
  for (let i = 0; i < imageCount; i++) {
    // Use faker for placeholder images
    images.push(faker.image.url({ width: 640, height: 480, category }));
  }
  
  return {
    id,
    name,
    description: faker.lorem.paragraph(3),
    location,
    images: JSON.stringify(images),
    status,
    createdAt: now,
    updatedAt: now
  };
};

const generateBlog = (id, userId) => {
  const now = new Date();
  const topics = ['camping tips', 'outdoor cooking', 'survival skills', 'hiking trails', 'gear reviews', 'wildlife', 'camping with kids', 'photography', 'stargazing'];
  const topic = faker.helpers.arrayElement(topics);
  
  const titlePrefixes = ['Ultimate Guide to', 'Top 10', 'How to', 'Essential', 'Best Practices for', 'Exploring', 'Adventures in', 'Secrets of', 'Discovering'];
  const titlePrefix = faker.helpers.arrayElement(titlePrefixes);
  
  return {
    id,
    title: `${titlePrefix} ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
    content: faker.lorem.paragraphs(5),
    image: faker.image.url({ width: 800, height: 600, category: 'nature' }),
    likes: faker.number.int({ min: 0, max: 200 }),
    userId,
    createdAt: now,
    updatedAt: now
  };
};

const generateMarketplaceItem = (id, sellerId, status = 'available') => {
  const now = new Date();
  const itemTypes = ['tent', 'sleeping bag', 'cooking set', 'backpack', 'hiking boots', 'camping chair', 'headlamp', 'water filter', 'camping stove', 'multi-tool'];
  const itemType = faker.helpers.arrayElement(itemTypes);
  
  const conditions = ['brand new', 'like new', 'gently used', 'well used', 'refurbished'];
  const condition = faker.helpers.arrayElement(conditions);
  
  const brands = ['Coleman', 'North Face', 'REI', 'Kelty', 'Patagonia', 'MSR', 'Black Diamond', 'Mountain Hardwear', 'Osprey', 'Big Agnes'];
  const brand = faker.helpers.arrayElement(brands);
  
  const tunisianCities = ['Tunis', 'Sousse', 'Sfax', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana', 'Monastir', 'Hammamet'];
  const location = faker.helpers.arrayElement(tunisianCities);
  
  return {
    id,
    title: `${condition} ${brand} ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`,
    description: faker.lorem.paragraph(2),
    imageURL: faker.image.url({ width: 640, height: 480, category: 'nature' }),
    price: parseFloat(faker.commerce.price({ min: 10, max: 300, dec: 2 })),
    status,
    sellerId,
    buyerId: status === 'sold' ? faker.number.int({ min: 1, max: 20 }) : null,
    location,
    createdAt: now,
    updatedAt: now
  };
};

const generateReview = (id, userId, placeId) => {
  const now = new Date();
  return {
    id,
    rating: faker.number.int({ min: 3, max: 5 }), // Bias towards positive reviews
    comment: faker.lorem.paragraph(),
    placeId,
    userId,
    createdAt: now,
    updatedAt: now
  };
};

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
        { id: 5, name: 'Sleeping Gear', icon: '🛌', createdAt: now, updatedAt: now },
        // Additional location-based categories
        { id: 6, name: 'Beaches & Coastal Areas', icon: '🌊', createdAt: now, updatedAt: now },
        { id: 7, name: 'Mountain Trails', icon: '🏔️', createdAt: now, updatedAt: now },
        { id: 8, name: 'Forests & National Parks', icon: '🌳', createdAt: now, updatedAt: now },
        { id: 9, name: 'Deserts & Oases', icon: '🏜️', createdAt: now, updatedAt: now },
        { id: 10, name: 'Lakes & Rivers', icon: '💦', createdAt: now, updatedAt: now },
        { id: 11, name: 'Family Friendly', icon: '👨‍👩‍👧‍👦', createdAt: now, updatedAt: now },
        { id: 12, name: 'Adventure Camping', icon: '🧗', createdAt: now, updatedAt: now },
        { id: 13, name: 'Fishing Spots', icon: '🎣', createdAt: now, updatedAt: now },
        { id: 14, name: 'Stargazing', icon: '✨', createdAt: now, updatedAt: now },
        { id: 15, name: 'Beginner Friendly', icon: '🔰', createdAt: now, updatedAt: now }
      ]);

      // Places next
      console.log('Seeding places...');
      const existingPlaces = [
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
        },
        // New desert and oasis camping locations
        {
          id: 11,
          name: 'Douz Desert Camp',
          description: 'Experience authentic Sahara camping at the gateway to the desert. Sleep under the stars in traditional Bedouin tents. Camel treks and sand boarding activities available.',
          location: 'Douz, Kebili Governorate',
          images: JSON.stringify(['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPGhDegWCdU9Nrpw5qLa1qJzv9TjFU4z5WIQ&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJbBFD11lDdm9jb7RMT8MZs9WmcwkVCPxcOQ&s']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 12,
          name: 'Tozeur Oasis Retreat',
          description: 'Luxurious camping in the heart of Tunisia\'s most famous oasis. Palm groves, natural springs, and traditional architecture create a magical atmosphere. Guided tours of nearby film locations available.',
          location: 'Tozeur Oasis',
          images: JSON.stringify(['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQO88k7OZ_b8NdBfSJ-mL_yJ4al7Wg3lnFm2w&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxn8xm5TLCNF-DJZLvsaRUjYjDvLHB7UwYfQ&s']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 13,
          name: 'Chott El Jerid Salt Lake Camp',
          description: 'Surreal camping experience on the edge of Tunisia\'s largest salt lake. Witness spectacular sunrises and sunsets over the otherworldly landscape. Stargazing and night photography paradise.',
          location: 'Chott El Jerid, Tozeur',
          images: JSON.stringify(['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTAeCw-7YwfpTYaKJGDsweZT2DRkaOXv-vzQ&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPg8HvvjDBMEUkzYgGJNVxGa9A1qFnqvVNlQ&s']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 14,
          name: 'Matmata Cave Camping',
          description: 'Unique underground camping experience in traditional Berber cave dwellings. Featured in Star Wars films, these caves offer a cool retreat from desert heat. Cultural experiences include traditional cooking and music.',
          location: 'Matmata, Gabès Governorate',
          images: JSON.stringify(['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSe33EmwRaNE-xZbZ9s3FO9_QIFnKHHpnN0Fw&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZHbB14n__G4m6W1qwvYlOWvzJ_xEjkdyOYQ&s']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 15,
          name: 'Ksar Ghilane Oasis Camp',
          description: 'Remote desert oasis camping with natural hot springs. Relax in thermal waters after a day of desert exploration. Luxury tent accommodations with authentic desert experience.',
          location: 'Ksar Ghilane, Tataouine',
          images: JSON.stringify(['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0UOWl6LBC7rn03FvlMZeYX03mBq0dBhbkJQ&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEttxT5a3ekFNzbOEZmWYRxZQikY78aqrGWw&s']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        }
      ];
      
      // Generate additional places with Faker
      const additionalPlaces = [];
      
      // Tunisian locations for more authenticity
      const tunisianLocations = [
        'Hammamet', 'Nabeul', 'Monastir', 'Djerba', 'Mahdia', 'Kelibia', 
        'Sousse', 'Sfax', 'Carthage', 'Sidi Bou Said', 'Kairouan', 'El Jem',
        'Sbeitla', 'Enfidha', 'Gammarth', 'La Marsa', 'Korba', 'Mornag'
      ];
      
      for (let i = 16; i <= 25; i++) {
        // Generate appropriate place names based on what kind of camping spot it is
        const placeTypes = ['Beach', 'Mountain', 'Forest', 'Lake', 'Desert', 'Oasis'];
        const placeType = faker.helpers.arrayElement(placeTypes);
        
        let name;
        let imageTheme;
        
        switch(placeType) {
          case 'Beach':
            name = faker.helpers.arrayElement([
              'Coastal Haven', 'Sea Breeze Camp', 'Mediterranean View',
              'Blue Wave Retreat', 'Sandy Shore Camp'
            ]);
            imageTheme = 'beach';
            break;
          case 'Mountain':
            name = faker.helpers.arrayElement([
              'Alpine Heights', 'Mountain Ridge Camp', 'Peak Sanctuary',
              'Highland Refuge', 'Summit Retreat'
            ]);
            imageTheme = 'mountain';
            break;
          case 'Forest':
            name = faker.helpers.arrayElement([
              'Woodland Sanctuary', 'Forest Canopy Camp', 'Pine Grove Haven',
              'Nature\'s Embrace', 'Ancient Woods Camp'
            ]);
            imageTheme = 'forest';
            break;
          case 'Lake':
            name = faker.helpers.arrayElement([
              'Lakeview Campsite', 'Tranquil Waters', 'Lakeside Retreat',
              'Reflections Camp', 'Water\'s Edge'
            ]);
            imageTheme = 'lake';
            break;
          case 'Desert':
            name = faker.helpers.arrayElement([
              'Dune Sanctuary', 'Sahara Stars Camp', 'Desert Horizon',
              'Sunset Dunes', 'Nomad\'s Rest'
            ]);
            imageTheme = 'desert';
            break;
          case 'Oasis':
            name = faker.helpers.arrayElement([
              'Palm Oasis', 'Desert Springs', 'Verdant Haven',
              'Eden Camp', 'Mirage Retreat'
            ]);
            imageTheme = 'desert';
            break;
        }
        
        // Random location in Tunisia
        const location = faker.helpers.arrayElement(tunisianLocations) + ', Tunisia';
        
        // Generate 1-3 images
        const images = [];
        const imageCount = faker.number.int({ min: 1, max: 3 });
        for (let j = 0; j < imageCount; j++) {
          images.push(faker.image.url({ width: 800, height: 600 }));
        }
        
        additionalPlaces.push({
          id: i,
          name: `${name} ${placeType} Camp`,
          description: faker.lorem.paragraphs(2),
          location,
          images: JSON.stringify(images),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        });
      }
      
      await queryInterface.bulkInsert('places', [...existingPlaces, ...additionalPlaces]);

      // Users
      console.log('Seeding users...');
      const existingUsers = [
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
          updatedAt: now,
          isBanned: false
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
          updatedAt: now,
          isBanned: false
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
          updatedAt: now,
          isBanned: false
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
          updatedAt: now,
          isBanned: false
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
          updatedAt: now,
          isBanned: false
        }
      ];
      
      // Generate additional users with Faker
      const additionalUsers = [];
      for (let i = 6; i <= 20; i++) {
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
          createdAt: now,
          updatedAt: now,
          isBanned: false
        });
      }
      
      // Combine existing and new users
      await queryInterface.bulkInsert('users', [...existingUsers, ...additionalUsers]);

      // Advisors
      console.log('Seeding advisors...');
      const existingAdvisors = [
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
      ];
      
      // Generate advisors for new users with advisor role
      const additionalAdvisors = [];
      let advisorId = 2;
      
      // For each user with ID divisible by 5 (advisor role), create an advisor record
      for (let i = 10; i <= 20; i += 5) {
        additionalAdvisors.push({
          id: advisorId,
          userId: i,
          isVerified: faker.datatype.boolean(0.8), // 80% chance of being verified
          tokenVerification: faker.string.alphanumeric(16),
          currentRank: faker.helpers.arrayElement(['bronze', 'silver', 'gold', 'platinum']),
          cin: faker.string.alphanumeric(8).toUpperCase(),
          points: faker.number.int({ min: 50, max: 1000 }),
          createdAt: now,
          updatedAt: now
        });
        advisorId++;
      }
      
      // Combine existing and new advisors
      await queryInterface.bulkInsert('advisors', [...existingAdvisors, ...additionalAdvisors]);

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
      const existingItems = await queryInterface.bulkInsert('marketplaceitems', [
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
        },
        // New desert camping specialized gear
        {
          id: 5,
          title: 'Desert Trekking Tent',
          description: 'Specialized tent with UV protection and enhanced ventilation, designed for desert conditions. Sand-resistant zippers and reinforced stakes for secure anchoring in sand.',
          imageURL: 'https://example.com/desert-tent.jpg',
          price: 89.99,
          status: 'available',
          sellerId: 2, // Travel Advisor
          buyerId: null,
          location: 'Tozeur',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 6,
          title: 'Desert Hydration System',
          description: '3L capacity hydration backpack with insulated tubes to keep water cool in hot conditions. Built-in filtration system.',
          imageURL: 'https://example.com/hydration-pack.jpg',
          price: 45.00,
          status: 'available',
          sellerId: 4, // Sarah
          buyerId: null,
          location: 'Douz',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 7,
          title: 'Sand Protection Kit',
          description: 'Complete set for protecting gear from sand, includes covers for electronics, special bags for clothing, and anti-sand mats for tent entrances.',
          imageURL: 'https://example.com/sand-kit.jpg',
          price: 35.50,
          status: 'available',
          sellerId: 5, // Mike
          buyerId: null,
          location: 'Matmata',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 8,
          title: 'Solar Camping Shower',
          description: 'Portable shower that heats water using solar energy, perfect for desert camping where water is scarce but sun is plentiful.',
          imageURL: 'https://example.com/solar-shower.jpg',
          price: 28.99,
          status: 'available',
          sellerId: 3, // Regular User
          buyerId: null,
          location: 'Ksar Ghilane',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 9,
          title: 'Bedouin-Style Camping Rug',
          description: 'Traditional Tunisian handwoven rug, perfect for desert camping. Adds comfort and authentic style to your desert experience.',
          imageURL: 'https://example.com/bedouin-rug.jpg',
          price: 55.00,
          status: 'available',
          sellerId: 2, // Travel Advisor
          buyerId: null,
          location: 'Douz',
          createdAt: now,
          updatedAt: now
        }
      ], { returning: true });
      
      // Add 10 more items with Faker
      const fakerItems = [];
      for (let i = 10; i <= 20; i++) {
        const sellerId = faker.number.int({ min: 1, max: 10 });
        fakerItems.push({
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
      
      await queryInterface.bulkInsert('marketplaceitems', fakerItems);

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
        { marketplaceItemId: 4, marketplaceCategorieId: 3, createdAt: now, updatedAt: now }, // Cookware -> Cooking Equipment
        
        // New desert gear categories
        { marketplaceItemId: 5, marketplaceCategorieId: 1, createdAt: now, updatedAt: now }, // Desert Tent -> Tents & Shelters
        { marketplaceItemId: 5, marketplaceCategorieId: 6, createdAt: now, updatedAt: now }, // Desert Tent -> Tools & Equipment
        
        { marketplaceItemId: 6, marketplaceCategorieId: 5, createdAt: now, updatedAt: now }, // Hydration System -> Backpacks & Bags
        { marketplaceItemId: 6, marketplaceCategorieId: 6, createdAt: now, updatedAt: now }, // Hydration System -> Tools & Equipment
        
        { marketplaceItemId: 7, marketplaceCategorieId: 6, createdAt: now, updatedAt: now }, // Sand Protection Kit -> Tools & Equipment
        
        { marketplaceItemId: 8, marketplaceCategorieId: 6, createdAt: now, updatedAt: now }, // Solar Shower -> Tools & Equipment
        
        { marketplaceItemId: 9, marketplaceCategorieId: 2, createdAt: now, updatedAt: now } // Bedouin Rug -> Sleeping Gear
      ]);

      // PlaceCategories
      console.log('Seeding placeCategories...');
      await queryInterface.bulkInsert('placeCategories', [
        { placeId: 1, categorieId: 1, createdAt: now, updatedAt: now }, // Sidi El Barrak - Beaches
        { placeId: 2, categorieId: 2, createdAt: now, updatedAt: now }, // Ain Draham - Mountains
        { placeId: 3, categorieId: 1, createdAt: now, updatedAt: now }, // Cap Serrat - Beaches
        { placeId: 4, categorieId: 2, createdAt: now, updatedAt: now }, // Zaghouan - Mountains
        { placeId: 5, categorieId: 1, createdAt: now, updatedAt: now }, // El Haouaria - Beaches
        
        // New associations with the new categories
        { placeId: 1, categorieId: 6, createdAt: now, updatedAt: now }, // Sidi El Barrak - Beaches & Coastal Areas
        { placeId: 1, categorieId: 10, createdAt: now, updatedAt: now }, // Sidi El Barrak - Lakes & Rivers
        { placeId: 1, categorieId: 11, createdAt: now, updatedAt: now }, // Sidi El Barrak - Family Friendly
        
        { placeId: 2, categorieId: 7, createdAt: now, updatedAt: now }, // Ain Draham - Mountain Trails
        { placeId: 2, categorieId: 8, createdAt: now, updatedAt: now }, // Ain Draham - Forests & National Parks
        { placeId: 2, categorieId: 12, createdAt: now, updatedAt: now }, // Ain Draham - Adventure Camping
        
        { placeId: 3, categorieId: 6, createdAt: now, updatedAt: now }, // Cap Serrat - Beaches & Coastal Areas
        { placeId: 3, categorieId: 13, createdAt: now, updatedAt: now }, // Cap Serrat - Fishing Spots
        
        { placeId: 4, categorieId: 7, createdAt: now, updatedAt: now }, // Zaghouan - Mountain Trails
        { placeId: 4, categorieId: 14, createdAt: now, updatedAt: now }, // Zaghouan - Stargazing
        
        { placeId: 5, categorieId: 6, createdAt: now, updatedAt: now }, // El Haouaria - Beaches & Coastal Areas
        { placeId: 5, categorieId: 15, createdAt: now, updatedAt: now }, // El Haouaria - Beginner Friendly
        
        { placeId: 6, categorieId: 8, createdAt: now, updatedAt: now }, // Ichkeul - Forests & National Parks
        { placeId: 6, categorieId: 13, createdAt: now, updatedAt: now }, // Ichkeul - Fishing Spots
        
        { placeId: 7, categorieId: 8, createdAt: now, updatedAt: now }, // Tabarka - Forests & National Parks
        { placeId: 7, categorieId: 6, createdAt: now, updatedAt: now }, // Tabarka - Beaches & Coastal Areas
        
        { placeId: 8, categorieId: 10, createdAt: now, updatedAt: now }, // Beni Mtir - Lakes & Rivers
        
        { placeId: 9, categorieId: 7, createdAt: now, updatedAt: now }, // Djebel Ressas - Mountain Trails
        { placeId: 9, categorieId: 12, createdAt: now, updatedAt: now }, // Djebel Ressas - Adventure Camping
        
        { placeId: 10, categorieId: 10, createdAt: now, updatedAt: now }, // Bizerte Lakes - Lakes & Rivers
        
        // Desert and Oasis place categories
        { placeId: 11, categorieId: 9, createdAt: now, updatedAt: now }, // Douz Desert Camp - Deserts & Oases
        { placeId: 11, categorieId: 12, createdAt: now, updatedAt: now }, // Douz Desert Camp - Adventure Camping
        { placeId: 11, categorieId: 14, createdAt: now, updatedAt: now }, // Douz Desert Camp - Stargazing
        
        { placeId: 12, categorieId: 9, createdAt: now, updatedAt: now }, // Tozeur Oasis Retreat - Deserts & Oases
        { placeId: 12, categorieId: 11, createdAt: now, updatedAt: now }, // Tozeur Oasis Retreat - Family Friendly
        
        { placeId: 13, categorieId: 9, createdAt: now, updatedAt: now }, // Chott El Jerid Salt Lake Camp - Deserts & Oases
        { placeId: 13, categorieId: 14, createdAt: now, updatedAt: now }, // Chott El Jerid Salt Lake Camp - Stargazing
        { placeId: 13, categorieId: 12, createdAt: now, updatedAt: now }, // Chott El Jerid Salt Lake Camp - Adventure Camping
        
        { placeId: 14, categorieId: 9, createdAt: now, updatedAt: now }, // Matmata Cave Camping - Deserts & Oases
        { placeId: 14, categorieId: 15, createdAt: now, updatedAt: now }, // Matmata Cave Camping - Beginner Friendly
        
        { placeId: 15, categorieId: 9, createdAt: now, updatedAt: now }, // Ksar Ghilane Oasis Camp - Deserts & Oases
        { placeId: 15, categorieId: 11, createdAt: now, updatedAt: now }, // Ksar Ghilane Oasis Camp - Family Friendly
        { placeId: 15, categorieId: 14, createdAt: now, updatedAt: now } // Ksar Ghilane Oasis Camp - Stargazing
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
