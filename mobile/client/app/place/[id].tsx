import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  SafeAreaView,
  PanResponder,
  Alert,
  Linking
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EXPO_PUBLIC_API_URL } from '../../config';
import FavoriteButton from '../../components/FavoriteButton';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import LocationService from '../../services/location.service';

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = StatusBar.currentHeight || 0;

// Star Rating Component
const StarRating = ({ 
  initialRating = 0, 
  onRatingChange, 
  size = 32,
  readonly = false
}: { 
  initialRating?: number, 
  onRatingChange?: (rating: number) => void, 
  size?: number,
  readonly?: boolean
}) => {
  const [rating, setRating] = useState(initialRating);
  
  const handleRating = (selectedRating: number) => {
    if (readonly) return;
    
    // Visual feedback with animation
    const newRating = selectedRating === rating ? selectedRating - 0.5 : selectedRating;
    setRating(newRating);
    
    if (onRatingChange) {
      onRatingChange(newRating);
    }
  };
  
  // If the parent updates the rating, update our internal state
  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);
  
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity
          key={i}
          onPress={() => handleRating(i)}
          disabled={readonly}
          activeOpacity={readonly ? 1 : 0.6}
          style={{ padding: 4 }}
        >
          <Ionicons
            name={rating >= i ? 'star' : rating >= i - 0.5 ? 'star-half' : 'star-outline'}
            size={size}
            color="#FFD700"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

interface WeatherData {
  temp_c: number;
  condition: {
    text: string;
    icon: string;
  };
}

interface Criteria {
  id: string;
  name: string;
  percentage: number;
  value: number;
}

interface PlaceDetails {
  id: string;
  name: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  rating: number;
  categories: {
    name: string;
    icon: string;
  }[];
  critiria: Criteria[];
}

// Separate InteractiveSlider component
const InteractiveSlider = ({ 
  criteria, 
  initialValue, 
  onValueChange 
}: { 
  criteria: Criteria, 
  initialValue: number, 
  onValueChange: (criteriaId: string, value: number) => void 
}) => {
  const animatedValue = useRef(new Animated.Value(initialValue)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // When the user touches the slider, we store the current position
        animatedValue.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        // Calculate the new value based on the gesture
        const trackWidth = width - 40; // Width of track (screen width - padding)
        const newValue = Math.max(0, Math.min(100, (gestureState.moveX / trackWidth) * 100));
        
        // Update the animated value
        animatedValue.setValue(newValue);
        
        // Update the parent component with the new value
        onValueChange(criteria.id, Math.round(newValue));
      },
      onPanResponderRelease: (_, gestureState) => {
        // When the user releases, finalize the value and save
        const trackWidth = width - 40; // Width of track (screen width - padding)
        const newValue = Math.max(0, Math.min(100, (gestureState.moveX / trackWidth) * 100));
        const roundedValue = Math.round(newValue);
        
        // Add a small bounce animation for feedback
        Animated.spring(animatedValue, {
          toValue: roundedValue,
          useNativeDriver: false,
          friction: 7,
          tension: 40
        }).start();
        
        // Finalize the value change
        onValueChange(criteria.id, roundedValue);
      }
    })
  ).current;

  const getSliderColor = (value: number) => {
    if (value < 25) return '#FF3B30'; // Red
    if (value < 50) return '#FF9500'; // Orange
    if (value < 75) return '#FFCC00'; // Yellow
    return '#34C759'; // Green
  };

  // Update animated value when initialValue changes
  useEffect(() => {
    animatedValue.setValue(initialValue);
  }, [initialValue, animatedValue]);

  const animatedThumbStyle = {
    left: animatedValue.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    }),
    backgroundColor: animatedValue.interpolate({
      inputRange: [0, 25, 50, 75, 100],
      outputRange: ['#FF3B30', '#FF9500', '#FFCC00', '#FFCC00', '#34C759'],
    }),
    transform: [{ translateX: -12 }]
  };

  const animatedFillStyle = {
    width: animatedValue.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    })
  };

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={styles.criteriaName}>{criteria.name}</Text>
        <Text style={styles.criteriaValue}>{initialValue}%</Text>
      </View>
      
      <View style={styles.sliderTrack} {...panResponder.panHandlers}>
        <LinearGradient
          colors={['#FF3B30', '#FF9500', '#FFCC00', '#34C759']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sliderGradient}
        />
        <Animated.View 
          style={[
            styles.sliderFill, 
            animatedFillStyle
          ]} 
        />
        <Animated.View 
          style={[
            styles.sliderThumb,
            animatedThumbStyle
          ]}
        />
      </View>
      
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>Poor</Text>
        <Text style={styles.sliderLabel}>Fair</Text>
        <Text style={styles.sliderLabel}>Good</Text>
        <Text style={styles.sliderLabel}>Great</Text>
        <Text style={styles.sliderLabel}>Excellent</Text>
      </View>
    </View>
  );
};

export default function PlaceDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { user, accessToken } = useAuth();
  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [userVotes, setUserVotes] = useState<{[key: string]: number}>({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  
  const scrollX = useRef(new Animated.Value(0)).current;

  const checkIfFavorite = async (placeId: string) => {
    if (!user || !accessToken) {
      setIsFavorite(false);
      return;
    }

    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}favorites/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const foundFavorite = data.data.some((fav: { id: string }) => fav.id === placeId);
          setIsFavorite(foundFavorite);
        }
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
      setIsFavorite(false);
    }
  };

  const fetchPlaceDetails = async () => {
    try {
      setLoading(true);
      const apiUrl = `${EXPO_PUBLIC_API_URL}places/${id}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.success) {
        setPlace(data.data);
        
        // Debug location information
        console.log('Place Data:', {
          id: data.data.id,
          name: data.data.name,
          hasLocation: !!data.data.location,
          hasLatitude: !!data.data.latitude,
          hasLongitude: !!data.data.longitude,
          latitude: data.data.latitude,
          longitude: data.data.longitude
        });
        
        checkIfFavorite(data.data.id);
        
        if (data.data.location) {
          fetchWeather(data.data.location);
        }

        // Get user's current location for distance calculation
        await getUserLocation();
      } else {
        console.error('Failed to fetch place details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (location: string) => {
    try {
      setLoadingWeather(true);
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=b2cdcab20c2244d0b3e103538251303&q=${location},Tunisia&aqi=no`
      );
      
      if (!response.ok) {
        console.error(`Weather API error (${response.status}): ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      
      if (!data || !data.current || typeof data.current.temp_c === 'undefined') {
        console.error('Invalid weather data format:', data);
        return;
      }
      
      setWeatherData({
        temp_c: data.current.temp_c,
        condition: {
          text: data.current.condition?.text || 'Unknown',
          icon: data.current.condition?.icon || '//cdn.weatherapi.com/weather/64x64/day/116.png',
        }
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setLoadingWeather(false);
    }
  };

  // Get user's current location
  const getUserLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      
      if (location) {
        setUserLocation(location);
      }
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };

  // Calculate distance between user and place
  useEffect(() => {
    if (userLocation && place && place.latitude && place.longitude) {
      const calculatedDistance = LocationService.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        place.latitude,
        place.longitude
      );
      
      setDistance(calculatedDistance);
    }
  }, [userLocation, place]);

  // Attempt to get user location as soon as the component mounts
  useEffect(() => {
    const getLocation = async () => {
      try {
        const permission = await LocationService.checkLocationPermission();
        if (permission) {
          const location = await LocationService.getCurrentLocation();
          if (location) {
            setUserLocation(location);
          }
        }
      } catch (error) {
        console.error('Error getting location in place details:', error);
      }
    };

    getLocation();
  }, []);

  const openDirections = () => {
    console.log('openDirections called');
    if (!place || !place.latitude || !place.longitude) {
      console.log('No valid coordinates for directions');
      Alert.alert('Error', 'Location coordinates not available for this place');
      return;
    }
    
    console.log('Using coordinates for directions:', place.latitude, place.longitude);
    
    // Format coordinates properly
    const lat = place.latitude;
    const lng = place.longitude;
    
    // URL format differs by platform
    let url;
    if (Platform.OS === 'ios') {
      // Format for Apple Maps
      url = `http://maps.apple.com/?q=${place.name}&ll=${lat},${lng}`;
      console.log('iOS directions URL:', url);
    } else {
      // Format for Google Maps on Android
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      console.log('Android directions URL:', url);
    }
    
    console.log('Opening URL for directions:', url);
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log('Cannot open URL:', url);
        Alert.alert('Error', 'Could not open maps application');
      }
    }).catch(err => {
      console.error('Error opening directions:', err);
      Alert.alert('Error', 'Could not open maps application');
    });
  };

  useEffect(() => {
    if (id) {
      fetchPlaceDetails();
      testCriteriaEndpoint();
    }
  }, [id]);

  const testCriteriaEndpoint = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}criteria/debug`);
      const data = await response.json();
      console.log('Criteria endpoint test:', data);
    } catch (error) {
      console.error('Error testing criteria endpoint:', error);
    }
  };

  const handleVote = async (criteriaId: string, value: number) => {
    // Update local state first for immediate feedback
    setUserVotes(prev => ({
      ...prev,
      [criteriaId]: value
    }));
    
    // Only attempt to save to backend if user is logged in
    if (user && accessToken && place) {
      try {
        console.log('Sending rating to backend:', { critiriaId: criteriaId, value });
        
        const response = await fetch(`${EXPO_PUBLIC_API_URL}criteria/rate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            userId: user.id,
            placeId: place.id,
            ratings: [{ critiriaId: criteriaId, value }]
          })
        });
        
        // Log the raw response for debugging
        console.log('Rating response status:', response.status);
        
        const data = await response.json();
        console.log('Rating response data:', data);
        
        if (!data.success) {
          console.error('Error saving rating:', data.error, data.details);
          Alert.alert(
            "Rating Error",
            "There was a problem saving your rating. Please try again later."
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error submitting rating:', errorMessage);
        Alert.alert(
          "Connection Error",
          "Could not connect to the server. Please check your internet connection."
        );
      }
    } else {
      // Prompt user to login
      Alert.alert(
        "Login Required",
        "Please login to save your ratings",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/(auth)/login" as any) }
        ]
      );
    }
  };

  const renderCriteria = () => {
    if (!place || !place.critiria || place.critiria.length === 0) {
      return null;
    }

    return (
      <>
        <Text style={styles.sectionTitle}>Place Ratings</Text>
        <View style={styles.slidersContainer}>
          {place.critiria.map(criteria => {
            const currentValue = userVotes[criteria.id] !== undefined ? 
              userVotes[criteria.id] : criteria.value;
              
            return (
              <InteractiveSlider
                key={criteria.id}
                criteria={criteria}
                initialValue={currentValue}
                onValueChange={handleVote}
              />
            );
          })}
        </View>
      </>
    );
  };

  const toggleDescription = () => {
    setDescriptionExpanded(!descriptionExpanded);
  };

  // Handle star rating change
  const handleRatingChange = async (rating: number) => {
    setUserRating(rating);
    
    // Only submit if user is logged in
    if (user && accessToken && place) {
      try {
        console.log('Submitting star rating:', rating);
        
        const response = await fetch(`${EXPO_PUBLIC_API_URL}places/rate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            userId: user.id,
            placeId: place.id,
            rating: rating
          })
        });
        
        console.log('Rating response status:', response.status);
        
        const data = await response.json();
        console.log('Star rating response:', data);
        
        if (!data.success) {
          console.error('Error saving star rating:', data.error);
          Alert.alert(
            "Rating Error",
            "There was a problem saving your rating. Please try again."
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error submitting star rating:', errorMessage);
        Alert.alert(
          "Connection Error",
          "Could not connect to the server. Please check your connection."
        );
      }
    } else {
      // Prompt user to login
      Alert.alert(
        "Login Required",
        "Please login to save your rating",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/(auth)/login" as any) }
        ]
      );
    }
  };

  // Fetch user's existing rating for this place
  const fetchUserRating = async () => {
    if (!user || !accessToken || !place) return;
    
    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}places/${place.id}/user-rating/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUserRating(data.data.rating || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  useEffect(() => {
    if (place && user) {
      fetchUserRating();
    }
  }, [place, user]);

  // Render the ratings section with stars and criteria sliders
  const renderRatingsSection = () => {
    return (
      <>
        <View style={styles.divider} />
        
        <Text style={styles.sectionTitle}>Rate This Place</Text>
        
        <View style={styles.starRatingContainer}>
          <Text style={styles.ratingPrompt}>Your overall impression:</Text>
          <StarRating 
            initialRating={userRating}
            onRatingChange={handleRatingChange}
            size={36}
          />
        </View>
        
        {place?.critiria && place.critiria.length > 0 && renderCriteria()}
      </>
    );
  };

  // Render the map section
  const renderMapSection = () => {
    console.log('Rendering map section');
    console.log('Place data for map:', place ? {
      id: place.id,
      name: place.name,
      hasLatitude: !!place.latitude,
      hasLongitude: !!place.longitude,
      latitude: place.latitude,
      longitude: place.longitude,
      platform: Platform.OS
    } : 'No place data');

    if (!place || !place.latitude || !place.longitude) {
      console.log('Missing place coordinates, showing unavailable message');
      return (
        <View style={styles.mapUnavailable}>
          <Ionicons name="map-outline" size={48} color="#8892B0" />
          <Text style={styles.mapUnavailableText}>Map unavailable for this location</Text>
        </View>
      );
    }

    try {
      console.log('Attempting to render map with coordinates:', place.latitude, place.longitude);
      
      // Create map region
      const region = {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      console.log('Map region:', region);

      // Try standard map first
      return (
        <View style={styles.mapContainer}>
          {/* Static map */}
          {renderStaticMap()}
          
          {/* Custom overlays */}
          <View style={styles.mapButtons}>
            {/* Distance Button */}
            {distance !== null && (
              <TouchableOpacity
                style={styles.distanceButton}
                activeOpacity={0.8}
              >
                <Ionicons name="locate-outline" size={20} color="#FFFFFF" />
                <Text style={styles.distanceButtonText}>
                  {distance < 1 
                    ? `${Math.round(distance * 1000)} m` 
                    : `${distance.toFixed(1)} km`}
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Directions Button */}
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={() => {
                console.log('Direction button pressed');
                openDirections();
              }}
            >
              <Ionicons name="navigate-circle" size={20} color="#FFFFFF" />
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } catch (error) {
      console.error('Error rendering map:', error);
      return (
        <View style={styles.mapUnavailable}>
          <Ionicons name="map-outline" size={48} color="#8892B0" />
          <Text style={styles.mapUnavailableText}>Map unavailable at this moment. Please try again later.</Text>
          {distance !== null && (
            <View style={styles.coordinatesContainer}>
              <Text style={styles.coordinatesText}>
                Location: {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
              </Text>
              <Text style={styles.coordinatesText}>
                Distance: {distance < 1 
                  ? `${Math.round(distance * 1000)} meters away` 
                  : `${distance.toFixed(1)} km away`}
              </Text>
            </View>
          )}
        </View>
      );
    }
  };

  // Render a static map image fallback
  const renderStaticMap = () => {
    console.log('Rendering static map fallback');
    if (!place || !place.latitude || !place.longitude) return null;
    
    // Static map URL using Google Maps Static API
    const apiKey = 'AIzaSyB5gnUWjb84t6klt5vcPjMOQylhQRFB5Wc'; // Using the key from app.json
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${place.latitude},${place.longitude}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${place.latitude},${place.longitude}&key=${apiKey}`;
    
    console.log('Static map URL generated');
    
    return (
      <View style={styles.staticMapContainer}>
        <Image 
          source={{ uri: mapUrl }}
          style={styles.staticMap}
          onLoad={() => console.log('Static map image loaded successfully')}
          onError={(e) => console.error('Static map image failed to load:', e.nativeEvent.error)}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#64FFDA" />
          </Pressable>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator color="#64FFDA" size="large" />
          <Text style={styles.loadingText}>Loading amazing place...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!place) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#64FFDA" />
          </Pressable>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContent}>
          <Text style={styles.errorText}>Place not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#64FFDA" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{place.name}</Text>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <View style={styles.heroContainer}>
          <Animated.FlatList
            data={place.images}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            renderItem={({ item }) => (
              <View style={styles.heroSlide}>
                <Image 
                  source={{ uri: item }} 
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'transparent', 'rgba(10, 25, 47, 0.7)']}
                  style={styles.imageGradient}
                  locations={[0, 0.6, 1]}
                />
              </View>
            )}
          />
          
          <FavoriteButton 
            placeId={place.id} 
            initialIsFavorite={isFavorite} 
            style={styles.favoriteButton} 
          />
          
          <View style={styles.paginationContainer}>
            {place.images.map((_, i) => {
              const inputRange = [
                (i - 1) * width,
                i * width,
                (i + 1) * width
              ];
              
              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 16, 8],
                extrapolate: 'clamp'
              });
              
              const dotOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.4, 1, 0.4],
                extrapolate: 'clamp'
              });
              
              return (
                <Animated.View
                  key={`dot-${i}`}
                  style={[
                    styles.paginationDot,
                    { width: dotWidth, opacity: dotOpacity }
                  ]}
                />
              );
            })}
          </View>
        </View>
        
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.placeName}>{place.name}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={18} color="#FFD700" />
              <Text style={styles.ratingText}>{place.rating}</Text>
            </View>
          </View>
          
          <View style={styles.locationWeatherRow}>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={20} color="#64FFDA" />
              <Text style={styles.locationText}>{place.location}</Text>
            </View>
            
            {weatherData && (
              <View style={styles.weatherContainer}>
                <Image 
                  source={{ uri: `https:${weatherData.condition.icon}` }}
                  style={styles.weatherIcon}
                />
                <Text style={styles.temperatureText}>{Math.round(weatherData.temp_c)}°C</Text>
              </View>
            )}
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
            style={styles.categoriesScroll}
          >
            {place.categories.map((category, index) => (
              <View key={index} style={styles.categoryChip}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>About This Place</Text>
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText} numberOfLines={descriptionExpanded ? undefined : 3}>
              {place.description}
            </Text>
            <TouchableOpacity 
              onPress={toggleDescription}
              style={styles.readMoreButton}
            >
              <Text style={styles.readMoreText}>
                {descriptionExpanded ? 'Read Less' : 'Read More'}
              </Text>
              <Ionicons 
                name={descriptionExpanded ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color="#64FFDA" 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Location</Text>
          {renderMapSection()}
          
          {renderRatingsSection()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#1d2c4d"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8ec3b9"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1a3646"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#4b6878"
      }
    ]
  },
  {
    "featureType": "administrative.province",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#4b6878"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#0e1626"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#4e6d70"
      }
    ]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 255, 218, 0.1)',
    backgroundColor: '#0A192F',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginLeft: 16,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8892B0',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#64FFDA',
    fontSize: 16,
  },
  heroContainer: {
    height: height * 0.45,
    width: width,
    position: 'relative',
  },
  heroSlide: {
    width: width,
    height: height * 0.45,
  },
  heroImage: {
    width: width,
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#0A192F',
    marginTop: -30,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  placeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#CCD6F6',
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  locationWeatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#8892B0',
    fontSize: 16,
    marginLeft: 8,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.3)',
  },
  weatherIcon: {
    width: 28,
    height: 28,
  },
  temperatureText: {
    color: '#64FFDA',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  categoriesScroll: {
    marginBottom: 20,
  },
  categoriesScrollContent: {
    paddingRight: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.3)',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryName: {
    color: '#64FFDA',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(140, 179, 186, 0.1)',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginBottom: 16,
  },
  descriptionContainer: {
    marginBottom: 8,
  },
  descriptionText: {
    color: '#8892B0',
    fontSize: 16,
    lineHeight: 24,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  readMoreText: {
    color: '#64FFDA',
    fontWeight: '500',
    marginRight: 4,
  },
  slidersContainer: {
    marginBottom: 12,
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  criteriaName: {
    color: '#CCD6F6',
    fontSize: 16,
    fontWeight: '600',
  },
  criteriaValue: {
    color: '#64FFDA',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sliderTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
    marginBottom: 10,
    overflow: 'hidden',
  },
  sliderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 5,
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: 'transparent',
  },
  sliderThumb: {
    position: 'absolute',
    top: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#64FFDA',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#8892B0',
  },
  starRatingContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  ratingPrompt: {
    color: '#CCD6F6',
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '500',
  },
  mapContainer: {
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapLocationPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
    zIndex: 10,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    left: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 25, 47, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.3)',
  },
  distanceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#64FFDA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 150,
  },
  directionsButtonText: {
    color: '#0A192F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapLocationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  mapLocationCard: {
    backgroundColor: 'rgba(10, 25, 47, 0.8)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.3)',
    width: '90%',
    marginTop: 10,
  },
  mapLocationName: {
    color: '#CCD6F6',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mapLocationAddress: {
    color: '#8892B0',
    fontSize: 16,
  },
  mapCoordinates: {
    color: '#64FFDA',
    fontSize: 14,
    fontWeight: 'bold',
  },
  coordinatesContainer: {
    padding: 16,
    backgroundColor: 'rgba(10, 25, 47, 0.5)',
    borderRadius: 16,
    marginTop: 16,
  },
  coordinatesText: {
    color: '#8892B0',
    fontSize: 16,
  },
  mapUnavailable: {
    height: 200,
    backgroundColor: 'rgba(10, 25, 47, 0.5)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
    borderStyle: 'dashed',
  },
  mapUnavailableText: {
    color: '#8892B0',
    fontSize: 16,
    marginTop: 8,
  },
  staticMapContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1D2D50',
  },
  staticMap: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  mapPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
    zIndex: 5,
  },
  mapButtons: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    left: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  distanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1D2D50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#64FFDA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 130,
  },
  distanceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 