import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { EXPO_PUBLIC_API_URL } from '../config';
import { Ionicons } from '@expo/vector-icons';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${EXPO_PUBLIC_API_URL}events`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data);
      } else {
        console.error('Failed to fetch events:', data.error);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upcoming Events</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#64FFDA" />
      ) : events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No upcoming events</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.eventsScroll}
        >
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/event/${event.id}`}
              asChild
            >
              <Pressable style={styles.eventCard}>
                <Image
                  source={{ uri: event.images?.[0] || 'https://via.placeholder.com/400' }}
                  style={styles.eventImage}
                />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View style={styles.locationContainer}>
                    <Ionicons name="location" size={14} color="#8892B0" />
                    <Text style={styles.eventLocation}>{event.location}</Text>
                  </View>
                  <View style={styles.dateContainer}>
                    <Ionicons name="calendar" size={14} color="#64FFDA" />
                    <Text style={styles.eventDate}>
                      {new Date(event.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CCD6F6',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    color: '#CCD6F6',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  eventsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  eventCard: {
    width: 280,
    marginRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 180,
  },
  eventInfo: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    color: '#CCD6F6',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventLocation: {
    color: '#8892B0',
    fontSize: 14,
  },
  eventDate: {
    color: '#64FFDA',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8892B0',
    fontSize: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
});
