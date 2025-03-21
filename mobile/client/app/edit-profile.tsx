import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { EXPO_PUBLIC_API_URL } from '@/config';
import { uploadImageToCloudinary } from '@/config/cloudinary';
import AuthService from '@/services/auth.service';

export default function EditProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    experience: '',
  });

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await AuthService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching profile for ID:', id);
      const response = await fetch(`${EXPO_PUBLIC_API_URL}advisor/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      console.log('Fetched profile data:', data);
      
      if (data.success) {
        setFormData({
          first_name: data.data.user.first_name,
          last_name: data.data.user.last_name,
          bio: data.data.bio || '',
          experience: data.data.experience || '',
        });
        console.log('Setting profile image:', data.data.user.profile_image);
        setProfileImage(data.data.user.profile_image);
      }
    } catch (error: any) {
      console.error('Error in fetchProfile:', error);
      Alert.alert('Error', error.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
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
        setLoading(true);
        const base64Data = result.assets[0].base64;
        console.log('Image selected, base64 data length:', base64Data?.length);

        if (!base64Data) {
          Alert.alert('Error', 'Failed to get image data');
          return;
        }

        try {
          // Upload to Cloudinary
          console.log('Uploading to Cloudinary...');
          const uploadResponse = await uploadImageToCloudinary(base64Data);
          console.log('Cloudinary upload response:', uploadResponse);
          
          if (!uploadResponse.secure_url) {
            throw new Error('Failed to get secure URL from Cloudinary');
          }

          // Update local state immediately
          console.log('Setting local profile image:', uploadResponse.secure_url);
          setProfileImage(uploadResponse.secure_url);
          
          // Update profile image in the backend
          const token = await AuthService.getToken();
          if (!token) {
            throw new Error('No authentication token found');
          }

          console.log('Updating backend with new profile image...');
          const response = await fetch(`${EXPO_PUBLIC_API_URL}advisor/profile/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              profile_image: uploadResponse.secure_url
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error('Backend update error:', errorData);
            throw new Error(errorData?.message || 'Failed to update profile image');
          }

          const responseData = await response.json();
          console.log('Backend update response:', responseData);

          // Refresh profile data to ensure everything is in sync
          await fetchProfile();
          Alert.alert('Success', 'Profile picture updated successfully');
        } catch (error: any) {
          console.error('Error in image upload:', error);
          Alert.alert('Error', error.message || 'Failed to upload image. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = await AuthService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Update profile information
      const response = await fetch(`${EXPO_PUBLIC_API_URL}advisor/profile/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          bio: formData.bio,
          experience: formData.experience
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to update profile');
      }

      Alert.alert('Success', 'Profile updated successfully');
      router.replace(`/advisor/${id}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#64FFDA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ 
              uri: profileImage || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
            }}
            style={styles.profileImage}
            onError={(error) => console.error('Image loading error:', error.nativeEvent.error)}
          />
          <TouchableOpacity
            style={styles.changeImageButton}
            onPress={handleImagePick}
            disabled={loading}
          >
            <Ionicons name="camera" size={24} color="#64FFDA" />
            <Text style={styles.changeImageText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={formData.first_name}
            onChangeText={(text) => setFormData({ ...formData, first_name: text })}
            placeholder="Enter your first name"
            placeholderTextColor="#8892B0"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={formData.last_name}
            onChangeText={(text) => setFormData({ ...formData, last_name: text })}
            placeholder="Enter your last name"
            placeholderTextColor="#8892B0"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            placeholder="Tell us about yourself"
            placeholderTextColor="#8892B0"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Experience</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.experience}
            onChangeText={(text) => setFormData({ ...formData, experience: text })}
            placeholder="Share your experience"
            placeholderTextColor="#8892B0"
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  form: {
    padding: 20,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    backgroundColor: '#1D2D50',
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2D50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeImageText: {
    color: '#64FFDA',
    marginLeft: 5,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#CCD6F6',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1D2D50',
    borderRadius: 8,
    padding: 12,
    color: '#CCD6F6',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#64FFDA',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#0A192F',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 