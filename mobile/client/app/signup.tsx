import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { EXPO_PUBLIC_API_URL } from '../config';
import { validatePassword } from '../utils/passwordValidation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function SignupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: '',
  });
  
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleSignup = async () => {
    try {
      // Dismiss keyboard
      Keyboard.dismiss();
      
      setLoading(true);
      
      // Basic validation
      if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
        Alert.alert('Missing Information', 'Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Password Error', 'Passwords do not match');
        setLoading(false);
        return;
      }
      
      if (!termsAccepted) {
        Alert.alert('Terms & Conditions', 'Please accept the terms and privacy policy to continue');
        setLoading(false);
        return;
      }
      
      // Validate password strength
      const validation = validatePassword(formData.password);
      if (!validation.isValid) {
        Alert.alert('Weak Password', 'Please create a stronger password');
        setLoading(false);
        return;
      }

      const response = await fetch(`${EXPO_PUBLIC_API_URL}auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Ensure onboarding is marked as seen
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        
        // Show success message and navigate to login
        Alert.alert(
          'Account Created!',
          'Welcome to Campy! Your account has been created successfully.',
          [{ text: 'Continue to Login', onPress: () => router.replace('/auth') }]
        );
      } else {
        console.error('Signup failed:', data.error);
        Alert.alert('Registration Error', data.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Connection Error', 'Unable to connect to the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (text: string) => {
    setFormData(prev => ({ ...prev, password: text }));
    
    if (text.length > 0) {
      const validation = validatePassword(text);
      setPasswordStrength(validation.strength);
      setPasswordErrors(validation.errors);
      
      // Check confirm password match if it exists
      if (formData.confirmPassword) {
        if (text !== formData.confirmPassword) {
          setConfirmError('Passwords do not match');
        } else {
          setConfirmError(null);
        }
      }
    } else {
      setPasswordStrength(null);
      setPasswordErrors([]);
    }
  };
  
  const handleConfirmPasswordChange = (text: string) => {
    setFormData(prev => ({ ...prev, confirmPassword: text }));
    
    if (text.length > 0) {
      if (text !== formData.password) {
        setConfirmError('Passwords do not match');
      } else {
        setConfirmError(null);
      }
    } else {
      setConfirmError(null);
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'strong': return '#64FFDA';
      case 'medium': return '#FFB347';
      case 'weak': return '#FF6B6B';
      default: return '#8892B0';
    }
  };
  
  const getStrengthWidth = () => {
    switch (passwordStrength) {
      case 'strong': return '100%';
      case 'medium': return '66%';
      case 'weak': return '33%';
      default: return '10%';
    }
  };

  const goToLogin = () => {
    router.replace('/auth');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?q=80&w=1470&auto=format&fit=crop' }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(10, 25, 47, 0.7)', 'rgba(10, 25, 47, 0.95)']}
            style={styles.gradient}
          >
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.formContainer}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <View style={styles.logoContainer}>
                  <Text style={styles.logoText}>CAMPY</Text>
                  <Text style={styles.tagline}>Begin Your Journey</Text>
                </View>

                <View style={styles.card}>
                  <Text style={styles.welcomeText}>Create Account</Text>
                  <Text style={styles.subtitle}>Join the adventure community</Text>

                  <View style={styles.nameContainer}>
                    <View style={[styles.inputWrapper, styles.halfInput]}>
                      <Ionicons name="person-outline" size={20} color="#64FFDA" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="First Name"
                        placeholderTextColor="#8892B0"
                        value={formData.firstName}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                      />
                    </View>
                    <View style={[styles.inputWrapper, styles.halfInput]}>
                      <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        placeholderTextColor="#8892B0"
                        value={formData.lastName}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                      />
                    </View>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#64FFDA" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email Address"
                      placeholderTextColor="#8892B0"
                      value={formData.email}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#64FFDA" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Password"
                      placeholderTextColor="#8892B0"
                      value={formData.password}
                      onChangeText={handlePasswordChange}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity 
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={22} 
                        color="#64FFDA" 
                      />
                    </TouchableOpacity>
                  </View>

                  {formData.password.length > 0 && (
                    <View style={styles.passwordFeedback}>
                      <View style={styles.strengthIndicator}>
                        <Text style={styles.strengthLabel}>Password Strength:</Text>
                        <View style={styles.strengthBarContainer}>
                          <View 
                            style={[
                              styles.strengthBar,
                              { width: getStrengthWidth(), backgroundColor: getStrengthColor() }
                            ]} 
                          />
                        </View>
                        <Text style={[
                          styles.strengthText,
                          { color: getStrengthColor() }
                        ]}>
                          {passwordStrength || 'weak'}
                        </Text>
                      </View>
                      {passwordErrors.length > 0 && (
                        <View style={styles.errorList}>
                          {passwordErrors.map((error, index) => (
                            <Text key={index} style={styles.errorText}>
                              • {error}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#64FFDA" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Confirm Password"
                      placeholderTextColor="#8892B0"
                      value={formData.confirmPassword}
                      onChangeText={handleConfirmPasswordChange}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity 
                      style={styles.eyeIcon}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons 
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                        size={22} 
                        color="#64FFDA" 
                      />
                    </TouchableOpacity>
                  </View>

                  {confirmError && (
                    <Text style={styles.errorText}>{confirmError}</Text>
                  )}

                  <View style={styles.termsContainer}>
                    <TouchableOpacity 
                      style={styles.checkboxContainer}
                      onPress={() => setTermsAccepted(!termsAccepted)}
                    >
                      <View style={[
                        styles.checkbox,
                        termsAccepted && styles.checkboxChecked
                      ]}>
                        {termsAccepted && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                      </View>
                      <Text style={styles.termsText}>
                        I agree to the{' '}
                        <Text style={styles.termsLink}>Terms & Privacy Policy</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    style={[
                      styles.button,
                      loading && styles.buttonDisabled
                    ]}
                    onPress={handleSignup}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#0A192F" size="small" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Create Account</Text>
                        <Ionicons name="arrow-forward" size={20} color="#0A192F" style={styles.buttonIcon} />
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Already have an account?</Text>
                    <TouchableOpacity onPress={goToLogin}>
                      <Text style={styles.loginLink}>Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </LinearGradient>
        </ImageBackground>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    flex: 1,
    width: width * 0.9,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  tagline: {
    color: '#64FFDA',
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 1,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(17, 34, 64, 0.9)',
    borderRadius: 20,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
    backdropFilter: 'blur(10px)',
  },
  welcomeText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8892B0',
    marginBottom: 30,
    textAlign: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  halfInput: {
    width: '48%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.3)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    color: '#FFFFFF',
    fontSize: 16,
  },
  passwordInput: {
    paddingRight: 40, // Space for the eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  passwordFeedback: {
    width: '100%',
    marginTop: -5,
    marginBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 10,
  },
  strengthIndicator: {
    marginBottom: 8,
  },
  strengthLabel: {
    color: '#8892B0',
    marginBottom: 5,
    fontSize: 13,
  },
  strengthBarContainer: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginBottom: 5,
  },
  strengthBar: {
    height: '100%',
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 13,
    textTransform: 'capitalize',
    fontWeight: 'bold',
  },
  errorList: {
    marginTop: 5,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginBottom: 4,
  },
  termsContainer: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#64FFDA',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#64FFDA',
  },
  termsText: {
    color: '#CCD6F6',
    fontSize: 14,
    flex: 1,
  },
  termsLink: {
    color: '#64FFDA',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#64FFDA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#64FFDA",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#0A192F',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#8892B0',
    fontSize: 15,
  },
  loginLink: {
    color: '#64FFDA',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  }
}); 