import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { EXPO_PUBLIC_API_URL } from '../config';
import { uploadImageToCloudinary } from '../config/cloudinary';
import AuthService from '@/services/auth.service';
import LocationPicker from '@/components/LocationPicker';
import { LocationType, formatLocation } from '@/utils/tunisiaLocations';

interface Category {
  id: number;
  name: string;
  icon: string;
}

export default function AddPlaceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    exclusive_details: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = await AuthService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${EXPO_PUBLIC_API_URL}categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', error.message || 'Failed to fetch categories');
    }
  };

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
          setImages([...images, uploadResponse.secure_url]);
          Alert.alert('Success', 'Image uploaded successfully');
        } catch (error: any) {
          console.error('Error uploading image:', error);
          Alert.alert('Error', error.message || 'Failed to upload image');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = await AuthService.getToken();
      if (!token) throw new Error('No authentication token found');

      // Validate required fields
      if (!formData.name || !selectedLocation || !formData.description) {
        throw new Error('Please fill in all required fields');
      }

      if (images.length === 0) {
        throw new Error('Please add at least one image');
      }

      if (selectedCategories.length === 0) {
        throw new Error('Please select at least one category');
      }

      // Format categories to match backend expectation
      const formattedCategories = selectedCategories.map(name => {
        const category = categories.find(cat => cat.name === name);
        return {
          name: category?.name,
          icon: category?.icon
        };
      });

      const requestBody = {
        ...formData,
        location: formatLocation(selectedLocation),
        images: images,
        Categories: formattedCategories
      };

      console.log('Sending create request with body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${EXPO_PUBLIC_API_URL}advisor/place`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData?.message || 'Failed to create place');
      }

      Alert.alert('Success', 'Place created successfully');
      router.back();
    } catch (error: any) {
      console.error('Error creating place:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create place. Please try again.'
      );
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
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter place name"
            placeholderTextColor="#8892B0"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <LocationPicker
            value={selectedLocation}
            onChange={setSelectedLocation}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Categories *</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategories.includes(category.id) && styles.selectedCategory
                ]}
                onPress={() => handleCategoryToggle(category.id)}
              >
                <Text style={[
                  styles.categoryIcon,
                  selectedCategories.includes(category.id) && styles.selectedCategoryIcon
                ]}>
                  {category.icon}
                </Text>
                <Text style={[
                  styles.categoryText,
                  selectedCategories.includes(category.id) && styles.selectedCategoryText
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Describe the place"
            placeholderTextColor="#8892B0"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Exclusive Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.exclusive_details}
            onChangeText={(text) => setFormData({ ...formData, exclusive_details: text })}
            placeholder="Add any exclusive details"
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
            {images.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImages(images.filter((_, i) => i !== index))}
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
              <Ionicons name="add-circle" size={24} color="#64FFDA" />
              <Text style={styles.addImageText}>Add Image</Text>
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
            <Text style={styles.submitButtonText}>Create Place</Text>
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
  categoriesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2D50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedCategory: {
    backgroundColor: '#64FFDA',
  },
  categoryText: {
    color: '#64FFDA',
    marginLeft: 5,
    fontSize: 14,
  },
  selectedCategoryText: {
    color: '#0A192F',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 5,
  },
  selectedCategoryIcon: {
    color: '#0A192F',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2D50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  addImageText: {
    color: '#64FFDA',
    marginLeft: 5,
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