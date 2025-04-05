import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';
import { EXPO_PUBLIC_API_URL } from '../config';
import AuthService from './auth.service';

class LocationService {
  // Request location permission from the user
  async requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  // Check current location permission status
  async checkLocationPermission() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }

  // Get user's current location
  async getCurrentLocation() {
    try {
      const isPermissionGranted = await this.checkLocationPermission();
      
      if (!isPermissionGranted) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Update user's location permission status in the database
  async updateLocationPermissionStatus(isGranted: boolean) {
    try {
      const token = await AuthService.getToken();
      const user = await AuthService.getUser();

      if (!token || !user) {
        console.error('No auth data found');
        return false;
      }

      const response = await fetch(`${EXPO_PUBLIC_API_URL}users/${user.id}/location-permission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ locationPermission: isGranted })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local user data with new permission status
        const updatedUser = { ...user, locationPermission: isGranted };
        await AuthService.storeAuthData({ token, user: updatedUser });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating location permission status:', error);
      return false;
    }
  }

  // Open app settings to allow user to enable location
  openLocationSettings() {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }

  // Show alert for location permission
  showLocationPermissionAlert() {
    Alert.alert(
      'Location Access Required',
      'This app needs location access to show nearby camping sites and calculate distances.',
      [
        { text: 'Not Now', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => this.openLocationSettings() 
        }
      ]
    );
  }

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Earth radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  // Convert degrees to radians
  deg2rad(deg: number) {
    return deg * (Math.PI/180);
  }

  // Update user's location permission status in the database for a specific user
  async updatePermissionStatus(userId: number, isGranted: boolean, accessToken: string) {
    try {
      if (!userId || !accessToken) {
        console.error('Missing userId or accessToken');
        return false;
      }

      const response = await fetch(`${EXPO_PUBLIC_API_URL}users/${userId}/location-permission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ locationPermission: isGranted })
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error updating permission status:', error);
      return false;
    }
  }
}

export default new LocationService(); 