import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import {API_BASE_URL} from '../../config';



interface Category {
  id: number;
  name: string;
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
}

export default function Market() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const categories = [
    { id: 'all', name: 'All' },
    { id: '1', name: 'Tents' },
    { id: '2', name: 'Sleeping Bags' },
    { id: '3', name: 'Cooking' },
    { id: '4', name: 'Tools' },
  ];

  const fetchItems = async (categoryId?: string) => {
    try {
      setError(null);
      const url = categoryId && categoryId !== 'all' 
        ? `${API_BASE_URL}/marketplace/category/${categoryId}`
        : `${API_BASE_URL}/marketplace/items`;
      
      const response = await axios.get(url);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
      setError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchItems = async (query: string) => {
    if (!query.trim()) {
      fetchItems(selectedCategory);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/marketplace/search?name=${encodeURIComponent(query)}`);
      if (response.data) {
        setItems([response.data]); // Wrap single item in array since our UI expects an array
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error searching items:', error);
      setError('Failed to search items. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchItems(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    fetchItems(selectedCategory);
  }, [selectedCategory]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchItems(selectedCategory).finally(() => setRefreshing(false));
  }, [selectedCategory]);

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
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/market/new' as any)}
        >
          <Ionicons name="add-circle-outline" size={24} color="#64FFDA" />
          <Text style={styles.addButtonText}>Sell Item</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8892B0" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor="#8892B0"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              setSearchQuery('');
              fetchItems(selectedCategory);
            }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#8892B0" />
          </TouchableOpacity>
        )}
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
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category.id && styles.categoryButtonTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.section}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemCard}
            onPress={() => router.push(`/market/${item.id}` as any)}
          >
            <Image 
              source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
              style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemPrice}>${item.price}</Text>
              <View style={styles.sellerInfo}>
                <Image 
                  source={{ uri: item.seller?.profile_image || 'https://via.placeholder.com/50' }}
                  style={styles.sellerImage}
                />
                <Text style={styles.sellerName}>
                  {item.seller?.first_name} {item.seller?.last_name}
                </Text>
                <TouchableOpacity 
                  style={styles.chatButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/chat/${item.sellerId}` as any);
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#64FFDA" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
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
    width: '100%',
    height: 200,
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
});