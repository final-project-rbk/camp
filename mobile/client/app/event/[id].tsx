import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Pressable,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
  TouchableOpacity,
  Share
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { EXPO_PUBLIC_API_URL } from '../../config';
import { LinearGradient } from 'expo-linear-gradient';

interface Advisor {
  id: number;
  User: {
    id: number;
    first_name: string;
    last_name: string;
    profile_image: string | null;
  }
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  exclusive_details?: string;
  advisorId: number;
  Advisor?: Advisor;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [expandDescription, setExpandDescription] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${EXPO_PUBLIC_API_URL}events/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setEvent(data.data);
      } else {
        console.error('Failed to fetch event:', data.error);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id]);

  const handleShare = async () => {
    if (!event) return;
    
    try {
      await Share.share({
        message: `Check out this event: ${event.title} on ${new Date(event.date).toLocaleDateString()} at ${event.location}`,
        title: event.title,
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#64FFDA" />
          </Pressable>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#64FFDA" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#64FFDA" />
          </Pressable>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated header that appears when scrolling */}
      <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#64FFDA" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{event.title}</Text>
          <Pressable 
            style={styles.actionButton}
            onPress={handleShare}
          >
            <Ionicons name="share-social" size={22} color="#64FFDA" />
          </Pressable>
        </View>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero image section with carousel */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(
                e.nativeEvent.contentOffset.x / Dimensions.get('window').width
              );
              setActiveImageIndex(newIndex);
            }}
          >
            {event.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image || 'https://via.placeholder.com/400' }}
                style={styles.heroImage}
              />
            ))}
          </ScrollView>
          
          {/* Back button overlay on image */}
          <Pressable 
            style={styles.imageBackButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          
          {/* Share button overlay */}
          <Pressable 
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Ionicons name="share-social" size={22} color="#FFFFFF" />
          </Pressable>
          
          {/* Status badge */}
          {event.status && (
            <View style={[
              styles.statusBadge,
              event.status === 'approved' ? styles.approvedBadge : 
              event.status === 'pending' ? styles.pendingBadge : styles.rejectedBadge
            ]}>
              <Ionicons 
                name={
                  event.status === 'approved' ? 'checkmark-circle' : 
                  event.status === 'pending' ? 'time' : 'close-circle'
                } 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={styles.statusText}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </Text>
            </View>
          )}
          
          {/* Gradient overlay on image */}
          <LinearGradient
            colors={['transparent', 'rgba(10, 25, 47, 0.8)', '#0A192F']}
            style={styles.imageGradient}
          />
        </View>

        {/* Pagination dots */}
        <View style={styles.pagination}>
          {event.images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === activeImageIndex && styles.activeDot
              ]}
            />
          ))}
        </View>

        {/* Event details */}
        <View style={styles.detailsCard}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{event.title}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={20} color="#64FFDA" />
              <Text style={styles.detailText}>
                {formatDate(event.date)}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="location" size={20} color="#64FFDA" />
              <Text style={styles.detailText}>{event.location}</Text>
            </View>
          </View>

          {/* Advisor info */}
          {event.Advisor && event.Advisor.User && (
            <View style={styles.advisorSection}>
              <Text style={styles.sectionLabel}>Event Organizer</Text>
              <View style={styles.advisorRow}>
                <Image 
                  source={{ 
                    uri: event.Advisor.User.profile_image || 'https://ui-avatars.com/api/?name=' + 
                      encodeURIComponent(`${event.Advisor.User.first_name} ${event.Advisor.User.last_name}`)
                  }} 
                  style={styles.advisorAvatar} 
                />
                <View style={styles.advisorInfo}>
                  <Text style={styles.advisorName}>
                    {event.Advisor.User.first_name} {event.Advisor.User.last_name}
                  </Text>
                  <Text style={styles.advisorTitle}>Travel Advisor</Text>
                </View>
                <Pressable style={styles.viewAdvisorButton}>
                  <Text style={styles.viewAdvisorText}>Profile</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Description section */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionLabel}>About the Event</Text>
            <Pressable onPress={() => setExpandDescription(!expandDescription)}>
              <Text style={styles.description} numberOfLines={expandDescription ? undefined : 3}>
                {event.description}
              </Text>
              {event.description.length > 150 && (
                <Text style={styles.readMoreText}>
                  {expandDescription ? 'Show less' : 'Read more'}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Exclusive details if available */}
          {event.exclusive_details && (
            <View style={styles.exclusiveSection}>
              <Text style={styles.sectionLabel}>Exclusive Details</Text>
              <View style={styles.exclusiveContent}>
                <Ionicons name="star" size={20} color="#FFD700" style={styles.exclusiveIcon} />
                <Text style={styles.exclusiveText}>{event.exclusive_details}</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Action button */}
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerButtonText}>Register for Event</Text>
          </TouchableOpacity>
        </View>

        {/* Footer space */}
        <View style={styles.footer} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#0A192F',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 255, 218, 0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginLeft: 16,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#64FFDA',
    fontSize: 16,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    height: 300,
  },
  heroImage: {
    width: Dimensions.get('window').width,
    height: 300,
    resizeMode: 'cover',
  },
  imageBackButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(10, 25, 47, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(10, 25, 47, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 70,
    right: 16,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  approvedBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.8)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(243, 156, 18, 0.8)',
  },
  rejectedBadge: {
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -24,
    marginBottom: 12,
    zIndex: 5,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#64FFDA',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  detailsCard: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: '#1D2D50',
    borderRadius: 16,
    marginTop: -40,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.1)',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  titleRow: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  infoRow: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    color: '#CCD6F6',
    fontSize: 16,
    marginLeft: 12,
  },
  advisorSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 255, 218, 0.1)',
    paddingTop: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    color: '#64FFDA',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  advisorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  advisorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#64FFDA',
  },
  advisorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  advisorName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  advisorTitle: {
    fontSize: 14,
    color: '#8892B0',
  },
  viewAdvisorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    borderWidth: 1,
    borderColor: '#64FFDA',
  },
  viewAdvisorText: {
    color: '#64FFDA',
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 255, 218, 0.1)',
    paddingTop: 16,
    marginBottom: 16,
  },
  description: {
    color: '#CCD6F6',
    fontSize: 16,
    lineHeight: 24,
  },
  readMoreText: {
    color: '#64FFDA',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  exclusiveSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 255, 218, 0.1)',
    paddingTop: 16,
  },
  exclusiveContent: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
  },
  exclusiveIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  exclusiveText: {
    color: '#FFD700',
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  actionButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  registerButton: {
    backgroundColor: '#64FFDA',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#0A192F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    height: 40,
  }
});
