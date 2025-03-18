import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { Colors } from '../../constants/Colors';
import { EXPO_PUBLIC_API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

const RoomsScreen = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { accessToken, user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get(`${EXPO_PUBLIC_API_URL}chat/rooms`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setRooms(response.data);
      } catch (error) {
        setError('Error fetching rooms');
        console.error('Error fetching rooms:', error);
      } finally {
        setLoading(false);
      }
    };
    if (accessToken) fetchRooms();
  }, [accessToken]);

  const renderItem = ({ item }) => {
    const otherUser = item.users.find(u => u.id !== user.id);
    return (
      <TouchableOpacity
        style={styles.roomItem}
        onPress={() => router.push({
          pathname: `/chat/${item.id}`,
          params: { roomId: item.id }
        } as any)}
      >
        <Text style={styles.roomName}>{otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : 'Unknown User'}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color={Colors.primary} />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 10
  },
  roomItem: {
    padding: 15,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    marginVertical: 5
  },
  roomName: {
    color: Colors.white,
    fontSize: 18
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20
  }
});

export default RoomsScreen;
