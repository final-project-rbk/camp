import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabBar from '../../components/TabBar';
import StaticTabbar, { tabHeight } from '../../components/TabBar/StaticTabbar';

// Tab bar height including safe area insets (for use in other components)
export const TAB_BAR_HEIGHT = tabHeight + (Platform.OS === 'ios' ? 34 : 0);

export default function TabLayout() {
  return (
    <View style={styles.container}>
      {/* Hidden Tabs component for routing */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { 
            display: 'none',
          },
        }}
        initialRouteName="home"
      >
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="market"
          options={{
            title: 'Market',
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favorites',
          }}
        />
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
          }}
        />
        <Tabs.Screen
          name="story"
          options={{
            title: 'Story',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
          }}
        />
      </Tabs>
      
      {/* Animated TabBar component */}
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0A192F',
  },
});
