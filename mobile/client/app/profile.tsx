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
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { EXPO_PUBLIC_API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  profile_image: string;
  bio: string;
  points: number;
  created_at: string;
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
  const id = 3;

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editField, setEditField] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);

  useEffect(() => {
    checkAuthAndFetchProfile();
  }, []);

  const checkAuthAndFetchProfile = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      console.log('Checking stored data:', { userToken, userData }); // Debug log

      if (!userToken || !userData) {
        console.log('No auth data found, redirecting to auth'); // Debug log
        router.replace('/auth');
        return;
      }

      const user = JSON.parse(userData);
      console.log('Found user data:', user); // Debug log

      // Fetch the profile data
      const response = await fetch(`${EXPO_PUBLIC_API_URL}users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Profile response:', data); // Debug log

      if (data.success) {
        setProfile(data.data);
      } else {
        console.log('Failed to fetch profile:', data); // Debug log
        if (response.status === 401) {
          // Token expired or invalid
          await AsyncStorage.multiRemove(['userToken', 'userData']);
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

  const handleUpdate = async (field: string, value: string) => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (!userData || !userToken) {
        router.replace('/auth');
        return;
      }

      const user = JSON.parse(userData);
      const response = await fetch(`${EXPO_PUBLIC_API_URL}users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ [field]: value }),
      });
      
      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
        // Update stored user data
        await AsyncStorage.setItem('userData', JSON.stringify(data.data));
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const pickImage = async () => {
    try {
      // Show action sheet for image source selection
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
      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'profile-image.jpg',
      } as any);
      formData.append('upload_preset', 'Ghassen123'); // Your actual preset
      formData.append('cloud_name', 'dqh6arave'); // Your actual cloud name

      // Upload to Cloudinary
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
      console.log('Cloudinary response:', data); // For debugging

      if (data.secure_url) {
        // Update profile with new image URL
        await handleUpdate('profile_image', data.secure_url);
      } else {
        console.error('Upload error:', data); // For debugging
        Alert.alert('Error', 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error); // For debugging
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
      const userToken = await AsyncStorage.getItem('userToken');
      
      // Updated endpoint URL to match backend
      const response = await fetch(`${EXPO_PUBLIC_API_URL}formularAdvisor/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });

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
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        router.replace('/auth');
        return;
      }

      const user = JSON.parse(userData);
      const existingApplication = await checkExistingApplication(user.id);
      
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
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
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
    <>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerStyle: { backgroundColor: '#0A192F' },
          headerTintColor: '#64FFDA',
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
              <Ionicons name="log-out-outline" size={24} color="#64FFDA" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView 
        style={styles.container}
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
        </View>

        <View style={styles.infoSection}>
          {[
            { label: 'First Name', value: profile?.first_name, field: 'first_name' },
            { label: 'Last Name', value: profile?.last_name, field: 'last_name' },
            { label: 'Email', value: profile?.email, field: 'email' },
            { label: 'Phone', value: profile?.phone_number, field: 'phone_number' },
            { label: 'Bio', value: profile?.bio, field: 'bio' },
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

        <TouchableOpacity 
          style={styles.createFormularButton}
          onPress={handleCreateFormular}
        >
          <Text style={styles.createFormularButtonText}>
            {hasExistingApplication ? 'Update Advisor Application' : 'Create Advisor Application'}
          </Text>
        </TouchableOpacity>

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
      </ScrollView>
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
}); 