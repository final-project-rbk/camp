import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
  Dimensions,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { EXPO_PUBLIC_API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import AuthService from '../../services/auth.service';
import { TAB_BAR_HEIGHT } from '../../components/TabBar';

interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  profile_image: string;
  bio: string;
  experience?: string;
  points: number;
  created_at: string;
  role: string;
  rank?: string;
  completed_sessions?: number;
  rating?: number;
  reviews?: number;
}

interface EditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  value: string;
  field: string;
}

const EditModal = ({ visible, onClose, onSave, value, field }: EditModalProps) => {
  const [newValue, setNewValue] = useState(value);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit {field}</Text>
          <TextInput
            style={styles.input}
            value={newValue}
            onChangeText={setNewValue}
            placeholder={`Enter new ${field}`}
            placeholderTextColor="#8892B0"
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={() => {
                onSave(newValue);
                onClose();
              }}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { user, accessToken, checkAuth } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editField, setEditField] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  const [advisorStats, setAdvisorStats] = useState(null);

  useEffect(() => {
    checkAuthAndFetchProfile();
  }, []);

  const checkAuthAndFetchProfile = async () => {
    try {
      const token = await AuthService.getToken();
      const userData = await AuthService.getUser();

      console.log('Checking stored data:', { token, userData }); // Debug log

      if (!token || !userData) {
        console.log('No auth data found, redirecting to auth'); // Debug log
        router.replace('/auth');
        return;
      }

      const response = await fetch(`${EXPO_PUBLIC_API_URL}users/${userData.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        await checkAuth();
        router.replace('/auth');
        return;
      }

      const data = await response.json();
      console.log('Profile response:', data);

      if (data.success) {
        setProfile(data.data);
        
        // If the user is an advisor, fetch advisor-specific stats
        if (data.data.role === 'advisor') {
          fetchAdvisorStats(userData.id, token);
        }
      } else {
        console.log('Failed to fetch profile:', data); // Debug log
        if (response.status === 401) {
          await AuthService.clearAuthData();
          router.replace('/auth');
        } else {
          Alert.alert('Error', 'Failed to fetch profile');
        }
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAdvisorStats = async (userId: number, token: string) => {
    try {
      const statsResponse = await fetch(`${EXPO_PUBLIC_API_URL}advisor/stats/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('Advisor stats response:', statsData);
        
        if (statsData.success) {
          setAdvisorStats(statsData.data);
          // Update the profile with the advisor stats data
          setProfile(prev => {
            if (!prev) return null;
            return {
              ...prev,
              rank: statsData.data.currentRank,
              points: statsData.data.points
            };
          });
        }
      }
    } catch (error) {
      console.error('Error fetching advisor stats:', error);
    }
  };

  const handleUpdate = async (field: string, value: string) => {
    try {
      const token = await AuthService.getToken();
      const userData = await AuthService.getUser();
      
      if (!userData || !token) {
        router.replace('/auth');
        return;
      }

      // Make sure the API URL has proper formatting
      let baseUrl = EXPO_PUBLIC_API_URL;
      if (!baseUrl.endsWith('/')) {
        baseUrl = `${baseUrl}/`;
      }
      
      let endpoint;
      let body;
      
      // Special handling for advisor experience update
      if (userData.role === 'advisor' && field === 'experience') {
        endpoint = `${baseUrl}advisor/experience/${userData.id}`;
        body = JSON.stringify({ experience: value });
        console.log('Updating advisor experience at:', endpoint);
        console.log('Request body:', body);
      } else {
        // For other fields
        endpoint = `${baseUrl}users/${userData.id}`;
        body = JSON.stringify({ [field]: value });
      }
      
      console.log('Making request to:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body,
      });

      console.log('Response status:', response.status);
      console.log('Response content type:', response.headers.get('content-type'));
      
      // Get the raw text response first
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      let data;
      try {
        // Try to parse the response as JSON
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError);
        console.error('Response was not valid JSON:', responseText.substring(0, 200) + '...');
        
        Alert.alert(
          'Error', 
          'Server returned an invalid response. Please try again later.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      if (data.success) {
        // Update the local profile state
        setProfile(prev => {
          if (!prev) return null;
          return {
            ...prev,
            [field]: value
          };
        });
        
        Alert.alert('Success', `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
        
        // Refresh the profile data
        setTimeout(() => {
          onRefresh();
        }, 1000);
      } else {
        Alert.alert('Error', data.error || `Failed to update ${field}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert(
        'Error', 
        'Something went wrong with the request. Please check your connection and try again.'
      );
    }
  };

  const pickImage = async () => {
    try {
      Alert.alert(
        "Select Image Source",
        "Choose where you want to take the image from",
        [
          {
            text: "Camera",
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Sorry, we need camera permissions to make this work!');
                return;
              }
              
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
              });

              if (!result.canceled) {
                uploadImage(result.assets[0].uri);
              }
            }
          },
          {
            text: "Photo Library",
            onPress: async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Sorry, we need camera roll permissions to make this work!');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
              });

              if (!result.canceled) {
                uploadImage(result.assets[0].uri);
              }
            }
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'profile-image.jpg',
      } as any);
      formData.append('upload_preset', 'Ghassen123');
      formData.append('cloud_name', 'dqh6arave');

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dqh6arave/image/upload',
        {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const data = await response.json();
      console.log('Cloudinary response:', data);

      if (data.secure_url) {
        await handleUpdate('profile_image', data.secure_url);
      } else {
        console.error('Upload error:', data);
        Alert.alert('Error', 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await checkAuthAndFetchProfile();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const ImageViewModal = () => (
    <Modal
      visible={imageModalVisible}
      transparent={true}
      onRequestClose={() => setImageModalVisible(false)}
      animationType="fade"
    >
      <View style={styles.imageModalContainer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setImageModalVisible(false)}
        >
          <Ionicons name="close" size={28} color="#64FFDA" />
        </TouchableOpacity>
        <Image
          source={{ uri: profile?.profile_image }}
          style={styles.fullScreenImage}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );

  const checkExistingApplication = async (userId: number) => {
    try {
      const token = await AuthService.getToken();
      
      const response = await fetch(`${EXPO_PUBLIC_API_URL}formularAdvisor/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        await checkAuth();
        router.replace('/auth');
        return null;
      }

      if (!response.ok) {
        console.log('Response not OK:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('Application check response:', data);
      
      setHasExistingApplication(!!data.data);
      return data.data;
    } catch (error) {
      console.error('Error checking application:', error);
      return null;
    }
  };

  const handleCreateFormular = async () => {
    try {
      const userData = await AuthService.getUser();
      if (!userData) {
        router.replace('/auth');
        return;
      }

      const existingApplication = await checkExistingApplication(userData.id);
      
      if (existingApplication) {
        router.push({
          pathname: '/formular-create',
          params: { 
            mode: 'edit',
            existingData: JSON.stringify(existingApplication)
          }
        });
      } else {
        router.push({
          pathname: '/formular-create',
          params: { mode: 'create' }
        });
      }
    } catch (error) {
      console.error('Error handling formular creation:', error);
      Alert.alert('Error', 'Failed to check application status');
    }
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#64FFDA" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#64FFDA"
          colors={['#64FFDA']}
          progressBackgroundColor="#112240"
        />
      }
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>
          {profile?.role === 'advisor' ? 'Advisor Profile' : 'Profile'}
        </Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#64FFDA" />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setImageModalVisible(true)}>
          <Image
            source={{ 
              uri: profile?.profile_image || 'https://via.placeholder.com/150'
            }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.editImageButton}
          onPress={pickImage}
        >
          <Ionicons name="camera" size={24} color="#64FFDA" />
        </TouchableOpacity>
        
        <View style={styles.profileNameContainer}>
          <Text style={styles.profileName}>
            {profile?.first_name} {profile?.last_name}
          </Text>
          {profile?.role === 'advisor' && (
            <View style={styles.advisorBadge}>
              <Ionicons name="star" size={20} color="#64FFDA" />
              <Text style={styles.advisorBadgeText}>Advisor</Text>
            </View>
          )}
        </View>
      </View>

      {profile?.role === 'advisor' && (
        <View style={styles.advisorStatsSection}>
          <Text style={styles.statsTitle}>Advisor Stats</Text>
          <View style={styles.rankCard}>
            <Text style={styles.rankTitle}>Current Rank</Text>
            <View style={styles.rankValueContainer}>
              <Text style={styles.rankValue}>{profile?.rank || 'Bronze'}</Text>
              <View style={[styles.rankIconContainer, 
                { backgroundColor: 
                  profile?.rank === 'platinum' ? '#E5E4E2' : 
                  profile?.rank === 'gold' ? '#FFD700' : 
                  profile?.rank === 'silver' ? '#C0C0C0' : 
                  '#CD7F32'
                }
              ]}>
                <Ionicons name="trophy" size={24} color="#0A192F" />
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${(profile?.points || 0) % 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.pointsText}>
              {profile?.points || 0} Points
            </Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {profile?.completed_sessions || 0}
              </Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {profile?.rating || '0.0'}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {profile?.reviews || 0}
              </Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.infoSection}>
        {[
          { label: 'First Name', value: profile?.first_name, field: 'first_name' },
          { label: 'Last Name', value: profile?.last_name, field: 'last_name' },
          { label: 'Email', value: profile?.email, field: 'email' },
          { label: 'Phone', value: profile?.phone_number, field: 'phone_number' },
          { label: 'Bio', value: profile?.bio, field: 'bio' },
          ...(profile?.role === 'advisor' ? [{ label: 'Experience', value: profile?.experience, field: 'experience' }] : []),
        ].map((item) => (
          <View key={item.field} style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{item.value || 'Not set'}</Text>
            </View>
            <TouchableOpacity onPress={() => setEditField(item.field)}>
              <Ionicons name="create-outline" size={24} color="#64FFDA" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {profile?.role !== 'advisor' && (
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Stats</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Points</Text>
            <Text style={styles.statsValue}>{profile?.points || 0}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Member since</Text>
            <Text style={styles.statsValue}>
              {new Date(profile?.created_at || '').toLocaleDateString()}
            </Text>
          </View>
        </View>
      )}

      {profile?.role !== 'advisor' && (
        <TouchableOpacity 
          style={styles.createFormularButton}
          onPress={handleCreateFormular}
        >
          <Text style={styles.createFormularButtonText}>
            {hasExistingApplication ? 'Update Advisor Application' : 'Create Advisor Application'}
          </Text>
        </TouchableOpacity>
      )}

      <EditModal
        visible={!!editField}
        onClose={() => setEditField(null)}
        onSave={(value) => {
          if (editField) handleUpdate(editField, value);
        }}
        value={profile?.[editField as keyof UserProfile]?.toString() || ''}
        field={editField || ''}
      />
      
      <ImageViewModal />

      {profile?.role === 'advisor' && (
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            style={styles.dashboardButton}
            onPress={() => router.push('/dashboared-advisor')}
          >
            <Ionicons name="stats-chart" size={20} color="#0A192F" style={styles.dashboardIcon} />
            <Text style={styles.dashboardText}>Advisor Dashboard</Text>
          </TouchableOpacity>
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
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CCD6F6',
  },
  logoutButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A192F',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  editImageButton: {
    position: 'absolute',
    right: '35%',
    bottom: 20,
    backgroundColor: '#1D2D50',
    padding: 8,
    borderRadius: 20,
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#112240',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1D2D50',
  },
  infoContent: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#8892B0',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#CCD6F6',
  },
  statsSection: {
    padding: 20,
    backgroundColor: '#112240',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64FFDA',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statsLabel: {
    fontSize: 16,
    color: '#8892B0',
  },
  statsValue: {
    fontSize: 16,
    color: '#CCD6F6',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#112240',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    color: '#64FFDA',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1D2D50',
    padding: 12,
    borderRadius: 8,
    color: '#CCD6F6',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    padding: 10,
    marginLeft: 10,
    borderRadius: 8,
    backgroundColor: '#1D2D50',
  },
  saveButton: {
    backgroundColor: '#64FFDA',
  },
  buttonText: {
    color: '#CCD6F6',
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: width,
    height: height * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: StatusBar.currentHeight || 40,
    right: 20,
    zIndex: 1,
    padding: 10,
    backgroundColor: 'rgba(29, 45, 80, 0.8)',
    borderRadius: 20,
  },
  createFormularButton: {
    backgroundColor: '#64FFDA',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  createFormularButtonText: {
    color: '#0A192F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileNameContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginBottom: 8,
  },
  advisorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#112240',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#64FFDA',
  },
  advisorBadgeText: {
    color: '#64FFDA',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  advisorStatsSection: {
    padding: 20,
    backgroundColor: '#112240',
    marginHorizontal: 16,
    borderRadius: 12,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rankCard: {
    backgroundColor: '#1D2D50',
    padding: 15,
    borderRadius: 12,
    marginVertical: 10,
  },
  rankTitle: {
    color: '#8892B0',
    fontSize: 14,
  },
  rankValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  rankValue: {
    color: '#64FFDA',
    fontSize: 28,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  rankIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#0A192F',
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#64FFDA',
    borderRadius: 4,
  },
  pointsText: {
    color: '#CCD6F6',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1D2D50',
    borderRadius: 8,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    color: '#64FFDA',
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#8892B0',
    fontSize: 12,
    marginTop: 5,
  },
  bottomButtonContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#64FFDA',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dashboardIcon: {
    marginRight: 10,
  },
  dashboardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A192F',
  },
}); 