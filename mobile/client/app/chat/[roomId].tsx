import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { io,Socket } from 'socket.io-client';
import { EXPO_PUBLIC_API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useLocalSearchParams, useRouter } from 'expo-router';

const MessagesScreen = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const { accessToken, user } = useAuth();
  const { roomId, isNewRoom } = useLocalSearchParams();
  const router = useRouter();
  
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef(null);

  const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dqh6arave/upload";
  const CLOUDINARY_UPLOAD_PRESET = "Ghassen123";

  // Handle back button press
  const handleBackPress = () => {
    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }
    router.back();
  };

  useEffect(() => {
    if (!roomId) return;

    console.log('Starting chat with roomId:', roomId);
    
    // First validate that the room exists
    const validateRoom = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${EXPO_PUBLIC_API_URL}chat/rooms/${roomId}/validate`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 5000
          }
        );
        
        if (!response.data.exists) {
          setError('This chat room no longer exists');
          Alert.alert(
            'Chat Room Error',
            'This chat room no longer exists. Would you like to go back to your chats?',
            [
              {
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Go to My Chats',
                onPress: () => router.replace('/chat/room')
              }
            ]
          );
          setLoading(false);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Error validating room:', error);
        return true; // Continue anyway and let socket connection handle errors
      }
    };
    
    // Connect to socket after validating room
    validateRoom().then(isValid => {
      if (!isValid) return;
      
      // Initialize socket connection with auth token and better configuration
      socketRef.current = io(EXPO_PUBLIC_API_URL.replace('/api', ''), {
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
        
        // Make sure roomId is a string for socket.io rooms
        const roomIdStr = roomId.toString();
        console.log('Joining room:', roomIdStr);
        
        // Join the room
        socketRef.current?.emit('join_room', roomIdStr);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setError('Connection error: ' + error.message);
      });

      // Handle room join confirmation
      socketRef.current.on('user_joined', (data) => {
        console.log('User joined room:', data);
        // If this is a new room, send a welcome message
        if (isNewRoom === '1') {
          sendMessage('👋 Hi! I\'m interested in your item.');
        }
      });

      // Handle room errors
      socketRef.current.on('room_error', (data) => {
        console.error('Room error:', data.message);
        setError('Chat room error: ' + data.message);
        
        if (data.message.includes('does not exist')) {
          // Show alert with navigation option
          Alert.alert(
            'Chat Room Error',
            'This chat room no longer exists. Would you like to go back to your chats?',
            [
              {
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Go to My Chats',
                onPress: () => router.replace('/chat/room')
              }
            ]
          );
        } else {
          Alert.alert('Chat Error', data.message);
        }
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
        
        // Rejoin room after reconnection with string roomId
        socketRef.current?.emit('join_room', roomId.toString());
      });

      socketRef.current.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error);
        setError('Unable to reconnect to chat. Please check your connection.');
      });

      // Listen for new messages
      socketRef.current.on('receive_message', (message) => {
        setMessages(prev => [...prev, message]);
        flatListRef.current?.scrollToEnd();
        
        // Mark message as read if it's not from current user
        if (message.senderId !== user?.id) {
          socketRef.current?.emit('message_read', {
            messageId: message.id,
            roomId
          });
        }
      });

      // Listen for typing status
      socketRef.current.on('typing_status', ({ user: typingUser, isTyping }) => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(typingUser.first_name);
          } else {
            newSet.delete(typingUser.first_name);
          }
          return newSet;
        });
      });

      // Fetch initial messages
      fetchMessages();

      return () => {
        if (socketRef.current?.connected) {
          socketRef.current.disconnect();
        }
      };
    });
  }, [roomId, accessToken]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(
        `${EXPO_PUBLIC_API_URL}chat/rooms/${roomId}/messages`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000 // 10 second timeout
        }
      );
      setMessages(response.data);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          setError('Request timed out. Please check your connection.');
        } else if (!error.response) {
          setError('Network error. Please check your connection.');
        } else {
          setError('Error loading messages: ' + error.message);
        }
      } else {
        setError('Error loading messages');
      }
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content = null) => {
    try {
      const messageText = content || newMessage.trim();
      
      // Check if there's any content to send (text or media)
      if (!messageText && (!mediaUrls || mediaUrls.length === 0)) {
        console.log('Nothing to send - no message text or media');
        return;
      }
      
      if (!socketRef.current?.connected) {
        setError('Not connected to chat server. Please try again.');
        return;
      }

      // Make sure roomId is a string for socket.io
      const roomIdStr = roomId.toString();
      console.log(`Sending message to room ${roomIdStr}: ${messageText?.substring(0, 20)}..., Media: ${mediaUrls?.length || 0} files`);
      
      const messageData = {
        roomId: roomIdStr,
        message: messageText,
        mediaUrls: mediaUrls || []
      };

      // Send message with acknowledgment
      socketRef.current.emit('send_message', messageData, (response) => {
        if (!response.success) {
          console.error('Failed to send message:', response.error);
          setError('Failed to send message: ' + response.error);
          Alert.alert('Error', response.error);
        } else {
          console.log('Message sent successfully');
          
          // Clear message input and media URLs after sending
          setNewMessage('');
          setMediaUrls([]);
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error sending message:', errorMessage);
      setError('Error sending message: ' + errorMessage);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      const compressedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const formData = new FormData();
      formData.append('file', {
        uri: compressedImage.uri,
        type: 'image/jpeg',
        name: `upload_${Date.now()}.jpg`,
      } as any);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      // Show loading state
      setLoading(true);

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      if (!data.secure_url) {
        throw new Error('Failed to upload image');
      }

      // Add the uploaded image URL to the media URLs array
      const newImageUrl = data.secure_url;
      setMediaUrls([newImageUrl]);
      
      // Clear loading state
      setLoading(false);
      
      // Show the image preview, but don't send automatically
      console.log('Image uploaded successfully:', newImageUrl);
    } catch (error) {
      setError('Error uploading image');
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again later.');
      setLoading(false);
    }
  };

  const handleTyping = (text) => {
    setNewMessage(text);
    
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', { roomId });
      
      // Stop typing indicator after 2 seconds of no input
      setTimeout(() => {
        setIsTyping(false);
        socketRef.current.emit('stop_typing', { roomId });
      }, 2000);
    }
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === user.id;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {!isOwnMessage && (
          <Image
            source={{ uri: item.user?.profile_image || 'https://via.placeholder.com/30' }}
            style={styles.avatar}
          />
        )}
        <View style={[
          styles.messageContent,
          isOwnMessage ? styles.ownMessageContent : styles.otherMessageContent
        ]}>
          {/* Display media if available */}
          {Array.isArray(item.mediaUrls) && item.mediaUrls.length > 0 && 
            item.mediaUrls.map((url, index) => (
              <Image
                key={index}
                source={{ uri: url }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            ))
          }
          {item.content && (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
          )}
          <Text style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#64FFDA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color="#64FFDA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />
      
      {typingUsers.size > 0 && (
        <Text style={styles.typingIndicator}>
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </Text>
      )}

      {mediaUrls.length > 0 && (
        <View style={styles.mediaPreviewContainer}>
          {mediaUrls.map((url, index) => (
            <View key={index} style={styles.mediaPreview}>
              <Image source={{ uri: url }} style={styles.mediaPreviewImage} />
              <TouchableOpacity 
                style={styles.removeMediaButton}
                onPress={() => setMediaUrls(prev => prev.filter((_, i) => i !== index))}
              >
                <Ionicons name="close-circle" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.attachButton}>
          <Ionicons name="image-outline" size={24} color="#64FFDA" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          placeholderTextColor="#8892B0"
          multiline
        />
        
        <TouchableOpacity 
          onPress={() => sendMessage()}
          style={styles.sendButton}
          disabled={!newMessage.trim() && mediaUrls.length === 0}
        >
          <Ionicons 
            name="send" 
            size={24} 
            color={(newMessage.trim() || mediaUrls.length > 0) ? "#64FFDA" : "#8892B0"} 
          />
        </TouchableOpacity>
      </View>
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
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '70%',
    borderRadius: 16,
    padding: 12,
  },
  ownMessageContent: {
    backgroundColor: '#64FFDA',
    borderBottomRightRadius: 4,
  },
  otherMessageContent: {
    backgroundColor: '#112240',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: '#0A192F',
  },
  otherMessageText: {
    color: '#CCD6F6',
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#8892B0',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#112240',
    borderTopWidth: 1,
    borderTopColor: '#1D2D50',
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    padding: 8,
    maxHeight: 100,
    color: '#CCD6F6',
    fontSize: 16,
    backgroundColor: '#1D2D50',
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  sendButton: {
    padding: 8,
  },
  typingIndicator: {
    color: '#8892B0',
    fontSize: 12,
    padding: 8,
    paddingLeft: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  mediaPreviewContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#112240',
  },
  mediaPreview: {
    position: 'relative',
    marginRight: 8,
  },
  mediaPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0A192F',
    borderRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#112240',
    borderBottomWidth: 1,
    borderBottomColor: '#1D2D50',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginLeft: 8,
  },
});

export default MessagesScreen;
