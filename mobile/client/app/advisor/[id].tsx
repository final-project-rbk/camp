import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Pressable, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { EXPO_PUBLIC_API_URL } from '@/config';
import { cloudinary, uploadImageToCloudinary } from '@/config/cloudinary';

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

interface Event {
  title: string;
  date: string;
  status: 'approved' | 'pending' | 'rejected';
  reviews: Review[];
}

interface User {
  email: string;
  first_name: string;
  last_name: string;
  bio: string;
  experience: string | null;
  profile_image: string;
}

interface AdvisorProfile {
  advisorId: number;
  user: User;
  events: Event[];
  points: number;
  rank: 'bronze' | 'silver' | 'gold' | 'platinum';
  reviews: Review[];
}

export default function AdvisorProfileScreen() {
  const { id } = useLocalSearchParams();
  const [advisor, setAdvisor] = useState<AdvisorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const fetchAdvisorProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${EXPO_PUBLIC_API_URL}advisor/${id}`);
      const data = await response.json();
      setAdvisor(data);
    } catch (error) {
      console.error('Error fetching advisor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisorProfile();
  }, [id]);

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'platinum': return '#E5E4E2';
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      default: return '#CD7F32'; // bronze
    }
  };

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
                name={index < item.rating ? "star" : "star-outline"}
                size={16}
                color="#64FFDA"
              />
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventCard}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDate}>
        {new Date(item.date).toLocaleDateString()}
      </Text>
      <Text style={[styles.eventStatus, { 
        color: item.status === 'approved' ? '#64FFDA' : '#FFB347'
      }]}>
        {item.status.toUpperCase()}
      </Text>
    </View>
  );

  const handleImagePress = () => {
    setShowImageOptions(true);
  };

  const handleViewImage = () => {
    setShowImageOptions(false);
    setShowFullImage(true);
  };

  const handleChooseImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setShowImageOptions(false);
        setLoading(true);
        const base64Data = result.assets[0].base64;

        if (!base64Data) {
          Alert.alert('Error', 'Failed to get image data');
          return;
        }

        try {
          // Upload to Cloudinary using our helper function
          const uploadResponse = await uploadImageToCloudinary(base64Data);

          // Update advisor profile with Cloudinary URL
          const response = await fetch(`${EXPO_PUBLIC_API_URL}advisor/${id}/profile-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              profile_image: uploadResponse.secure_url,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to update profile image');
          }

          // Refresh advisor data
          await fetchAdvisorProfile();
          Alert.alert('Success', 'Profile picture updated successfully');
        } catch (error) {
          console.error('Error in image upload:', error);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#64FFDA" />
      </View>
    );
  }

  if (!advisor) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Advisor not found</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.profileImageContainer}
            onPress={handleImagePress}
          >
            <Image
              source={{ 
                uri: !imageError ? (advisor?.user.profile_image || 'https://via.placeholder.com/150') 
                                : 'https://via.placeholder.com/150'
              }}
              style={styles.profileImage}
              onError={() => setImageError(true)}
            />
            {loading && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="large" color="#64FFDA" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{`${advisor.user.first_name} ${advisor.user.last_name}`}</Text>
            <Text style={styles.bio}>{advisor.user.bio}</Text>
            <View style={styles.rankContainer}>
              <Text style={[styles.rank, { color: getRankColor(advisor.rank) }]}>
                {advisor.rank.toUpperCase()}
              </Text>
              <Text style={styles.points}>{advisor.points} points</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {advisor.events.map((event, index) => (
            <View key={index} style={styles.eventCard}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>
                {new Date(event.date).toLocaleDateString()}
              </Text>
              <Text style={[styles.eventStatus, { 
                color: event.status === 'approved' ? '#64FFDA' : '#FFB347'
              }]}>
                {event.status.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {advisor.reviews.map(review => renderReview({ item: review }))}
        </View> */}
      </ScrollView>

      {/* Image Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showImageOptions}
        onRequestClose={() => setShowImageOptions(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowImageOptions(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleViewImage}
            >
              <Ionicons name="eye-outline" size={24} color="#64FFDA" />
              <Text style={styles.modalOptionText}>View Profile Picture</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleChooseImage}
            >
              <Ionicons name="camera-outline" size={24} color="#64FFDA" />
              <Text style={styles.modalOptionText}>Choose New Picture</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Full Image Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showFullImage}
        onRequestClose={() => setShowFullImage(false)}
      >
        <Pressable 
          style={styles.fullImageContainer}
          onPress={() => setShowFullImage(false)}
        >
          <Image
            source={{ 
              uri: !imageError ? (advisor?.user.profile_image || 'https://via.placeholder.com/150') 
                              : 'https://via.placeholder.com/150'
            }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1D2D50',
  },
  profileImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    backgroundColor: '#1D2D50',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(29, 45, 80, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginBottom: 5,
  },
  bio: {
    color: '#8892B0',
    fontSize: 16,
    lineHeight: 24,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
  points: {
    color: '#64FFDA',
    fontSize: 16,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1D2D50',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#64FFDA',
    marginBottom: 10,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#1D2D50',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    padding: 10,
  },
  eventTitle: {
    color: '#CCD6F6',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDate: {
    color: '#64FFDA',
    fontSize: 14,
    marginBottom: 2,
  },
  eventStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: '#1D2D50',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
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
    fontWeight: 'bold',
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  reviewComment: {
    color: '#8892B0',
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1D2D50',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 255, 218, 0.1)',
  },
  modalOptionText: {
    color: '#CCD6F6',
    fontSize: 16,
    marginLeft: 15,
  },
  fullImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width,
  },
}); 
; 