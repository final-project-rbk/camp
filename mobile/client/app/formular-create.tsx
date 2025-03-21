import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { EXPO_PUBLIC_API_URL } from '../config';
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/auth.service';

interface FormData {
  address: string;
  phoneNumber: string;
  cin: string;
  motivation: string;
  eventTypes: string;
  experience: string;
  socialMediaLinks: string;
  termsAccepted: boolean;
  genuineInfoAgreed: boolean;
  cinFront: string;
  cinBack: string;
  certificate: string;
  faceImage: string;
}

export default function FormularCreate() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, checkAuth } = useAuth();
  const params = useLocalSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const isEdit = params.mode === 'edit';
  
  // Initialize formData with existing data if in edit mode
  const [formData, setFormData] = useState<FormData>(() => {
    if (params.mode === 'edit' && params.existingData) {
      const existingData = JSON.parse(params.existingData as string);
      return {
        address: existingData.address || '',
        phoneNumber: existingData.phoneNumber || '',
        cin: existingData.cin || '',
        motivation: existingData.motivation || '',
        eventTypes: existingData.eventTypes || '',
        experience: existingData.experience || '',
        socialMediaLinks: existingData.socialMediaLinks || '',
        termsAccepted: existingData.termsAccepted || false,
        genuineInfoAgreed: existingData.genuineInfoAgreed || false,
        cinFront: existingData.advisor_medium?.cinFront || '',
        cinBack: existingData.advisor_medium?.cinBack || '',
        certificate: existingData.advisor_medium?.certificate || '',
        faceImage: existingData.advisor_medium?.faceImage || ''
      };
    }
    return {
      address: '',
      phoneNumber: '',
      cin: '',
      motivation: '',
      eventTypes: '',
      experience: '',
      socialMediaLinks: '',
      termsAccepted: false,
      genuineInfoAgreed: false,
      cinFront: '',
      cinBack: '',
      certificate: '',
      faceImage: ''
    };
  });

  const [existingImages, setExistingImages] = useState(() => {
    if (params.mode === 'edit' && params.existingData) {
      const existingData = JSON.parse(params.existingData as string);
      return {
        cinFront: existingData.advisor_medium?.cinFront || '',
        cinBack: existingData.advisor_medium?.cinBack || '',
        certificate: existingData.advisor_medium?.certificate || '',
        faceImage: existingData.advisor_medium?.faceImage || ''
      };
    }
    return {
      cinFront: '',
      cinBack: '',
      certificate: '',
      faceImage: ''
    };
  });

  // Add state for user data
  const [userId, setUserId] = useState<number | null>(null);
  
  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to auth');
      router.replace('/auth');
    }
  }, [isAuthenticated, isLoading]);

  const handleSubmit = async () => {
    try {
        const token = await authService.getToken();
        const userData = await authService.getUser();
        
        if (!token || !userData) {
            router.replace('/auth');
            return;
        }

        // Upload images if they've changed
        const imageUrls = {
            cinFront: formData.cinFront !== existingImages.cinFront ? 
                await uploadToCloudinary(formData.cinFront) : formData.cinFront,
            cinBack: formData.cinBack !== existingImages.cinBack ? 
                await uploadToCloudinary(formData.cinBack) : formData.cinBack,
            certificate: formData.certificate !== existingImages.certificate ? 
                await uploadToCloudinary(formData.certificate) : formData.certificate,
            faceImage: formData.faceImage !== existingImages.faceImage ? 
                await uploadToCloudinary(formData.faceImage) : formData.faceImage,
        };

        const requestBody = {
            ...formData,
            ...imageUrls,
            userId: userData.id,
        };

        const existingData = isEdit ? JSON.parse(params.existingData as string) : null;

        // Use PUT for update, POST for create
        const apiUrl = `${EXPO_PUBLIC_API_URL.replace(/\/+$/, '')}/formularAdvisor${isEdit ? `/${existingData.id}` : '/create'}`;
        console.log('API URL:', apiUrl);
        console.log('Sending request with body:', requestBody);

        const response = await fetch(apiUrl, {
            method: isEdit ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (response.status === 401) {
            await checkAuth();
            router.replace('/auth');
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        try {
            const responseText = await response.text();
            console.log('Raw response:', responseText);
            
            if (!responseText) {
                throw new Error('Empty response from server');
            }

            const result = JSON.parse(responseText);
            
            if (result.success) {
                Alert.alert('Success', `Application ${isEdit ? 'updated' : 'submitted'} successfully`, [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                throw new Error(result.message || `Failed to ${isEdit ? 'update' : 'submit'} application`);
            }
        } catch (parseError) {
            console.error('Parse error:', parseError);
            throw new Error('Failed to parse server response');
        }
    } catch (error) {
        console.error('Submit error:', error);
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to process application');
    }
};

  const handleImagePick = async (field: 'cinFront' | 'cinBack' | 'certificate' | 'faceImage') => {
    try {
      // Show action sheet to choose between camera and gallery
      Alert.alert(
        'Choose Image Source',
        'Would you like to take a photo or choose from gallery?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Take Photo',
            onPress: async () => {
              // Request camera permissions
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission needed', 'Camera permission is required to take photos');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
              });

              if (!result.canceled) {
                const imageUri = result.assets[0].uri;
                // Upload to Cloudinary
                const cloudinaryUrl = await uploadToCloudinary(imageUri);
                setFormData(prev => ({ ...prev, [field]: cloudinaryUrl }));
              }
            }
          },
          {
            text: 'Choose from Gallery',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
              });

              if (!result.canceled) {
                const imageUri = result.assets[0].uri;
                // Upload to Cloudinary
                const cloudinaryUrl = await uploadToCloudinary(imageUri);
                setFormData(prev => ({ ...prev, [field]: cloudinaryUrl }));
              }
            }
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadToCloudinary = async (uri: string) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'upload.jpg',
      } as any);
      formData.append('upload_preset', 'Ghassen123');
      formData.append('cloud_name', 'dqh6arave');

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dqh6arave/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
      return '';
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.address || !formData.phoneNumber || !formData.cin) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.motivation || !formData.eventTypes || !formData.experience) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const showTerms = () => {
    setShowTermsModal(true);
  };

  const checkExistingApplication = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      if (!userToken || !userData) {
        return null;
      }

      const user = JSON.parse(userData);
      
      const response = await fetch(`${EXPO_PUBLIC_API_URL}formularAdvisor/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        return null;
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error checking application:', error);
      return null;
    }
  };

  const renderStep1 = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Personal Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          value={formData.address}
          onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
          placeholder="Enter your address"
          placeholderTextColor="#8892B0"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={formData.phoneNumber}
          onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
          placeholder="Enter your phone number"
          placeholderTextColor="#8892B0"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>CIN *</Text>
        <TextInput
          style={styles.input}
          value={formData.cin}
          onChangeText={(text) => setFormData(prev => ({ ...prev, cin: text }))}
          placeholder="Enter your CIN"
          placeholderTextColor="#8892B0"
          keyboardType='numeric'
        />
      </View>

      <TouchableOpacity 
        style={styles.nextButton}
        onPress={handleNext}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Professional Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Motivation *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.motivation}
          onChangeText={(text) => setFormData(prev => ({ ...prev, motivation: text }))}
          placeholder="Why do you want to be an advisor?"
          placeholderTextColor="#8892B0"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Types *</Text>
        <TextInput
          style={styles.input}
          value={formData.eventTypes}
          onChangeText={(text) => setFormData(prev => ({ ...prev, eventTypes: text }))}
          placeholder="What types of events can you handle?"
          placeholderTextColor="#8892B0"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Experience *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.experience}
          onChangeText={(text) => setFormData(prev => ({ ...prev, experience: text }))}
          placeholder="Describe your relevant experience"
          placeholderTextColor="#8892B0"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Document Upload</Text>

      <View style={styles.documentSection}>
        <View style={styles.documentItem}>
          <TouchableOpacity 
            style={styles.documentButton}
            onPress={() => handleImagePick('faceImage')}
          >
            <Text style={styles.documentButtonText}>
              Upload Face Image *
            </Text>
          </TouchableOpacity>
          {(formData.faceImage || existingImages.faceImage) ? (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: formData.faceImage || existingImages.faceImage }} 
                style={styles.imagePreview} 
                resizeMode="contain"
              />
            </View>
          ) : (
            <Text style={styles.documentStatus}>No image uploaded</Text>
          )}
        </View>

        <View style={styles.documentItem}>
          <TouchableOpacity 
            style={styles.documentButton}
            onPress={() => handleImagePick('cinFront')}
          >
            <Text style={styles.documentButtonText}>
              Upload CIN Front *
            </Text>
          </TouchableOpacity>
          {(formData.cinFront || existingImages.cinFront) ? (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: formData.cinFront || existingImages.cinFront }} 
                style={styles.imagePreview} 
                resizeMode="contain"
              />
            </View>
          ) : (
            <Text style={styles.documentStatus}>No image uploaded</Text>
          )}
        </View>

        <View style={styles.documentItem}>
          <TouchableOpacity 
            style={styles.documentButton}
            onPress={() => handleImagePick('cinBack')}
          >
            <Text style={styles.documentButtonText}>
              Upload CIN Back *
            </Text>
          </TouchableOpacity>
          {(formData.cinBack || existingImages.cinBack) ? (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: formData.cinBack || existingImages.cinBack }} 
                style={styles.imagePreview} 
                resizeMode="contain"
              />
            </View>
          ) : (
            <Text style={styles.documentStatus}>No image uploaded</Text>
          )}
        </View>

        <View style={styles.documentItem}>
          <TouchableOpacity 
            style={styles.documentButton}
            onPress={() => handleImagePick('certificate')}
          >
            <Text style={styles.documentButtonText}>
              Upload Certificate *
            </Text>
          </TouchableOpacity>
          {(formData.certificate || existingImages.certificate) ? (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: formData.certificate || existingImages.certificate }} 
                style={styles.imagePreview} 
                resizeMode="contain"
              />
            </View>
          ) : (
            <Text style={styles.documentStatus}>No image uploaded</Text>
          )}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Terms & Conditions</Text>

      <TouchableOpacity 
        style={styles.termsButton}
        onPress={showTerms}
      >
        <Text style={styles.termsButtonText}>Read Terms & Conditions</Text>
      </TouchableOpacity>

      <View style={styles.checkboxContainer}>
        <Checkbox
          value={formData.termsAccepted}
          onValueChange={(value) => setFormData(prev => ({ ...prev, termsAccepted: value }))}
          color={formData.termsAccepted ? '#64FFDA' : undefined}
          style={styles.checkbox}
        />
        <Text style={styles.checkboxLabel}>I accept the terms and conditions</Text>
      </View>

      <View style={styles.checkboxContainer}>
        <Checkbox
          value={formData.genuineInfoAgreed}
          onValueChange={(value) => setFormData(prev => ({ ...prev, genuineInfoAgreed: value }))}
          color={formData.genuineInfoAgreed ? '#64FFDA' : undefined}
          style={styles.checkbox}
        />
        <Text style={styles.checkboxLabel}>I confirm all information is genuine</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.submitButton,
            (!formData.termsAccepted || !formData.genuineInfoAgreed) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!formData.termsAccepted || !formData.genuineInfoAgreed || loading}
        >
          {loading ? (
            <ActivityIndicator color="#0A192F" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Application</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTermsModal = () => (
    <Modal
      visible={showTermsModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Terms & Conditions</Text>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.modalText}>
              {/* Add your terms and conditions text here */}
              1. By accepting these terms, you agree to provide accurate and truthful information.
              {'\n\n'}
              2. You understand that false information may result in application rejection.
              {'\n\n'}
              3. You agree to maintain professional standards as an advisor.
              {'\n\n'}
              4. Your personal information will be handled according to our privacy policy.
            </Text>
          </ScrollView>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setShowTermsModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: `${params.mode === 'edit' ? 'Update' : 'Create'} Advisor Application (Step ${currentStep}/4)`,
          headerStyle: { backgroundColor: '#0A192F' },
          headerTintColor: '#64FFDA',
        }}
      />
      <ScrollView style={styles.container}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>
      {renderTermsModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#64FFDA',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#8892B0',
    marginBottom: 8,
    fontSize: 16,
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
  documentSection: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#64FFDA',
    marginBottom: 12,
  },
  documentButton: {
    backgroundColor: '#112240',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  documentButtonText: {
    color: '#64FFDA',
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchLabel: {
    color: '#8892B0',
    marginLeft: 10,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#64FFDA',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
    marginLeft: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#1D2D50',
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#0A192F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    backgroundColor: '#1D2D50',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
    marginRight: 10,
  },
  nextButton: {
    backgroundColor: '#64FFDA',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
    marginLeft: 10,
  },
  buttonText: {
    color: '#0A192F',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  termsButton: {
    backgroundColor: '#112240',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  termsButtonText: {
    color: '#64FFDA',
    fontSize: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 25, 47, 0.9)',
  },
  modalContent: {
    backgroundColor: '#112240',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    color: '#64FFDA',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalScroll: {
    marginBottom: 15,
  },
  modalText: {
    color: '#CCD6F6',
    fontSize: 16,
    lineHeight: 24,
  },
  modalCloseButton: {
    backgroundColor: '#64FFDA',
    padding: 12,
    borderRadius: 8,
  },
  modalCloseButtonText: {
    color: '#0A192F',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#112240',
    padding: 15,
    borderRadius: 8,
  },
  checkbox: {
    margin: 8,
    borderRadius: 4,
    borderColor: '#64FFDA',
  },
  checkboxLabel: {
    color: '#8892B0',
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  documentItem: {
    marginBottom: 20,
  },
  documentStatus: {
    color: '#8892B0',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  imagePreviewContainer: {
    marginTop: 10,
    backgroundColor: '#112240',
    borderRadius: 8,
    overflow: 'hidden',
    height: 200,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
}); 