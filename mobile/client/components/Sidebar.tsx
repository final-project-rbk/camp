import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export default function Sidebar({ isVisible, onClose }: SidebarProps) {
  const slideAnim = React.useRef(new Animated.Value(-width)).current;
  const router = useRouter();

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : -width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  const menuItems = [
    { icon: 'home', label: 'Home', route: '/(tabs)/home' },
    { icon: 'compass', label: 'Explore', route: '/(tabs)/market' },
    { icon: 'heart', label: 'Favorites', route: '/(tabs)/favorites' },
    { icon: 'person-circle', label: 'Advisor Profile', route: '/advisor/1' },
    { icon: 'help-circle', label: 'Help', route: '/(tabs)/hints' },
    { icon: 'settings', label: 'Settings', route: '/setting' },
  ];

  return (
    <>
      {isVisible && (
        <Pressable style={styles.overlay} onPress={onClose}>
          <View style={styles.overlayContent} />
        </Pressable>
      )}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Menu</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color="#CCD6F6" />
          </Pressable>
        </View>

        <View style={styles.menuItems}>
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              style={styles.menuItem}
              onPress={() => {
                onClose();
                router.push(item.route as any);
              }}
            >
              <Ionicons name={item.icon as any} size={24} color="#64FFDA" />
              <Text style={styles.menuItemText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  overlayContent: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.75,
    backgroundColor: '#1D2D50',
    zIndex: 2,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 255, 218, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CCD6F6',
  },
  menuItems: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#CCD6F6',
  },
}); 