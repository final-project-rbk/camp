import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EXPO_PUBLIC_API_URL } from '../config';

interface FavoriteButtonProps {
  placeId: string;
  initialIsFavorite?: boolean;
  style?: object;
}

export default function FavoriteButton({ placeId, initialIsFavorite = false, style }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);

  const toggleFavorite = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}favorites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: 1, placeId }), // Hardcoded userId for demo
      });
      
      const data = await response.json();
      if (data.success) {
        setIsFavorite(!isFavorite);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
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