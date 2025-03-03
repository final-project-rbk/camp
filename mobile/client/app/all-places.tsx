import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  Pressable,
  ActivityIndicator 
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {  EXPO_PUBLIC_API_URL  } from '../config';
import { Link } from 'expo-router';

interface Category {
  name: string;
  icon: string;
}

interface Place {
  id: string;
  name: string;
  location: string;
  image: string;
  rating: number;
  categories: Category[];
}

export default function AllPlacesScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${ EXPO_PUBLIC_API_URL }categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPlaces = async (category?: string) => {
    try {
      setLoading(true);
      const queryParams = category ? `?category=${category}` : '';
      const response = await fetch(`${ EXPO_PUBLIC_API_URL }places${queryParams}`);
      const data = await response.json();
      if (data.success) {
        setPlaces(data.data);
      }
    } catch (error) {
    throw error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPlaces(selectedCategory || undefined);
  }, [selectedCategory]);

  const renderPlace = ({ item }: { item: Place }) => (
    <Link href={`/place/${item.id}`} asChild>
      <Pressable style={styles.placeCard}>
        <Image source={{ uri: item.image }} style={styles.placeImage} />
        <View style={styles.placeInfo}>
          <Text style={styles.placeName}>{item.name}</Text>
          <Text style={styles.placeLocation}>{item.location}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{item.rating}</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );

  const renderCategoryFilter = ({ item }: { item: Category }) => (
    <Pressable 
      style={[
        styles.categoryButton,
        selectedCategory === item.name && styles.selectedCategory
      ]}
      onPress={() => setSelectedCategory(selectedCategory === item.name ? null : item.name)}
    >
      <LinearGradient
        colors={selectedCategory === item.name 
          ? ['#64FFDA', '#48A89A'] 
          : ['#1D2D50', '#1A2744']}
        style={styles.categoryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[
          styles.categoryIcon,
          selectedCategory === item.name && styles.selectedCategoryIcon
        ]}>
          {item.icon}
        </Text>
        <Text style={[
          styles.categoryText,
          selectedCategory === item.name && styles.selectedCategoryText
        ]}>
          {item.name}
        </Text>
      </LinearGradient>
    </Pressable>
  );

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'All Places',
          headerStyle: { backgroundColor: '#0A192F' },
          headerTintColor: '#64FFDA'
        }} 
      />
      <View style={styles.container}>
        <FlatList
          data={categories}
          renderItem={renderCategoryFilter}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryList}
        />
        {loading ? (
          <ActivityIndicator color="#64FFDA" />
        ) : (
          <FlatList
            data={places}
            renderItem={renderPlace}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.placesList}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  categoryList: {
    padding: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(29, 45, 80, 0.5)',
  },
  categoryButton: {
    marginRight: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  categoryGradient: {
    padding: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  selectedCategory: {
    transform: [{ scale: 1.02 }],
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  categoryText: {
    color: '#CCD6F6',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#0A192F',
    fontWeight: '700',
  },
  selectedCategoryIcon: {
    transform: [{ scale: 1.1 }],
  },
  placesList: {
    padding: 15,
  },
  placeCard: {
    backgroundColor: '#1D2D50',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  placeImage: {
    width: '100%',
    height: 200,
  },
  placeInfo: {
    padding: 15,
  },
  placeName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeLocation: {
    color: '#8892B0',
    marginTop: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  rating: {
    color: '#FFFFFF',
    marginLeft: 5,
  },
}); 