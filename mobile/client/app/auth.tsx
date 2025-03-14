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
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { EXPO_PUBLIC_API_URL } from '../config';
import { validatePassword } from '../utils/passwordValidation';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function Auth() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { signIn } = useAuth();

  const handleAuth = async () => {
    try {
      setLoading(true);
      
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
      
      // Prepare request body
      const requestBody = isLogin 
        ? { 
            email: formData.email, 
            password: formData.password 
          }
        : {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            password: formData.password
          };

      console.log('Sending request to:', `${EXPO_PUBLIC_API_URL}auth/${endpoint}`);

      const response = await fetch(`${EXPO_PUBLIC_API_URL}auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (data.success && data.data) {
        // Store auth data using the context
        await signIn(data.data.accessToken || data.data.token, data.data.user);
        router.replace('/home');
      } else {
        Alert.alert('Error', data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Error', 'Connection failed. Please try again.');
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
    } else {
      setPasswordStrength(null);
      setPasswordErrors([]);
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
          onChangeText={handlePasswordChange}
          secureTextEntry
        />

        {formData.password.length > 0 && (
          <View style={styles.passwordFeedback}>
            <View style={styles.strengthIndicator}>
              <Text style={styles.strengthLabel}>Strength:</Text>
              <View style={[
                styles.strengthBar,
                { backgroundColor: getStrengthColor() }
              ]} />
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

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0A192F" />
          ) : (
            <Text style={styles.buttonText}>
              {isLogin ? 'Log In' : 'Sign Up'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
          disabled={loading}
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
  passwordFeedback: {
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
  },
  strengthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLabel: {
    color: '#8892B0',
    marginRight: 8,
  },
  strengthBar: {
    height: 4,
    width: 100,
    borderRadius: 2,
    marginRight: 8,
  },
  strengthText: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  errorList: {
    marginTop: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginBottom: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
}); 