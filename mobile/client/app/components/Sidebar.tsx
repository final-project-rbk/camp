import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AuthService from '../../services/auth.service';

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = StatusBar.currentHeight || 0;

type RouteType = 
  | '/(tabs)/home'
  | '/(tabs)/market'
  | '/(tabs)/story'
  | '/(tabs)/favorites'
  | '/(tabs)/profile'
  | '/setting';

interface MenuItem {
  icon: string;
  label: string;
  route: RouteType;
  description: string;
}

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

  const handleProfilePress = async () => {
    try {
      console.log('Profile button pressed');
      const token = await AuthService.getToken();
      const user = await AuthService.getUser();
      console.log('Token:', token);
      console.log('User:', user);
      
      if (user) {
        if (user.role === 'advisor') {
          console.log('Navigating to advisor profile with ID:', user.id);
          router.push(`/advisor/${user.id}` as any);
        } else {
          console.log('Navigating to regular profile');
          router.push('/profile');
        }
      } else {
        console.log('No user data found');
        router.push('/auth');
      }
      onClose();
    } catch (error) {
      console.error('Error in handleProfilePress:', error);
      router.push('/auth');
    }
  };

  const menuItems: MenuItem[] = [
    { 
      icon: 'home-outline', 
      label: 'Home', 
      route: '/(tabs)/home',
      description: 'Discover camping spots'
    },
    { 
      icon: 'cart-outline', 
      label: 'Market', 
      route: '/(tabs)/market',
      description: 'Find camping gear'
    },
    { 
      icon: 'book-outline', 
      label: 'Story', 
      route: '/(tabs)/story',
      description: 'Share your experiences'
    },
    { 
      icon: 'person-outline', 
      label: 'Profile', 
      route: '/(tabs)/profile',
      description: 'Your account'
    },
    { 
      icon: 'heart-outline', 
      label: 'Favorites', 
      route: '/(tabs)/favorites',
      description: 'Your saved places'
    },
    { 
      icon: 'settings-outline', 
      label: 'Settings', 
      route: '/setting',
      description: 'App preferences'
    },
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
        <SafeAreaView style={styles.sidebarSafeArea}>
          <ImageBackground
            source={{ uri: 'https://tse1.mm.bing.net/th?id=OIP.-SRgaUg8bfBFBVg9HSVdAQHaEK&pid=Api&P=0&h=180' }}
            style={styles.headerBackground}
          >
            <LinearGradient
              colors={['rgba(10, 25, 47, 0.7)', 'rgba(10, 25, 47, 0.95)']}
              style={styles.headerGradient}
            >
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Image 
                    source={{ uri: 'https://tse2.mm.bing.net/th?id=OIP.K2x67hQ69-pwC-YodDsU_AHaEK&pid=Api&P=0&h=180' }}
                    style={styles.logoImage}
                  />
                  <View style={styles.logoText}>
                    <Text style={styles.appName}>Campy</Text>
                    <Text style={styles.tagline}>Explore Tunisia</Text>
                  </View>
                </View>
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#CCD6F6" />
                </Pressable>
              </View>
            </LinearGradient>
          </ImageBackground>

          <View style={styles.divider} />

          <ScrollView 
            style={styles.menuItemsContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.menuItems}>
              {menuItems.map((item, index) => (
                <Pressable
                  key={index}
                  style={styles.menuItem}
                  onPress={() => {
                    onClose();
                    if (item.label === 'Profile') {
                      handleProfilePress();
                    } else {
                      router.push(item.route);
                    }
                  }}
                >
                  <View style={styles.menuItemIcon}>
                    <Ionicons name={item.icon as any} size={24} color="#64FFDA" />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemText}>{item.label}</Text>
                    <Text style={styles.menuItemDescription}>{item.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8892B0" />
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Version 1.0.0</Text>
            <Text style={styles.footerTagline}>Camp Smarter with Campy</Text>
          </View>
        </SafeAreaView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    width: width * 0.8,
    backgroundColor: '#0F2641',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  sidebarSafeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT : 0,
  },
  headerBackground: {
    height: height * 0.22,
    width: '100%',
  },
  headerGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  logoText: {
    justifyContent: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: 14,
    color: '#64FFDA',
  },
  closeButton: {
    padding: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(100, 255, 218, 0.2)',
    marginVertical: 8,
  },
  menuItemsContainer: {
    flex: 1,
  },
  menuItems: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 255, 218, 0.1)',
  },
  menuItemIcon: {
    width: 36,
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCD6F6',
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#8892B0',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(10, 25, 47, 0.8)',
  },
  footerText: {
    fontSize: 12,
    color: '#8892B0',
    marginBottom: 4,
  },
  footerTagline: {
    fontSize: 14,
    color: '#64FFDA',
    fontWeight: '500',
  },
}); 