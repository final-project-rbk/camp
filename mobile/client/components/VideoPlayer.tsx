import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, Image, ActivityIndicator, Animated } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface VideoPlayerProps {
  uri: string;
  thumbnail: string | any;
  onClose: () => void;
}

export default function VideoPlayer({ uri, thumbnail, onClose }: VideoPlayerProps) {
  const videoRef = React.useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const fadeAnim = new Animated.Value(0);

  // Preload the video
  useEffect(() => {
    const loadVideo = async () => {
      if (videoRef.current) {
        await videoRef.current.loadAsync({ uri }, {}, false);
        setIsLoading(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    };
    loadVideo();
  }, [uri]);

  // Handle playback status
  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.isPlaying) {
      setShowThumbnail(false);
    }
  };

  return (
    <Modal visible={!!uri} transparent={false} animationType="slide">
      <View style={styles.container}>
        {showThumbnail && (
          <Image
            source={typeof thumbnail === 'string' ? { uri: thumbnail } : thumbnail}
            style={styles.video}
            resizeMode="cover"
          />
        )}

        <Animated.View style={{ opacity: fadeAnim }}>
          <Video
            ref={videoRef}
            style={[styles.video, showThumbnail ? styles.hidden : {}]}
            source={{ uri }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
        </Animated.View>

        {isLoading && (
          <ActivityIndicator style={styles.loader} size="large" color="#fff" />
        )}

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: 300,
  },
  hidden: {
    display: 'none',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 10,
  },
  loader: {
    position: 'absolute',
    alignSelf: 'center',
  },
});