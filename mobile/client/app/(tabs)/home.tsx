import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Sidebar from '../../components/Sidebar';
import {  EXPO_PUBLIC_API_URL  } from '../../config';

// Define navigation type
type RootStackParamList = {
  'all-places': undefined;
  // Add other screen names here
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Place {
  id: string;
  name: string;
  location: string;
  image: string;
  rating: number;
  categories: Array<{
    name: string;
    icon: string;
  }>;
}

interface WeatherData {
  temp_c: number;
  condition: {
    text: string;
    icon: string;
  };
}

interface MarketplacePreview {
  id: string;
  title: string;
  price: number;
  image: string;
  seller: string;
}

export default function DiscoverScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [weatherData, setWeatherData] = useState<{ [key: string]: WeatherData }>({});
  const [loading, setLoading] = useState(true);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [showAllPlaces, setShowAllPlaces] = useState(false);
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  const fetchPlaces = async () => {
    try {
      const limit = showAllPlaces ? '' : '5';
      const response = await fetch(`${ EXPO_PUBLIC_API_URL }places?limit=${limit}`);
      const data = await response.json();
      if (data.success) {
        if (showAllPlaces) {
          console.log('Navigate to all places screen');
        } else {
          setPlaces(data.data.slice(0, 5));
        }
      }
    } catch (error) {
      console.error('Error fetching places:', error);
    } finally {
      setPlacesLoading(false);
    }
  };

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
    fetchPlaces();
  }, [showAllPlaces]);

  useEffect(() => {
    const loadWeatherData = async () => {
      setLoading(true);
      const locations = ['Ariana,Tunisia', ...places.map(p => `${p.location},Tunisia`)];
      console.log('Fetching weather for locations:', locations);
      const weatherPromises = locations.map(location => fetchWeather(location));
      const results = await Promise.all(weatherPromises);
      
      const weatherMap: { [key: string]: WeatherData } = {};
      locations.forEach((location, index) => {
        if (results[index]) {
          const cityName = location.split(',')[0];
          weatherMap[cityName] = results[index]!;
          console.log(`Weather for ${cityName}:`, results[index]);
        }
      });
      
      setWeatherData(weatherMap);
      setLoading(false);
    };

    loadWeatherData();
  }, [places]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPlaces(places);
    } else {
      const filtered = places.filter(place => 
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPlaces(filtered);
    }
  }, [searchQuery, places]);

  const getWeatherIcon = (condition: string) => {
    // Map weather conditions to Ionicons
    if (condition.toLowerCase().includes('sunny')) return 'sunny';
    if (condition.toLowerCase().includes('cloud')) return 'cloudy';
    if (condition.toLowerCase().includes('rain')) return 'rainy';
    return 'partly-sunny';
  };

  const handleSeeAllPress = () => {
    navigation.navigate('all-places' as never);
  };

  return (
    <>
      <Sidebar 
        isVisible={isSidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setSidebarVisible(true)}>
            <Ionicons name="menu" size={24} color="#64FFDA" />
          </Pressable>
          <View>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.location}>Ariana, Tunisia</Text>
          </View>
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
        </View>

        <Pressable 
          style={styles.searchContainer}
          onPress={() => {/* Handle search press */}}
        >
          <View style={styles.searchContent}>
            <Ionicons name="search" size={20} color="#8892B0" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search destinations..."
              placeholderTextColor="#8892B0"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Destinations</Text>
            <Pressable onPress={handleSeeAllPress}>
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>
          
          {placesLoading ? (
            <ActivityIndicator color="#64FFDA" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.destinationsScroll}
            >
              {filteredPlaces.map((place) => (
                <Link
                  key={place.id}
                  href={`/place/${place.id}`}
                  asChild
                >
                  <Pressable style={styles.destinationCard}>
                    <Image
                      source={{ uri: place.image }}
                      style={styles.destinationImage}
                    />
                    <View style={styles.destinationInfo}>
                      <Text style={styles.destinationName}>{place.name}</Text>
                      <View style={styles.destinationDetails}>
                        <View style={styles.locationContainer}>
                          <Ionicons name="location" size={14} color="#8892B0" />
                          <Text style={styles.destinationLocation}>{place.location}</Text>
                        </View>
                        <View style={styles.ratingContainer}>
                          <Ionicons name="star" size={14} color="#FFD700" />
                          <Text style={styles.rating}>{place.rating}</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Link>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Discoveries</Text>
          {filteredPlaces.map((place) => (
            <View key={place.id} style={styles.discoveryCard}>
              <Image source={{ uri: place.image }} style={styles.discoveryImage} />
              <View style={styles.discoveryInfo}>
                <Text style={styles.discoveryName}>{place.name}</Text>
                <Text style={styles.discoveryLocation}>{place.location}</Text>
                <View style={styles.discoveryDetails}>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#64FFDA" />
                    <Text style={styles.rating}>{place.rating}</Text>
                  </View>
                  <View style={styles.weatherInfo}>
                    <Ionicons name="thermometer" size={14} color="#64FFDA" />
                    <Text style={styles.discoveryTemp}>
                      {weatherData[place.location.split(',')[0]]?.temp_c 
                        ? `${Math.round(weatherData[place.location.split(',')[0]].temp_c)}°` 
                        : '--°'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
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
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.1)',
  },
  searchContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#CCD6F6',
    fontSize: 16,
    padding: 0,
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
  marketplaceCard: {
    width: 200,
    marginRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  marketplaceImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  marketplaceInfo: {
    padding: 12,
  },
  marketplaceTitle: {
    fontSize: 16,
    color: '#CCD6F6',
    fontWeight: 'bold',
  },
  marketplacePrice: {
    fontSize: 16,
    color: '#64FFDA',
    marginVertical: 4,
  },
  marketplaceSeller: {
    fontSize: 14,
    color: '#8892B0',
  },
});