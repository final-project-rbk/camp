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
      // Make sure we're using the correct URL format
      const apiUrl = `${EXPO_PUBLIC_API_URL}favorites/toggle`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ 
          placeId 
        }),
      });
      
      // Handle non-OK responses
      if (!response.ok) {
        console.error(`Server error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Response body: ${errorText}`);
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }
      
      // Get response as text first for debugging
      const responseText = await response.text();
      
      // Parse JSON only if there's content
      let data;
      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          console.error('Response that failed to parse:', responseText);
          throw new Error('Invalid JSON response from server');
        }
      } else {
        console.error('Empty response from server');
        throw new Error('Empty response from server');
      }
      
      if (data && data.success) {
        setIsFavorite(!isFavorite);
      } else {
        console.error('Error toggling favorite:', data?.error || 'Unknown error');
        Alert.alert("Error", data?.error || "Failed to update favorites");
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