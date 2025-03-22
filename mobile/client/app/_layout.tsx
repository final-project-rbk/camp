import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { darkTheme, lightTheme } from '../constants/theme';

// Customize navigation themes
const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    ...darkTheme,
  },
};

const customLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...lightTheme,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              gestureEnabled: false,
              animation: 'fade',
              contentStyle: {
                backgroundColor: colorScheme === 'dark' ? darkTheme.background : lightTheme.background,
              },
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
              name="[hints]" 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
              }} 
            />
            <Stack.Screen 
              name="+not-found" 
              options={{ 
                headerShown: false 
              }} 
            />
          </Stack>
        </NavigationThemeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
