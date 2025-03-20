import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Pressable, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { EXPO_PUBLIC_API_URL } from '@/config';
import { uploadImageToCloudinary } from '@/config/cloudinary';
import AuthService from '@/services/auth.service';

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
  id: number;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    profile_image: string;
    bio: string;
    experience: string;
  };
  bio: string;
  experience: string;
  points: number;
  rank: string;
  places: Array<{
    id: number;
    name: string;
    location: string;
    image: string;
    averageRating: number;
    reviewCount: number;
  }>;
}

export default function AdvisorProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [profile, setProfile] = useState<AdvisorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching advisor profile for ID:', id);
      
      const token = await AuthService.getToken();
      if (!token) {
        console.error('No authentication token found');
        throw new Error('No authentication token found');
      }
      console.log('Auth token found');

      // Fetch profile data
      const profileUrl = `${EXPO_PUBLIC_API_URL}advisor/${id}`;
      console.log('Making request to:', profileUrl);
      
      const profileResponse = await fetch(profileUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Profile response status:', profileResponse.status);
      
      if (!profileResponse.ok) {
        const errorData = await profileResponse.json().catch(() => null);
        console.error('Error response data:', errorData);
        throw new Error(errorData?.message || `HTTP error! status: ${profileResponse.status}`);
      }
      
      const profileData = await profileResponse.json();
      console.log('Profile data:', profileData);
      
      if (profileData.success) {
        // Initialize profile data with empty places array
        const profileWithPlaces = {
          ...profileData.data,
          places: []
        };

        // Fetch places data
        const placesUrl = `${EXPO_PUBLIC_API_URL}advisor/${id}/places`;
        console.log('Fetching places from:', placesUrl);
        
        const placesResponse = await fetch(placesUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (placesResponse.ok) {
          const placesData = await placesResponse.json();
          if (placesData.success) {
            profileWithPlaces.places = placesData.data;
          }
        }
        
        setProfile(profileWithPlaces);
        console.log('Profile data set successfully');
      } else {
        console.error('Failed to fetch profile:', profileData.error);
        throw new Error(profileData.error || 'Failed to fetch profile');
      }
    } catch (error: any) {
      console.error('Error in fetchProfile:', error);
      Alert.alert('Error', error.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const getRankColor = (rank: string) => {
    switch (rank.toLowerCase()) {
      case 'admin': return '#E5E4E2'; // platinum color for admin
      case 'advisor': return '#FFD700'; // gold color for advisor
      default: return '#CD7F32'; // bronze color for regular users
    }
  };

  const handleAddPlace = () => {
    router.push('/add-place');
  };

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

          // Get the auth token
          const token = await AuthService.getToken();
          if (!token) {
            throw new Error('No authentication token found');
          }

          // Update advisor profile with Cloudinary URL
          const response = await fetch(`${EXPO_PUBLIC_API_URL}advisor/profile/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              profile_image: uploadResponse.secure_url,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to update profile image');
          }

          // Refresh advisor data
          await fetchProfile();
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#64FFDA" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#64FFDA" />
          </Pressable>
          <Text style={styles.headerTitle}>Advisor Profile</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ 
                uri: !imageError ? (profile.user.profile_image || 'https://via.placeholder.com/150') 
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
            <View style={styles.badgeContainer}>
              <Ionicons name="compass" size={24} color="#64FFDA" />
              <Text style={styles.badgeText}>Travel Advisor</Text>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {profile.user.first_name} {profile.user.last_name}
            </Text>
            <Text style={styles.email}>{profile.user.email}</Text>
            
            <View style={styles.rankContainer}>
              <Text style={[styles.rank, { color: getRankColor(profile.rank) }]}>
                {profile.rank.toUpperCase()}
              </Text>
              <Text style={styles.points}>{profile.points} points</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{profile.bio}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <Text style={styles.experience}>{profile.experience}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Places</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddPlace}
            >
              <Ionicons name="add-circle" size={24} color="#64FFDA" />
              <Text style={styles.addButtonText}>Add Place</Text>
            </TouchableOpacity>
          </View>

          {profile.places.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.placesScroll}
            >
              {profile.places.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  style={styles.placeCard}
                  onPress={() => router.push(`/place/${place.id}`)}
                >
                  <Image
                    source={{ uri: place.image }}
                    style={styles.placeImage}
                  />
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <View style={styles.placeDetails}>
                      <View style={styles.locationContainer}>
                        <Ionicons name="location" size={14} color="#8892B0" />
                        <Text style={styles.placeLocation}>{place.location}</Text>
                      </View>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.rating}>
                          {place.averageRating ? place.averageRating.toFixed(1) : '0.0'} 
                          <Text style={styles.reviewCount}> ({place.reviewCount})</Text>
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noPlacesText}>No places added yet</Text>
          )}
        </View>
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
              uri: !imageError ? (profile?.user.profile_image || 'https://via.placeholder.com/150') 
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
    color: '#FF6B6B',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1D2D50',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CCD6F6',
  },
  profileSection: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1D2D50',
  },
  profileImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    backgroundColor: '#1D2D50',
    overflow: 'hidden',
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
  badgeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 25, 47, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  badgeText: {
    color: '#64FFDA',
    marginLeft: 5,
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#8892B0',
    marginBottom: 10,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2D50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rank: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
  },
  points: {
    color: '#64FFDA',
    fontSize: 14,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1D2D50',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CCD6F6',
  },
  bio: {
    fontSize: 16,
    color: '#8892B0',
    lineHeight: 24,
  },
  experience: {
    fontSize: 16,
    color: '#8892B0',
    lineHeight: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2D50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#64FFDA',
    marginLeft: 5,
    fontSize: 14,
  },
  placesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  placeCard: {
    width: 280,
    marginRight: 16,
    backgroundColor: '#1D2D50',
    borderRadius: 16,
    overflow: 'hidden',
  },
  placeImage: {
    width: '100%',
    height: 180,
  },
  placeInfo: {
    padding: 15,
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginBottom: 8,
  },
  placeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeLocation: {
    color: '#8892B0',
    marginLeft: 4,
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: '#CCD6F6',
    marginLeft: 4,
    fontSize: 14,
  },
  reviewCount: {
    color: '#8892B0',
    fontSize: 12,
  },
  noPlacesText: {
    color: '#8892B0',
    fontSize: 16,
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