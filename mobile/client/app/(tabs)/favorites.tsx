import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, ActivityIndicator } from 'react-native';
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
  const userId = 1;

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${EXPO_PUBLIC_API_URL}favorites/user/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setFavorites(data.data);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
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
      <Pressable style={styles.favoriteCard}>
        <FavoriteButton placeId={item.id} initialIsFavorite={true} />
        <Image source={{ uri: item.image }} style={styles.placeImage} />
        <View style={styles.placeInfo}>
          <Text style={styles.placeName}>{item.name}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#8892B0" />
            <Text style={styles.location}>{item.location}</Text>
          </View>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{item.rating}</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#64FFDA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#64FFDA" />
          <Text style={styles.emptyText}>No favorites yet</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchFavorites}
        />
      )}
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
    color: '#64FFDA',
    fontSize: 20,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3347',
  },
  placeImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64FFDA',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  location: {
    color: '#8892B0',
    marginLeft: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  rating: {
    color: '#FFD700',
    marginLeft: 5,
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
  },
  emptyText: {
    color: '#64FFDA',
    fontSize: 18,
    marginTop: 20,
  },
  listContainer: {
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#64FFDA',
    marginBottom: 20,
  },
});
    