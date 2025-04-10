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
    // Generate random coordinates for Tunisia based on location
    latitude: faker.number.float({ min: 30.2, max: 37.5, precision: 0.0001 }),
    longitude: faker.number.float({ min: 7.5, max: 11.6, precision: 0.0001 }),
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
        { id: 3, name: 'Forests', icon: '🌳', createdAt: now, updatedAt: now },
        { id: 4, name: 'Deserts', icon: '🏜️', createdAt: now, updatedAt: now },
        { id: 5, name: 'Lakes', icon: '💦', createdAt: now, updatedAt: now }
      ]);

      // Places next
      console.log('Seeding places...');
      const existingPlaces = [
        {
          id: 1,
          name: 'Camping Sidi El Barrak',
          description: 'Beautiful lakeside camping site surrounded by pine forests. Perfect for family camping with facilities for swimming, fishing, and hiking. Features clean amenities and designated BBQ areas.',
          location: 'Nefza, Béja Governorate',
          latitude: 37.1726,
          longitude: 9.2201,
          images: JSON.stringify(['https://picsum.photos/id/10/800/500', 'https://picsum.photos/id/11/800/500','https://picsum.photos/id/12/800/500']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          name: 'Ain Draham Forest Camp',
          description: 'Mountain camping in Tunisia\'s most beautiful cork oak forest. Experience cool mountain air and stunning views. Ideal for nature lovers and hikers.',
          location: 'Ain Draham, Jendouba',
          latitude: 36.7720,
          longitude: 8.6868,
          images: JSON.stringify(['https://picsum.photos/id/13/800/500','https://picsum.photos/id/14/800/500','https://picsum.photos/id/15/800/500']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 3,
          name: 'Cap Serrat Beach Camp',
          description: 'Pristine beachfront camping location with crystal clear waters. Perfect for snorkeling and beach activities. Offers both tent and cabin accommodations.',
          location: 'Cap Serrat, Bizerte',
          latitude: 37.2252,
          longitude: 9.2384,
          images: JSON.stringify(['https://picsum.photos/id/16/800/500','https://picsum.photos/id/17/800/500']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 4,
          name: 'Zaghouan Mountain Retreat',
          description: 'High-altitude camping site near the ancient Roman temple. Excellent for rock climbing and mountain biking. Spectacular sunrise views over the mountains.',
          location: 'Zaghouan Mountains',
          latitude: 36.3833,
          longitude: 10.1400,
          images: JSON.stringify(['https://images.unsplash.com/photo-1455496231601-e6195da1f841?w=500&auto=format','https://images.unsplash.com/photo-1464207687429-7505649dae38?w=500&auto=format']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 5,
          name: 'El Haouaria Beach Camp',
          description: 'Coastal camping ground with views of the Mediterranean. Famous for bird watching and wind sports. Close to ancient Punic caves.',
          location: 'El Haouaria, Cap Bon',
          latitude: 37.0517,
          longitude: 11.0072,
          images: JSON.stringify(['https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=500&auto=format','https://images.unsplash.com/photo-1526491109672-74740652b963?w=500&auto=format']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 6,
          name: 'Ichkeul National Park Camp',
          description: 'UNESCO World Heritage site offering unique ecosystem camping. Home to diverse bird species and lake views. Educational nature trails available.',
          location: 'Ichkeul, Bizerte',
          latitude: 37.1422,
          longitude: 9.6789,
          images: JSON.stringify(['https://images.unsplash.com/photo-1496545672447-f699b503d270?w=500&auto=format','https://images.unsplash.com/photo-1471115853179-bb1d604434e0?w=500&auto=format']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 7,
          name: 'Tabarka Pine Forest Camp',
          description: 'Seaside forest camping combining beach and woodland experiences. Close to coral reefs and historic Genoese fort. Excellent for diving enthusiasts.',
          location: 'Tabarka, Jendouba',
          latitude: 36.9547,
          longitude: 8.7594,
          images: JSON.stringify(['https://images.unsplash.com/photo-1484960055659-a39d25adcb3c?w=500&auto=format','https://images.unsplash.com/photo-1532339142463-fd0a8979791a?w=500&auto=format']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 8,
          name: 'Beni Mtir Lake Camp',
          description: 'Peaceful lakeside camping in the heart of Kroumirie. Surrounded by dense forests and offering water activities. Perfect for fishing and kayaking.',
          location: 'Beni Mtir, Jendouba',
          latitude: 36.7342,
          longitude: 8.7433,
          images: JSON.stringify(['https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=500&auto=format','https://images.unsplash.com/photo-1537905569824-f89f14cceb68?w=500&auto=format']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 9,
          name: 'Djebel Ressas Eco Camp',
          description: 'Eco-friendly mountain camping site with panoramic views of Tunis. Popular for climbing and hiking. Traditional Berber hospitality experience.',
          location: 'Djebel Ressas, Ben Arous',
          latitude: 36.5989,
          longitude: 10.3186,
          images: JSON.stringify(['https://images.unsplash.com/photo-1414016642750-7fdd78dc33d9?w=500&auto=format','https://images.unsplash.com/photo-1515444744559-7be63e1600de?w=500&auto=format']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 10,
          name: 'Bizerte Lakes Camp',
          description: 'Unique camping experience between the Mediterranean Sea and Bizerte Lake. Rich in marine life and bird watching opportunities. Water sports facilities available.',
          location: 'Bizerte',
          latitude: 37.2678,
          longitude: 9.8724,
          images: JSON.stringify(['https://images.unsplash.com/photo-1455763916899-e8b50eca9967?w=500&auto=format','https://images.unsplash.com/photo-1534187886935-1e1236e856c3?w=500&auto=format']),
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
          latitude: 33.4569,
          longitude: 9.0203,
          images: JSON.stringify(['https://images.unsplash.com/photo-1542401886-65d6c61db217?w=500&auto=format', 'https://images.unsplash.com/photo-1470093851219-69951fcbb533?w=500&auto=format']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 12,
          name: 'Tozeur Oasis Retreat',
          description: 'Luxurious camping in the heart of Tunisia\'s most famous oasis. Palm groves, natural springs, and traditional architecture create a magical atmosphere. Guided tours of nearby film locations available.',
          location: 'Tozeur Oasis',
          latitude: 33.9197,
          longitude: 8.1335,
          images: JSON.stringify(['https://images.unsplash.com/photo-1523496420900-3e6b8a2b39e4?w=500&auto=format', 'https://images.unsplash.com/photo-1604542031658-5799ca5d7936?w=500&auto=format']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 13,
          name: 'Chott El Jerid Salt Lake Camp',
          description: 'Surreal camping experience on the edge of Tunisia\'s largest salt lake. Witness spectacular sunrises and sunsets over the otherworldly landscape. Stargazing and night photography paradise.',
          location: 'Chott El Jerid, Tozeur',
          latitude: 33.7000,
          longitude: 8.4000,
          images: JSON.stringify(['https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=500&auto=format', 'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=500&auto=format']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 14,
          name: 'Matmata Cave Camping',
          description: 'Unique underground camping experience in traditional Berber cave dwellings. Featured in Star Wars films, these caves offer a cool retreat from desert heat. Cultural experiences include traditional cooking and music.',
          location: 'Matmata, Gabès Governorate',
          latitude: 33.5439,
          longitude: 9.9715,
          images: JSON.stringify(['https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=500&auto=format', 'https://images.unsplash.com/photo-1487730116645-74489c95b41b?w=500&auto=format']),
          status: 'approved',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 15,
          name: 'Ksar Ghilane Oasis Camp',
          description: 'Remote desert oasis camping with natural hot springs. Relax in thermal waters after a day of desert exploration. Luxury tent accommodations with authentic desert experience.',
          location: 'Ksar Ghilane, Tataouine',
          latitude: 32.9888,
          longitude: 9.6336,
          images: JSON.stringify(['https://images.unsplash.com/photo-1559521783-1d1599583485?w=500&auto=format', 'https://images.unsplash.com/photo-1533632359083-0185df1be85d?w=500&auto=format']),
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
          // Generate random coordinates for Tunisia
          // Tunisia's approximate bounds: 
          // Latitude: 30.2 to 37.5
          // Longitude: 7.5 to 11.6
          latitude: faker.number.float({ min: 30.2, max: 37.5, precision: 0.0001 }),
          longitude: faker.number.float({ min: 7.5, max: 11.6, precision: 0.0001 }),
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
          title: 'Portable Camping Stove',
          description: 'Compact gas stove with wind protection, ideal for outdoor cooking.',
          imageURL: 'https://scontent.ftun16-1.fna.fbcdn.net/v/t45.5328-4/474974329_2439868456357340_6004575026370459160_n.jpg?stp=dst-jpg_s960x960_tt6&_nc_cat=104&ccb=1-7&_nc_sid=247b10&_nc_ohc=IE3HsUiBMpAQ7kNvwHCEcP1&_nc_oc=AdmNEuNJCXRRIU06DfREb6K6-YhfEj13MPwgTnZstm14RKRfy1tQN0vDb1sCld9cTkM&_nc_zt=23&_nc_ht=scontent.ftun16-1.fna&_nc_gid=oVwsp70DL9v_IUET2oIxkA&oh=00_AfHP24smspBiB_U91aeIoWqeqveP-hiV5dyc6KovYF1KYA&oe=67FCF204',
          price: 29.50,
          status: 'sold',
          sellerId: 2,
          buyerId: 1,
          location: 'Ain Draham, Jendouba',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          title: 'Sleeping Bag (-5°C)',
          description: 'Warm and cozy sleeping bag for cold mountain nights.',
          imageURL: 'https://scontent.ftun16-1.fna.fbcdn.net/v/t45.5328-4/474368049_1140266557759964_8641816073624392036_n.jpg?stp=dst-jpg_p720x720_tt6&_nc_cat=111&ccb=1-7&_nc_sid=247b10&_nc_ohc=ibg_5a5c-r8Q7kNvwHBHGpQ&_nc_oc=AdlYW6cn11qJcgPJJrSBB2xZLR2NCxOeXjorCJE1Tg7cmTeXHNfTr-gfUnvynVHNbRw&_nc_zt=23&_nc_ht=scontent.ftun16-1.fna&_nc_gid=JCwhBcDZvHbp0hbI53OXlQ&oh=00_AfGJ0ewK-w0fQ3W-HbNQwWAElBRQMtAwp0yHz8JWEs_SmA&oe=67FCC727',
          price: 39.99,
          status: 'pending',
          sellerId: 3,
          buyerId: 2,
          location: 'Zaghouan',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 3,
          title: 'Camping Cookware Set',
          description: 'Lightweight aluminum cookware set including pots and pans.',
          imageURL: 'https://scontent.ftun16-1.fna.fbcdn.net/v/t45.5328-4/464678295_438502655955170_567627676550909839_n.jpg?stp=dst-jpg_s960x960_tt6&_nc_cat=107&ccb=1-7&_nc_sid=247b10&_nc_ohc=oymmdQ5--CkQ7kNvwHadBE4&_nc_oc=AdlFxKFWunb86v96vxaxL9K-8q36M5Pt4fcfH-XoLwrSzKIhx_SCTk2Hh8nbWj2wEtw&_nc_zt=23&_nc_ht=scontent.ftun16-1.fna&_nc_gid=48bBtmj49tIMnUBji7CTOQ&oh=00_AfGsmdDtoVRLLen3oNPyaVnkOKcyf_0piGvRiniEeYiFCg&oe=67FCE662',
          price: 25.00,
          status: 'available',
          sellerId: 1,
          buyerId: null,
          location: 'Tabarka, Jendouba',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 4,
          title: 'Desert Trekking Tent',
          description: 'Specialized tent with UV protection and enhanced ventilation, designed for desert conditions. Sand-resistant zippers and reinforced stakes for secure anchoring in sand.',
          imageURL: 'https://m.media-amazon.com/images/I/71tGPr6WCTL._AC_UF1000,1000_QL80_.jpg',
          price: 89.99,
          status: 'available',
          sellerId: 2,
          buyerId: null,
          location: 'Tozeur',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 5,
          title: 'Desert Hydration System',
          description: '3L capacity hydration backpack with insulated tubes to keep water cool in hot conditions. Built-in filtration system.',
          imageURL: 'https://cdn11.bigcommerce.com/s-jkwzatsr05/images/stencil/1280x1280/products/360/2176/img2085__16851.1673921189.jpg?c=2',
          price: 45.00,
          status: 'available',
          sellerId: 4,
          buyerId: null,
          location: 'Douz',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 6,
          title: 'Sand Protection Kit',
          description: 'Complete set for protecting gear from sand, includes covers for electronics, special bags for clothing, and anti-sand mats for tent entrances.',
          imageURL: 'https://m.media-amazon.com/images/I/717cxFF6X2L._AC_UF894,1000_QL80_.jpg',
          price: 35.50,
          status: 'available',
          sellerId: 5,
          buyerId: null,
          location: 'Matmata',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 7,
          title: 'Solar Camping Shower',
          description: 'Portable shower that heats water using solar energy, perfect for desert camping where water is scarce but sun is plentiful.',
          imageURL: 'https://scontent.ftun16-1.fna.fbcdn.net/v/t39.30808-6/487344574_10238417336398677_1799390328818583113_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=E3UU7-iGrSoQ7kNvwEf9Nd2&_nc_oc=AdmvoDToYOUB5OTn_PEGZ3CP25jBp1lRd38hHrjLECLNRzgMKUMzb2M4ka4YyBTends&_nc_zt=23&_nc_ht=scontent.ftun16-1.fna&_nc_gid=onc5Fco5vISgyO8t44WULw&oh=00_AfFPg5wC0A7TGA1QJACubnfPWRrHBRXrHtC5KglleHLhjw&oe=67FCCC7E',
          price: 28.99,
          status: 'available',
          sellerId: 3,
          buyerId: null,
          location: 'Ksar Ghilane',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 8,
          title: 'Bedouin-Style Camping Rug',
          description: 'Traditional Tunisian handwoven rug, perfect for desert camping. Adds comfort and authentic style to your desert experience.',
          imageURL: 'https://belltent.co.uk/cdn/shop/files/carpet-hand-loomed-patterned-moroccan_1600x.jpg',
          price: 55.00,
          status: 'available',
          sellerId: 2,
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
        // Basic location categories
        { placeId: 1, categorieId: 1, createdAt: now, updatedAt: now }, // Sidi El Barrak - Beaches
        { placeId: 1, categorieId: 5, createdAt: now, updatedAt: now }, // Sidi El Barrak - Lakes
        
        { placeId: 2, categorieId: 2, createdAt: now, updatedAt: now }, // Ain Draham - Mountains
        { placeId: 2, categorieId: 3, createdAt: now, updatedAt: now }, // Ain Draham - Forests
        
        { placeId: 3, categorieId: 1, createdAt: now, updatedAt: now }, // Cap Serrat - Beaches
        
        { placeId: 4, categorieId: 2, createdAt: now, updatedAt: now }, // Zaghouan - Mountains
        
        { placeId: 5, categorieId: 1, createdAt: now, updatedAt: now }, // El Haouaria - Beaches
        
        { placeId: 6, categorieId: 3, createdAt: now, updatedAt: now }, // Ichkeul - Forests
        { placeId: 6, categorieId: 5, createdAt: now, updatedAt: now }, // Ichkeul - Lakes
        
        { placeId: 7, categorieId: 3, createdAt: now, updatedAt: now }, // Tabarka - Forests
        { placeId: 7, categorieId: 1, createdAt: now, updatedAt: now }, // Tabarka - Beaches
        
        { placeId: 8, categorieId: 5, createdAt: now, updatedAt: now }, // Beni Mtir - Lakes
        
        { placeId: 9, categorieId: 2, createdAt: now, updatedAt: now }, // Djebel Ressas - Mountains
        
        { placeId: 10, categorieId: 5, createdAt: now, updatedAt: now }, // Bizerte Lakes - Lakes
        
        // Desert place categories
        { placeId: 11, categorieId: 4, createdAt: now, updatedAt: now }, // Douz Desert Camp - Deserts
        
        { placeId: 12, categorieId: 4, createdAt: now, updatedAt: now }, // Tozeur Oasis Retreat - Deserts
        
        { placeId: 13, categorieId: 4, createdAt: now, updatedAt: now }, // Chott El Jerid Salt Lake Camp - Deserts
        { placeId: 13, categorieId: 5, createdAt: now, updatedAt: now }, // Chott El Jerid Salt Lake Camp - Lakes
        
        { placeId: 14, categorieId: 4, createdAt: now, updatedAt: now }, // Matmata Cave Camping - Deserts
        
        { placeId: 15, categorieId: 4, createdAt: now, updatedAt: now }, // Ksar Ghilane Oasis Camp - Deserts
        
        // Additional places (Faker generated)
        { placeId: 16, categorieId: 1, createdAt: now, updatedAt: now }, // Faker place - Beaches
        { placeId: 17, categorieId: 2, createdAt: now, updatedAt: now }, // Faker place - Mountains
        { placeId: 18, categorieId: 3, createdAt: now, updatedAt: now }, // Faker place - Forests
        { placeId: 19, categorieId: 4, createdAt: now, updatedAt: now }, // Faker place - Deserts
        { placeId: 20, categorieId: 5, createdAt: now, updatedAt: now }, // Faker place - Lakes
        { placeId: 21, categorieId: 1, createdAt: now, updatedAt: now }, // Faker place - Beaches
        { placeId: 22, categorieId: 2, createdAt: now, updatedAt: now }, // Faker place - Mountains
        { placeId: 23, categorieId: 3, createdAt: now, updatedAt: now }, // Faker place - Forests
        { placeId: 24, categorieId: 4, createdAt: now, updatedAt: now }, // Faker place - Deserts
        { placeId: 25, categorieId: 5, createdAt: now, updatedAt: now }  // Faker place - Lakes
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

      // Seed hints/tutorials data
      console.log('Seeding hints/tutorials...');
      await queryInterface.bulkInsert('hints', [
        // Fire category hints
        {
          id: 1,
          title: "5 Ways to Start a Fire Without Matches",
          description: "Master the art of fire starting using natural materials and basic tools. This comprehensive guide covers friction methods, solar ignition, chemical reactions, and more to ensure you can always create fire in survival situations.",
          difficulty: "intermediate",
          timeToComplete: "15-20 mins",
          image: "https://images.unsplash.com/photo-1475738972911-5b44ce984c42?w=800&auto=format",
          gallerySteps: JSON.stringify([
            {
              step: 1,
              title: "Gather Materials",
              description: "Start by gathering dry tinder like small twigs, dry leaves, and bark. Look for materials that catch fire easily.",
              image: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=600&auto=format"
            },
            {
              step: 2,
              title: "Create a Fire Bow",
              description: "Create a fire bow using a flexible branch and a shoelace or strong cord. This will be your tool for creating friction.",
              image: "https://images.unsplash.com/photo-1510239792459-a4cdbef71a5e?w=600&auto=format"
            },
            {
              step: 3,
              title: "Build Your Setup",
              description: "Position the spindle and apply downward pressure while moving the bow back and forth to create friction.",
              image: "https://images.unsplash.com/photo-1479741044197-d28dfb400181?w=600&auto=format"
            },
            {
              step: 4,
              title: "Create an Ember",
              description: "Use the ember to ignite your tinder bundle by gently blowing on it to provide oxygen.",
              image: "https://images.unsplash.com/photo-1519616425099-4d4a2f0eada1?w=600&auto=format"
            },
            {
              step: 5,
              title: "Build Your Fire",
              description: "Carefully nurture the flame with small kindling, gradually adding larger pieces as the fire grows.",
              image: "https://images.unsplash.com/photo-1567446190843-a45f19ad7503?w=600&auto=format"
            }
          ]),
          views: 127,
          category: 'fire',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          title: "How to Build a Campfire That Lasts All Night",
          description: "Learn to build a long-lasting, safe campfire using the teepee method. Perfect for beginners who want to enjoy warmth throughout the night without constant maintenance.",
          difficulty: "beginner",
          timeToComplete: "10-15 mins",
          image: "https://images.unsplash.com/photo-1497906539264-eb74442e37a9?w=800&auto=format",
          gallerySteps: JSON.stringify([
            {
              step: 1,
              title: "Choose the Right Location",
              description: "Find a safe spot away from trees and brush. Use an existing fire ring if available.",
              image: "https://images.unsplash.com/photo-1542332213-7b40ced7b7c6?w=600&auto=format"
            },
            {
              step: 2,
              title: "Gather Your Materials",
              description: "Collect tinder (dry leaves, paper), kindling (small sticks), and fuel (larger logs).",
              image: "https://images.unsplash.com/photo-1580286923998-09fb2cc928dc?w=600&auto=format"
            },
            {
              step: 3,
              title: "Build the Teepee Structure",
              description: "Create a teepee structure with your kindling around a core of tinder.",
              image: "https://images.unsplash.com/photo-1475003087144-7bca17597d2c?w=600&auto=format"
            },
            {
              step: 4,
              title: "Light the Tinder",
              description: "Carefully light the tinder at the base of your teepee.",
              image: "https://images.unsplash.com/photo-1543466375-e6676802eff9?w=600&auto=format"
            },
            {
              step: 5,
              title: "Add Larger Logs",
              description: "Once the kindling catches, add larger logs to the outside of the teepee.",
              image: "https://images.unsplash.com/photo-1576710139879-3db3737346a5?w=600&auto=format"
            },
            {
              step: 6,
              title: "Maintain Your Fire",
              description: "For an all-night fire, add large logs in a star pattern and push them into the center as they burn.",
              image: "https://images.unsplash.com/photo-1490635230914-6b21f6633068?w=600&auto=format"
            }
          ]),
          views: 245,
          category: 'fire',
          createdAt: now,
          updatedAt: now
        },
        
        // Shelter category hints
        {
          id: 3,
          title: "Emergency Shelter Building Techniques",
          description: "Create a weatherproof shelter using natural materials found in different environments. These survival skills could be essential in emergency situations to protect yourself from the elements.",
          difficulty: "advanced",
          timeToComplete: "30-45 mins",
          image: "https://images.unsplash.com/photo-1532339142463-fd0a8979791a?w=800&auto=format",
          gallerySteps: JSON.stringify([
            {
              step: 1,
              title: "Select Your Location",
              description: "Find a suitable location away from hazards like dead trees, flash flood zones, and animal paths.",
              image: "https://images.unsplash.com/photo-1590003273241-11e84268401a?w=600&auto=format"
            },
            {
              step: 2,
              title: "Gather Materials",
              description: "Collect long branches for the frame, smaller branches for supports, and leaves, grass, or pine needles for insulation.",
              image: "https://images.unsplash.com/photo-1633439038840-992e5dcf4ff9?w=600&auto=format"
            },
            {
              step: 3,
              title: "Build the Frame",
              description: "Create an A-frame structure by leaning branches against a support like a fallen tree or between two trees.",
              image: "https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format"
            },
            {
              step: 4,
              title: "Add Cross Supports",
              description: "Layer smaller branches horizontally across your frame to create a lattice structure.",
              image: "https://images.unsplash.com/photo-1588668214407-6109f3e2c86a?w=600&auto=format"
            },
            {
              step: 5,
              title: "Add Insulation",
              description: "Cover your frame with leaves, grass, or pine needles, starting from the bottom and working upward like shingles.",
              image: "https://images.unsplash.com/photo-1571687949921-1306bfb24b72?w=600&auto=format"
            },
            {
              step: 6,
              title: "Create a Thick Layer",
              description: "Add at least 6-12 inches of insulating material to keep you warm and dry.",
              image: "https://images.unsplash.com/photo-1583003250278-3a62805e4ce5?w=600&auto=format"
            },
            {
              step: 7,
              title: "Prepare the Interior",
              description: "Create a bed of insulating material inside to keep you off the cold ground.",
              image: "https://images.unsplash.com/photo-1603379050995-607571ddf5bf?w=600&auto=format"
            }
          ]),
          views: 168,
          category: 'shelter',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 4,
          title: "Quick Tarp Shelter Setups",
          description: "Learn five different ways to set up a tarp shelter quickly and effectively. Protect yourself from rain, wind, and sun with minimal equipment.",
          difficulty: "beginner",
          timeToComplete: "5-10 mins",
          image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&auto=format",
          gallerySteps: JSON.stringify([
            {
              step: 1,
              title: "A-Frame Shelter",
              description: "The most basic and versatile setup - string a ridgeline between two trees and drape your tarp over it.",
              image: "https://images.unsplash.com/photo-1567639044414-1e12dfe89c65?w=600&auto=format"
            },
            {
              step: 2,
              title: "Lean-To Shelter",
              description: "Quick protection from wind and rain from one direction - anchor one side to the ground and elevate the other.",
              image: "https://images.unsplash.com/photo-1581230141647-d7b04e5c2ea2?w=600&auto=format"
            },
            {
              step: 3,
              title: "Diamond Shelter",
              description: "Excellent rain protection with good airflow - anchor opposite corners to the ground and elevate the other two.",
              image: "https://images.unsplash.com/photo-1524656855800-59465ebcec69?w=600&auto=format"
            },
            {
              step: 4,
              title: "Arrow Head Shelter",
              description: "Great for high winds - create a pointed front facing into the wind with a more spacious rear area.",
              image: "https://images.unsplash.com/photo-1590496793923-d4244a4040d6?w=600&auto=format"
            },
            {
              step: 5,
              title: "C-Fly Shelter",
              description: "Curved setup that provides excellent protection from wind while maximizing interior space.",
              image: "https://images.unsplash.com/photo-1563299796-17596ed6b017?w=600&auto=format"
            }
          ]),
          views: 203,
          category: 'shelter',
          createdAt: now,
          updatedAt: now
        },
        
        // Food category hints
        {
          id: 5,
          title: "3 One-Pot Camping Meals Anyone Can Make",
          description: "Master the basics of cooking delicious meals over a campfire with these simple one-pot recipes that require minimal equipment and ingredients.",
          difficulty: "beginner",
          timeToComplete: "20-25 mins",
          image: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&auto=format",
          gallerySteps: JSON.stringify([
            {
              step: 1,
              title: "Campfire Chili",
              description: "Cook ground beef, add canned beans, tomatoes, and spices. Simmer until thickened for a hearty meal.",
              image: "https://images.unsplash.com/photo-1540914124281-342587941389?w=600&auto=format"
            },
            {
              step: 2,
              title: "Veggie Pasta Primavera",
              description: "Boil pasta, add olive oil, pre-chopped vegetables, and pre-grated cheese for a quick and satisfying meal.",
              image: "https://images.unsplash.com/photo-1499296668315-d819885aabad?w=600&auto=format"
            },
            {
              step: 3,
              title: "Breakfast Skillet",
              description: "Cook potatoes until crispy, add eggs, pre-cooked meat, and cheese for a filling start to your day.",
              image: "https://images.unsplash.com/photo-1559054663-e8d23213f55c?w=600&auto=format"
            }
          ]),
          views: 312,
          category: 'food',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 6,
          title: "Foraging for Wild Edibles: What's Safe and What's Not",
          description: "Learn to identify common wild edible plants that can supplement your camping meals, with clear guidance on look-alikes to avoid.",
          difficulty: "intermediate",
          timeToComplete: "An ongoing skill",
          image: "https://images.unsplash.com/photo-1565789559254-4233d2061af9?w=800&auto=format",
          gallerySteps: JSON.stringify([
            {
              step: 1,
              title: "Blackberries & Raspberries",
              description: "Easy to identify, these berries grow on thorny canes and are safe to eat when ripe.",
              image: "https://images.unsplash.com/photo-1615485925600-97237c4fc1ec?w=600&auto=format"
            },
            {
              step: 2,
              title: "Dandelions",
              description: "Entirely edible from root to flower. Young leaves are less bitter and great in salads.",
              image: "https://images.unsplash.com/photo-1553921162-c4d037b7f329?w=600&auto=format"
            },
            {
              step: 3,
              title: "Chickweed",
              description: "Look for the single line of hairs along the stem and white star-shaped flowers. Tastes like mild spinach.",
              image: "https://images.unsplash.com/photo-1589045366481-28dcad6a6e59?w=600&auto=format"
            },
            {
              step: 4,
              title: "Pine Needles",
              description: "Rich in vitamin C, they can be steeped to make tea. Avoid yew trees which look similar but are toxic!",
              image: "https://images.unsplash.com/photo-1481232927785-53b3a8f5c5fb?w=600&auto=format"
            },
            {
              step: 5,
              title: "CAUTION: Proper Identification",
              description: "Never eat anything you cannot identify with 100% certainty. Consult multiple reliable sources.",
              image: "https://images.unsplash.com/photo-1588099636131-4930ddd7889b?w=600&auto=format"
            }
          ]),
          views: 189,
          category: 'food',
          createdAt: now,
          updatedAt: now
        },
        
        // Gear category hints
        {
          id: 7,
          title: "Essential Gear Maintenance",
          description: "Keep your camping gear in top condition with these maintenance tips to extend the life of your equipment and ensure it's ready when you need it.",
          difficulty: "intermediate",
          timeToComplete: "25-30 mins",
          image: "https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=800&auto=format",
          gallerySteps: JSON.stringify([
            {
              step: 1,
              title: "Tent Care",
              description: "Clean and dry tent after each use. Never store wet or dirty. Repair small holes immediately with repair tape.",
              image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=600&auto=format"
            },
            {
              step: 2,
              title: "Sleeping Bag Maintenance",
              description: "Air out after each trip. Store uncompressed in a large cotton bag. Clean according to manufacturer's instructions.",
              image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format"
            },
            {
              step: 3,
              title: "Backpack Care",
              description: "Empty completely after trips. Hand wash with mild soap when dirty. Check and tighten loose stitching.",
              image: "https://images.unsplash.com/photo-1494029722188-672a328c4d65?w=600&auto=format"
            },
            {
              step: 4,
              title: "Cooking Equipment",
              description: "Thoroughly clean after each use. Remove all food residue. Check fuel lines for leaks on stoves.",
              image: "https://images.unsplash.com/photo-1623461487986-9400110de28e?w=600&auto=format"
            },
            {
              step: 5,
              title: "Footwear Maintenance",
              description: "Clean and dry boots after each trip. Apply appropriate waterproofing. Replace insoles as needed.",
              image: "https://images.unsplash.com/photo-1520219306100-ec294a8a1370?w=600&auto=format"
            },
            {
              step: 6,
              title: "Tools and Knives",
              description: "Clean, dry, and oil metal tools after use. Sharpen blades regularly. Remove any rust immediately.",
              image: "https://images.unsplash.com/photo-1551431009-a802eeec77b1?w=600&auto=format"
            }
          ]),
          views: 234,
          category: 'gear',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 8,
          title: "Choosing the Right Backpack",
          description: "Learn how to select the perfect backpack for your camping and hiking needs, focusing on fit, capacity, and features.",
          difficulty: "beginner",
          timeToComplete: "15 mins",
          image: "https://images.unsplash.com/photo-1501554728187-ce583db33af7?w=800&auto=format",
          gallerySteps: JSON.stringify([
            {
              step: 1,
              title: "Determine Your Needs",
              description: "Day hiking: 20-35L, Weekend trip: 35-50L, Multi-day backpacking: 50-70L, Extended trips: 70L+",
              image: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=600&auto=format"
            },
            {
              step: 2,
              title: "Getting the Right Fit",
              description: "Measure your torso length and hip size. The backpack should match your torso length for proper weight distribution.",
              image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&auto=format"
            },
            {
              step: 3,
              title: "Frame Types",
              description: "Internal frames: Better balance and stability. External frames: Better ventilation and carrying capacity.",
              image: "https://images.unsplash.com/photo-1594494842862-ee71a755e4d7?w=600&auto=format"
            },
            {
              step: 4,
              title: "Essential Features",
              description: "Look for adjustable suspension, padded hip belt, multiple compartments, and external attachment points.",
              image: "https://images.unsplash.com/photo-1580913428023-02c695666d61?w=600&auto=format"
            },
            {
              step: 5,
              title: "Try Before You Buy",
              description: "Load the pack with 15-20 pounds and walk around to test comfort. Pay attention to pressure points.",
              image: "https://images.unsplash.com/photo-1624777904860-ba41c9aa45a9?w=600&auto=format"
            }
          ]),
          views: 278,
          category: 'gear',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 9,
          title: "Water Purification Methods in the Wild",
          description: "Learn different techniques to make water safe for drinking when camping in remote areas. Protect yourself from waterborne illnesses with these proven methods.",
          difficulty: "intermediate",
          timeToComplete: "10-30 mins depending on method",
          image: "https://images.unsplash.com/photo-1590322356624-00a400b9fb21?w=800&auto=format",
          gallerySteps: JSON.stringify([
            {
              step: 1,
              title: "Boiling",
              description: "The most reliable method. Bring water to a rolling boil for 1 minute (3 minutes at high altitudes).",
              image: "https://images.unsplash.com/photo-1616668983570-1556a107cd9c?w=600&auto=format"
            },
            {
              step: 2,
              title: "Chemical Treatment",
              description: "Use iodine or chlorine tablets following package instructions. Wait the full recommended time.",
              image: "https://images.unsplash.com/photo-1550834777-dd411d209b9c?w=600&auto=format"
            },
            {
              step: 3,
              title: "Water Filters",
              description: "Pump or gravity filters remove particles and many pathogens. Check the micron rating for effectiveness.",
              image: "https://images.unsplash.com/photo-1523362289600-a70b4a0e09aa?w=600&auto=format"
            },
            {
              step: 4,
              title: "UV Purifiers",
              description: "Handheld UV devices disrupt the DNA of pathogens. Requires clear water to be effective.",
              image: "https://images.unsplash.com/photo-1536939459926-301728717817?w=600&auto=format"
            },
            {
              step: 5,
              title: "Emergency Solar Disinfection",
              description: "Fill clear plastic bottles and expose to full sunlight for at least 6 hours (or 2 days if cloudy).",
              image: "https://images.unsplash.com/photo-1593076867932-fafe4291a160?w=600&auto=format"
            }
          ]),
          views: 195,
          category: 'gear',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 10,
          title: "Navigation Without GPS",
          description: "Essential wilderness navigation skills using map, compass, and natural indicators. Be prepared for when technology fails or batteries die.",
          difficulty: "advanced",
          timeToComplete: "Practice regularly",
          image: "https://images.unsplash.com/photo-1518542928841-2c99f8992d7d?w=800&auto=format",
          gallerySteps: JSON.stringify([
            {
              step: 1,
              title: "Map Reading Basics",
              description: "Learn to interpret topographic features, contour lines, and map symbols. Always orient your map to north.",
              image: "https://images.unsplash.com/photo-1439857271264-8ea0641273d3?w=600&auto=format"
            },
            {
              step: 2,
              title: "Compass Navigation",
              description: "Take and follow bearings. Learn to account for magnetic declination in your area.",
              image: "https://images.unsplash.com/photo-1615486203993-c39caba63a7b?w=600&auto=format"
            },
            {
              step: 3,
              title: "Sun Navigation",
              description: "The sun rises in the east and sets in the west. At noon in the northern hemisphere, it's directly south.",
              image: "https://images.unsplash.com/photo-1504387103978-e4ee71100c68?w=600&auto=format"
            },
            {
              step: 4,
              title: "Star Navigation",
              description: "Find the North Star (Polaris) by locating the Big Dipper and following the pointer stars.",
              image: "https://images.unsplash.com/photo-1528196471972-3e4c4d85c8b0?w=600&auto=format"
            },
            {
              step: 5,
              title: "Natural Indicators",
              description: "Moss often grows on the north side of trees in the northern hemisphere. Snow melts faster on south-facing slopes.",
              image: "https://images.unsplash.com/photo-1472897248068-3273ef004bb8?w=600&auto=format"
            },
            {
              step: 6,
              title: "Triangulation",
              description: "Locate your position by taking bearings to three known landmarks and finding where they intersect on your map.",
              image: "https://images.unsplash.com/photo-1501909694088-56913151bb7c?w=600&auto=format"
            }
          ]),
          views: 167,
          category: 'gear',
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
        'media',
        'reviews',
        'placeUsers',
        'placeCategories',
        'marketplace_item_categories',
        'chats',
        'marketplace_items',
        'marketplace_categorie',
        'comments',
        'blogs',
        'events',
        'hints',
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
