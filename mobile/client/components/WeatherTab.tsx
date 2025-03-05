import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cloud, CloudRain, Sun, Wind, ThermometerSun, Droplets, CloudSnow, CloudLightning, AlertTriangle } from 'lucide-react-native';

const WeatherTab: React.FC = () => {
  const [currentWeather, setCurrentWeather] = useState({
    temp: 72,
    condition: 'Partly Cloudy',
    humidity: 45,
    windSpeed: 8,
    precipitation: 10,
  });

  const [forecast, setForecast] = useState([
    { day: 'Today', high: 75, low: 62, condition: 'Partly Cloudy' },
    { day: 'Tomorrow', high: 78, low: 64, condition: 'Sunny' },
    { day: 'Wed', high: 68, low: 58, condition: 'Rain' },
    { day: 'Thu', high: 70, low: 60, condition: 'Cloudy' },
    { day: 'Fri', high: 72, low: 62, condition: 'Sunny' },
  ]);

  const [location] = useState('Mountain View Campground');

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentWeather({
        temp: 74,
        condition: 'Partly Cloudy',
        humidity: 48,
        windSpeed: 7,
        precipitation: 15,
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Current Weather */}
      <View style={styles.card}>
        <View style={styles.locationHeader}>
          <Text style={styles.locationText}>{location}</Text>
          <Text style={styles.updateText}>Updated just now</Text>
        </View>
        
        <View style={styles.currentWeather}>
          <Cloud size={24} color="#64FFDA" />
          <Text style={styles.temperature}>{currentWeather.temp}°F</Text>
          <View style={styles.weatherDetails}>
            <Text style={styles.condition}>{currentWeather.condition}</Text>
            <Text style={styles.feelsLike}>Feels like {currentWeather.temp + 2}°F</Text>
          </View>
        </View>
        
        <View style={styles.weatherStats}>
          <View style={styles.statItem}>
            <Droplets size={16} color="#64FFDA" />
            <Text style={styles.statLabel}>Humidity</Text>
            <Text style={styles.statValue}>{currentWeather.humidity}%</Text>
          </View>
          <View style={styles.statItem}>
            <Wind size={16} color="#64FFDA" />
            <Text style={styles.statLabel}>Wind</Text>
            <Text style={styles.statValue}>{currentWeather.windSpeed} mph</Text>
          </View>
          <View style={styles.statItem}>
            <CloudRain size={16} color="#64FFDA" />
            <Text style={styles.statLabel}>Precip</Text>
            <Text style={styles.statValue}>{currentWeather.precipitation}%</Text>
          </View>
        </View>
      </View>

      {/* Forecast */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>5-Day Forecast</Text>
        <View style={styles.forecastContainer}>
          {forecast.map((day, index) => (
            <View key={index} style={styles.forecastItem}>
              <Text style={styles.forecastDay}>{day.day}</Text>
              <View style={styles.forecastDetails}>
                <Text style={styles.forecastTemp}>
                  <Text>{day.high}° </Text>
                  <Text style={styles.lowTemp}>{day.low}°</Text>
                </Text>
                <Text style={styles.forecastCondition}>{day.condition}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Weather Alerts */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Weather Alerts</Text>
        <View style={styles.alertContainer}>
          <AlertTriangle size={20} color="#FBBF24" />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Wind Advisory</Text>
            <Text style={styles.alertText}>
              Strong winds expected tonight through tomorrow morning. Secure loose items around your campsite.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  locationText: {
    color: '#F3F4F6',
    fontSize: 18,
    fontWeight: '500',
  },
  updateText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  currentWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  temperature: {
    color: '#F3F4F6',
    fontSize: 32,
    fontWeight: '500',
  },
  weatherDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  condition: {
    color: '#F3F4F6',
    fontSize: 16,
  },
  feelsLike: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  weatherStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  statValue: {
    color: '#F3F4F6',
    fontSize: 14,
  },
  sectionTitle: {
    color: '#F3F4F6',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  forecastContainer: {
    gap: 12,
  },
  forecastItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forecastDay: {
    color: '#F3F4F6',
    fontSize: 14,
    width: 80,
  },
  forecastDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  forecastTemp: {
    color: '#F3F4F6',
    fontSize: 14,
  },
  lowTemp: {
    color: '#9CA3AF',
  },
  forecastCondition: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  alertContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#1E293B',
    borderColor: '#FBBF24',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  alertText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});

export default WeatherTab; 