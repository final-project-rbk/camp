import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { EXPO_PUBLIC_API_URL } from '@/config';
import { uploadImageToCloudinary } from '@/config/cloudinary';
import AuthService from '@/services/auth.service';
import LocationPicker from '@/components/LocationPicker';
import { LocationType, parseLocation, formatLocation } from '@/utils/tunisiaLocations';

interface Category {
  id: number;
  name: string;
  icon: string;
}

export default function EditPlaceScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [place, setPlace] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    exclusive_details: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(null);

  useEffect(() => {
    fetchPlace();
    fetchCategories();
  }, [id]);

  const fetchPlace = async () => {
    try {
      setLoading(true);
      const token = await AuthService.getToken();
      if (!token) throw new Error('No authentication token found');

      console.log('Fetching place with ID:', id);
      const response = await fetch(`${EXPO_PUBLIC_API_URL}places/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch place');

      const data = await response.json();
      console.log('Fetched place data:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        setPlace(data.data);
        setFormData({
          name: data.data.name,
          description: data.data.description,
          exclusive_details: data.data.exclusive_details || '',
        });
        setImages(data.data.images || []);
        setUploadedImages(data.data.images || []);
        
        // Parse location
        const parsedLocation = parseLocation(data.data.location);
        setSelectedLocation(parsedLocation);
        
        // Set selected categories from the place's categories
        if (data.data.categories && Array.isArray(data.data.categories)) {
          const categoryNames = data.data.categories.map((cat: any) => cat.name);
          console.log('Setting selected categories by name:', categoryNames);
          setSelectedCategories(categoryNames);
        } else {
          console.log('No categories found for place');
          setSelectedCategories([]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching place:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = await AuthService.getToken();
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${EXPO_PUBLIC_API_URL}categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch categories');

      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
        const base64Data = result.assets[0].base64;
        if (!base64Data) {
          Alert.alert('Error', 'Failed to get image data');
          return;
        }

        try {
          const uploadResponse = await uploadImageToCloudinary(base64Data);
          setImages(prev => [...prev, uploadResponse.secure_url]);
          setUploadedImages(prev => [...prev, uploadResponse.secure_url]);
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
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
        images: uploadedImages,
        Categories: formattedCategories
      };

      console.log('Sending update request with body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${EXPO_PUBLIC_API_URL}advisor/place/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      
      let data;
      try {
        const textResponse = await response.text();
        console.log('Raw response:', textResponse);
        data = JSON.parse(textResponse);
        console.log('Parsed response data:', data);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Server response was not in the expected format');
      }

      if (!response.ok) {
        throw new Error(
          data.error || data.message || 
          `Failed to update place (Status: ${response.status})`
        );
      }

      Alert.alert(
        'Success',
        'Place updated successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Error updating place:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update place. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && !place) {
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
        <Text style={styles.headerTitle}>Edit Place</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
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
          <Text style={styles.label}>Description</Text>
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
          <Text style={styles.label}>Exclusive Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.exclusive_details}
            onChangeText={(text) => setFormData(prev => ({ ...prev, exclusive_details: text }))}
            placeholder="Enter exclusive details"
            placeholderTextColor="#8892B0"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Categories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategories.includes(category.name) && styles.selectedCategory
                ]}
                onPress={() => {
                  setSelectedCategories(prev =>
                    prev.includes(category.name)
                      ? prev.filter(name => name !== category.name)
                      : [...prev, category.name]
                  );
                }}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryText,
                  selectedCategories.includes(category.name) && styles.selectedCategoryText
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Images</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.imagesContainer}
          >
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: image }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addImageButton} onPress={handleImagePick}>
              <Ionicons name="add-circle" size={40} color="#64FFDA" />
              <Text style={styles.addImageText}>Add Image</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0A192F" />
          ) : (
            <Text style={styles.submitButtonText}>Update Place</Text>
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
  categoriesContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2D50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  selectedCategory: {
    backgroundColor: '#64FFDA',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryText: {
    color: '#CCD6F6',
    fontSize: 14,
  },
  selectedCategoryText: {
    color: '#0A192F',
  },
  imagesContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
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
    marginRight: 12,
  },
  addImageText: {
    color: '#64FFDA',
    marginTop: 8,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#64FFDA',
    padding: 16,
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