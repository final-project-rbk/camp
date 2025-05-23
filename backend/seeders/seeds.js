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
    userId,
    disabled: false,
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
          email: 'a@gmail.com',
          password: await bcrypt.hash('Abc123456$', 10),
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
          email: 'b@gmail.com',
          password: await bcrypt.hash('Abc123456$', 10),
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
          email: 'c@gmail.com',
          password: await bcrypt.hash('Abc123456$', 10),
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
          userId: 2,
          disabled: false,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          title: 'Best Mountain Trails',
          content: 'Explore the top mountain trails...',
          image: 'https://bloghiiker.files.wordpress.com/2023/07/shutterstock_688964890.jpg',
          userId: 3,
          disabled: false,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 3,
          title: 'Desert Camping Guide',
          content: 'Everything you need to know about camping in the Sahara...',
          image: 'https://mybayutcdn.bayut.com/mybayut/wp-content/uploads/shutterstock_1056187661-1024x640.jpg',
          userId: 2,
          disabled: false,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 4,
          title: 'Best Camping Gear 2024',
          content: 'A comprehensive guide to essential camping equipment...',
          image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9t8gqLxbqLmVVPQzNbZbAU2k8lDBwTHj7Gg&s',
          userId: 4,
          disabled: false,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 5,
          title: 'Hidden Gems: Secret Camping Spots',
          content: 'Discover Tunisia\'s lesser-known camping locations...',
          image: 'https://www.usatoday.com/gcdn/-mm-/0fda231a973d99460286fb318b4ecb54f1a3418f/c=0-484-3985-2736/local/-/media/2017/08/17/USATODAY/USATODAY/636385814865818731-20170609-USAT-0376.jpg?width=1733&height=975&fit=crop&format=pjpg&auto=webp',
          userId: 5,
          disabled: false,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 6,
          title: 'Beginner\'s Guide to Coastal Camping',
          content: 'Tips and tricks for your first beach camping adventure...',
          image: 'https://www.trespass.com/advice/wp-content/uploads/2018/08/Top-Tips-to-Survive-Family-Camping-Trips-1200x900.png',
          userId: 1,
          disabled: false,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 7,
          title: 'Wildlife Watching While Camping',
          content: 'Best spots and safety tips for observing wildlife...',
          image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8Rb6HKLXokRV1uLpdg2ExWiInSeaJJPNtyg&s',
          userId: 2,
          disabled: false,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 8,
          title: 'Eco-Friendly Camping Practices',
          content: 'How to camp sustainably and leave no trace...',
          image: 'https://www.undp.org/sites/g/files/zskgke326/files/migration/pk/PK-Eco-Camping.jpg',
          userId: 3,
          disabled: false,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 9,
          title: 'Winter Camping Essentials',
          content: 'Stay warm and safe during cold-weather camping...',
          image: 'https://www.miyaradventures.com/wp-content/uploads/2022/02/img1.jpg',
          userId: 4,
          disabled: false,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 10,
          title: 'Stargazing Camping Spots',
          content: 'Best locations for night sky observation while camping...',
          image: 'https://cdn.mos.cms.futurecdn.net/Yad64zizbbNCtXS5eZGMgB.jpg',
          userId: 5,
          disabled: false,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 11,
          title: 'Family Camping Adventures',
          content: 'How to plan a fun camping trip with kids...',
          image: 'https://www.mbizi.co.za/wp-content/uploads/2024/12/family-camping-checklist.png',
          userId: 1,
          disabled: false,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 12,
          title: 'Cooking Outdoors: Best Camping Recipes',
          content: 'Delicious meals to make over a campfire...',
          image: 'https://intrepidcampgear.com/cdn/shop/articles/iStock-965001994.jpg?v=1648255865',
          userId: 2,
          disabled: false,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 13,
          title: 'Solo Camping: Tips for Safety and Fun',
          content: 'Guide to enjoying a solo camping experience...',
          image: 'https://cdn.sanity.io/images/a8njjy3d/production/11524d7a6ce22ae75c8abab6ec4fcfbf27b812eb-2000x1061.jpg?fm=webp&q=80&auto=format',
          userId: 3,
          disabled: false,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 14,
          title: 'Photography Tips for Camping',
          content: 'Capture stunning nature shots on your next trip...',
          image: 'https://www.bestoflanka.com/images/camp1.jpg',
          userId: 4,
          disabled: false,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 15,
          title: 'Camping with Pets: What You Need to Know',
          content: 'Bringing your furry friends along for the adventure...',
          image: 'https://theexpertcamper.co.uk/wp-content/uploads/2024/06/tips-for-camping-with-dogs-what-you-need-to-know-pE.jpeg',
          userId: 5,
          disabled: false,
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

      // Comments
      console.log('Seeding comments...');
      await queryInterface.bulkInsert('comments', [
        {
          id: 1,
          content: 'This is a great post! I love the beach destinations you mentioned.',
          userId: 3,
          blogId: 1,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 2,
          content: 'I hiked on some of these trails last year. Amazing views!',
          userId: 4,
          blogId: 2,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 3,
          content: 'Do you have any tips for first-time desert campers?',
          userId: 5,
          blogId: 3,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 4,
          content: 'Great article!',
          userId: 1,
          blogId: 1,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 5,
          content: 'Very helpful',
          userId: 3,
          blogId: 1,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 6,
          content: 'Amazing views!',
          userId: 2,
          blogId: 2,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 7,
          content: 'This desert guide saved my trip!',
          userId: 4,
          blogId: 3,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 8,
          content: 'Thanks for the gear recommendations',
          userId: 5,
          blogId: 4,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 9,
          content: 'I visited one of these hidden spots - amazing!',
          userId: 1,
          blogId: 5,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 10,
          content: 'Great tips for beginners',
          userId: 3,
          blogId: 4,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 11,
          content: 'Planning to visit next month',
          userId: 2,
          blogId: 5,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 12,
          content: 'Perfect guide for my first camping trip!',
          userId: 4,
          blogId: 6,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 13,
          content: 'Saw amazing birds thanks to this!',
          userId: 5,
          blogId: 7,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 14,
          content: 'Love the eco-friendly tips',
          userId: 1,
          blogId: 8,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 15,
          content: 'These winter tips are spot on',
          userId: 2,
          blogId: 9,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 16,
          content: 'Cant wait to try these stargazing spots',
          userId: 3,
          blogId: 10,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 17,
          content: 'Really helpful sustainability advice',
          userId: 4,
          blogId: 8,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 18,
          content: 'The wildlife safety tips were great',
          userId: 5,
          blogId: 7,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 19,
          content: 'Adding these to my camping list!',
          userId: 1,
          blogId: 10,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 20,
          content: 'My kids loved the ideas in this post!',
          userId: 2,
          blogId: 11,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 21,
          content: 'These recipes are a game-changer',
          userId: 3,
          blogId: 12,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 22,
          content: 'Solo camping feels less daunting now',
          userId: 4,
          blogId: 13,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 23,
          content: 'Got some amazing shots thanks to this!',
          userId: 5,
          blogId: 14,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 24,
          content: 'Perfect for my dogs first camping trip',
          userId: 1,
          blogId: 15,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 25,
          content: 'Cant wait to try the campfire stew',
          userId: 4,
          blogId: 12,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 26,
          content: 'Great advice for family outings',
          userId: 5,
          blogId: 11,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 27,
          content: 'These photo tips are awesome',
          userId: 2,
          blogId: 14,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 28,
          content: 'Feeling more confident going solo',
          userId: 1,
          blogId: 13,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 29,
          content: 'My cat will love this trip!',
          userId: 3,
          blogId: 15,
          disabled: false,
          created_at: now,
          createdAt: now,
          updatedAt: now
        }
      ]);

      console.log('Seeding blog likes...');
      await queryInterface.bulkInsert('blog_likes', [
        // Admin likes several blogs
        { blogId: 1, userId: 1, createdAt: now, updatedAt: now },
        { blogId: 3, userId: 1, createdAt: now, updatedAt: now },
        { blogId: 5, userId: 1, createdAt: now, updatedAt: now },
        
        // Advisor likes some blogs
        { blogId: 2, userId: 2, createdAt: now, updatedAt: now },
        { blogId: 4, userId: 2, createdAt: now, updatedAt: now },
        { blogId: 6, userId: 2, createdAt: now, updatedAt: now },
        
        // Regular users like various blogs
        { blogId: 1, userId: 3, createdAt: now, updatedAt: now },
        { blogId: 2, userId: 3, createdAt: now, updatedAt: now },
        { blogId: 7, userId: 3, createdAt: now, updatedAt: now },
        
        { blogId: 3, userId: 4, createdAt: now, updatedAt: now },
        { blogId: 5, userId: 4, createdAt: now, updatedAt: now },
        { blogId: 8, userId: 4, createdAt: now, updatedAt: now },
        
        { blogId: 2, userId: 5, createdAt: now, updatedAt: now },
        { blogId: 4, userId: 5, createdAt: now, updatedAt: now },
        { blogId: 6, userId: 5, createdAt: now, updatedAt: now },
        
        // Add some popular blogs with multiple likes
        { blogId: 10, userId: 1, createdAt: now, updatedAt: now },
        { blogId: 10, userId: 2, createdAt: now, updatedAt: now },
        { blogId: 10, userId: 3, createdAt: now, updatedAt: now },
        { blogId: 10, userId: 4, createdAt: now, updatedAt: now },
        { blogId: 10, userId: 5, createdAt: now, updatedAt: now },
        
        { blogId: 15, userId: 1, createdAt: now, updatedAt: now },
        { blogId: 15, userId: 3, createdAt: now, updatedAt: now },
        { blogId: 15, userId: 5, createdAt: now, updatedAt: now }
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
        'blog_likes',
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
