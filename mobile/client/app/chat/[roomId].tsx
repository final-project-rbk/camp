import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Colors } from '../../constants/Colors';
import { EXPO_PUBLIC_API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useLocalSearchParams } from 'expo-router';

const MessagesScreen = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { accessToken, user } = useAuth();
  const { roomId } = useLocalSearchParams();

  const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dqh6arave/upload";
const CLOUDINARY_UPLOAD_PRESET = "Ghassen123";

  useEffect(() => {
    fetchMessages();
  }, [roomId]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${EXPO_PUBLIC_API_URL}chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setMessages(response.data);
    } catch (error) {
      setError('Error fetching messages');
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    try {
      await axios.post(`${EXPO_PUBLIC_API_URL}chat/messages`, {
        roomId,
        content: newMessage
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchMessages();
      setNewMessage('');
    } catch (error) {
      setError('Error sending message');
      console.error('Error sending message:', error);
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

      await sendMessageWithMedia(data.secure_url);
    } catch (error) {
      setError('Error uploading image');
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again later.');
    }
  };

  const sendMessageWithMedia = async (mediaUrl) => {
    try {
      await axios.post(`${EXPO_PUBLIC_API_URL}chat/messages`, {
        roomId,
        content: newMessage,
        mediaUrls: [mediaUrl]
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchMessages();
      setNewMessage('');
    } catch (error) {
      setError('Error sending message with media');
      console.error('Error sending message with media:', error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.messageItem}>
      <Text style={styles.messageContent}>{item.content}</Text>
      <Text style={styles.messageAuthor}>{item.user.first_name} {item.user.last_name}</Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color={Colors.primary} />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message"
        />
        <Button title="Send" onPress={sendMessage} />
        <Button title="Upload Image" onPress={pickImage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 10
  },
  messageItem: {
    padding: 10,
    backgroundColor: Colors.gray[100],
    borderRadius: 10,
    marginVertical: 5
  },
  messageContent: {
    color: Colors.black,
    fontSize: 16
  },
  messageAuthor: {
    color: Colors.gray[500],
    fontSize: 12,
    marginTop: 5
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: Colors.gray[100],
    borderRadius: 10,
    marginTop: 10
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: Colors.white,
    borderRadius: 10,
    marginRight: 10
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20
  }
});

export default MessagesScreen;
