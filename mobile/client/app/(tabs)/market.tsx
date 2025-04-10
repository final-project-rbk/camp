import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator, 
  TextInput, 
  Alert,
  Platform,
  Dimensions,
  FlatList
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, AntDesign, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { EXPO_PUBLIC_API_URL } from '../../config';

import { useAuth as auth } from '../../context/AuthContext'
import { useAuth } from '../../hooks/useAuth';
import { TAB_BAR_HEIGHT } from '../../components/TabBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  media?: {
    id: number;
    url: string;
    type: string;
  }[];
}

interface MarketplaceItem {
  id: number;
  title: string;
  description: string;
  price: number;
  status: 'available' | 'sold' | 'pending';
  sellerId: number;
  seller: {
    first_name: string;
    last_name: string;
    profile_image: string;
  };
  images: string[];
  categories: Category[];
  media: {
    id: number;
    url: string;
    type: string;
  }[];
  imageURL?: string;
}

interface SearchFilters {
  minPrice?: string;
  maxPrice?: string;
  category?: string;
}

const DEFAULT_AVATAR = 'https://via.placeholder.com/50?text=User';

export default function Market() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
   const { accessToken } = auth();

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${EXPO_PUBLIC_API_URL}marketplace/categories`);
      const allCategories = [
        { 
          id: 'all', 
          name: 'All',
          media: [] 
        },
        ...response.data.map((cat: any) => ({
          id: cat.id.toString(),
          name: cat.name,
          description: cat.description,
          media: cat.media || [],
          icon: cat.media?.[0]?.url || cat.icon // Use first media URL if available, fallback to icon
        }))
      ];
      setCategories(allCategories);
    } catch (error) {
      // Error handling for category fetching
    }
  };

  const fetchItems = async (categoryId?: string) => {
    try {
      setError(null);
      const url = categoryId && categoryId !== 'all'
        ? `${EXPO_PUBLIC_API_URL}marketplace/categories/${categoryId}/items`
        : `${EXPO_PUBLIC_API_URL}marketplace/items`;
      
      const response = await axios.get(url);
      const itemsWithMedia = response.data.map((item: MarketplaceItem) => ({
        ...item,
        media: item.media || [] // Ensure media is always an array
      }));
      setItems(Array.isArray(itemsWithMedia) ? itemsWithMedia : []);
    } catch (error) {
      // Error handling for marketplace items fetching
      setError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchItems = async (query: string) => {
    if (!query.trim() && !searchFilters.minPrice && !searchFilters.maxPrice && !searchFilters.category) {
      fetchItems(selectedCategory);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);

      const params = new URLSearchParams();
      if (query.trim()) params.append('name', query);
      if (searchFilters.minPrice) params.append('minPrice', searchFilters.minPrice);
      if (searchFilters.maxPrice) params.append('maxPrice', searchFilters.maxPrice);
      if (searchFilters.category && searchFilters.category !== 'all') {
        params.append('category', searchFilters.category);
      }

      const response = await axios.get(`${EXPO_PUBLIC_API_URL}marketplace/search?${params.toString()}`);
      const itemsWithMedia = response.data.map((item: MarketplaceItem) => ({
        ...item,
        media: item.media || [] // Ensure media is always an array
      }));
      setItems(Array.isArray(itemsWithMedia) ? itemsWithMedia : []);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Handle "No items found" as a success case
        setItems([]);
      } else if (axios.isAxiosError(error)) {
        // Error handling for axios errors
        setError(error.response?.data?.details || 'Failed to search items. Please try again.');
      } else {
        // Error handling for other errors
        setError('Failed to search items. Please try again.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = (filters: Partial<SearchFilters>) => {
    setSearchFilters(prev => ({ ...prev, ...filters }));
    searchItems(searchQuery);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchItems(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchItems(selectedCategory);
  }, [selectedCategory]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchItems(selectedCategory).finally(() => setRefreshing(false));
  }, [selectedCategory]);

  const handleChatPress = async (sellerId: number) => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'Please login to chat with sellers');
      return;
    }

    if (sellerId === user?.id) {
      Alert.alert('Error', 'You cannot chat with yourself');
      return;
    }

    try {
      // Show loading indicator
      setLoading(true);

      // Create or get chat room
      const response = await axios.post(
        `${EXPO_PUBLIC_API_URL}chat/rooms/get-or-create`,
        { userId: sellerId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const roomData = response.data;
      const roomId = roomData.id;
      const isNewRoom = roomData.isNew;

      if (!roomId) {
        throw new Error('Failed to get a valid room ID');
      }

      // Navigate to chat room
      router.push({
        pathname: "/chat/[roomId]",
        params: {
          roomId: roomId.toString(),
          isNewRoom: isNewRoom ? '1' : '0'
        }
      });

    } catch (error) {
      // Error handling for chat
      let errorMessage = 'Could not start chat. Please try again later.';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage = 'Your session has expired. Please login again.';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(
        'Chat Error',
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNewItemPress = () => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'Please login to create listings');
      return;
    }
    router.push('/market/new');
  };

  const handleMyChatsPress = () => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'Please login to view your chats');
      return;
    }
    router.push('/chat/room');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#64FFDA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with shadow and elevation */}
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleMyChatsPress}
          >
            <Ionicons name="chatbubbles-outline" size={24} color="#64FFDA" />
            <Text style={styles.headerButtonText}>My Chats</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleNewItemPress}
          >
            <Ionicons name="add-circle-outline" size={24} color="#64FFDA" />
            <Text style={styles.headerButtonText}>Sell Item</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search bar with improved styling */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8892B0" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search items..."
              placeholderTextColor="#8892B0"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => {
                  setSearchQuery('');
                  setSearchFilters({});
                  fetchItems(selectedCategory);
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#8892B0" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Price range filters */}
        <View style={styles.filterContainer}>
          <TextInput
            style={styles.priceInput}
            placeholder="Min Price"
            placeholderTextColor="#8892B0"
            keyboardType="numeric"
            value={searchFilters.minPrice}
            onChangeText={(text) => handleFilterChange({ minPrice: text })}
          />
          <View style={styles.priceSeparator} />
          <TextInput
            style={styles.priceInput}
            placeholder="Max Price"
            placeholderTextColor="#8892B0"
            keyboardType="numeric"
            value={searchFilters.maxPrice}
            onChangeText={(text) => handleFilterChange({ maxPrice: text })}
          />
        </View>

        {/* Improved Categories Carousel */}
        <View style={styles.categoriesSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  selectedCategory === item.id && styles.categoryButtonActive
                ]}
                onPress={() => {
                  setSelectedCategory(item.id);
                  handleFilterChange({ category: item.id });
                }}
              >
                {(item.media?.[0]?.url || item.icon) && (
                  <Image 
                    source={{ uri: item.media?.[0]?.url || item.icon }}
                    style={styles.categoryIcon}
                  />
                )}
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === item.id && styles.categoryButtonTextActive
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {isSearching && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#64FFDA" />
          </View>
        )}

        {!isSearching && (
          <View style={styles.itemsGrid}>
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
            
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => router.push(`/market/${item.id}`)}
                activeOpacity={0.9}
              >
                <View style={styles.itemImageContainer}>
                  {item.media?.length > 0 ? (
                    <Image 
                      source={{ 
                        uri: item.media[0].url || 'https://via.placeholder.com/400x300?text=No+Image'
                      }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  ) : item.imageURL ? (
                    <Image 
                      source={{ 
                        uri: item.imageURL
                      }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.noImageContainer}>
                      <Ionicons name="image-outline" size={40} color="#1D2D50" />
                      <Text style={styles.noImageText}>No Image</Text>
                    </View>
                  )}
                  
                  {/* Status badge for items */}
                  {item.status !== 'available' && (
                    <View style={[
                      styles.statusBadge,
                      item.status === 'sold' ? styles.soldBadge : styles.pendingBadge
                    ]}>
                      <Text style={styles.statusText}>
                        {item.status === 'sold' ? 'SOLD' : 'PENDING'}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.itemPrice}>${item.price}</Text>
                  
                  <View style={styles.sellerInfo}>
                    <Image 
                      source={{ 
                        uri: item.seller?.profile_image || DEFAULT_AVATAR
                      }}
                      style={styles.sellerImage}
                    />
                    <Text style={styles.sellerName} numberOfLines={1}>
                      {item.seller?.first_name} {item.seller?.last_name}
                    </Text>
                    <TouchableOpacity 
                      style={styles.chatButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleChatPress(item.sellerId);
                      }}
                    >
                      <Ionicons name="chatbubble-outline" size={20} color="#64FFDA" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            
            {items.length === 0 && !error && (
              <View style={styles.emptyState}>
                <Ionicons name="basket-outline" size={60} color="#64FFDA" />
                <Text style={styles.emptyStateTitle}>No items found</Text>
                <Text style={styles.emptyStateText}>Try changing your search criteria</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Floating action button for adding new items */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleNewItemPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={30} color="#0A192F" />
      </TouchableOpacity>
    </View>
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#112240',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerButtonText: {
    marginLeft: 8,
    color: '#64FFDA',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CCD6F6',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(17, 34, 64, 0.5)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#CCD6F6',
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(17, 34, 64, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 255, 218, 0.1)',
  },
  priceSeparator: {
    width: 15,
    height: 1,
    backgroundColor: '#8892B0',
    marginHorizontal: 10,
  },
  priceInput: {
    flex: 1,
    height: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#CCD6F6',
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
  },
  categoriesSection: {
    paddingVertical: 16,
    backgroundColor: 'rgba(17, 34, 64, 0.3)',
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
  },
  categoryButtonActive: {
    backgroundColor: '#64FFDA',
    borderColor: '#64FFDA',
  },
  categoryButtonText: {
    color: '#8892B0',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#0A192F',
    fontWeight: 'bold',
  },
  categoryIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
    borderRadius: 12,
  },
  itemsGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    backgroundColor: '#112240',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.1)',
  },
  itemImageContainer: {
    position: 'relative',
    height: 150,
    backgroundColor: '#1D2D50',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  noImageText: {
    color: '#8892B0',
    marginTop: 8,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  soldBadge: {
    backgroundColor: '#F44336',
  },
  pendingBadge: {
    backgroundColor: '#FFC107',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemInfo: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    color: '#64FFDA',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  sellerImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sellerName: {
    color: '#8892B0',
    fontSize: 12,
    flex: 1,
  },
  chatButton: {
    padding: 6,
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    borderRadius: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    width: '100%',
  },
  emptyStateTitle: {
    color: '#CCD6F6',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateText: {
    color: '#8892B0',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    width: '100%',
    padding: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: TAB_BAR_HEIGHT + 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#64FFDA',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});