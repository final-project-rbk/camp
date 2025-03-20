import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { EXPO_PUBLIC_API_URL } from '../config';
import { uploadImageToCloudinary } from '../config/cloudinary';
import AuthService from '@/services/auth.service';

interface PlaceForm {
  name: string;
  location: string;
  description: string;
  images: string[];
}

export default function AddPlaceScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PlaceForm>({
    name: '',
    location: '',
    description: '',
    images: [],
  });

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to add images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        const base64Data = result.assets[0].base64;

        if (!base64Data) {
          Alert.alert('Error', 'Failed to get image data');
          return;
        }

        try {
          const uploadResponse = await uploadImageToCloudinary(base64Data);
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, uploadResponse.secure_url],
          }));
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    try {
      // Basic validation
      if (!formData.name || !formData.location || !formData.description) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      if (formData.images.length === 0) {
        Alert.alert('Error', 'Please add at least one image');
        return;
      }

      setLoading(true);

      // Get the auth token
      const token = await AuthService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Submitting place data:', {
        name: formData.name,
        location: formData.location,
        description: formData.description,
        imagesCount: formData.images.length,
        images: formData.images
      });

      const response = await fetch(`${EXPO_PUBLIC_API_URL}places`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          description: formData.description,
          images: formData.images,
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response data:', errorData);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Success response data:', data);

      if (data.success) {
        Alert.alert('Success', 'Place added successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        throw new Error(data.error || 'Failed to add place');
      }
    } catch (error) {
      console.error('Error adding place:', error);
      Alert.alert('Error', error.message || 'Failed to add place. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#64FFDA" />
        </Pressable>
        <Text style={styles.headerTitle}>Add New Place</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Enter place name"
            placeholderTextColor="#8892B0"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            value={formData.location}
            onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
            placeholder="Enter location"
            placeholderTextColor="#8892B0"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Enter description"
            placeholderTextColor="#8892B0"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Images *</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.imagesScroll}
          >
            {formData.images.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={handleImagePick}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#64FFDA" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={24} color="#64FFDA" />
                  <Text style={styles.addImageText}>Add Image</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0A192F" />
          ) : (
            <Text style={styles.submitButtonText}>Add Place</Text>
          )}
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
  imagesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 10,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#0A192F',
    borderRadius: 12,
  },
  addImageButton: {
    width: 120,
    height: 120,
    backgroundColor: '#1D2D50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addImageText: {
    color: '#64FFDA',
    marginTop: 5,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#64FFDA',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#0A192F',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 