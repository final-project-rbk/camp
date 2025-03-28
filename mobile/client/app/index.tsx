import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SplashScreen, router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import LocationService from '../services/location.service';

export default function AppIndex() {
  const { isLoading, accessToken, user } = useAuth();

  // Prevent the splash screen from auto-hiding
  SplashScreen.preventAutoHideAsync();

  useEffect(() => {
    const checkPermissionAndRedirect = async () => {
      if (!isLoading) {
        // Check location permission
        const hasLocationPermission = await LocationService.checkLocationPermission();
        
        // If not logged in, go to onboarding
        if (!accessToken || !user) {
          router.replace('/onbording');
        } else {
          // User is logged in, go to home
          router.replace('/(tabs)');
        }
        
        // Hide the splash screen
        SplashScreen.hideAsync();
      }
    };

    checkPermissionAndRedirect();
  }, [isLoading, accessToken, user]);

  // While checking auth state, show loading
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#64FFDA" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A192F',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#CCD6F6',
  },
}); 