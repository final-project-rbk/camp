import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal, 
  Pressable, 
  Dimensions, 
  Alert,
  StatusBar,
  Platform,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { EXPO_PUBLIC_API_URL } from '@/config';
import { uploadImageToCloudinary } from '@/config/cloudinary';
import AuthService from '@/services/auth.service';
import { LinearGradient } from 'expo-linear-gradient';

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

interface Expertise {
  icon: string;
  name: string;
}

interface AdvisorBadge {
  icon: string;
  label: string;
  color: string;
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
  expertise: Expertise[];
  badges: AdvisorBadge[];
  highlights: string[];
  places: Array<{
    id: number;
    name: string;
    location: string;
    image: string;
    averageRating: number;
    reviewCount: number;
    status?: string;
  }>;
}

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = StatusBar.currentHeight || 0;

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

  // Use useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen focused, refreshing profile data');
      fetchProfile();
    }, [id])
  );

  const getRankColor = (points: string | number) => {
    const pointsNum = Number(points);
    const rank = calculateRank(pointsNum);
    switch (rank.toLowerCase()) {
      case 'platinum': return '#E5E4E2';
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return '#CD7F32';
    }
  };

  const calculateRank = (points: number): string => {
    if (points >= 1000) return 'Platinum';
    if (points >= 750) return 'Gold';
    if (points >= 500) return 'Silver';
    return 'Bronze';
  };

  const getNextRankPoints = (points: number): number => {
    if (points >= 1000) return 1000; // Platinum is max
    if (points >= 750) return 1000; // Next is Platinum
    if (points >= 500) return 750; // Next is Gold
    if (points >= 250) return 500; // Next is Silver
    return 250; // Next is Bronze
  };

  const getProgressPercentage = (points: string | number): number => {
    const pointsNum = Number(points);
    const nextRankPoints = getNextRankPoints(pointsNum);
    const currentRankPoints = pointsNum < 250 ? 0 : 
                             pointsNum < 500 ? 250 : 
                             pointsNum < 750 ? 500 : 
                             pointsNum < 1000 ? 750 : 1000;
    const range = nextRankPoints - currentRankPoints;
    const progress = pointsNum - currentRankPoints;
    return Math.min((progress / range) * 100, 100);
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

  const handleEditProfile = () => {
    router.push(`/edit-profile?id=${id}`);
  };

  const handleLogout = async () => {
    try {
      await AuthService.clearAuthData();
      router.replace('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          backgroundColor: '#86EFAC', // Pale green
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          shadowColor: '#86EFAC',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
        };
      case 'rejected':
        return {
          backgroundColor: '#FCA5A5', // Pale red
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          shadowColor: '#FCA5A5',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
        };
      case 'pending':
      default:
        return {
          backgroundColor: '#FDE047', // Pale yellow
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          shadowColor: '#FDE047',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
        };
    }
  };

  const handleDeletePlace = async (placeId: number) => {
    Alert.alert(
      "Delete Place",
      "Are you sure you want to delete this place? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AuthService.getToken();
              if (!token) {
                throw new Error('No authentication token found');
              }

              const response = await fetch(`${EXPO_PUBLIC_API_URL}advisor/place/${placeId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (!response.ok) {
                throw new Error('Failed to delete place');
              }

              // Refresh the profile data
              await fetchProfile();
              Alert.alert('Success', 'Place deleted successfully');
            } catch (error) {
              console.error('Error deleting place:', error);
              Alert.alert('Error', 'Failed to delete place. Please try again.');
            }
          }
        }
      ]
    );
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView style={styles.container}>
        {/* Hero Header */}
        <View style={styles.heroHeader}>
          <Image
            source={{ 
              uri: !imageError ? (profile.user.profile_image || 'https://via.placeholder.com/150') 
                              : 'https://via.placeholder.com/150'
            }}
            style={styles.heroBackground}
            blurRadius={3}
          />
          <LinearGradient
            colors={['rgba(10, 25, 47, 0.3)', 'rgba(10, 25, 47, 0.9)', '#0A192F']}
            style={styles.heroGradient}
          >
            <View style={styles.headerTopRow}>
              <Pressable 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </Pressable>
              <View style={styles.headerButtons}>
                <Pressable 
                  style={[styles.editButton, { marginRight: 8 }]}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={24} color="#64FFDA" />
                </Pressable>
                <Pressable 
                  style={styles.editButton}
                  onPress={handleEditProfile}
                >
                  <Ionicons name="pencil" size={24} color="#64FFDA" />
                </Pressable>
              </View>
            </View>

            <View style={styles.profileImageContainer}>
              <Pressable onPress={() => setShowFullImage(true)}>
                <Image
                  source={{ 
                    uri: !imageError ? (profile.user.profile_image || 'https://via.placeholder.com/150') 
                                    : 'https://via.placeholder.com/150'
                  }}
                  style={styles.profileImage}
                />
              </Pressable>
              <TouchableOpacity 
                style={styles.editImageButton}
                onPress={handleImagePress}
              >
                <Ionicons name="camera" size={20} color="#64FFDA" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.name}>
                {profile.user.first_name} {profile.user.last_name}
              </Text>
              <Text style={styles.email}>{profile.user.email}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* About & Experience Combined Section */}
        <View style={styles.combinedSection}>
          {/* About Card */}
          <View style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="compass" size={24} color="#64FFDA" />
              </View>
              <Text style={styles.sectionTitle}>About Me</Text>
            </View>
            <View style={styles.cardContent}>
              {profile.badges && profile.badges.length > 0 && (
                <View style={styles.badgeContainer}>
                  {profile.badges.map((badge, index) => (
                    <View key={index} style={styles.badge}>
                      <Ionicons name={badge.icon as any} size={16} color={badge.color} />
                      <Text style={styles.badgeText}>{badge.label}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              <Text style={styles.bio}>{profile.bio}</Text>

              {profile.highlights && profile.highlights.length > 0 && (
                <View style={styles.highlightsContainer}>
                  {profile.highlights.map((highlight, index) => (
                    <View key={index} style={styles.highlight}>
                      <Ionicons name="checkmark-circle" size={20} color="#64FFDA" />
                      <Text style={styles.highlightText}>{highlight}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Rank Progress Card */}
          <View style={styles.rankCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `rgba(${getRankColor(profile.points)}, 0.1)` }]}>
                <Ionicons name="trophy" size={24} color={getRankColor(profile.points)} />
              </View>
              <Text style={styles.sectionTitle}>Rank Progress</Text>
            </View>
            <View style={styles.rankContent}>
              <View style={styles.rankHeader}>
                <View style={[styles.rankBadge, { backgroundColor: `rgba(${getRankColor(profile.points)}, 0.1)` }]}>
                  <Ionicons name="trophy" size={20} color={getRankColor(profile.points)} />
                  <Text style={[styles.rankText, { color: getRankColor(profile.points) }]}>
                    {calculateRank(profile.points).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.pointsText}>{profile.points} points</Text>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill,
                      { 
                        width: `${getProgressPercentage(profile.points)}%`,
                        backgroundColor: getRankColor(profile.points)
                      }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.rankLevels}>
                <View style={styles.rankLevelItem}>
                  <View style={[styles.rankDot, { backgroundColor: '#CD7F32' }]} />
                  <Text style={styles.rankLevel}>Bronze</Text>
                </View>
                <View style={styles.rankLevelItem}>
                  <View style={[styles.rankDot, { backgroundColor: '#C0C0C0' }]} />
                  <Text style={styles.rankLevel}>Silver</Text>
                </View>
                <View style={styles.rankLevelItem}>
                  <View style={[styles.rankDot, { backgroundColor: '#FFD700' }]} />
                  <Text style={styles.rankLevel}>Gold</Text>
                </View>
                <View style={styles.rankLevelItem}>
                  <View style={[styles.rankDot, { backgroundColor: '#E5E4E2' }]} />
                  <Text style={styles.rankLevel}>Platinum</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Experience Card */}
          <View style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `rgba(${getRankColor(profile.points)}, 0.1)` }]}>
                <Ionicons name="trophy" size={24} color={getRankColor(profile.points)} />
              </View>
              <Text style={styles.sectionTitle}>Experience</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.experienceStats}>
                <View style={styles.experienceStat}>
                  <Text style={styles.experienceValue}>{profile.places.length}</Text>
                  <Text style={styles.experienceLabel}>Places Added</Text>
                </View>
                <View style={styles.experienceStatDivider} />
                <View style={styles.experienceStat}>
                  <Text style={styles.experienceValue}>
                    {profile.places.reduce((sum, place) => sum + place.reviewCount, 0)}
                  </Text>
                  <Text style={styles.experienceLabel}>Total Reviews</Text>
                </View>
              </View>
              
              <Text style={styles.experience}>{profile.experience}</Text>

              {profile.expertise && profile.expertise.length > 0 && (
                <View style={styles.expertiseContainer}>
                  <Text style={styles.expertiseTitle}>Expertise Areas:</Text>
                  <View style={styles.expertiseGrid}>
                    {profile.expertise.map((item, index) => (
                      <View key={index} style={styles.expertiseItem}>
                        <Ionicons name={item.icon as any} size={20} color="#64FFDA" />
                        <Text style={styles.expertiseText}>{item.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Places Section */}
        <View style={styles.section}>
          <View style={styles.placesHeader}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={24} color="#64FFDA" />
              <Text style={styles.sectionTitle}>My Places</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddPlace}
            >
              <Ionicons name="add-circle" size={24} color="#64FFDA" />
              <Text style={styles.addButtonText}>Add Place</Text>
            </TouchableOpacity>
          </View>

          {profile.places.length > 0 ? (
            <View style={styles.placesGrid}>
              {profile.places.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  style={styles.placeCard}
                  onPress={() => router.push(`/place/${place.id}`)}
                >
                  <View style={styles.placeImageContainer}>
                    <Image
                      source={{ uri: place.image }}
                      style={styles.placeImage}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(10, 25, 47, 0.8)']}
                      style={styles.placeGradient}
                    />
                    <View style={[
                      styles.statusBadge,
                      getStatusBadgeStyle(place.status || 'pending')
                    ]}>
                      <Text style={styles.statusText}>
                        {(place.status || 'pending').charAt(0).toUpperCase() + (place.status || 'pending').slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <View style={styles.placeDetails}>
                      <View style={styles.locationContainer}>
                        <Ionicons name="location" size={14} color="#64FFDA" />
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

                  <View style={styles.placeActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push(`/edit-place?id=${place.id}`);
                      }}
                    >
                      <Ionicons name="pencil" size={20} color="#64FFDA" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeletePlace(place.id);
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPlaces}>
              <Ionicons name="location-outline" size={64} color="#64FFDA" />
              <Text style={styles.emptyPlacesText}>No places added yet</Text>
              <Text style={styles.emptyPlacesSubtext}>Start adding amazing places!</Text>
            </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
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
  heroHeader: {
    height: height * 0.5,
    position: 'relative',
  },
  heroBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 20 : STATUSBAR_HEIGHT + 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 25, 47, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 25, 47, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#64FFDA',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: width * 0.5 - 80,
    backgroundColor: '#1D2D50',
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#64FFDA',
  },
  profileInfo: {
    alignItems: 'center',
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#8892B0',
    marginBottom: 20,
  },
  rankCard: {
    backgroundColor: '#1D2D50',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.1)',
    marginTop: 20,
  },
  rankContent: {
    padding: 16,
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pointsText: {
    fontSize: 16,
    color: '#8892B0',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarBackground: {
    flex: 1,
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  rankLevels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  rankLevelItem: {
    alignItems: 'center',
    gap: 4,
  },
  rankDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rankLevel: {
    fontSize: 12,
    color: '#8892B0',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1D2D50',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 255, 218, 0.1)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginLeft: 10,
  },
  bio: {
    fontSize: 16,
    color: '#8892B0',
    lineHeight: 24,
    marginTop: 12,
  },
  experience: {
    fontSize: 16,
    color: '#8892B0',
    lineHeight: 24,
    marginTop: 12,
  },
  placesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#64FFDA',
  },
  addButtonText: {
    color: '#64FFDA',
    marginLeft: 8,
    fontSize: 14,
  },
  placesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  placeCard: {
    width: '100%',
    backgroundColor: '#1D2D50',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.1)',
  },
  placeImageContainer: {
    position: 'relative',
    height: 200,
  },
  placeImage: {
    width: '100%',
    height: '100%',
  },
  placeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  placeInfo: {
    padding: 16,
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    color: '#FFD700',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewCount: {
    color: '#8892B0',
    fontSize: 12,
  },
  placeActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(10, 25, 47, 0.8)',
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyPlaces: {
    alignItems: 'center',
    padding: 40,
  },
  emptyPlacesText: {
    fontSize: 18,
    color: '#CCD6F6',
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptyPlacesSubtext: {
    fontSize: 14,
    color: '#8892B0',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.9)',
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 255, 218, 0.1)',
  },
  modalOptionText: {
    color: '#CCD6F6',
    fontSize: 16,
    marginLeft: 16,
  },
  fullImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width,
    height: width,
  },
  combinedSection: {
    padding: 20,
    gap: 20,
  },
  infoCard: {
    backgroundColor: '#1D2D50',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.1)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    padding: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    color: '#CCD6F6',
    fontSize: 14,
    fontWeight: '500',
  },
  highlightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 45, 80, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  highlightText: {
    color: '#CCD6F6',
    fontSize: 14,
  },
  experienceStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(29, 45, 80, 0.5)',
    borderRadius: 12,
  },
  experienceStat: {
    flex: 1,
    alignItems: 'center',
  },
  experienceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#64FFDA',
    marginBottom: 4,
  },
  experienceLabel: {
    fontSize: 14,
    color: '#8892B0',
  },
  experienceStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    marginHorizontal: 16,
  },
  expertiseContainer: {
    marginTop: 16,
  },
  expertiseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginBottom: 12,
  },
  expertiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expertiseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 45, 80, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    width: '48%',
  },
  expertiseText: {
    color: '#CCD6F6',
    fontSize: 14,
  },
}); 