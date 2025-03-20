import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Sidebar from '../../components/Sidebar';
import {  EXPO_PUBLIC_API_URL  } from '../../config';
import FavoriteButton from '../../components/FavoriteButton';
import Events from '../event';

// Define navigation type
type RootStackParamList = {
  'all-places': undefined;
  'event': { id: string };
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

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
}

export default function DiscoverScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [weatherData, setWeatherData] = useState<{ [key: string]: WeatherData }>({});
  const [loading, setLoading] = useState(true);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showAllPlaces, setShowAllPlaces] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [popularPlaces, setPopularPlaces] = useState<Place[]>([]);

  const fetchPlaces = async () => {
    try {
      setPlacesLoading(true);
      
      // Fetch all places for Latest Discoveries
      const allPlacesResponse = await fetch(`${EXPO_PUBLIC_API_URL}places`);
      const allPlacesData = await allPlacesResponse.json();
      
      // Fetch top 5 places for Popular Destinations
      const popularPlacesResponse = await fetch(`${EXPO_PUBLIC_API_URL}places?limit=5`);
      const popularPlacesData = await popularPlacesResponse.json();
      
      if (allPlacesData.success && popularPlacesData.success) {
        setAllPlaces(allPlacesData.data); // State for all places
        setPopularPlaces(popularPlacesData.data); // State for top 5 places
      }
    } catch (error) {
      console.error('Error fetching places:', error);
    } finally {
      setPlacesLoading(false);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      setEventsLoading(true);
      const response = await fetch(`${EXPO_PUBLIC_API_URL}events/upcoming?limit=5`);
      const data = await response.json();
      if (data.success) {
        setUpcomingEvents(data.data);
      }
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    } finally {
      setEventsLoading(false);
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

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const response = await fetch(`${EXPO_PUBLIC_API_URL}events`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data);
      } else {
        console.error('Failed to fetch events:', data.error);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
    fetchUpcomingEvents();
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

  useEffect(() => {
    fetchEvents();
  }, []);

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
            >
              {popularPlaces.map(place => (
                <Link
                  key={place.id}
                  href={`/place/${place.id}`}
                  asChild
                >
                  <Pressable style={styles.destinationCard}>
                    <FavoriteButton placeId={place.id} />
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Discoveries</Text>
          </View>
          
          {placesLoading ? (
            <ActivityIndicator color="#64FFDA" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {allPlaces.map(place => (
                <Link
                  key={place.id}
                  href={`/place/${place.id}`}
                  asChild
                >
                  <Pressable style={styles.destinationCard}>
                    <FavoriteButton placeId={place.id} />
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
                      <View style={styles.weatherInfo}>
                        <Ionicons name="thermometer" size={14} color="#64FFDA" />
                        <Text style={styles.discoveryTemp}>
                          {weatherData[place.location.split(',')[0]]?.temp_c 
                            ? `${Math.round(weatherData[place.location.split(',')[0]].temp_c)}°` 
                            : '--°'}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </Link>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
          </View>
          <Events />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {eventsLoading ? (
            <ActivityIndicator color="#64FFDA" />
          ) : upcomingEvents.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {upcomingEvents.map((event, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.eventCard}
                  onPress={() => navigation.navigate('event', { id: event.id })}
                >
                  <Image
                    source={{ uri: event.images?.[0] || 'https://via.placeholder.com/150' }}
                    style={styles.eventImage}
                  />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventDate}>
                      {new Date(event.date).toLocaleDateString()}
                    </Text>
                    <View style={styles.eventLocation}>
                      <Ionicons name="location" size={16} color="#64FFDA" />
                      <Text style={styles.eventLocationText}>{event.location}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noEventsText}>No upcoming events</Text>
          )}
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventDate: {
    color: '#CCD6F6',
    fontSize: 14,
  },
  eventCard: {
    width: 280,
    marginRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 160,
  },
  eventInfo: {
    padding: 12,
  },
  eventTitle: {
    fontSize: 16,
    color: '#CCD6F6',
    fontWeight: 'bold',
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  eventLocationText: {
    color: '#8892B0',
    fontSize: 14,
  },
  noEventsText: {
    color: '#8892B0',
    textAlign: 'center',
    marginTop: 20,
  },
});