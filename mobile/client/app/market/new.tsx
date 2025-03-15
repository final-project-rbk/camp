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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { EXPO_PUBLIC_API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';


interface Category {
  id: string;
  name: string;
  icon?: string;
}

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dqh6arave/upload";
const UPLOAD_PRESET = "Ghassen123";

// Create an axios instance with custom config
const axiosInstance = axios.create({
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

export default function NewItem() {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!accessToken) {
      Alert.alert('Error', 'Please login to create an item');
      router.replace('/auth');
      return;
    }
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get(`${EXPO_PUBLIC_API_URL}marketplace/categories`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  };

  const uploadToCloudinary = async (fileUri: string): Promise<string> => {
    try {
      // First compress the image
      const compressedImage = await ImageManipulator.manipulateAsync(
        fileUri,
        [{ resize: { width: 1080 } }], // Resize to max width of 1080px
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log('Uploading file:', compressedImage); // Debug: Check file object

      const formData = new FormData();
      const ext = compressedImage.uri.split('.').pop() || 'jpg';
      
      // Prepare the file
      formData.append('file', {
        uri: compressedImage.uri,
        type: `image/${ext}`,
        name: `marketplace_${Date.now()}.${ext}`,
      } as any);

      // Use the correct unsigned upload preset
      formData.append('upload_preset', 'Ghassen123');

      console.log('Starting upload to Cloudinary...'); // Debug log

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
      console.log('Cloudinary response:', data); // Debug: Check response

      if (!data?.secure_url) {
        console.error('Invalid Cloudinary response:', data);
        throw new Error(data.error?.message || 'Failed to upload image');
      }

      return data.secure_url;
    } catch (error: any) {
      console.error('Upload error details:', error.response?.data || error.message);
      Alert.alert(
        'Error',
        'Failed to upload image. Please try again later.'
      );
      throw error;
    }
  };

  const handleSubmit = async () => {
    console.log('Current accessToken:', accessToken); // Debug log
    console.log('Current user:', user); // Debug log

    if (!accessToken) {
      Alert.alert('Error', 'Please login to create an item');
      router.replace('/auth');
      return;
    }

    if (!title || !description || !price || !location || selectedCategories.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields and select at least one category');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    setSubmitting(true);
    try {
      console.log('Submitting data:', {
        title,
        description,
        price,
        location,
        categoryIds: selectedCategories,
        images,
      });

      const response = await axiosInstance.post(
        `${EXPO_PUBLIC_API_URL}marketplace/items`,
        {
          title,
          description,
          price: parseFloat(price),
          location,
          categoryIds: selectedCategories.map(id => parseInt(id)),
          images: images,
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Server response:', response.data); // Debug log

      if (response.data) {
        Alert.alert(
          'Success',
          'Item listed successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      console.error('Error creating item:', error);
      let errorMessage = 'Failed to create item. Please try again.';
      
      if (error.response) {
        console.log('Error response:', error.response.data);
        errorMessage = error.response.data.error || error.response.data.details || errorMessage;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const pickImage = async () => {
    if (!accessToken) {
      Alert.alert('Error', 'Please login to upload images');
      router.replace('/auth');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        allowsMultipleSelection: true, // Enable multiple selection
        aspect: [4, 3],
        quality: 0.8,
      });
  
      if (!result.canceled) {
        setLoading(true);
        setUploadProgress(0);
  
        try {
          // Process all selected images
          const uploadedImages = await Promise.all(
            result.assets.map(async (asset) => {
              return await uploadToCloudinary(asset.uri);
            })
          );
  
          setImages((prev) => [...prev, ...uploadedImages]); // Append new images
        } catch (error: any) {
          Alert.alert('Upload Error', error.message || 'Failed to upload images');
        } finally {
          setLoading(false);
          setUploadProgress(0);
        }
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };
  

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#64FFDA" />
        {uploadProgress > 0 && (
          <Text style={styles.uploadProgressText}>
            Uploading: {uploadProgress}%
          </Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back-circle-outline" size={28} color="#64FFDA" />
        </TouchableOpacity>
        <Text style={styles.title}>List New Item</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#64FFDA" />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={28} color="#64FFDA" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Title*</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter item title"
          placeholderTextColor="#8892B0"
        />

        <Text style={styles.label}>Description*</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your item"
          placeholderTextColor="#8892B0"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Price*</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="Enter price"
          placeholderTextColor="#8892B0"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Location*</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Enter location"
          placeholderTextColor="#8892B0"
        />

        <Text style={styles.label}>Images</Text>
        <ScrollView horizontal style={styles.imageContainer}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addImage} onPress={pickImage}>
            <Ionicons name="camera-outline" size={40} color="#64FFDA" />
          </TouchableOpacity>
        </ScrollView>

        <Text style={styles.label}>Categories*</Text>
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategories.includes(category.id) && styles.categoryButtonActive,
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              {category.icon && (
                <Image source={{ uri: category.icon }} style={styles.categoryIcon} />
              )}
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategories.includes(category.id) && styles.categoryButtonTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#0A192F" />
          ) : (
            <Text style={styles.submitButtonText}>List Item</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Styles remain unchanged
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
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#112240',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CCD6F6',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    color: '#64FFDA',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#112240',
    borderRadius: 8,
    padding: 12,
    color: '#CCD6F6',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageContainer: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  imageWrapper: {
    marginRight: 10,
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImage: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#0A192F',
    borderRadius: 12,
  },
  addImage: {
    width: 100,
    height: 100,
    backgroundColor: '#112240',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#64FFDA',
    borderStyle: 'dashed',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#112240',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#64FFDA',
  },
  categoryIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  categoryButtonText: {
    color: '#8892B0',
    fontSize: 14,
  },
  categoryButtonTextActive: {
    color: '#0A192F',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#64FFDA',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#0A192F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadProgressText: {
    color: '#64FFDA',
    marginTop: 10,
    fontSize: 16,
  },
});