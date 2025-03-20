import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EXPO_PUBLIC_API_URL } from '../../config';
import { useFocusEffect } from '@react-navigation/native';
import FavoriteButton from '../../components/FavoriteButton';
import { useAuth } from '../../context/AuthContext';
import { TAB_BAR_HEIGHT } from '../../components/TabBar';

interface Place {
  id: string;
  name: string;
  location: string;
  images: string[];
  rating: number;
}

export default function Favorites() {
  const [favorites, setFavorites] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, accessToken, isLoading } = useAuth();
  const router = useRouter();
  
  // Check if user is authenticated
  const isAuthenticated = !!accessToken && !!user;

  const fetchFavorites = async () => {
    // If not authenticated, don't attempt to fetch
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${EXPO_PUBLIC_API_URL}favorites/user/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      Alert.alert(
        "Authentication Required",
        "Please sign in to view your favorites",
        [
          { text: "Cancel", onPress: () => router.replace('/home') },
          { text: "Sign In", onPress: () => router.push('/auth') }
        ]
      );
    }
  }, [isLoading, isAuthenticated]);

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        fetchFavorites();
      }
    }, [isAuthenticated])
  );

  const renderFavoriteItem = ({ item }: { item: Place }) => (
    <Link href={`/place/${item.id}`} asChild>
      <Pressable style={styles.listItem}>
        <Image
          source={{ uri: Array.isArray(item.images) ? item.images[0] : item.images }}
          style={styles.listImage}
          onError={(e) => console.log('Failed to load image:', e.nativeEvent.error)}
        />
        <View style={styles.listContent}>
          <Text style={styles.listTitle}>{item.name}</Text>
          <View style={styles.listDetails}>
            <View style={styles.locationContainer}>
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

  // If still loading auth state, show loading indicator
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color="#64FFDA" size="large" />
      </View>
    );
  }

  // If not authenticated, don't render content (will be redirected by useEffect)
  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.messageText}>Please sign in to view your favorites</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}
    >
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Your Favorites</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#64FFDA" />
        </View>
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
          <Pressable 
            style={styles.exploreButton}
            onPress={() => router.push('/home')}
          >
            <Text style={styles.exploreButtonText}>Explore Places</Text>
          </Pressable>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
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
  locationContainer: {
    flexDirection: 'row',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 100,
  },
  emptyText: {
    color: '#64FFDA',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A192F',
    padding: 20,
    paddingTop: 100,
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
  exploreButton: {
    backgroundColor: '#64FFDA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  exploreButtonText: {
    color: '#0A192F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageText: {
    color: '#8892B0',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  }
});
    