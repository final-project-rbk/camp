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
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { EXPO_PUBLIC_API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

// Types
interface Category {
  id: string;
  name: string;
  icon?: string;
}

type Step = {
  id: number;
  title: string;
};

// Add LocationType to properly type the currentLocation state
type LocationType = Location.LocationObject | null;

const steps: Step[] = [
  { id: 1, title: 'Basic Info' },
  { id: 2, title: 'Details' },
  { id: 3, title: 'Location' },
  { id: 4, title: 'Images' },
];

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dqh6arave/upload";
const UPLOAD_PRESET = "Ghassen123";

// Create an axios instance with custom config
const axiosInstance = axios.create({
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

const CreateListingScreen = () => {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  
  // Step state for multi-step form
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [condition, setCondition] = useState('new');
  const [images, setImages] = useState<string[]>([]);
  
  // Update types for location-related states
  const [currentLocation, setCurrentLocation] = useState<LocationType>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Dropdown states for categories
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Validation states
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    images: '',
    category: ''
  });

  useEffect(() => {
    if (!accessToken) {
      Alert.alert('Error', 'Please login to create an item');
      router.replace('/auth');
      return;
    }
    fetchCategories();
    // Request permission for location
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      
      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
    })();
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

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      title: '',
      description: '',
      price: '',
      location: '',
      images: '',
      category: ''
    };
    
    // Title validation
    if (!title.trim()) {
      newErrors.title = 'Title is required';
      valid = false;
    } else if (title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
      valid = false;
    }
    
    // Description validation
    if (!description.trim()) {
      newErrors.description = 'Description is required';
      valid = false;
    } else if (description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
      valid = false;
    }
    
    // Price validation
    if (!price.trim()) {
      newErrors.price = 'Price is required';
      valid = false;
    } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      newErrors.price = 'Price must be a valid number greater than 0';
      valid = false;
    }
    
    // Location validation
    if (!useCurrentLocation && !location.trim()) {
      newErrors.location = 'Location is required';
      valid = false;
    }
    
    // Image validation
    if (images.length === 0) {
      newErrors.images = 'At least one image is required';
      valid = false;
    }
    
    // Category validation
    if (selectedCategories.length === 0) {
      newErrors.category = 'Category is required';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!accessToken) {
      Alert.alert('Error', 'Please login to create an item');
      router.replace('/auth');
      return;
    }

    if (!validateForm()) {
      Alert.alert('Error', 'Please fill in all required fields and correct any errors');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axiosInstance.post(
        `${EXPO_PUBLIC_API_URL}marketplace/items`,
        {
          title,
          description,
          price: parseFloat(price),
          location: useCurrentLocation ? location : location,
          condition: condition,
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
          
          // Clear image error if images are uploaded
          if (errors.images) {
            setErrors(prev => ({...prev, images: ''}));
          }
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
    
    // If we remove all images, set the error back
    if (images.length === 1) {
      setErrors(prev => ({...prev, images: 'At least one image is required'}));
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
    
    // Clear category error if any category is selected
    if (!selectedCategories.includes(categoryId) && errors.category) {
      setErrors(prev => ({...prev, category: ''}));
    }
  };

  const useMyLocation = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Unable to get your current location. Please enter it manually.');
      return;
    }
    
    setUseCurrentLocation(true);
    
    try {
      if (!currentLocation || !currentLocation.coords) {
        throw new Error('Location coordinates not available');
      }
      
      const { coords } = currentLocation;
      const address = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      
      if (address && address.length > 0) {
        const { city, region, country } = address[0];
        setLocation(`${city || ''}, ${region || ''}, ${country || ''}`.trim());
      } else {
        setLocation('Location found (coordinates only)');
      }
      
      setErrors({ ...errors, location: '' });
    } catch (error) {
      console.error('Error getting location details:', error);
      Alert.alert('Error', 'Failed to get location details. Please enter manually.');
      setUseCurrentLocation(false);
    }
  };

  // Add new functions for the step-by-step form
  const validateCurrentStep = () => {
    let isValid = true;
    const newErrors = { ...errors };
    
    switch (currentStep) {
      case 1: // Basic Info
        // Validate title
        if (!title.trim()) {
          newErrors.title = 'Title is required';
          isValid = false;
        } else if (title.length < 3) {
          newErrors.title = 'Title must be at least 3 characters';
          isValid = false;
        } else {
          newErrors.title = '';
        }
        
        // Validate price
        if (!price.trim()) {
          newErrors.price = 'Price is required';
          isValid = false;
        } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
          newErrors.price = 'Price must be a valid number greater than 0';
          isValid = false;
        } else {
          newErrors.price = '';
        }
        
        // Validate category
        if (selectedCategories.length === 0) {
          newErrors.category = 'At least one category is required';
          isValid = false;
        } else {
          newErrors.category = '';
        }
        break;
        
      case 2: // Details
        // Validate description
        if (!description.trim()) {
          newErrors.description = 'Description is required';
          isValid = false;
        } else if (description.length < 10) {
          newErrors.description = 'Description must be at least 10 characters';
          isValid = false;
        } else {
          newErrors.description = '';
        }
        break;
        
      case 3: // Location
        // Validate location
        if (!useCurrentLocation && !location.trim()) {
          newErrors.location = 'Location is required';
          isValid = false;
        } else {
          newErrors.location = '';
        }
        break;
        
      case 4: // Images
        // Validate images
        if (images.length === 0) {
          newErrors.images = 'At least one image is required';
          isValid = false;
        } else {
          newErrors.images = '';
        }
        break;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const nextStep = () => {
    if (validateCurrentStep() && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Rendering based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Basic Info
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title*</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter item title"
                placeholderTextColor="#8892B0"
              />
              {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Price*</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor="#8892B0"
                  keyboardType="numeric"
                />
              </View>
              {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Categories*</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesContainer}
                contentContainerStyle={{paddingRight: 8}}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryButton,
                      selectedCategories.includes(cat.id) && styles.categoryButtonActive
                    ]}
                    onPress={() => toggleCategory(cat.id)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        selectedCategories.includes(cat.id) && styles.categoryButtonTextActive
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
            </View>
          </View>
        );
        
      case 2: // Details
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description*</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your item in detail..."
                placeholderTextColor="#8892B0"
                multiline
                numberOfLines={4}
              />
              {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Condition</Text>
              <View style={styles.conditionContainer}>
                {['new', 'like-new', 'good', 'fair'].map((cond) => (
                  <TouchableOpacity
                    key={cond}
                    style={[
                      styles.conditionButton,
                      condition === cond && styles.conditionButtonActive
                    ]}
                    onPress={() => setCondition(cond)}
                  >
                    <Text
                      style={[
                        styles.conditionButtonText,
                        condition === cond && styles.conditionButtonTextActive
                      ]}
                    >
                      {cond.charAt(0).toUpperCase() + cond.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
        
      case 3: // Location
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location*</Text>
              <View style={styles.locationContainer}>
                <View style={styles.locationInputWrapper}>
                  <Ionicons name="location-outline" size={20} color="#64FFDA" style={styles.locationIcon} />
                  <TextInput
                    style={[styles.locationInput, useCurrentLocation && styles.disabledInput]}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Enter location"
                    placeholderTextColor="#8892B0"
                    editable={!useCurrentLocation}
                  />
                </View>
                <TouchableOpacity 
                  style={[styles.locationButton, useCurrentLocation && styles.activeLocationButton]}
                  onPress={useMyLocation}
                >
                  <Ionicons name="locate" size={20} color={useCurrentLocation ? "#0A192F" : "#64FFDA"} />
                </TouchableOpacity>
              </View>
              {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
            </View>
          </View>
        );
        
      case 4: // Images
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Images*</Text>
              <View style={styles.imageUploadContainer}>
                <Ionicons name="camera-outline" size={50} color="#64FFDA" />
                <Text style={styles.uploadText}>Add photos</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickImage}
                >
                  <Ionicons name="cloud-upload-outline" size={20} color="#0A192F" />
                  <Text style={styles.uploadButtonText}>Select Images</Text>
                </TouchableOpacity>
                <Text style={styles.uploadNote}>PNG, JPG, GIF up to 10MB</Text>
              </View>
              {errors.images ? <Text style={styles.errorText}>{errors.images}</Text> : null}
            </View>

            {images.length > 0 && (
              <View style={styles.selectedImagesContainer}>
                <Text style={styles.selectedImagesTitle}>Selected Images</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{paddingRight: 10}}
                >
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
                </ScrollView>
              </View>
            )}
          </View>
        );
      default:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.label}>Unknown step</Text>
          </View>
        );
    }
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={{paddingBottom: 30}}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#64FFDA" />
          </TouchableOpacity>
          <Text style={styles.title}>List Your Camping Gear</Text>
          <View style={{width: 24}} />
        </View>

        {/* Main Card Container */}
        <View style={styles.mainCard}>
          {/* Progress Steps */}
          <View style={styles.stepsContainer}>
            {steps.map((step) => (
              <View key={step.id} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    step.id === currentStep
                      ? styles.currentStepCircle
                      : step.id < currentStep
                      ? styles.completedStepCircle
                      : styles.inactiveStepCircle
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      (step.id === currentStep || step.id < currentStep) && styles.activeStepNumber
                    ]}
                  >
                    {step.id}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepTitle,
                    step.id === currentStep && styles.currentStepTitle
                  ]}
                >
                  {step.title}
                </Text>
              </View>
            ))}
          </View>

          {/* Current Step Content */}
          <View style={styles.contentCard}>
            {renderStepContent()}
          </View>

          {/* Navigation Footer */}
          <View style={styles.footerContainer}>
            <LinearGradient
              colors={['#0E1B36', '#1D2D50']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.navigationContainer}
            >
              <TouchableOpacity
                onPress={prevStep}
                style={[styles.navButton, styles.prevButton, currentStep === 1 && styles.disabledButton]}
                disabled={currentStep === 1}
              >
                <Ionicons name="chevron-back" size={18} color={currentStep === 1 ? "#8892B0" : "#64FFDA"} />
                <Text style={[styles.navButtonText, currentStep === 1 && styles.disabledButtonText]}>Previous</Text>
              </TouchableOpacity>
              
              <View style={styles.stepIndicatorContainer}>
                {steps.map((step) => (
                  <View
                    key={`indicator-${step.id}`}
                    style={[
                      styles.stepIndicator,
                      currentStep === step.id && styles.currentStepIndicator,
                      currentStep > step.id && styles.completedStepIndicator
                    ]}
                  />
                ))}
              </View>
              
              <TouchableOpacity
                onPress={currentStep === steps.length ? handleSubmit : nextStep}
                style={[styles.navButton, styles.nextButton, submitting && styles.disabledButton]}
                disabled={submitting}
              >
                {currentStep === steps.length ? (
                  submitting ? (
                    <ActivityIndicator size="small" color="#0A192F" />
                  ) : (
                    <>
                      <Text style={styles.nextButtonText}>List Item</Text>
                      <Ionicons name="cloud-upload-outline" size={18} color="#0A192F" />
                    </>
                  )
                ) : (
                  <>
                    <Text style={styles.nextButtonText}>Next</Text>
                    <Ionicons name="chevron-forward" size={18} color="#0A192F" />
                  </>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Update styles to match the new design
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  scrollContainer: {
    flex: 1,
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
    padding: 16,
    backgroundColor: '#1D2D50',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  mainCard: {
    margin: 16,
    marginTop: 24,
    backgroundColor: '#112240',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5.84,
    elevation: 8,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1D2D50',
    backgroundColor: '#0E1B36',
  },
  contentCard: {
    padding: 4,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  currentStepCircle: {
    backgroundColor: '#64FFDA',
  },
  completedStepCircle: {
    backgroundColor: '#64FFDA',
  },
  inactiveStepCircle: {
    backgroundColor: '#1D2D50',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8892B0',
  },
  activeStepNumber: {
    color: '#0A192F',
  },
  stepTitle: {
    fontSize: 12,
    color: '#8892B0',
    textAlign: 'center',
  },
  currentStepTitle: {
    color: '#64FFDA',
    fontWeight: 'bold',
  },
  stepContent: {
    padding: 16,
  },
  footerContainer: {
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 255, 218, 0.1)',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  stepIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1D2D50',
    marginHorizontal: 4,
  },
  currentStepIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#64FFDA',
    shadowColor: "#64FFDA",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  completedStepIndicator: {
    backgroundColor: 'rgba(100, 255, 218, 0.6)',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 1,
  },
  prevButton: {
    backgroundColor: 'rgba(14, 27, 54, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.3)',
  },
  nextButton: {
    backgroundColor: '#64FFDA',
    shadowColor: "#64FFDA",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 3.62,
    elevation: 6,
  },
  navButtonText: {
    fontWeight: 'bold',
    marginHorizontal: 4,
    color: '#64FFDA',
  },
  nextButtonText: {
    fontWeight: 'bold',
    marginHorizontal: 4,
    color: '#0A192F',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#8892B0',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64FFDA',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0E1B36',
    borderRadius: 8,
    padding: 12,
    color: '#CCD6F6',
    borderWidth: 1,
    borderColor: '#1D2D50',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1B36',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1D2D50',
    paddingHorizontal: 8,
  },
  currencySymbol: {
    color: '#64FFDA',
    fontSize: 16,
    paddingHorizontal: 4,
  },
  priceInput: {
    flex: 1,
    padding: 12,
    color: '#CCD6F6',
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  categoryButton: {
    backgroundColor: '#0E1B36',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1D2D50',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  categoryButtonActive: {
    backgroundColor: '#64FFDA',
    borderColor: '#64FFDA',
  },
  categoryButtonText: {
    color: '#8892B0',
  },
  categoryButtonTextActive: {
    color: '#0A192F',
    fontWeight: 'bold',
  },
  conditionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  conditionButton: {
    backgroundColor: '#0E1B36',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1D2D50',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  conditionButtonActive: {
    backgroundColor: '#64FFDA',
    borderColor: '#64FFDA',
  },
  conditionButtonText: {
    color: '#8892B0',
  },
  conditionButtonTextActive: {
    color: '#0A192F',
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1B36',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: '#1D2D50',
    borderRightWidth: 0,
  },
  locationIcon: {
    paddingLeft: 10,
  },
  locationInput: {
    flex: 1,
    padding: 12,
    color: '#CCD6F6',
  },
  locationButton: {
    backgroundColor: '#0E1B36',
    padding: 14,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderColor: '#1D2D50',
    borderLeftWidth: 0,
  },
  activeLocationButton: {
    backgroundColor: '#64FFDA',
  },
  disabledInput: {
    backgroundColor: '#0E1B36',
    color: '#8892B0',
  },
  imageUploadContainer: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#1D2D50',
    borderRadius: 8,
    padding: 24,
    backgroundColor: '#0E1B36',
    alignItems: 'center',
  },
  uploadText: {
    color: '#64FFDA',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#64FFDA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  uploadButtonText: {
    color: '#0A192F',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  uploadNote: {
    color: '#8892B0',
    fontSize: 12,
    marginTop: 8,
  },
  selectedImagesContainer: {
    marginTop: 20,
  },
  selectedImagesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64FFDA',
    marginBottom: 12,
  },
  imageWrapper: {
    marginRight: 10,
    position: 'relative',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    padding: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
  },
  uploadProgressText: {
    color: '#64FFDA',
    marginTop: 10,
    fontSize: 16,
  },
});

export default CreateListingScreen;