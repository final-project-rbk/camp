import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const popularDestinations = [
  {
    id: '1',
    name: 'Ghabet Lbondak',
    location: 'Nabeul',
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1920',
    rating: 4.5,
    temperature: 15,
  },
  {
    id: '2',
    name: 'Ain Drahem',
    location: 'Jendouba',
    image: 'https://images.unsplash.com/photo-1508873696983-2dfd5898f08b?q=80&w=1920',
    rating: 4.8,
    temperature: 18,
  },
  {
    id: '3',
    name: 'Camp Mars',
    location: 'Douz',
    image: 'https://images.unsplash.com/photo-1517823382935-51bfcb0ec6bc?q=80&w=1920',
    rating: 4.6,
    temperature: 22,
  },
];

interface WeatherData {
  temp_c: number;
  condition: {
    text: string;
    icon: string;
  };
}

export default function DiscoverScreen() {
  const [weatherData, setWeatherData] = useState<{ [key: string]: WeatherData }>({});
  const [loading, setLoading] = useState(true);

  const fetchWeather = async (location: string) => {
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=b9f7a2866bfe4141aae172643252402&q=${location}&aqi=no`
      );
      const data = await response.json();
      return {
        temp_c: data.current.temp_c,
        condition: {
          text: data.current.condition.text,
          icon: data.current.condition.icon,
        },
      };
    } catch (error) {
      console.error('Error fetching weather:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadWeatherData = async () => {
      setLoading(true);
      const locations = ['Ariana,Tunisia', ...popularDestinations.map(d => `${d.location},Tunisia`)];
      const weatherPromises = locations.map(location => fetchWeather(location));
      const results = await Promise.all(weatherPromises);
      
      const weatherMap: { [key: string]: WeatherData } = {};
      locations.forEach((location, index) => {
        if (results[index]) {
          weatherMap[location.split(',')[0]] = results[index]!;
        }
      });
      
      setWeatherData(weatherMap);
      setLoading(false);
    };

    loadWeatherData();
  }, []);

  const getWeatherIcon = (condition: string) => {
    // Map weather conditions to Ionicons
    if (condition.toLowerCase().includes('sunny')) return 'sunny';
    if (condition.toLowerCase().includes('cloud')) return 'cloudy';
    if (condition.toLowerCase().includes('rain')) return 'rainy';
    return 'partly-sunny';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning</Text>
          <Text style={styles.location}>Ariana, Tunisia</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.weatherContainer}>
            {loading ? (
              <ActivityIndicator color="#64FFDA" />
            ) : weatherData['Ariana'] ? (
              <>
                <Image 
                  source={{ uri: `https:${weatherData['Ariana'].condition.icon}` }}
                  style={{ width: 24, height: 24 }}
                />
                <Text style={styles.temperature}>{Math.round(weatherData['Ariana'].temp_c)}°</Text>
              </>
            ) : (
              <>
                <Ionicons name="sunny" size={24} color="#64FFDA" />
                <Text style={styles.temperature}>--°</Text>
              </>
            )}
          </View>
          <Link href="/advisor-profile" asChild>
            <Pressable style={styles.profileButton}>
              <Ionicons name="person-circle-outline" size={32} color="#64FFDA" />
            </Pressable>
          </Link>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8892B0" />
        <Text style={styles.searchPlaceholder}>Search destinations...</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Destinations</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.destinationsScroll}>
          {popularDestinations.map((destination) => (
            <Pressable key={destination.id} style={styles.destinationCard}>
              <Image source={{ uri: destination.image }} style={styles.destinationImage} />
              <View style={styles.destinationInfo}>
                <Text style={styles.destinationName}>{destination.name}</Text>
                <View style={styles.destinationDetails}>
                  <View style={styles.locationContainer}>
                    <Ionicons name="location" size={14} color="#8892B0" />
                    <Text style={styles.destinationLocation}>{destination.location}</Text>
                  </View>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#64FFDA" />
                    <Text style={styles.rating}>{destination.rating}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Latest Discoveries</Text>
        {popularDestinations.map((destination) => (
          <View key={destination.id} style={styles.discoveryCard}>
            <Image source={{ uri: destination.image }} style={styles.discoveryImage} />
            <View style={styles.discoveryInfo}>
              <Text style={styles.discoveryName}>{destination.name}</Text>
              <Text style={styles.discoveryLocation}>{destination.location}</Text>
              <View style={styles.discoveryDetails}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#64FFDA" />
                  <Text style={styles.rating}>{destination.rating}</Text>
                </View>
                <View style={styles.weatherInfo}>
                  <Ionicons name="thermometer" size={14} color="#64FFDA" />
                  <Text style={styles.discoveryTemp}>{destination.temperature}°</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#8892B0',
  },
  location: {
    fontSize: 20,
    color: '#CCD6F6',
    fontWeight: 'bold',
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  temperature: {
    fontSize: 20,
    color: '#CCD6F6',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 20,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchPlaceholder: {
    color: '#8892B0',
    fontSize: 16,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#CCD6F6',
    fontWeight: 'bold',
  },
  seeAllLink: {
    padding: 8,
  },
  seeAllText: {
    color: '#64FFDA',
    fontSize: 14,
  },
  destinationsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  destinationCard: {
    width: 280,
    marginRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  destinationImage: {
    width: '100%',
    height: 180,
  },
  destinationInfo: {
    padding: 16,
  },
  destinationName: {
    fontSize: 18,
    color: '#CCD6F6',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  destinationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  destinationLocation: {
    color: '#8892B0',
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    color: '#CCD6F6',
    fontSize: 14,
  },
  discoveryCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  discoveryImage: {
    width: 100,
    height: 100,
  },
  discoveryInfo: {
    flex: 1,
    padding: 16,
  },
  discoveryName: {
    fontSize: 16,
    color: '#CCD6F6',
    fontWeight: 'bold',
  },
  discoveryLocation: {
    fontSize: 14,
    color: '#8892B0',
    marginBottom: 8,
  },
  discoveryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discoveryTemp: {
    color: '#CCD6F6',
    fontSize: 14,
  },
  profileButton: {
    padding: 4,
  },
});