import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { EXPO_PUBLIC_API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

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
  const { accessToken, user } = useAuth();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [expandDescription, setExpandDescription] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

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

  const handleShowFullImage = (index: number) => {
    setCurrentImageIndex(index);
    setImageModalVisible(true);
  };

  const handleChatPress = async () => {
    if (!accessToken) {
      Alert.alert('Error', 'Please login to message sellers');
      return;
    }

    if (item?.sellerId === user?.id) {
      Alert.alert('Error', 'You cannot message yourself');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${EXPO_PUBLIC_API_URL}chat/rooms/get-or-create`,
        { userId: item?.sellerId },
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

      router.push({
        pathname: "/chat/[roomId]",
        params: {
          roomId: roomId.toString(),
          isNewRoom: isNewRoom ? '1' : '0'
        }
      });
    } catch (error) {
      let errorMessage = 'Could not start chat. Please try again later.';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage = 'Your session has expired. Please login again.';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      Alert.alert('Chat Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openMap = (location: string) => {
    const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(location)}`;
    Linking.canOpenURL(mapUrl).then(supported => {
      if (supported) {
        Linking.openURL(mapUrl);
      } else {
        Alert.alert('Error', 'Could not open maps application');
    }
    });
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

  const images = item.images?.length > 0 
    ? item.images 
    : [item.imageURL || 'https://m.media-amazon.com/images/I/812wCS-IKuL.jpg'];

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#64FFDA" />
        </TouchableOpacity>
        <Text style={styles.title}>Item Details</Text>
      </View>

      {/* Image Carousel */}
      <View style={styles.imageContainer}>
      <ScrollView 
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const contentOffset = event.nativeEvent.contentOffset;
            const viewSize = event.nativeEvent.layoutMeasurement;
            const pageNum = Math.floor(contentOffset.x / viewSize.width);
            setCurrentImageIndex(pageNum);
          }}
          scrollEventThrottle={16}
      >
          {images.map((image, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.9}
              onPress={() => handleShowFullImage(index)}
              style={styles.imageWrapper}
            >
              <Image
              source={{ uri: image }}
              style={styles.itemImage}
              resizeMode="cover"
            />
            </TouchableOpacity>
          ))}
      </ScrollView>
        
        {/* Image Indicators */}
        <View style={styles.indicatorContainer}>
          {images.map((_, index) => (
            <View 
              key={index}
              style={[
                styles.indicator,
                index === currentImageIndex && styles.indicatorActive
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* Item Title and Price */}
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemPrice}>${item.price}</Text>

        {/* Seller Information */}
        <View style={styles.sellerContainer}>
          <Image 
            source={{ uri: item.seller?.profile_image || 'https://via.placeholder.com/50' }}
            style={styles.sellerImage}
          />
          <View style={styles.sellerInfo}>
            <View style={styles.sellerNameRow}>
            <Text style={styles.sellerName}>
              {item.seller?.first_name} {item.seller?.last_name}
            </Text>
              <Ionicons name="checkmark-circle" size={16} color="#64FFDA" style={styles.verifiedBadge} />
          </View>
            
            {/* Location with Map Link */}
          <TouchableOpacity 
              style={styles.locationRow}
              onPress={() => item.location && openMap(item.location)}
          >
              <Ionicons name="location-outline" size={16} color="#8892B0" />
              <Text style={styles.location}>{item.location || 'No location specified'}</Text>
          </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          {item.categories?.map((category) => (
            <View key={category.id} style={styles.categoryTag}>
              <Text style={styles.categoryText}>{category.name}</Text>
            </View>
          ))}
        </View>

        {/* Description with expandable option */}
        <Text style={styles.sectionTitle}>Description</Text>
        <View>
          <Text 
            style={styles.description}
            numberOfLines={expandDescription ? undefined : 3}
          >
            {item.description}
          </Text>
          {item.description && item.description.length > 100 && (
            <TouchableOpacity
              onPress={() => setExpandDescription(!expandDescription)}
              style={styles.readMoreButton}
            >
              <Text style={styles.readMoreText}>
                {expandDescription ? 'Read Less' : 'Read More'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Message Seller Button */}
        {item.sellerId !== user?.id && (
          <TouchableOpacity 
            style={styles.messageButton} 
            onPress={handleChatPress}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#0A192F" style={styles.buttonIcon} />
            <Text style={styles.messageButtonText}>Message Seller</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Image Modal for Zoomed View */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeModal}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close-circle" size={36} color="#CCD6F6" />
          </TouchableOpacity>
          <Image
            source={{ uri: images[currentImageIndex] }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const { width: screenWidth } = Dimensions.get('window');

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
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  imageWrapper: {
    width: screenWidth,
    height: 300,
  },
  itemImage: {
    height: 300,
    width: screenWidth,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  indicator: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#64FFDA',
    width: 16,
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
    fontSize: 26,
    color: '#64FFDA',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#112240',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sellerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#64FFDA',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginRight: 6,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  location: {
    color: '#8892B0',
    marginLeft: 4,
    fontSize: 14,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  categoryTag: {
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#64FFDA',
  },
  categoryText: {
    color: '#64FFDA',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#8892B0',
    lineHeight: 24,
  },
  readMoreButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  readMoreText: {
    color: '#64FFDA',
    fontWeight: 'bold',
  },
  messageButton: {
    backgroundColor: '#64FFDA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  messageButtonText: {
    color: '#0A192F',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  closeModal: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
  },
});