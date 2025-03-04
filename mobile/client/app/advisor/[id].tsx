import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EXPO_PUBLIC_API_URL } from '@/config';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    name: string;
    avatar: string;
  };
}

interface Event {
  title: string;
  date: string;
  status: 'approved' | 'pending' | 'rejected';
  reviews: Review[];
}

interface User {
  email: string;
  first_name: string;
  last_name: string;
  bio: string;
  experience: string | null;
  profile_image: string;
}

interface AdvisorProfile {
  advisorId: number;
  user: User;
  events: Event[];
  points: number;
  rank: 'bronze' | 'silver' | 'gold' | 'platinum';
  reviews: Review[];
}

export default function AdvisorProfileScreen() {
  const { id } = useLocalSearchParams();
  const [advisor, setAdvisor] = useState<AdvisorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdvisorProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/advisor/${id}`);
      const data = await response.json();
      setAdvisor(data);
    } catch (error) {
      console.error('Error fetching advisor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisorProfile();
  }, [id]);

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'platinum': return '#E5E4E2';
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      default: return '#CD7F32'; // bronze
    }
  };

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image 
          source={{ uri: item.user.avatar }} 
          style={styles.reviewerAvatar} 
        />
        <View>
          <Text style={styles.reviewerName}>{item.user.name}</Text>
          <View style={styles.ratingContainer}>
            {[...Array(5)].map((_, index) => (
              <Ionicons 
                key={index}
                name={index < item.rating ? "star" : "star-outline"}
                size={16}
                color="#64FFDA"
              />
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventCard}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDate}>
        {new Date(item.date).toLocaleDateString()}
      </Text>
      <Text style={[styles.eventStatus, { 
        color: item.status === 'approved' ? '#64FFDA' : '#FFB347'
      }]}>
        {item.status.toUpperCase()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#64FFDA" />
      </View>
    );
  }

  if (!advisor) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Advisor not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: advisor.user.profile_image || 'https://via.placeholder.com/150' }}
          style={styles.profileImage}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{`${advisor.user.first_name} ${advisor.user.last_name}`}</Text>
          <Text style={styles.bio}>{advisor.user.bio}</Text>
          <View style={styles.rankContainer}>
            <Text style={[styles.rank, { color: getRankColor(advisor.rank) }]}>
              {advisor.rank.toUpperCase()}
            </Text>
            <Text style={styles.points}>{advisor.points} points</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        {advisor.events.map((event, index) => (
          <View key={index} style={styles.eventCard}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventDate}>
              {new Date(event.date).toLocaleDateString()}
            </Text>
            <Text style={[styles.eventStatus, { 
              color: event.status === 'approved' ? '#64FFDA' : '#FFB347'
            }]}>
              {event.status.toUpperCase()}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        {advisor.reviews.map(review => renderReview({ item: review }))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1D2D50',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginBottom: 5,
  },
  bio: {
    color: '#8892B0',
    fontSize: 16,
    lineHeight: 24,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
  points: {
    color: '#64FFDA',
    fontSize: 16,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1D2D50',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#64FFDA',
    marginBottom: 10,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#1D2D50',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    padding: 10,
  },
  eventTitle: {
    color: '#CCD6F6',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDate: {
    color: '#64FFDA',
    fontSize: 14,
    marginBottom: 2,
  },
  eventStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: '#1D2D50',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  reviewerName: {
    color: '#CCD6F6',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  reviewComment: {
    color: '#8892B0',
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
}); 