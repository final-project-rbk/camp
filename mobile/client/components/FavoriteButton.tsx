import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EXPO_PUBLIC_API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

interface FavoriteButtonProps {
  placeId: string;
  initialIsFavorite?: boolean;
  style?: object;
}

export default function FavoriteButton({ placeId, initialIsFavorite = false, style }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const { user, accessToken } = useAuth();
  const router = useRouter();
  
  // Check if user is authenticated
  const isAuthenticated = !!accessToken && !!user;

  const toggleFavorite = async () => {
    // If user is not authenticated, prompt to login
    if (!isAuthenticated) {
      Alert.alert(
        "Authentication Required",
        "Please sign in to add places to your favorites",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => navigateToLogin() }
        ]
      );
      return;
    }

    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}favorites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ 
          userId: user?.id, 
          placeId 
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setIsFavorite(!isFavorite);
      } else {
        console.error('Error toggling favorite:', data.error);
        Alert.alert("Error", data.error || "Failed to update favorites");
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert("Error", "Could not update favorites. Please try again later.");
    }
  };

  // Navigate to login screen
  const navigateToLogin = () => {
    router.push('/auth');
  };

  // Update local state when initialIsFavorite changes
  React.useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  return (
    <TouchableOpacity
      style={[styles.favoriteButton, style]}
      onPress={toggleFavorite}
    >
      <Ionicons
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={24}
        color={isFavorite ? '#FF6B6B' : '#FFF'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
});