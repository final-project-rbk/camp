import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Pressable,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LocationService from '../services/location.service';
import { format } from 'date-fns';

// WeatherAPI.com interface definitions
interface WeatherCondition {
  text: string;
  icon: string;
  code: number;
}

interface CurrentWeather {
  temp_c: number;
  temp_f: number;
  condition: WeatherCondition;
  wind_kph: number;
  wind_mph: number;
  humidity: number;
  cloud: number;
  feelslike_c: number;
  feelslike_f: number;
  precip_mm: number;
  precip_in: number;
  uv: number;
  gust_kph: number;
  gust_mph: number;
  vis_km: number;
  vis_miles: number;
  pressure_mb: number;
  is_day: number;
}

interface ForecastDay {
  date: string;
  day: {
    maxtemp_c: number;
    mintemp_c: number;
    maxtemp_f: number;
    mintemp_f: number;
    condition: WeatherCondition;
    avgtemp_c: number;
    avgtemp_f: number;
    daily_chance_of_rain: number;
  };
  astro: {
    sunrise: string;
    sunset: string;
  };
}

interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    localtime: string;
  };
  current: CurrentWeather;
  forecast: {
    forecastday: ForecastDay[];
  };
}

// Initialize with default state to avoid null checks
const initialWeatherData: WeatherData = {
  location: {
    name: '',
    region: '',
    country: '',
    localtime: '',
  },
  current: {
    temp_c: 0,
    temp_f: 0,
    condition: { text: '', icon: '', code: 0 },
    wind_kph: 0,
    wind_mph: 0,
    humidity: 0,
    cloud: 0,
    feelslike_c: 0,
    feelslike_f: 0,
    precip_mm: 0,
    precip_in: 0,
    uv: 0,
    gust_kph: 0,
    gust_mph: 0,
    vis_km: 0,
    vis_miles: 0,
    pressure_mb: 0,
    is_day: 1,
  },
  forecast: {
    forecastday: [],
  },
};

export default function WeatherScreen() {
  const router = useRouter();
  const [weatherData, setWeatherData] = useState<WeatherData>(initialWeatherData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [useCelsius, setUseCelsius] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Get the current date and time
  const currentDate = new Date();
  const formattedDate = format(currentDate, 'EEE, MMM d, yyyy');
  const formattedTime = format(currentDate, 'h:mm a');

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get user's location
      const location = await LocationService.getCurrentLocation();
      
      if (!location) {
        setError('Unable to get your location. Please check your location permissions.');
        setLoading(false);
        return;
      }
      
      setUserLocation(location);
      
      // Fetch weather data from WeatherAPI
      const apiKey = 'b2cdcab20c2244d0b3e103538251303'; // Using the same key that's used elsewhere in the app
      const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location.latitude},${location.longitude}&days=3&aqi=no&alerts=no`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setError('Failed to fetch weather data. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeatherData();
  };

  const toggleTemperatureUnit = () => {
    setUseCelsius(!useCelsius);
  };

  // Get background gradient based on weather and time of day
  const getBackgroundGradient = () => {
    if (!weatherData.current) return ['#0A192F', '#1F2937'];
    
    const { is_day, condition } = weatherData.current;
    const conditionText = condition.text.toLowerCase();
    
    if (is_day) {
      // Daytime gradients
      if (conditionText.includes('sunny') || conditionText.includes('clear')) {
        return ['#4A90E2', '#87CEEB'];
      } else if (conditionText.includes('cloud')) {
        return ['#7899B3', '#A3B5C7'];
      } else if (conditionText.includes('rain') || conditionText.includes('drizzle')) {
        return ['#465A6E', '#758A9B'];
      } else if (conditionText.includes('snow')) {
        return ['#B4C4D6', '#D6E3F3'];
      } else if (conditionText.includes('fog') || conditionText.includes('mist')) {
        return ['#939FAD', '#B8C4CF'];
      } else {
        return ['#5A81A6', '#7FA1C3']; // Default day
      }
    } else {
      // Nighttime gradients
      if (conditionText.includes('clear')) {
        return ['#0F2044', '#1F3A67'];
      } else if (conditionText.includes('cloud')) {
        return ['#1E2C3D', '#2A3C54'];
      } else if (conditionText.includes('rain') || conditionText.includes('drizzle')) {
        return ['#151F2B', '#212E3F'];
      } else if (conditionText.includes('snow')) {
        return ['#1C2739', '#2A3B51'];
      } else if (conditionText.includes('fog') || conditionText.includes('mist')) {
        return ['#1D2533', '#2C3749'];
      } else {
        return ['#0A192F', '#1F2937']; // Default night
      }
    }
  };

  // Get weather activity recommendation
  const getWeatherRecommendation = () => {
    if (!weatherData.current) return '';
    
    const { condition, temp_c, precip_mm, wind_kph } = weatherData.current;
    const conditionText = condition.text.toLowerCase();
    
    if (conditionText.includes('rain') || conditionText.includes('drizzle')) {
      return 'Rainy weather - pack waterproof gear!';
    } else if (conditionText.includes('snow')) {
      return 'Snowy conditions - dress warmly and check road conditions.';
    } else if (conditionText.includes('sunny') && temp_c > 25) {
      return 'Hot and sunny - perfect for swimming! Bring sunscreen.';
    } else if (conditionText.includes('sunny') || conditionText.includes('clear')) {
      return 'Great weather for hiking and outdoor activities!';
    } else if (wind_kph > 30) {
      return 'Strong winds - secure your camp gear properly!';
    } else if (conditionText.includes('fog') || conditionText.includes('mist')) {
      return 'Foggy conditions - use caution when hiking.';
    } else if (precip_mm > 5) {
      return 'Heavy precipitation expected - check for flooding risks.';
    } else {
      return 'Good camping conditions - enjoy the outdoors!';
    }
  };

  // Get weather icon from condition code
  const getWeatherIcon = (code: number, size: number = 32) => {
    // Map weather codes to Ionicons
    if (code >= 1000 && code <= 1003) return <Ionicons name="sunny" size={size} color="#FFD700" />;
    if (code >= 1004 && code <= 1009) return <Ionicons name="cloudy" size={size} color="#A9A9A9" />;
    if (code >= 1030 && code <= 1039) return <Ionicons name="cloud" size={size} color="#A9A9A9" />;
    if (code >= 1063 && code <= 1069) return <Ionicons name="rainy-outline" size={size} color="#4682B4" />;
    if (code >= 1072 && code <= 1117) return <Ionicons name="snow" size={size} color="#F5F5F5" />;
    if (code >= 1135 && code <= 1147) return <Ionicons name="water" size={size} color="#D3D3D3" />;
    if (code >= 1150 && code <= 1201) return <Ionicons name="rainy" size={size} color="#4682B4" />;
    if (code >= 1204 && code <= 1237) return <Ionicons name="snow" size={size} color="#F5F5F5" />;
    if (code >= 1240 && code <= 1252) return <Ionicons name="thunderstorm" size={size} color="#4682B4" />;
    if (code >= 1255 && code <= 1264) return <Ionicons name="snow" size={size} color="#F5F5F5" />;
    if (code >= 1273 && code <= 1282) return <Ionicons name="thunderstorm" size={size} color="#4682B4" />;
    
    return <Ionicons name="partly-sunny" size={size} color="#FFD700" />; // Default icon
  };

  // Format temperature based on selected unit
  const formatTemp = (temp: number) => {
    return Math.round(useCelsius ? temp : weatherData.current.temp_f);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#64FFDA" />
        <Text style={styles.loadingText}>Loading weather data...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={getBackgroundGradient()} style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
      >
        {/* Header section with location and time */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.locationContainer}>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{weatherData.location.name}</Text>
              <Text style={styles.locationRegion}>{weatherData.location.country}</Text>
            </View>
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{formattedDate}</Text>
              <Text style={styles.timeText}>{formattedTime}</Text>
            </View>
          </View>
        </View>

        {/* Error message if any */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Main weather display */}
        <View style={styles.mainWeatherCard}>
          <View style={styles.temperatureRow}>
            {weatherData.current.condition.icon ? (
              <Image
                source={{ uri: `https:${weatherData.current.condition.icon}` }}
                style={styles.weatherIcon}
              />
            ) : (
              getWeatherIcon(weatherData.current.condition.code, 64)
            )}
            <View style={styles.temperatureContainer}>
              <Pressable onPress={toggleTemperatureUnit} style={styles.temperatureWrapper}>
                <Text style={styles.temperatureValue}>
                  {formatTemp(weatherData.current.temp_c)}
                </Text>
                <Text style={styles.temperatureUnit}>°{useCelsius ? 'C' : 'F'}</Text>
              </Pressable>
              <Text style={styles.conditionText}>{weatherData.current.condition.text}</Text>
              <Text style={styles.feelsLikeText}>
                Feels like {formatTemp(weatherData.current.feelslike_c)}°{useCelsius ? 'C' : 'F'}
              </Text>
            </View>
          </View>

          {/* Weather recommendation */}
          <View style={styles.recommendationContainer}>
            <Ionicons name="information-circle" size={20} color="#64FFDA" />
            <Text style={styles.recommendationText}>{getWeatherRecommendation()}</Text>
          </View>
        </View>

        {/* Additional weather details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Weather Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="water-outline" size={24} color="#64FFDA" />
              <Text style={styles.detailLabel}>Humidity</Text>
              <Text style={styles.detailValue}>{weatherData.current.humidity}%</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="speedometer-outline" size={24} color="#64FFDA" />
              <Text style={styles.detailLabel}>Wind</Text>
              <Text style={styles.detailValue}>{Math.round(weatherData.current.wind_kph)} km/h</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="rainy-outline" size={24} color="#64FFDA" />
              <Text style={styles.detailLabel}>Precipitation</Text>
              <Text style={styles.detailValue}>{weatherData.current.precip_mm} mm</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="eye-outline" size={24} color="#64FFDA" />
              <Text style={styles.detailLabel}>Visibility</Text>
              <Text style={styles.detailValue}>{weatherData.current.vis_km} km</Text>
            </View>
          </View>
        </View>

        {/* Sunrise & Sunset */}
        {weatherData.forecast.forecastday.length > 0 && (
          <View style={styles.sunTimesCard}>
            <Text style={styles.sectionTitle}>Sunrise & Sunset</Text>
            <View style={styles.sunTimesContainer}>
              <View style={styles.sunTimeItem}>
                <Ionicons name="sunny-outline" size={24} color="#FFD700" />
                <Text style={styles.sunTimeLabel}>Sunrise</Text>
                <Text style={styles.sunTimeValue}>{weatherData.forecast.forecastday[0].astro.sunrise}</Text>
              </View>
              <View style={styles.sunTimeItem}>
                <Ionicons name="moon-outline" size={24} color="#A9A9A9" />
                <Text style={styles.sunTimeLabel}>Sunset</Text>
                <Text style={styles.sunTimeValue}>{weatherData.forecast.forecastday[0].astro.sunset}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 3-day forecast */}
        {weatherData.forecast.forecastday.length > 0 && (
          <View style={styles.forecastCard}>
            <Text style={styles.sectionTitle}>3-Day Forecast</Text>
            <View style={styles.forecastList}>
              {weatherData.forecast.forecastday.map((day, index) => (
                <View key={index} style={styles.forecastItem}>
                  <Text style={styles.forecastDay}>
                    {index === 0 ? 'Today' : format(new Date(day.date), 'EEE')}
                  </Text>
                  <View style={styles.forecastIconContainer}>
                    {day.day.condition.icon ? (
                      <Image
                        source={{ uri: `https:${day.day.condition.icon}` }}
                        style={styles.forecastIcon}
                      />
                    ) : (
                      getWeatherIcon(day.day.condition.code, 24)
                    )}
                  </View>
                  <View style={styles.forecastTempContainer}>
                    <Text style={styles.forecastHighTemp}>
                      {formatTemp(day.day.maxtemp_c)}°
                    </Text>
                    <Text style={styles.forecastLowTemp}>
                      {formatTemp(day.day.mintemp_c)}°
                    </Text>
                  </View>
                  <View style={styles.rainChanceContainer}>
                    <Ionicons name="water-outline" size={14} color="#64FFDA" />
                    <Text style={styles.rainChanceText}>{day.day.daily_chance_of_rain}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Refresh button */}
        <Pressable onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.refreshButtonText}>Refresh Weather</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A192F',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  locationRegion: {
    color: '#CCD6F6',
    fontSize: 16,
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  timeText: {
    color: '#CCD6F6',
    fontSize: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  mainWeatherCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  temperatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherIcon: {
    width: 64,
    height: 64,
    marginRight: 16,
  },
  temperatureContainer: {
    flex: 1,
  },
  temperatureWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  temperatureValue: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
  },
  temperatureUnit: {
    color: '#FFFFFF',
    fontSize: 24,
    marginTop: 6,
  },
  conditionText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  feelsLikeText: {
    color: '#CCD6F6',
    fontSize: 14,
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 10,
  },
  recommendationText: {
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  detailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  detailLabel: {
    color: '#CCD6F6',
    fontSize: 14,
    marginTop: 8,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  sunTimesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sunTimesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sunTimeItem: {
    width: '48%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  sunTimeLabel: {
    color: '#CCD6F6',
    fontSize: 14,
    marginTop: 8,
  },
  sunTimeValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  forecastCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  forecastList: {
    gap: 8,
  },
  forecastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  forecastDay: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    width: 80,
  },
  forecastIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  forecastIcon: {
    width: 30,
    height: 30,
  },
  forecastTempContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  forecastHighTemp: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  forecastLowTemp: {
    color: '#CCD6F6',
    fontSize: 16,
  },
  rainChanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  rainChanceText: {
    color: '#CCD6F6',
    fontSize: 14,
    marginLeft: 4,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#64FFDA',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  refreshButtonText: {
    color: '#0A192F',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 