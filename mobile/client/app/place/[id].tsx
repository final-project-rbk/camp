import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
  FlatList
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EXPO_PUBLIC_API_URL } from '../../config';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    name: string;
    avatar: string;
  };
}

interface PlaceDetails {
  id: string;
  name: string;
  description: string;
  location: string;
  images: string[];
  rating: number;
  reviews: Review[];
  categories: {
    name: string;
    icon: string;
  }[];
}

export default function PlaceDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const fetchPlaceDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching place details for ID:', id);
      
      // Make sure the URL is properly formatted
      const apiUrl = `${EXPO_PUBLIC_API_URL}/api/places/${id}`;
      console.log('Fetching from URL:', apiUrl);

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success && data.data) {
        setPlace(data.data);
      } else {
        console.error('Failed to fetch place:', data.error);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      // Handle specific error cases
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      console.log('ID received:', id);
      fetchPlaceDetails();
    } else {
      console.error('No ID provided');
    }
  }, [id]);

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: item.user.avatar }}
          style={styles.reviewerAvatar}
        />
        <View>
          <Text style={styles.reviewerName}>{item.user.name}</Text>
          <View style={styles.ratingContainer}>
            {[...Array(5)].map((_, index) => (
              <Ionicons
                key={index}
                name={index < item.rating ? 'star' : 'star-outline'}
                size={16}
                color="#FFD700"
              />
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
      <Text style={styles.reviewDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#64FFDA" size="large" />
      </View>
    );
  }

  if (!place) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Place not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: place.name,
          headerStyle: { backgroundColor: '#0A192F' },
          headerTintColor: '#64FFDA',
        }}
      />
      <ScrollView style={styles.container}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(
              e.nativeEvent.contentOffset.x / Dimensions.get('window').width
            );
            setActiveImageIndex(newIndex);
          }}
        >
          {place.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.image}
            />
          ))}
        </ScrollView>

        <View style={styles.pagination}>
          {place.images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === activeImageIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name}>{place.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.rating}>{place.rating}</Text>
            </View>
          </View>

          <View style={styles.locationContainer}>
            <Ionicons name="location" size={20} color="#64FFDA" />
            <Text style={styles.location}>{place.location}</Text>
          </View>

          <View style={styles.categoriesContainer}>
            {place.categories.map((category, index) => (
              <View key={index} style={styles.categoryChip}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{place.description}</Text>

          <Text style={styles.sectionTitle}>Reviews</Text>
          <FlatList
            data={place.reviews}
            renderItem={renderReview}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A192F',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A192F',
  },
  errorText: {
    color: '#64FFDA',
    fontSize: 16,
  },
  image: {
    width: Dimensions.get('window').width,
    height: 300,
    resizeMode: 'cover',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 280,
    width: '100%',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#64FFDA',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CCD6F6',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: '#CCD6F6',
    fontSize: 18,
    marginLeft: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  location: {
    color: '#8892B0',
    fontSize: 16,
    marginLeft: 5,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  categoryName: {
    color: '#64FFDA',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginBottom: 10,
  },
  description: {
    color: '#8892B0',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  reviewerName: {
    color: '#CCD6F6',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewComment: {
    color: '#8892B0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    color: '#64FFDA',
    fontSize: 12,
  },
}); 