import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { IconSymbol } from './ui/IconSymbol';
import { API_BASE_URL } from '@/config';

interface Review {
  rating: number;
  comment: string;
  reviewer: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  description: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface AdvisorData {
  advisorId: number;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    profile_image: string;
    bio: string;
    points: number;
  };
  currentRank: string;
  events: Event[];
  reviews: Review[];
}

export default function AdvisorProfile() {
  const [data, setData] = useState<AdvisorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdvisorProfile();
  }, []);

  const fetchAdvisorProfile = async () => {
    try {
      // Hardcoded advisor ID for testing - should come from route params or context
      const response = await fetch(`${API_BASE_URL}advisor/1`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError('Failed to load advisor profile');
      console.error('Error fetching advisor profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#64FFDA" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Failed to load profile'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ 
            uri: data.user?.profile_image || 'https://cdn.pixabay.com/photo/2021/07/02/04/48/user-6380868_1280.png',
            width: 120,
            height: 120
          }}
          style={styles.profileImage}
        />
        <Text style={styles.name}>{`${data.user?.first_name || ''} ${data.user?.last_name || ''}`}</Text>
        <View style={styles.rankBadge}>
          <IconSymbol name="star.fill" size={16} color="#64FFDA" />
          <Text style={styles.rankText}>{data.currentRank}</Text>
        </View>
        <Text style={styles.points}>{`${data.user?.points} points`}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bio</Text>
        <Text style={styles.bio}>{data.user?.bio || 'No bio available'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Events</Text>
        {data.events && data.events.length > 0 ? (
          data.events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDetails}>{event.description}</Text>
              <View style={styles.eventMeta}>
                <Text style={styles.eventLocation}>{event.location}</Text>
                <Text style={styles.eventDate}>{new Date(event.date).toLocaleDateString()}</Text>
              </View>
              <View style={[styles.statusBadge, styles[`status_${event.status}`]]}>
                <Text style={styles.statusText}>{event.status}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No events available</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        {data.reviews && data.reviews.length > 0 ? (
          data.reviews.map((review, index) => (
            <View key={index} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{review.reviewer}</Text>
                <View style={styles.ratingContainer}>
                  <IconSymbol name="star.fill" size={16} color="#64FFDA" />
                  <Text style={styles.rating}>{review.rating}</Text>
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment || 'No comment'}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No reviews available</Text>
        )}
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
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginBottom: 8,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  rankText: {
    color: '#64FFDA',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  points: {
    color: '#8892B0',
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
    color: '#CCD6F6',
    marginBottom: 16,
  },
  bio: {
    color: '#8892B0',
    fontSize: 16,
    lineHeight: 24,
  },
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginBottom: 8,
  },
  eventDetails: {
    color: '#8892B0',
    marginBottom: 12,
  },
  eventMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventLocation: {
    color: '#64FFDA',
  },
  eventDate: {
    color: '#8892B0',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  status_pending: {
    backgroundColor: '#FFA500',
  },
  status_approved: {
    backgroundColor: '#64FFDA',
  },
  status_rejected: {
    backgroundColor: '#FF4444',
  },
  statusText: {
    color: '#0A192F',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    color: '#CCD6F6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: '#64FFDA',
    marginLeft: 4,
  },
  reviewComment: {
    color: '#8892B0',
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 16,
    textAlign: 'center',
  },
  noDataText: {
    color: '#8892B0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});
