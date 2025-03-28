# Campy - Explore, Camp, Connect

Campy is a mobile application designed to support tourism in Tunisia by helping users discover and explore camping spots and destinations. It provides real-time weather conditions, a marketplace for camping gear, user-generated experiences, event searches, itinerary planning, and a social community for campers.

## Features

### 🏕️ Discover Camping Destinations

- Explore a curated list of the best camping spots in Tunisia.
- Get recommendations based on weather conditions and time of year.
- View detailed descriptions, images, and user reviews of each location.

### 🌦️ Weather Forecast

- Get real-time weather updates for camping destinations.
- Plan your trip according to the best weather conditions.

### 🛒 Marketplace for Camping Gear

- Buy and sell camping equipment within the app.
- View item details, pricing, and user reviews.
- Secure transactions for a safe shopping experience.

### 💬 Messenger-Style Chat & Community Engagement

- Connect with other campers through real-time messaging.
- Chat features include text, images, and video calls.
- Sent messages appear on the right (blue bubbles), received messages on the left (gray bubbles), with user avatars.

### 📍 Itinerary Planner

- Plan your camping trip with an interactive itinerary builder.
- Add destinations, estimated travel times, and activities.

### 🚀 Events & Tours

- Search and join camping events and guided tours.
- Create and promote your own events within the community.

### 🆘 Emergency & Local Services

- Quick access to emergency contacts and local services.
- Locate nearby hospitals, rescue teams, and essential camping facilities.

## Tech Stack

### **Frontend:**

- **React Native** (for mobile development)
- **TypeScript** (for robust, scalable code)
- **Next.js** (for web integration)
- **React Native Maps** (for geolocation & mapping features)

### **Backend:**

- **Node.js & Express.js** (for API development)
- **Sequelize ORM & MySQL** (for database management)
- **JWT & Bcrypt** (for authentication & security)
- **Socket.io** (for real-time chat & messaging features)
- **Faker.js** (for generating mock data)

## Installation & Setup

### **1. Clone the Repository**

```sh
git clone https://github.com/final-project-rbk/camp.git
cd campy
```

### **2. Install Dependencies**

```sh
npm install
```

### **3. Set Up the Backend**

1. Create a `.env` file in the backend directory and configure your database credentials.
2. Run migrations using Sequelize:
   ```sh
   npx sequelize db:migrate
   ```
3. Start the backend server:
   ```sh
   npm run dev
   ```

### **4. Run the Mobile App**

```sh
npm start
```

## Contributing

We welcome contributions! Feel free to open issues or submit pull requests to improve Campy.

## License

This project is licensed under the **MIT License**.

## Contact

For any inquiries or support, contact **rayen\@campy.com** or visit our GitHub repository.

---

Happy Camping! ⛺🚀

