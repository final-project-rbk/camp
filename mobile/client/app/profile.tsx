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
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { EXPO_PUBLIC_API_URL } from '../config';

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editField, setEditField] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const id = 3;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}users/${id}`);
      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
      } else {
        Alert.alert('Error', 'Failed to fetch profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (field: string, value: string) => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      // Pick the image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        uploadImage(result.assets[0].uri);
      }
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
      await fetchProfile();
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
}); 