import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  Image, 
  Modal, 
  Pressable, 
  Vibration,
  StatusBar,
  Animated,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Message reaction options
const REACTIONS = {
  LIKE: { emoji: '👍', name: 'like' },
  LOVE: { emoji: '❤️', name: 'love' },
  LAUGH: { emoji: '😂', name: 'laugh' },
  SURPRISED: { emoji: '😮', name: 'surprised' },
  SAD: { emoji: '😢', name: 'sad' },
  ANGRY: { emoji: '😡', name: 'angry' },
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MESSAGE_BUBBLE_MAX_WIDTH = SCREEN_WIDTH * 0.75;

const DEFAULT_AVATAR = 'https://via.placeholder.com/30?text=User';

const MessagesScreen = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [currentImageView, setCurrentImageView] = useState('');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [reactionModalVisible, setReactionModalVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [attachmentsVisible, setAttachmentsVisible] = useState(false);
  
  const { accessToken, user } = useAuth();
  const { roomId, isNewRoom } = useLocalSearchParams();
  const router = useRouter();
  
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dqh6arave/upload";
  const CLOUDINARY_UPLOAD_PRESET = "Ghassen123";

  // Animation values for typing dots
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;
  
  // Setup typing animation
  useEffect(() => {
    if (typingUsers.size > 0) {
      // Create typing animation sequence
      const animateDots = () => {
        Animated.sequence([
          // Dot 1 animation
          Animated.timing(dot1Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          // Dot 2 animation with a slight delay
          Animated.timing(dot2Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          // Dot 3 animation with a slight delay
          Animated.timing(dot3Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          // Reset all dots
          Animated.parallel([
            Animated.timing(dot1Opacity, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot2Opacity, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot3Opacity, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          if (typingUsers.size > 0) {
            animateDots(); // Loop animation while typing
          }
        });
      };
      
      animateDots();
    }
  }, [typingUsers.size]);

  // Handle showing full-sized image
  const handleViewImage = (imageUrl: string) => {
    setCurrentImageView(imageUrl);
    setImageModalVisible(true);
  };
  
  // Handle message long press for reactions
  const handleMessageLongPress = (messageId: string) => {
    Vibration.vibrate(50); // Short vibration for feedback
    setSelectedMessageId(messageId);
    setReactionModalVisible(true);
  };
  
  // Handle adding a reaction to a message
  const handleAddReaction = (reaction: string) => {
    // Here you would implement the logic to send the reaction to the server
    // For now we'll just close the modal
    setReactionModalVisible(false);
    
    // Simulate adding reaction locally
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === selectedMessageId 
          ? {...msg, reaction} 
          : msg
      )
    );
    
    // You would emit this to the server in a real implementation
    if (socketRef.current?.connected) {
      socketRef.current.emit('add_reaction', {
        messageId: selectedMessageId,
        reaction,
        roomId
      });
    }
  };

  // Handle reply to message
  const handleReplyToMessage = (message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Handle back button press
  const handleBackPress = () => {
    console.log('Handling back button press, cleaning up socket');
    if (socketRef.current) {
      // Remove all listeners to prevent memory leaks
      socketRef.current.removeAllListeners();
      
      // Check if connected before disconnecting
      if (socketRef.current.connected) {
        console.log('Disconnecting socket on back press');
      socketRef.current.disconnect();
      }
      
      // Clear the reference
      socketRef.current = null;
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

      // Handle connection events with added checks
      if (socketRef.current) {
      socketRef.current.on('connect', () => {
          console.log('Socket connected successfully');
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
      }
    });

    // Extract the other user in the conversation
    const getOtherUser = async () => {
      try {
        const response = await axios.get(
          `${EXPO_PUBLIC_API_URL}chat/rooms/${roomId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
        
        if (response.data && response.data.users) {
          const otherUserData = response.data.users.find(u => u.id !== user.id);
          setOtherUser(otherUserData);
        }
      } catch (error) {
        console.error('Error getting room users:', error);
      }
    };
    
    getOtherUser();
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

  const sendMessage = async (content: string | null = null) => {
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
      const roomIdStr = typeof roomId === 'string' ? roomId : String(roomId);
      console.log(`Sending message to room ${roomIdStr}: ${messageText?.substring(0, 20)}..., Media: ${mediaUrls?.length || 0} files`);
      
      const messageData = {
        roomId: roomIdStr,
        message: messageText,
        mediaUrls: mediaUrls || [],
        replyToId: replyingTo?.id || null
      };

      // Send message with acknowledgment
      socketRef.current.emit('send_message', messageData, (response: {success: boolean, error?: string}) => {
        if (!response.success) {
          console.error('Failed to send message:', response.error);
          setError('Failed to send message: ' + response.error);
          Alert.alert('Error', response.error);
        } else {
          console.log('Message sent successfully');
          
          // Clear message input, media URLs, and reply after sending
          setNewMessage('');
          setMediaUrls([]);
          setReplyingTo(null);
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
    setAttachmentsVisible(false);
    
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

  const uploadImage = async (uri: string) => {
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

  const handleTyping = (text: string) => {
    setNewMessage(text);
    
    // Clear any existing typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Emit typing event once
    if (!isTyping && socketRef.current?.connected) {
      setIsTyping(true);
      socketRef.current.emit('typing', { roomId });
    }
      
    // Set timeout to stop typing indicator after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && socketRef.current?.connected) {
        setIsTyping(false);
        socketRef.current.emit('stop_typing', { roomId });
      }
    }, 2000);
  };
  
  // Format message timestamp
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const messageTime = new Date(timestamp);
    return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get message delivery status
  const getMessageStatus = (message) => {
    if (!message) return null;
    
    if (message.isRead) {
      return (
        <View style={styles.readStatus}>
          <MaterialCommunityIcons name="check-all" size={16} color="#64FFDA" />
        </View>
      );
    } else if (message.senderId === user?.id) {
      return (
        <View style={styles.sentStatus}>
          <MaterialCommunityIcons name="check" size={16} color="#8892B0" />
        </View>
      );
    }
    
    return null;
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === user?.id;

    if (isOwnMessage) {
      // Own message - right aligned blue gradient bubble (YOUR MESSAGES)
      return (
        <TouchableOpacity 
          activeOpacity={0.8}
          onLongPress={() => handleMessageLongPress(item.id)}
          style={styles.messageRow}
        >
          <View style={styles.ownMessageContainer}>
            <LinearGradient
              colors={['#0084FF', '#0078FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ownMessageContent}
            >
              {/* Message text content */}
              {item.content && (
                <Text style={styles.ownMessageText}>
                  {item.content}
                </Text>
              )}
              
              {/* Display media if available */}
              {Array.isArray(item.mediaUrls) && item.mediaUrls.length > 0 && 
                item.mediaUrls.map((url, index) => (
                  <TouchableOpacity
                    key={`media-${item.id || index}-${index}`}
                    activeOpacity={0.9}
                    onPress={() => handleViewImage(url)}
                  >
                    <Image
                      source={{ uri: url }}
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))
              }
              
              {/* Message delivery status */}
              {getMessageStatus(item)}
            </LinearGradient>
            <Text style={styles.timestamp}>
              {formatMessageTime(item.createdAt)}
            </Text>
            
            {/* Show reaction if any */}
            {item.reaction && (
              <View style={[styles.reactionContainer, styles.ownReactionContainer]}>
                <Text>{REACTIONS[item.reaction.toUpperCase()]?.emoji || '👍'}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    } else {
      // Other user's message - left aligned gray bubble (THEIR MESSAGES)
      return (
        <TouchableOpacity 
          activeOpacity={0.8}
          onLongPress={() => handleMessageLongPress(item.id)}
          style={styles.messageRow}
        >
          <View style={styles.otherMessageContainer}>
            <Image
              source={{ uri: otherUser?.profile_image || 'https://via.placeholder.com/30' }}
              style={styles.avatar}
            />
            <View>
              <View style={styles.otherMessageContent}>
                {/* Message text content */}
                {item.content && (
                  <Text style={styles.otherMessageText}>
                    {item.content}
                  </Text>
                )}
                
                {/* Display media if available */}
                {Array.isArray(item.mediaUrls) && item.mediaUrls.length > 0 && 
                  item.mediaUrls.map((url, index) => (
                    <TouchableOpacity
                      key={`media-${item.id || index}-${index}`}
                      activeOpacity={0.9}
                      onPress={() => handleViewImage(url)}
                    >
                      <Image
                        source={{ uri: url }}
                        style={styles.messageImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))
                }
              </View>
              <Text style={styles.timestamp}>
                {formatMessageTime(item.createdAt)}
              </Text>
              
              {/* Show reaction if any */}
              {item.reaction && (
                <View style={[styles.reactionContainer, styles.otherReactionContainer]}>
                  <Text>{REACTIONS[item.reaction.toUpperCase()]?.emoji || '👍'}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    }
  };

  // Generate a message date header when date changes
  const renderMessageDateHeader = ({ item, index }) => {
    if (index === 0) {
      return (
        <View style={styles.dateHeader}>
          <Text style={styles.dateHeaderText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      );
    }
    
    const prevMessage = messages[index - 1];
    const prevDate = new Date(prevMessage.createdAt).toDateString();
    const currentDate = new Date(item.createdAt).toDateString();
    
    if (prevDate !== currentDate) {
      return (
        <View style={styles.dateHeader}>
          <Text style={styles.dateHeaderText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      );
    }
    
    return null;
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
      <StatusBar barStyle="light-content" />
      {/* Chat Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color="#64FFDA" />
        </TouchableOpacity>
        
        {otherUser && (
          <TouchableOpacity 
            style={styles.headerUserInfo}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: otherUser.profile_image || DEFAULT_AVATAR }}
                style={styles.headerAvatar}
              />
              {otherUser.isOnline && (
                <View style={styles.onlineIndicator} />
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.headerTitle}>
                {otherUser.first_name} {otherUser.last_name}
              </Text>
              {typingUsers.size > 0 ? (
                <Text style={styles.typingStatus}>typing...</Text>
              ) : (
                <Text style={styles.onlineStatus}>
                  {otherUser.isOnline ? 'Online' : 'Last seen recently'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderMessage}
        ListHeaderComponent={<View style={styles.messageListPadding} />}
        ListFooterComponent={<View style={styles.messageListPadding} />}
        onContentSizeChange={() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({animated: true});
          }
        }}
        onLayout={() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({animated: false});
          }
        }}
      />
      
      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <View style={styles.typingIndicatorContainer}>
          <View style={styles.typingIndicatorBubble}>
            <View style={styles.typingIndicatorDots}>
              <Animated.View style={[styles.typingDot, {opacity: dot1Opacity}]} />
              <Animated.View style={[styles.typingDot, {opacity: dot2Opacity}]} />
              <Animated.View style={[styles.typingDot, {opacity: dot3Opacity}]} />
            </View>
            <Text style={styles.typingIndicatorText}>
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </Text>
          </View>
        </View>
      )}

      {/* Media preview area */}
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

      {/* Reply preview */}
      {replyingTo && (
        <View style={styles.replyContainer}>
          <View style={styles.replyContent}>
            <View style={styles.replyBar} />
            <View style={styles.replyInfo}>
              <Text style={styles.replyToText}>
                Replying to {replyingTo.senderId === user?.id ? 'yourself' : otherUser?.first_name || 'user'}
              </Text>
              <Text style={styles.replyMessageText} numberOfLines={1}>
                {replyingTo.content || 'Media message'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.cancelReplyButton} onPress={handleCancelReply}>
            <Ionicons name="close" size={20} color="#8892B0" />
          </TouchableOpacity>
        </View>
      )}

      {/* Message input area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          onPress={() => setAttachmentsVisible(!attachmentsVisible)} 
          style={styles.attachButton}
        >
          <Ionicons name="add-circle-outline" size={28} color="#64FFDA" />
        </TouchableOpacity>
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={newMessage}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          placeholderTextColor="#8892B0"
          multiline
          maxLength={1000}
        />
        
        <TouchableOpacity 
          onPress={() => sendMessage()}
          style={[
            styles.sendButton,
            (!newMessage.trim() && mediaUrls.length === 0) && styles.sendButtonDisabled
          ]}
          disabled={!newMessage.trim() && mediaUrls.length === 0}
        >
          <Ionicons 
            name="send" 
            size={24} 
            color={(newMessage.trim() || mediaUrls.length > 0) ? "#64FFDA" : "#8892B0"} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Attachment options panel */}
      {attachmentsVisible && (
        <View style={styles.attachmentsPanel}>
          <TouchableOpacity style={styles.attachmentOption} onPress={pickImage}>
            <View style={[styles.attachmentIconBg, {backgroundColor: '#4CAF50'}]}>
              <Ionicons name="image" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.attachmentText}>Image</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.attachmentOption} onPress={() => {
            // Handle document/file picking
            Alert.alert('Coming Soon', 'Document sharing will be available soon');
            setAttachmentsVisible(false);
          }}>
            <View style={[styles.attachmentIconBg, {backgroundColor: '#2196F3'}]}>
              <Ionicons name="document" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.attachmentText}>Document</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.attachmentOption} onPress={() => {
            // Handle location sharing
            Alert.alert('Coming Soon', 'Location sharing will be available soon');
            setAttachmentsVisible(false);
          }}>
            <View style={[styles.attachmentIconBg, {backgroundColor: '#FFC107'}]}>
              <Ionicons name="location" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.attachmentText}>Location</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.attachmentOption} onPress={() => {
            // Close the attachment panel
            setAttachmentsVisible(false);
          }}>
            <View style={[styles.attachmentIconBg, {backgroundColor: '#FF5722'}]}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.attachmentText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Full-size image modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeModal}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: currentImageView }}
            style={styles.fullImage}
            resizeMode="contain"
          />
          <View style={styles.imageModalFooter}>
            <TouchableOpacity style={styles.imageModalButton} onPress={() => {
              Alert.alert('Coming Soon', 'Download feature will be available soon');
            }}>
              <Ionicons name="download-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageModalButton} onPress={() => {
              Alert.alert('Coming Soon', 'Share feature will be available soon');
            }}>
              <Ionicons name="share-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Reaction picker modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reactionModalVisible}
        onRequestClose={() => setReactionModalVisible(false)}
      >
        <Pressable 
          style={styles.reactionModalOverlay}
          onPress={() => setReactionModalVisible(false)}
        >
          <Pressable style={styles.reactionModalContent}>
            <View style={styles.reactionModalHeader}>
              <Text style={styles.reactionModalTitle}>Add Reaction</Text>
            </View>
            <View style={styles.reactionList}>
              {Object.values(REACTIONS).map((reaction) => (
                <TouchableOpacity
                  key={reaction.name}
                  style={styles.reactionButton}
                  onPress={() => handleAddReaction(reaction.name)}
                >
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    padding: 16,
    backgroundColor: '#112240',
    borderBottomWidth: 1,
    borderBottomColor: '#1D2D50',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    height: Platform.OS === 'ios' ? 90 : 70,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#1D2D50',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#112240',
  },
  userDetails: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#CCD6F6',
  },
  typingStatus: {
    fontSize: 12,
    color: '#64FFDA',
    fontStyle: 'italic',
  },
  onlineStatus: {
    fontSize: 12,
    color: '#8892B0',
  },
  messageListPadding: {
    height: 16,
  },
  messageRow: {
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  // Sent message (your message)
  ownMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  ownMessageContent: {
    borderRadius: 18,
    padding: 12,
    marginBottom: 4,
    backgroundColor: '#0084FF',
    elevation: 1,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  ownMessageText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  
  // Received message (other user's message)
  otherMessageContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  otherMessageContent: {
    backgroundColor: '#E4E6EB',
    borderRadius: 18,
    padding: 12,
    marginBottom: 4,
    elevation: 1,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
  otherMessageText: {
    color: '#050505',
    fontSize: 16,
    lineHeight: 22,
  },
  
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  
  timestamp: {
    fontSize: 11,
    color: '#8892B0',
    marginTop: 2,
    marginBottom: 2,
  },
  
  messageImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 8,
  },
  
  dateHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderText: {
    fontSize: 12,
    color: '#8892B0',
    backgroundColor: 'rgba(17, 34, 64, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  typingIndicatorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 6,
  },
  typingIndicatorBubble: {
    backgroundColor: 'rgba(29, 45, 80, 0.7)',
    borderRadius: 18,
    padding: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '70%',
  },
  typingIndicatorDots: {
    flexDirection: 'row',
    marginRight: 6,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64FFDA',
    marginRight: 3,
    opacity: 0.5,
    // Add animation properties
    transform: [{scale: 1}],
    animationName: 'pulse',
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
  },
  typingIndicatorText: {
    color: '#CCD6F6',
    fontSize: 12,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  mediaPreviewContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#112240',
    borderTopWidth: 1,
    borderTopColor: '#1D2D50',
  },
  mediaPreview: {
    position: 'relative',
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.3)',
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  replyContainer: {
    backgroundColor: 'rgba(17, 34, 64, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#1D2D50',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyBar: {
    width: 4,
    height: '80%',
    backgroundColor: '#64FFDA',
    borderRadius: 2,
    marginRight: 8,
  },
  replyInfo: {
    flex: 1,
  },
  replyToText: {
    fontSize: 12,
    color: '#64FFDA',
    fontWeight: 'bold',
  },
  replyMessageText: {
    fontSize: 14,
    color: '#8892B0',
  },
  cancelReplyButton: {
    padding: 8,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  replyLine: {
    width: 3,
    height: '100%',
    backgroundColor: '#64FFDA',
    marginRight: 6,
    borderRadius: 1.5,
  },
  replyText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
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
    borderRadius: 20,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    padding: 12,
    maxHeight: 120,
    color: '#CCD6F6',
    fontSize: 16,
    backgroundColor: '#1D2D50',
    borderRadius: 24,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  sendButton: {
    padding: 10,
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  attachmentsPanel: {
    flexDirection: 'row',
    backgroundColor: '#0A192F',
    padding: 20,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#1D2D50',
    elevation: 5,
  },
  attachmentOption: {
    alignItems: 'center',
    width: 80,
  },
  attachmentIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  attachmentText: {
    color: '#CCD6F6',
    fontSize: 13,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
    borderRadius: 4,
  },
  closeModal: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 5,
  },
  imageModalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    width: '100%',
  },
  imageModalButton: {
    backgroundColor: 'rgba(17, 34, 64, 0.7)',
    padding: 12,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  reactionModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  reactionModalContent: {
    backgroundColor: '#112240',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  reactionList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  reactionButton: {
    padding: 16,
    backgroundColor: '#1D2D50',
    borderRadius: 40,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    transform: [{scale: 1}],
  },
  reactionEmoji: {
    fontSize: 26,
  },
  reactionContainer: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#1D2D50',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#0A192F',
    zIndex: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  ownReactionContainer: {
    right: 16,
  },
  otherReactionContainer: {
    left: 45,
  },
  readStatus: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  sentStatus: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  reactionModalHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  reactionModalTitle: {
    color: '#CCD6F6',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MessagesScreen;
