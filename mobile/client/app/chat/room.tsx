import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

const RoomsScreen = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  
  const { accessToken, user } = useAuth();
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  
  // Handle navigation back to marketplace
  const handleBackToMarketplace = () => {
    router.push('/(tabs)/market');
  };
  
  useEffect(() => {
    // Initialize socket connection with auth token and better configuration
    socketRef.current = io(EXPO_PUBLIC_BASE_URL, {
      auth: { token: accessToken },
      query: { token: accessToken },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      forceNew: true
    });

    // Handle connection events
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setError(null);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setError('Connection error: ' + error.message);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socketRef.current?.connect();
      }
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setError(null);
    });

    socketRef.current.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      setError('Unable to reconnect. Please check your connection.');
    });

    // Listen for user status updates
    socketRef.current.on('user_status', ({ userId, status }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (status === 'online') {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    // Listen for new messages
    socketRef.current.on('receive_message', (message) => {
      // Update room with new message
      setRooms(prevRooms => {
        return prevRooms.map(room => {
          if (room.id === message.roomId) {
            return {
              ...room,
              lastMessage: message
            };
          }
          return room;
        });
      });
    });

    fetchRooms();

    return () => {
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
    };
  }, [accessToken]);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(
        `${EXPO_PUBLIC_API_URL}chat/rooms`,
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );
      setRooms(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          setError('Request timed out. Please check your connection.');
        } else if (!error.response) {
          setError('Network error. Please check your connection and make sure the server is running.');
          console.error('Server connection error:', error);
        } else {
          setError('Error loading rooms: ' + error.message);
        }
      } else {
        setError('Error loading rooms');
      }
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const otherUser = item.users.find(u => u.id !== user.id);
    const isOnline = onlineUsers.has(otherUser?.id);
    const lastMessage = item.lastMessage;

    return (
      <TouchableOpacity
        style={styles.roomItem}
        onPress={() => router.push({
          pathname: `/chat/${item.id}`,
          params: {
            roomId: item.id,
            isNew: false
          }
        })}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{ 
              uri: otherUser?.profile_image || 'https://via.placeholder.com/50?text=User'
            }}
            style={styles.avatar}
          />
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.roomInfo}>
          <Text style={styles.userName}>
            {otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : 'Unknown User'}
          </Text>
          {lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage.content || 'Sent an image'}
            </Text>
          )}
        </View>

        {lastMessage && (
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {new Date(lastMessage.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            {!lastMessage.isRead && lastMessage.senderId !== user.id && (
              <View style={styles.unreadIndicator} />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#64FFDA" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackToMarketplace}
        >
          <Ionicons name="arrow-back" size={24} color="#64FFDA" />
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
      </View>

      {rooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={48} color="#64FFDA" />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>
            Start a conversation from the marketplace
          </Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A192F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1D2D50',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginLeft: 32,
  },
  listContainer: {
    paddingVertical: 8,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1D2D50',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1D2D50',
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#64FFDA',
    borderWidth: 2,
    borderColor: '#0A192F',
  },
  roomInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCD6F6',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#8892B0',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: '#8892B0',
    marginBottom: 4,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64FFDA',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#CCD6F6',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8892B0',
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
});

export default RoomsScreen;
