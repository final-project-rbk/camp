import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  Pressable,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { EXPO_PUBLIC_API_URL } from '../config';
import { Link } from 'expo-router';
import FavoriteButton from '../components/FavoriteButton';

const { width } = Dimensions.get('window');

interface Category {
  name: string;
  icon: string;
}

interface Place {
  id: string;
  name: string;
  location: string;
  images: string[] | string; // Can be an array or JSON string
  image?: string; // For backward compatibility
  rating: number;
  categories: Category[];
}

// Map category names to appropriate icons from Ionicons
const categoryIcons: {[key: string]: string} = {
  'Beaches': 'umbrella-outline',
  'Mountains': 'mountain-outline',
  'Forests': 'leaf-outline',
  'Lakes': 'water-outline',
  'Deserts': 'sunny-outline',
};

export default function AllPlacesScreen() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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
      setPlaces([]); // Clear places when starting new search
      const queryParams = category ? `?category=${category}` : '';
      const response = await fetch(`${EXPO_PUBLIC_API_URL}places${queryParams}`);
      const data = await response.json();
      if (data.success) {
        // Process the places data to ensure images are properly parsed
        const processedPlaces = data.data.map((place: any) => {
          // If images is a string, try to parse it as JSON
          if (typeof place.images === 'string') {
            try {
              place.images = JSON.parse(place.images);
            } catch (e) {
              // Keep original string if parsing fails
            }
          }
          
          // If place.images is still not an array or is an empty array, provide a fallback
          if (!Array.isArray(place.images) || place.images.length === 0) {
            if (typeof place.images === 'string' && place.images) {
              place.images = [place.images]; // Convert string to array
            } else {
              place.images = ['https://via.placeholder.com/400']; // Use fallback
            }
          }
          
          return place;
        });
        
        setPlaces(processedPlaces);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlaces(selectedCategory || undefined);
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
        <Image 
          source={{ 
            uri: Array.isArray(item.images) && item.images.length > 0 
              ? item.images[0] 
              : (typeof item.images === 'string' && item.images
                  ? item.images 
                  : 'https://via.placeholder.com/400') 
          }} 
          style={styles.placeImage}
        />
        <LinearGradient
          colors={['transparent', 'rgba(10, 25, 47, 0.8)', 'rgba(10, 25, 47, 0.95)']}
          style={styles.imageGradient}
        />
        <View style={styles.cardContent}>
          <View style={styles.categoryTags}>
            {item.categories && item.categories.slice(0, 2).map((cat, index) => (
              <View key={index} style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{cat.icon} {cat.name}</Text>
              </View>
            ))}
          </View>
          <View style={styles.placeInfo}>
            <Text style={styles.placeName}>{item.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="#64FFDA" />
              <Text style={styles.placeLocation}>{item.location}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{item.rating || "New"}</Text>
            </View>
          </View>
          <FavoriteButton placeId={item.id} style={styles.favoriteButton} />
        </View>
      </Pressable>
    </Link>
  );

  const renderCategoryFilter = ({ item }: { item: Category }) => {
    const isSelected = selectedCategory === item.name;
    return (
      <Pressable 
        style={[
          styles.categoryButton,
          isSelected && styles.selectedCategory
        ]}
        onPress={() => setSelectedCategory(isSelected ? null : item.name)}
      >
        <LinearGradient
          colors={isSelected 
            ? ['#64FFDA', '#48A89A'] 
            : ['rgba(29, 45, 80, 0.8)', 'rgba(26, 39, 68, 0.9)']}
          style={styles.categoryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.categoryIconContainer}>
            {item.icon ? (
              <Text style={{ fontSize: 24, color: isSelected ? '#0A192F' : '#64FFDA' }}>
                {item.icon}
              </Text>
            ) : (
              <Ionicons 
                name={(categoryIcons[item.name] || "compass-outline") as keyof typeof Ionicons.glyphMap}
                size={24} 
                color={isSelected ? '#0A192F' : '#64FFDA'} 
              />
            )}
          </View>
          <Text style={[
            styles.categoryText,
            isSelected && styles.selectedCategoryText
          ]}>
            {item.name}
          </Text>
        </LinearGradient>
      </Pressable>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search" size={64} color="#64FFDA" />
      <Text style={styles.emptyText}>
        {selectedCategory 
          ? `No camping spots found in ${selectedCategory} category` 
          : 'No camping spots available'}
      </Text>
      {selectedCategory && (
        <Pressable 
          style={styles.resetButton}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={styles.resetButtonText}>Show All Spots</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#64FFDA" />
        </Pressable>
        <Text style={styles.headerTitle}>Discover Places</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerSubtitle}>
            Find Your Perfect Camping Spot in Tunisia
          </Text>
          <Text style={styles.headerDescription}>
            Explore the best camping destinations across Tunisia
          </Text>
        </View>
        
        <View style={styles.categoryListContainer}>
          <FlatList
            data={categories}
            renderItem={renderCategoryFilter}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryList}
            contentContainerStyle={styles.categoryListContent}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#64FFDA" />
            <Text style={styles.loadingText}>
              Finding amazing camping spots...
            </Text>
          </View>
        ) : (
          <FlatList
            data={places}
            renderItem={renderPlace}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.placesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyList}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 255, 218, 0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  headerContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginBottom: 4,
  },
  headerDescription: {
    fontSize: 14,
    color: '#8892B0',
  },
  categoryListContainer: {
    backgroundColor: 'rgba(29, 45, 80, 0.4)',
    borderRadius: 8,
    marginVertical: 8,
  },
  categoryList: {
    paddingVertical: 12,
  },
  categoryListContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    marginRight: 12,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  categoryGradient: {
    padding: 12,
    borderRadius: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(10, 25, 47, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedCategory: {
    transform: [{ scale: 1.05 }],
  },
  categoryText: {
    color: '#CCD6F6',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#0A192F',
    fontWeight: '700',
  },
  placesList: {
    padding: 16,
    paddingBottom: 32,
  },
  placeCard: {
    backgroundColor: '#1D2D50',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  placeImage: {
    width: '100%',
    height: 220,
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  categoryTags: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: 'rgba(100, 255, 218, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#64FFDA',
  },
  categoryTagText: {
    color: '#64FFDA',
    fontSize: 12,
    fontWeight: '500',
  },
  placeInfo: {
    flexDirection: 'column',
  },
  placeName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  placeLocation: {
    color: '#CCD6F6',
    fontSize: 14,
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: '#FFFFFF',
    marginLeft: 4,
  },
  favoriteButton: {
    position: 'absolute',
    top: 0,
    right: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#64FFDA',
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#8892B0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: '#64FFDA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#0A192F',
    fontWeight: 'bold',
  },
});