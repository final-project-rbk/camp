import React, { useEffect, useState } from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '../context/AuthContext';
import { EXPO_PUBLIC_API_URL } from '../config';

// Keep splash screen visible while we fetch the initial route
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    // Add your fonts here
  });
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    const prepare = async () => {
      try {
        // For testing: Uncomment to reset onboarding status
        // await AsyncStorage.removeItem('hasSeenOnboarding');
        // await AsyncStorage.removeItem('userToken');
        
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        console.log('Initial route check - hasSeenOnboarding:', hasSeenOnboarding);

        if (hasSeenOnboarding !== 'true') {
          // First time user, show onboarding
          console.log('First time user, showing onboarding');
          setInitialRoute('onbording');
        } else {
          // User has seen onboarding, check auth status
          const userToken = await AsyncStorage.getItem('userToken');
          console.log('User has seen onboarding, checking auth token:', userToken ? 'exists' : 'none');
          
          if (userToken) {
            try {
              // Set up timeout for token verification
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

              // Verify token validity by making a test request
              const response = await fetch(`${EXPO_PUBLIC_API_URL}auth/verify`, {
                headers: {
                  'Authorization': `Bearer ${userToken}`
                },
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);
              
              if (response.ok) {
                // Token is valid, go to home
                console.log('Token verified, going to home');
                setInitialRoute('(tabs)');
              } else {
                // Token is invalid, clear it and go to auth
                console.log('Token invalid, clearing and going to auth');
                await AsyncStorage.removeItem('userToken');
                setInitialRoute('auth');
              }
            } catch (error) {
              console.error('Error verifying token:', error);
              // On error, clear token and go to auth
              await AsyncStorage.removeItem('userToken');
              setInitialRoute('auth');
            }
          } else {
            // User needs to log in
            console.log('User needs to authenticate, going to auth');
            setInitialRoute('auth');
          }
        }
      } catch (error) {
        console.error('Error checking initial route:', error);
        // Default to onboarding on error
        setInitialRoute('onbording');
      }
    };

    prepare().then(() => {
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    if (loaded && isReady) {
      // Hide splash screen once everything is ready
      SplashScreen.hideAsync();
    }
  }, [loaded, isReady]);

  // Show loading screen while preparing
  if (!loaded || !isReady || !initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A192F' }}>
        <ActivityIndicator size="large" color="#64FFDA" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider value={DarkTheme}>
        <Stack 
          screenOptions={{ 
            headerShown: false,
            gestureEnabled: false,
            animation: 'fade'
          }}
        >
          <Stack.Screen 
            name="onbording" 
            options={{ 
              headerShown: false,
              gestureEnabled: false,
            }} 
          />
          <Stack.Screen 
            name="auth" 
            options={{ 
              headerShown: false,
              gestureEnabled: false,
            }} 
          />
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              headerShown: false,
              gestureEnabled: false,
            }} 
          />
          <Stack.Screen 
            name="advisor/[id]" 
            options={{ 
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="add-place" 
            options={{ 
              headerShown: false,
              gestureEnabled: false,
            }} 
          />
          <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
