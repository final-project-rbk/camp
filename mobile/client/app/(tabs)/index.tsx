import React, { useEffect, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        const userToken = await AsyncStorage.getItem('userToken');

        if (hasSeenOnboarding !== 'true') {
          console.log('User has not seen onboarding, redirecting...');
          router.replace('/onbording');
        } else if (!userToken) {
          console.log('No auth token found, redirecting to auth...');
          router.replace('/auth');
        } else {
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        router.replace('/onbording');
      }
    };

    checkAuth();
  }, []);

  // Show nothing while checking
  if (isChecking) {
    return <View />;
  }

  // Only redirect to home if all checks have passed
  return <Redirect href="/(tabs)/home" />;
}