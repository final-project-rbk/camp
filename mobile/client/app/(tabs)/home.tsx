import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Pressable, 
  ActivityIndicator, 
  TextInput,
  Dimensions,
  ImageBackground,
  Platform,
  StatusBar,
  SafeAreaView,
  RefreshControl,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { Link, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Sidebar from '../components/Sidebar';
import { EXPO_PUBLIC_API_URL } from '../../config';
import FavoriteButton from '../../components/FavoriteButton';
import Events from '../event';
import { LinearGradient } from 'expo-linear-gradient';
import { TAB_BAR_HEIGHT } from '../../components/TabBar';

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
  images: string[];
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

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = StatusBar.currentHeight || 0;

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
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [popularPlaces, setPopularPlaces] = useState<Place[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [contentOpacity] = useState(new Animated.Value(1));
  const scrollViewRef = useRef<ScrollView>(null);

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
        const allPlacesResult = allPlacesData.data;
        setAllPlaces(allPlacesResult);
        setPlaces(allPlacesResult); // Set the main places array for filtering
        setFilteredPlaces(allPlacesResult); // Initialize filtered places with all places
        setPopularPlaces(popularPlacesData.data);
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
        `https://api.weatherapi.com/v1/current.json?key=b2cdcab20c2244d0b3e103538251303&q=${location}&aqi=no`
      );
      
      // Check if the response is OK
      if (!response.ok) {
        console.error(`Weather API error (${response.status}): ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      
      // Validate data structure before returning
      if (!data || !data.current || typeof data.current.temp_c === 'undefined') {
        console.error('Invalid weather data format:', data);
        return null;
      }
      
      return {
        temp_c: data.current.temp_c,
        condition: {
          text: data.current.condition?.text || 'Unknown',
          icon: data.current.condition?.icon || '//cdn.weatherapi.com/weather/64x64/day/116.png',
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
  }, [showAllPlaces]);

  const handleRefreshWeather = () => {
    if (places.length > 0) {
      loadWeatherData();
    }
  };

    const loadWeatherData = async () => {
      setLoading(true);
    try {
      // Just fetch for Ariana first to ensure API is working
      const arianaWeather = await fetchWeather('Ariana,Tunisia');
      
      if (arianaWeather) {
        // API is working, continue with all locations
        const locations = ['Ariana,Tunisia', ...places.map(p => `${p.location},Tunisia`)];
        
        const weatherPromises = locations.map(location => fetchWeather(location));
        const results = await Promise.all(weatherPromises);
        
        const weatherMap: { [key: string]: WeatherData } = {};
        locations.forEach((location, index) => {
          if (results[index]) {
            const cityName = location.split(',')[0];
            weatherMap[cityName] = results[index]!;
          }
        });
        
        setWeatherData(weatherMap);
      } else {
        console.error('Failed to fetch weather for Ariana');
      }
    } catch (error) {
      console.error('Error in loadWeatherData:', error);
    } finally {
      setLoading(false);
    }
    };

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

  const handleSearch = () => {
    // This function would be called when search button is pressed
    // For now, filtering happens automatically via the useEffect
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Initial weather load when component mounts
  useEffect(() => {
    loadWeatherData();
  }, []);

  // Handle refresh action
  const onRefresh = async () => {
    setRefreshing(true);
    
    // Create fade effect while refreshing
    Animated.timing(contentOpacity, {
      toValue: 0.8,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    try {
      // Refresh all data in parallel
      await Promise.all([
        fetchPlaces(),
        loadWeatherData(),
        fetchEvents()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      // Restore opacity with nice animation
      Animated.spring(contentOpacity, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true
      }).start();
      
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.mainContainer}>
        <Sidebar 
          isVisible={isSidebarVisible} 
          onClose={() => setSidebarVisible(false)} 
        />
        
        <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.container} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#64FFDA"
                colors={["#64FFDA", "#9D84FF", "#FF5757"]}
                progressBackgroundColor="#1D2D50"
                progressViewOffset={10}
                title="Pull to refresh..."
                titleColor="#CCD6F6"
              />
            }
            scrollEventThrottle={16}
          >
            {/* Hero header with background image */}
            <ImageBackground
              source={{ uri: 'https://tse3.mm.bing.net/th?id=OIP.fnT--y4uVmczYuFml4FEBQHaEo&pid=Api&P=0&h=180' }}
              style={styles.heroHeader}
            >
              <LinearGradient
                colors={['rgba(10, 25, 47, 0.5)', 'rgba(10, 25, 47, 0.9)']}
                style={styles.heroGradient}
              >
                <View style={styles.headerTopRow}>
                  <Pressable 
                    onPress={() => setSidebarVisible(true)}
                    style={styles.menuButton}
                  >
                    <Ionicons name="menu" size={24} color="#FFFFFF" />
                  </Pressable>
                  <Pressable 
                    style={styles.weatherContainer}
                    onPress={handleRefreshWeather}
                  >
                    {loading ? (
                      <ActivityIndicator color="#64FFDA" />
                    ) : weatherData['Ariana'] ? (
                      <>
                        <Image 
                          source={{ uri: `https:${weatherData['Ariana'].condition.icon}` }}
                          style={{ width: 28, height: 28 }}
                        />
                        <Text style={styles.temperature}>{Math.round(weatherData['Ariana'].temp_c)}°</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="sunny" size={28} color="#FFD700" />
                        <Text style={styles.temperature}>--°</Text>
                      </>
                    )}
                  </Pressable>
                </View>

                <View style={styles.heroContent}>
                  <Text style={styles.greeting}>Welcome Explorer</Text>
                  <Text style={styles.heroTitle}>Discover Camping in Tunisia</Text>
                  <Text style={styles.location}>
                    <Ionicons name="location" size={16} color="#64FFDA" />
                    {' Ariana, Tunisia'}
                  </Text>
                </View>
              </LinearGradient>
            </ImageBackground>

            {/* Search Container */}
            <View style={styles.searchWrapper}>
              <View style={styles.searchContainer}>
                <View style={styles.searchContent}>
                  <Ionicons name="search" size={20} color="#8892B0" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Find camping spots..."
                    placeholderTextColor="#8892B0"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={clearSearch}>
                      <Ionicons name="close-circle" size={20} color="#8892B0" />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>

            {searchQuery.trim() !== '' ? (
              // Display search results when a search is performed
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <Ionicons name="search" size={24} color="#64FFDA" style={styles.sectionIcon} />
                    <Text style={styles.sectionTitle}>Search Results</Text>
                  </View>
                  {filteredPlaces.length > 0 && (
                    <Text style={styles.resultCount}>{filteredPlaces.length} found</Text>
                  )}
                </View>
                
                {placesLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#64FFDA" />
                    <Text style={styles.loadingText}>Searching...</Text>
                  </View>
                ) : filteredPlaces.length === 0 ? (
                  <View style={styles.emptyResultsContainer}>
                    <Ionicons name="search-outline" size={64} color="#64FFDA" />
                    <Text style={styles.emptyResultsText}>No camping spots found</Text>
                    <Text style={styles.emptyResultsSubtext}>Try a different search term</Text>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cardsContainer}
                  >
                    {filteredPlaces.map(place => (
                      <Link
                        key={place.id}
                        href={`/place/${place.id}`}
                        asChild
                      >
                        <Pressable style={styles.destinationCard}>
                          <View style={styles.imageContainer}>
                            <FavoriteButton placeId={place.id} />
                            <Image
                              source={{ uri: Array.isArray(place.images) ? place.images[0] : place.images }}
                              style={styles.destinationImage}
                            />
                            <LinearGradient
                              colors={['transparent', 'rgba(10, 25, 47, 0.8)']}
                              style={styles.imageGradient}
                            />
                            {place.categories && place.categories.length > 0 && (
                              <View style={styles.categoryTag}>
                                <Text style={styles.categoryText}>
                                  {place.categories[0].icon} {place.categories[0].name}
                                </Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.destinationInfo}>
                            <Text style={styles.destinationName}>{place.name}</Text>
                            <View style={styles.destinationDetails}>
                              <View style={styles.locationContainer}>
                                <Ionicons name="location" size={14} color="#64FFDA" />
                                <Text style={styles.destinationLocation}>{place.location}</Text>
                              </View>
                              <View style={styles.ratingContainer}>
                                <Ionicons name="star" size={14} color="#FFD700" />
                                <Text style={styles.rating}>{place.rating ? place.rating : 'New'}</Text>
                              </View>
                            </View>
                          </View>
                        </Pressable>
                      </Link>
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : (
              // Display regular content when no search is active
              <>
                {/* Popular Destinations */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleContainer}>
                      <Ionicons name="flame" size={24} color="#FF5757" style={styles.sectionIcon} />
                      <Text style={styles.sectionTitle}>Popular Destinations</Text>
                    </View>
                    <Pressable 
                      onPress={handleSeeAllPress}
                      style={styles.seeAllButton}
                    >
                      <Text style={styles.seeAllText}>See All</Text>
                      <Ionicons name="chevron-forward" size={16} color="#64FFDA" />
                    </Pressable>
                  </View>
                  
                  {placesLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#64FFDA" />
                      <Text style={styles.loadingText}>Loading amazing places...</Text>
                    </View>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.cardsContainer}
                    >
                      {popularPlaces.map(place => (
                        <Link
                          key={place.id}
                          href={`/place/${place.id}`}
                          asChild
                        >
                          <Pressable style={styles.destinationCard}>
                            <View style={styles.imageContainer}>
                              <FavoriteButton placeId={place.id} />
                              <Image
                                source={{ uri: Array.isArray(place.images) ? place.images[0] : place.images }}
                                style={styles.destinationImage}
                              />
                              <LinearGradient
                                colors={['transparent', 'rgba(10, 25, 47, 0.8)']}
                                style={styles.imageGradient}
                              />
                              {place.categories && place.categories.length > 0 && (
                                <View style={styles.categoryTag}>
                                  <Text style={styles.categoryText}>
                                    {place.categories[0].icon} {place.categories[0].name}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.destinationInfo}>
                              <Text style={styles.destinationName}>{place.name}</Text>
                              <View style={styles.destinationDetails}>
                                <View style={styles.locationContainer}>
                                  <Ionicons name="location" size={14} color="#64FFDA" />
                                  <Text style={styles.destinationLocation}>{place.location}</Text>
                                </View>
                                <View style={styles.ratingContainer}>
                                  <Ionicons name="star" size={14} color="#FFD700" />
                                  <Text style={styles.rating}>{place.rating ? place.rating : 'New'}</Text>
                                </View>
                              </View>
                            </View>
                          </Pressable>
                        </Link>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* Latest Discoveries */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleContainer}>
                      <Ionicons name="compass" size={24} color="#64FFDA" style={styles.sectionIcon} />
                      <Text style={styles.sectionTitle}>Latest Discoveries</Text>
                    </View>
                  </View>
                  
                  {placesLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#64FFDA" />
                      <Text style={styles.loadingText}>Finding new spots...</Text>
                    </View>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.cardsContainer}
                    >
                      {allPlaces.map(place => {
                        // Extract city name safely
                        const cityName = place.location?.split(',')?.[0]?.trim() || '';
                        const temperature = weatherData[cityName]?.temp_c;
                        
                        return (
                          <Link
                            key={place.id}
                            href={`/place/${place.id}`}
                            asChild
                          >
                            <Pressable style={styles.destinationCard}>
                              <View style={styles.imageContainer}>
                                <FavoriteButton placeId={place.id} />
                                <Image
                                  source={{ uri: Array.isArray(place.images) ? place.images[0] : place.images }}
                                  style={styles.destinationImage}
                                />
                                <LinearGradient
                                  colors={['transparent', 'rgba(10, 25, 47, 0.8)']}
                                  style={styles.imageGradient}
                                />
                                {place.categories && place.categories.length > 0 && (
                                  <View style={styles.categoryTag}>
                                    <Text style={styles.categoryText}>
                                      {place.categories[0].icon} {place.categories[0].name}
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <View style={styles.destinationInfo}>
                                <Text style={styles.destinationName}>{place.name}</Text>
                                <View style={styles.destinationDetails}>
                                  <View style={styles.locationContainer}>
                                    <Ionicons name="location" size={14} color="#64FFDA" />
                                    <Text style={styles.destinationLocation}>{place.location}</Text>
                                  </View>
                                  <View style={styles.weatherInfo}>
                                    <Ionicons name="thermometer" size={14} color="#FF9D00" />
                                    <Text style={styles.discoveryTemp}>
                                      {temperature !== undefined ? `${Math.round(temperature)}°` : '--°'}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </Pressable>
                          </Link>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>

                {/* Upcoming Events */}
                <View style={[styles.section, styles.eventsSection]}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleContainer}>
                      <Ionicons name="calendar" size={24} color="#9D84FF" style={styles.sectionIcon} />
                      <Text style={styles.sectionTitle}>Upcoming Events</Text>
                    </View>
                  </View>
                  <Events />
                </View>
              </>
            )}

            {/* Refreshing indicator */}
            {refreshing && (
              <View style={styles.refreshingIndicator}>
                <ActivityIndicator color="#64FFDA" size="small" />
                <Text style={styles.refreshingText}>Refreshing your experience...</Text>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Discover the beauty of Tunisia</Text>
              <Text style={styles.footerTagline}>Camp smarter with Campy</Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  scrollContent: {
    paddingBottom: TAB_BAR_HEIGHT + 20,
  },
  heroHeader: {
    height: height * 0.28,
    width: '100%',
  },
  heroGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 10 : STATUSBAR_HEIGHT + 10,
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 25, 47, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.3)',
    zIndex: 1,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 10,
    zIndex: 0,
  },
  greeting: {
    fontSize: 16,
    color: '#64FFDA',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: '#CCD6F6',
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(10, 25, 47, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
    zIndex: 1,
  },
  temperature: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  searchContainer: {
    backgroundColor: '#1D2D50',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  searchContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  eventsSection: {
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#CCD6F6',
    fontWeight: 'bold',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: '#64FFDA',
    fontSize: 14,
    marginRight: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#8892B0',
    marginTop: 8,
  },
  cardsContainer: {
    paddingRight: 20,
  },
  destinationCard: {
    width: 280,
    marginRight: 16,
    backgroundColor: '#1D2D50',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
  },
  destinationImage: {
    width: '100%',
    height: 180,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  categoryTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#64FFDA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    color: '#0A192F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  destinationInfo: {
    padding: 16,
  },
  destinationName: {
    fontSize: 18,
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rating: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 157, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  discoveryTemp: {
    color: '#FF9D00',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 255, 218, 0.1)',
    paddingBottom: 50,
  },
  footerText: {
    fontSize: 14,
    color: '#8892B0',
    marginBottom: 4,
  },
  footerTagline: {
    fontSize: 16,
    color: '#64FFDA',
    fontWeight: '500',
  },
  emptyResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyResultsText: {
    fontSize: 18,
    color: '#CCD6F6',
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptyResultsSubtext: {
    fontSize: 14,
    color: '#8892B0',
    marginTop: 8,
  },
  resultCount: {
    color: '#64FFDA',
    fontSize: 14,
  },
  refreshingIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : STATUSBAR_HEIGHT + 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(10, 25, 47, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  refreshingText: {
    color: '#64FFDA',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});