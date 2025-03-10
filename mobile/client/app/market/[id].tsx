import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { EXPO_PUBLIC_API_URL } from '../../config';

interface Category {
  id: number;
  name: string;
}

interface MarketplaceItem {
  imageURL: string;
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
  location: string;
}

export default function MarketplaceItemDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${EXPO_PUBLIC_API_URL}marketplace/items/${id}`);
      setItem(response.data);
    } catch (error) {
      console.error('Error fetching item details:', error);
      setError('Failed to load item details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyItem = async () => {
    try {
      await axios.put(`${EXPO_PUBLIC_API_URL}marketplace/items/${id}/buy`);
      Alert.alert('Success', 'Item purchased successfully!');
      router.back();
    } catch (error) {
      console.error('Error buying item:', error);
      Alert.alert('Error', 'Failed to purchase item. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#64FFDA" />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Item not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#64FFDA" />
        </TouchableOpacity>
        <Text style={styles.title}>Item Details</Text>
      </View>

      <ScrollView 
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        style={styles.imageScrollContainer}
      >
        {item.images?.length > 0 ? (
          item.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          ))
        ) : (
          <Image
            source={{ uri: item.imageURL || 'https://m.media-amazon.com/images/I/812wCS-IKuL.jpg' }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        )}
      </ScrollView>

      <View style={styles.contentContainer}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemPrice}>${item.price}</Text>

        <View style={styles.sellerContainer}>
          <Image 
            source={{ uri: item.seller?.profile_image || 'https://via.placeholder.com/50' }}
            style={styles.sellerImage}
          />
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>
              {item.seller?.first_name} {item.seller?.last_name}
            </Text>
            <Text style={styles.location}>{item.location}</Text>
          </View>
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={() => router.push(`/chat/${item.sellerId}` as any)}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#64FFDA" />
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesContainer}>
          {item.categories?.map((category) => (
            <View key={category.id} style={styles.categoryTag}>
              <Text style={styles.categoryText}>{category.name}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{item.description}</Text>

        {/* {item.status === 'available' && (
          <TouchableOpacity style={styles.buyButton} onPress={handleBuyItem}>
            <Text style={styles.buyButtonText}>Buy Now</Text>
          </TouchableOpacity>
        )} */}
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
    backgroundColor: '#0A192F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CCD6F6',
  },
  imageScrollContainer: {
    height: 300,
  },
  itemImage: {
    height: 300,
    width: Dimensions.get('window').width,
  },
  contentContainer: {
    padding: 20,
  },
  itemTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 22,
    color: '#64FFDA',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#112240',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sellerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#CCD6F6',
  },
  location: {
    color: '#8892B0',
    marginTop: 4,
  },
  chatButton: {
    padding: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryTag: {
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    color: '#64FFDA',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#8892B0',
    lineHeight: 24,
    marginBottom: 24,
  },
  // buyButton: {
  //   backgroundColor: '#64FFDA',
  //   padding: 16,
  //   borderRadius: 12,
  //   alignItems: 'center',
  // },
  // buyButtonText: {
  //   color: '#0A192F',
  //   fontSize: 18,
  //   fontWeight: 'bold',
  // },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
  },
}); 