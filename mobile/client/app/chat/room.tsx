import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, TextInput, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

// Tab options
const TABS = {
  ALL: 'All',
  UNREAD: 'Unread',
  ARCHIVED: 'Archived'
};

const RoomsScreen = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(TABS.ALL);
  
  // Animation values
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
  
  const { accessToken, user } = useAuth();
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  
  useEffect(() => {
    // Update filtered rooms when rooms, search, or tab changes
    let results = [...rooms];
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(room => {
        const otherUser = room.users.find(u => u.id !== user.id);
        const fullName = `${otherUser?.first_name || ''} ${otherUser?.last_name || ''}`.toLowerCase();
        return fullName.includes(query);
      });
    }
    
    // Filter by tab
    if (activeTab === TABS.UNREAD) {
      results = results.filter(room => 
        room.lastMessage && !room.lastMessage.isRead && room.lastMessage.senderId !== user.id
      );
    } else if (activeTab === TABS.ARCHIVED) {
      // Implement archive functionality if available
      results = results.filter(room => room.isArchived);
    }
    
    setFilteredRooms(results);
  }, [rooms, searchQuery, activeTab]);
  
  // Handle tab change with animation
  const handleTabChange = (tab: string) => {
    // Calculate new position based on tab index
    const position = Object.values(TABS).indexOf(tab) * (100 / Object.keys(TABS).length);
    
    // Animate the tab indicator
    Animated.spring(tabIndicatorPosition, {
      toValue: position,
      useNativeDriver: false,
      speed: 12,
      bounciness: 8
    }).start();
    
    setActiveTab(tab);
  };
  
  useEffect(() => {
    console.log('Initializing chat room socket connection with token:', accessToken ? 'token-present' : 'no-token');
    
    // Add debugging logs
    console.log('EXPO_PUBLIC_BASE_URL:', EXPO_PUBLIC_BASE_URL);
    console.log('EXPO_PUBLIC_API_URL:', EXPO_PUBLIC_API_URL);
    
    // Extract base URL for socket connection - prefer EXPO_PUBLIC_BASE_URL if defined
    const socketUrl = EXPO_PUBLIC_BASE_URL || EXPO_PUBLIC_API_URL.replace('/api', '');
    console.log('Socket URL to connect:', socketUrl);
    
    // Initialize socket connection with auth token and better configuration
    try {
      socketRef.current = io(socketUrl, {
      auth: { token: accessToken },
      query: { token: accessToken },
      transports: ['websocket', 'polling'],
        timeout: 15000, // Increased timeout
      reconnection: true,
        reconnectionAttempts: 10, // More attempts
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
        forceNew: true,
        autoConnect: true,
        secure: false, // Set to false for local development
        rejectUnauthorized: false, // For development with self-signed certificates
      });
      
      console.log('Socket initialization attempt completed');
    } catch (error) {
      console.error('Error initializing socket:', error);
      setError('Failed to initialize chat connection: ' + (error.message || 'Unknown error'));
    }

    // Handle connection events
    if (socketRef.current) {
    socketRef.current.on('connect', () => {
        console.log('Socket connected successfully');
      setError(null);
    });

    socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message, error);
      setError('Connection error: ' + error.message);
    });
    }

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
      console.log('Cleaning up socket connection');
      if (socketRef.current) {
        // Remove all listeners to prevent memory leaks
        socketRef.current.removeAllListeners();
        
        // Check if connected before disconnecting
        if (socketRef.current.connected) {
          console.log('Disconnecting socket');
        socketRef.current.disconnect();
        }
        
        // Clear the reference
        socketRef.current = null;
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

  // Format timestamp relative to current time
  const formatMessageTime = (timestamp: string) => {
    if (!timestamp) return '';
    
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHour / 24);
    
    // Less than a minute
    if (diffSec < 60) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diffMin < 60) {
      return `${diffMin}m ago`;
    }
    
    // Less than 24 hours
    if (diffHour < 24) {
      return `${diffHour}h ago`;
    }
    
    // Less than 7 days
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    
    // More than 7 days - just show date
    return messageDate.toLocaleDateString();
  };

  const renderItem = ({ item }) => {
    const otherUser = item.users.find(u => u.id !== user.id);
    const isOnline = onlineUsers.has(otherUser?.id);
    const lastMessage = item.lastMessage;
    const hasUnread = lastMessage && !lastMessage.isRead && lastMessage.senderId !== user.id;

    return (
      <TouchableOpacity
        style={[styles.roomItem, hasUnread && styles.unreadRoomItem]}
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
          <View style={styles.roomHeader}>
            <Text style={[styles.userName, hasUnread && styles.unreadUserName]}>
            {otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : 'Unknown User'}
          </Text>
          {lastMessage && (
              <Text style={styles.timeText}>
                {formatMessageTime(lastMessage.createdAt)}
            </Text>
          )}
        </View>

          <View style={styles.messagePreviewContainer}>
        {lastMessage && (
              <Text style={[styles.lastMessage, hasUnread && styles.unreadMessage]} numberOfLines={1}>
                {lastMessage.content || 'Sent an image'}
            </Text>
            )}
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>New</Text>
              </View>
            )}
          </View>
        </View>
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
          onPress={() => router.push('/(tabs)/market')}
        >
          <Ionicons name="arrow-back" size={24} color="#64FFDA" />
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8892B0" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search conversations..."
          placeholderTextColor="#8892B0"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#8892B0" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Filters */}
      <View style={styles.tabContainer}>
        {Object.values(TABS).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => handleTabChange(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText
              ]}
            >
              {tab}
              {tab === TABS.UNREAD && (
                <Text style={styles.unreadCount}>
                  {' '}({rooms.filter(r => r.lastMessage && !r.lastMessage.isRead && r.lastMessage.senderId !== user.id).length})
                </Text>
              )}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* Animated Tab Indicator */}
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              width: `${100 / Object.keys(TABS).length}%`,
              left: tabIndicatorPosition.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {filteredRooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          {searchQuery ? (
            <>
              <Ionicons name="search" size={48} color="#64FFDA" />
              <Text style={styles.emptyText}>No matching conversations</Text>
            </>
          ) : activeTab === TABS.UNREAD ? (
            <>
              <Ionicons name="checkmark-done-outline" size={48} color="#64FFDA" />
              <Text style={styles.emptyText}>No unread messages</Text>
            </>
          ) : (
            <>
          <Ionicons name="chatbubbles-outline" size={48} color="#64FFDA" />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>
            Start a conversation from the marketplace
          </Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#112240',
    margin: 12,
    borderRadius: 10,
    padding: 10,
  },
  searchIcon: {
    marginHorizontal: 8,
  },
  searchInput: {
    flex: 1,
    color: '#CCD6F6',
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#112240',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    color: '#8892B0',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#64FFDA',
    fontWeight: '700',
  },
  unreadCount: {
    color: '#64FFDA',
    fontSize: 14,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: '#64FFDA',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  listContainer: {
    paddingBottom: 12,
  },
  roomItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#0A192F',
    borderBottomWidth: 1,
    borderBottomColor: '#1D2D50',
  },
  unreadRoomItem: {
    backgroundColor: 'rgba(100, 255, 218, 0.05)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1D2D50',
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#64FFDA',
    borderWidth: 2,
    borderColor: '#0A192F',
  },
  roomInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCD6F6',
  },
  unreadUserName: {
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    color: '#8892B0',
  },
  messagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#8892B0',
    flex: 1,
  },
  unreadMessage: {
    color: '#CCD6F6',
  },
  unreadBadge: {
    backgroundColor: '#64FFDA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  unreadBadgeText: {
    fontSize: 10,
    color: '#0A192F',
    fontWeight: '700',
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
