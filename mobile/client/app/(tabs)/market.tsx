import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { EXPO_PUBLIC_API_URL } from '../../config';
import { useAuth } from '../../hooks/useAuth'
import { useAuth as auth } from '../../context/AuthContext'

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
}

interface SearchFilters {
  minPrice?: string;
  maxPrice?: string;
  category?: string;
}

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
      console.error('Error fetching categories:', error);
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
      console.error('Error fetching marketplace items:', error);
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
        console.error('Error searching items:', error.response?.data || error.message);
        setError(error.response?.data?.details || 'Failed to search items. Please try again.');
      } else {
        console.error('Error searching items:', error);
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

  console.log('EXPO_PUBLIC_API_URL',EXPO_PUBLIC_API_URL);
  
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

      const roomId = response.data.id;
      const isNewRoom = response.data.isNew;

      // Navigate to chat room
      router.push({
        pathname: `/chat/${roomId}`,
        params: {
          roomId,
          isNewRoom: isNewRoom ? '1' : '0'
        }
      } as any);

    } catch (error) {
      console.error('Error handling chat:', error);
      Alert.alert(
        'Error',
        'Could not start chat. Please try again later.'
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
    router.push('/market/new' as any);
  };

  const handleMyChatsPress = () => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'Please login to view your chats');
      return;
    }
    router.push('/chat/room' as any);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#64FFDA" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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

      <View style={styles.filterContainer}>
        <TextInput
          style={styles.priceInput}
          placeholder="Min Price"
          placeholderTextColor="#8892B0"
          keyboardType="numeric"
          value={searchFilters.minPrice}
          onChangeText={(text) => handleFilterChange({ minPrice: text })}
        />
        <TextInput
          style={styles.priceInput}
          placeholder="Max Price"
          placeholderTextColor="#8892B0"
          keyboardType="numeric"
          value={searchFilters.maxPrice}
          onChangeText={(text) => handleFilterChange({ maxPrice: text })}
        />
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive
            ]}
            onPress={() => {
              setSelectedCategory(category.id);
              handleFilterChange({ category: category.id });
            }}
          >
            {(category.media?.[0]?.url || category.icon) && (
              <Image 
                source={{ uri: category.media?.[0]?.url || category.icon }}
                style={styles.categoryIcon}
              />
            )}
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category.id && styles.categoryButtonTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isSearching && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#64FFDA" />
        </View>
      )}

      {!isSearching && (
        <View style={styles.section}>
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => router.push(`/market/${item.id}` as any)}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(item.media || []).map((mediaItem) => (
                  <Image 
                    key={mediaItem.id}
                    source={{ 
                      uri: mediaItem.url || 'https://via.placeholder.com/400x300?text=No+Image'
                    }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemPrice}>${item.price}</Text>
                <View style={styles.sellerInfo}>
                  <Image 
                    source={{ 
                      uri: item.seller?.profile_image || 'https://via.placeholder.com/50?text=User'
                    }}
                    style={styles.sellerImage}
                  />
                  <Text style={styles.sellerName}>
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
              <Ionicons name="basket-outline" size={48} color="#64FFDA" />
              <Text style={styles.emptyStateText}>No items found</Text>
            </View>
          )}
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
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonText: {
    marginLeft: 8,
    color: '#64FFDA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CCD6F6',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    marginLeft: 8,
    color: '#64FFDA',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryButtonActive: {
    backgroundColor: '#64FFDA',
  },
  categoryButtonText: {
    color: '#8892B0',
    fontSize: 14,
  },
  categoryButtonTextActive: {
    color: '#0A192F',
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  itemCard: {
    backgroundColor: '#112240',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  itemImage: {
    width: 200,
    height: 200,
    backgroundColor: '#1D2D50',
    marginRight: 8,
  },
  itemInfo: {
    padding: 16,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CCD6F6',
  },
  itemPrice: {
    fontSize: 16,
    color: '#64FFDA',
    marginTop: 8,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  sellerImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  sellerName: {
    marginLeft: 8,
    color: '#8892B0',
    flex: 1,
  },
  chatButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#CCD6F6',
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  priceInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    color: '#CCD6F6',
  },
  categoryIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    color: '#8892B0',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
});