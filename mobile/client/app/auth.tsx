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
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { EXPO_PUBLIC_API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function Auth() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const handleAuth = async () => {
    try {
      // Basic validation
      if (!formData.email || !formData.password) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      if (!isLogin && (!formData.firstName || !formData.lastName)) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const endpoint = isLogin ? 'login' : 'signup';
      
      // Transform the data to match backend expectations
      const requestBody = isLogin 
        ? { 
            email: formData.email, 
            password: formData.password 
          }
        : {
            first_name: formData.firstName,  // Changed to match backend
            last_name: formData.lastName,    // Changed to match backend
            email: formData.email,
            password: formData.password
          };

      console.log('Sending request to:', `${EXPO_PUBLIC_API_URL}auth/${endpoint}`);
      console.log('Request body:', requestBody);

      const response = await fetch(`${EXPO_PUBLIC_API_URL}auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (data.success) {
        // Make sure we're storing both token and user data
        await AsyncStorage.setItem('userToken', data.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.data.user));
        
        console.log('Stored user data:', data.data.user); // Debug log
        console.log('Stored token:', data.data.token); // Debug log
        
        router.replace('/home');
      } else {
        Alert.alert('Error', data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Error', 'Connection failed. Please check your network and try again.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </Text>
        
        {!isLogin && (
          <>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#8892B0"
              value={formData.firstName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="#8892B0"
              value={formData.lastName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
            />
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#8892B0"
          value={formData.email}
          onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8892B0"
          value={formData.password}
          onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.button}
          onPress={handleAuth}
        >
          <Text style={styles.buttonText}>
            {isLogin ? 'Log In' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: '#64FFDA',
    marginBottom: 40,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    color: '#CCD6F6',
    fontSize: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#64FFDA',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#0A192F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
  },
  switchText: {
    color: '#64FFDA',
    fontSize: 14,
  },
}); 