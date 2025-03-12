import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EXPO_PUBLIC_API_URL } from '../../config';
import { useFocusEffect } from '@react-navigation/native';
import FavoriteButton from '../../components/FavoriteButton';

interface Place {
  id: string;
  name: string;
  location: string;
  image: string;
  rating: number;
}

export default function Favorites() {
  const [favorites, setFavorites] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = 1;

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${EXPO_PUBLIC_API_URL}favorites/user/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setFavorites(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch favorites');
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log('Favorites screen focused - refreshing data');
      fetchFavorites();
    }, [])
  );

  const renderFavoriteItem = ({ item }: { item: Place }) => (
    <Link href={`/place/${item.id}`} asChild>
      <Pressable style={styles.listItem}>
        <Image
          source={{ uri: item.image }}
          style={styles.listImage}
          onError={() => console.log('Failed to load image')}
        />
        <View style={styles.listContent}>
          <Text style={styles.listTitle}>{item.name}</Text>
          <View style={styles.listDetails}>
            <View style={styles.loadingContainer}>
              <Ionicons name="location" size={22} color="#8892B0" />
              <Text style={styles.listLocation}>{item.location}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={22} color="#FFD700" />
              <Text style={styles.rating}>{item.rating}</Text>
            </View>
          </View>
          <FavoriteButton placeId={item.id} initialIsFavorite={true} style={styles.favoriteButton} />
        </View>
      </Pressable>
    </Link>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Your Favorites</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#64FFDA" />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchFavorites}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#64FFDA" />
          <Text style={styles.emptyText}>No favorites yet</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {favorites.map((item) => (
            <View key={item.id}>
              {renderFavoriteItem({ item })}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  sectionTitle: {
    fontSize: 24,
    color: '#CCD6F6',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
  },
  listItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  listImage: {
    width: '100%',
    height: 200,
  },
  listContent: {
    padding: 20,
    position: 'relative',
  },
  listTitle: {
    fontSize: 24,
    color: '#CCD6F6',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  listDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listLocation: {
    color: '#8892B0',
    fontSize: 18,
    marginLeft: 8,
  },
  favoriteButton: {
    position: 'absolute',
    top: -40,
    right: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rating: {
    color: '#CCD6F6',
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#64FFDA',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A192F',
    padding: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#64FFDA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#0A192F',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
    