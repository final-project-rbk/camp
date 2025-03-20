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
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { EXPO_PUBLIC_API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();
      console.log('Login response:', result);

      if (result.success) {
        // Make sure we're storing the token properly
        const token = result.data.accessToken;
        console.log('Saving token to AsyncStorage:', token ? 'Token exists' : 'No token');
        
        // Double check that we're using the right token property from the response
        if (!token) {
          console.error('Token not found in response. Response structure:', JSON.stringify(result.data));
          Alert.alert('Login Error', 'Authentication token not found');
          setLoading(false);
          return;
        }
        
        // Store the token in AsyncStorage
        await AsyncStorage.setItem('userToken', token);
        console.log('Token saved to AsyncStorage');
        
        // Store user data if needed
        await AsyncStorage.setItem('userData', JSON.stringify(result.data.user));
        console.log('User data saved to AsyncStorage');
        
        // Ensure onboarding is marked as seen (essential for correct flow)
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        console.log('hasSeenOnboarding marked as true');
        
        // Call signIn from AuthContext to update auth state
        await signIn(token, result.data.user);
        console.log('Auth state updated via signIn');
        
        // Navigate to home screen or app main content
        console.log('Navigating to main app content...');
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('Login Failed', result.error || 'Please check your credentials and try again');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const goToSignup = () => {
    router.push('/signup');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1497906539264-eb74442e37a9?q=80&w=1587&auto=format&fit=crop' }}
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
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>CAMPY</Text>
                <Text style={styles.tagline}>Your Adventure Awaits</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.welcomeText}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#64FFDA" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#8892B0"
                    value={email}
                    onChangeText={setEmail}
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
                    value={password}
                    onChangeText={setPassword}
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

                <TouchableOpacity 
                  style={[
                    styles.button,
                    loading && styles.buttonDisabled
                  ]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#0A192F" size="small" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={20} color="#0A192F" style={styles.buttonIcon} />
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Don't have an account?</Text>
                  <TouchableOpacity onPress={goToSignup}>
                    <Text style={styles.signupLink}>Create Account</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Discover the best camping spots</Text>
              </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signupText: {
    color: '#8892B0',
    fontSize: 15,
  },
  signupLink: {
    color: '#64FFDA',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  }
}); 