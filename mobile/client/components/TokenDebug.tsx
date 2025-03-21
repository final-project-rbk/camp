import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

export default function TokenDebug() {
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setTokenInfo({ 
            status: 'valid', 
            token: token.substring(0, 15) + '...', 
            decoded 
          });
        } catch (e) {
          setTokenInfo({ 
            status: 'invalid', 
            token: token.substring(0, 15) + '...',
            error: (e as Error).message 
          });
        }
      } else {
        setTokenInfo({ status: 'none' });
      }
    } catch (e: unknown) {
      setTokenInfo({ status: 'error', error: (e as Error).message });
    }
  };

  useEffect(() => {
    checkToken();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Token Status</Text>
      <Text style={styles.info}>
        {tokenInfo ? JSON.stringify(tokenInfo, null, 2) : 'Checking...'}
      </Text>
      <Button title="Refresh Token Info" onPress={checkToken} />
      <Button 
        title="Clear Token" 
        onPress={async () => {
          await AsyncStorage.removeItem('userToken');
          checkToken();
        }} 
        color="#FF6B6B" 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 10,
    borderRadius: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#64FFDA',
  },
  info: {
    fontFamily: 'monospace',
    color: '#CCD6F6',
  },
}); 