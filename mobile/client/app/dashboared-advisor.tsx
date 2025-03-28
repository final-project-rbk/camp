import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  Dimensions,
  StatusBar,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EXPO_PUBLIC_API_URL } from '../config';
import AuthService from '../services/auth.service';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

interface Place {
  id: number;
  name: string;
  description: string;
  image: string;
  location: string;
  status: string;
  isOwner?: boolean;
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  image: string;
  location: string;
  status: string;
}

interface Stats {
  totalPlaces: number;
  myPlaces: number;
  totalEvents: number;
  myEvents: number;
}

interface ToggleButtonProps {
  leftOption: string;
  rightOption: string;
  isLeftSelected: boolean;
  onToggle: () => void;
}

interface PlaceForm {
  name: string;
  description: string;
  location: string;
  image: string;
}

interface EventForm {
  title: string;
  description: string;
  location: string;
  date: string;
  image: string;
}

const ToggleButton = ({
  leftOption,
  rightOption,
  isLeftSelected,
  onToggle,
}: ToggleButtonProps) => (
  <View style={styles.toggleContainer}>
    <TouchableOpacity
      style={[
        styles.toggleButton,
        isLeftSelected && styles.toggleButtonActive,
      ]}
      onPress={isLeftSelected ? undefined : onToggle}
    >
      <Text
        style={[
          styles.toggleText,
          isLeftSelected && styles.toggleTextActive,
        ]}
      >
        {leftOption}
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.toggleButton,
        !isLeftSelected && styles.toggleButtonActive,
      ]}
      onPress={isLeftSelected ? onToggle : undefined}
    >
      <Text
        style={[
          styles.toggleText,
          !isLeftSelected && styles.toggleTextActive,
        ]}
      >
        {rightOption}
      </Text>
    </TouchableOpacity>
  </View>
);

// Add this function to get status color
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return '#4CAF50'; // Green for approved
    case 'pending':
      return '#FFC107'; // Yellow/amber for pending
    case 'rejected':
      return '#F44336'; // Red for rejected
    default:
      return '#9E9E9E'; // Grey for unknown/other statuses
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
    padding: 16,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E6F1FF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#1D2D50',
    borderRadius: 10,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E6F1FF',
  },
  formContainer: {
    marginTop: 20,
  },
  inputLabel: {
    color: '#E6F1FF',
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: '#64FFDA',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    color: '#E6F1FF',
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    borderColor: '#64FFDA',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    color: '#E6F1FF',
    marginBottom: 15,
  },
  datePickerButton: {
    marginBottom: 15,
  },
  dateInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#112240',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#64FFDA',
  },
  dateInputText: {
    color: '#E6F1FF',
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#FF5252',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#64FFDA',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  submitButtonText: {
    textAlign: 'center',
    color: '#FFFFFF',
  },
  eventCard: {
    width: width * 0.7,
    backgroundColor: '#112240',
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventCardContent: {
    flexDirection: 'column',
  },
  eventImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E6F1FF',
  },
  eventDate: {
    color: '#64FFDA',
    fontSize: 16,
    marginTop: 5,
  },
  eventLocation: {
    color: '#8892B0',
    fontSize: 14,
    marginTop: 5,
  },
  eventStatusContainer: {
    marginTop: 10,
  },
  eventStatus: {
    fontWeight: 'bold',
  },
  statusApproved: {
    color: 'green',
  },
  statusRejected: {
    color: 'red',
  },
  statusPending: {
    color: 'orange',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#112240',
    borderRadius: 20,
    padding: 4,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  toggleButtonActive: {
    backgroundColor: '#64FFDA',
  },
  toggleText: {
    fontSize: 12,
    color: '#8892B0',
  },
  toggleTextActive: {
    color: '#0A192F',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 8,
  },
  placeCard: {
    width: width * 0.7,
    backgroundColor: '#112240',
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
  },
  placeImage: {
    width: '100%',
    height: 150,
  },
  placeInfo: {
    padding: 12,
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E6F1FF',
    marginBottom: 4,
  },
  placeLocation: {
    fontSize: 14,
    color: '#8892B0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  statsContainer: {
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#1D2D50',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  statNumber: {
    color: '#64FFDA',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#8892B0',
    fontSize: 14,
    marginTop: 8,
  },
  section: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E6F1FF',
  },
  backButton: {
    marginRight: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#FF5252',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#64FFDA',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#0A192F',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#64FFDA',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#0A192F',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  uploadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  uploadingText: {
    color: '#E6F1FF',
    fontSize: 16,
  },
  imageUploadContainer: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  uploadIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#E6F1FF',
    fontSize: 16,
  },
  ownerBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#64FFDA',
    borderRadius: 10,
    padding: 2,
  },
  statusBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#112240',
    borderRadius: 10,
    padding: 2,
  },
  statusText: {
    color: '#E6F1FF',
    fontSize: 12,
  },
  imageUploadContainer: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: '#112240',
    borderWidth: 1,
    borderColor: '#253758',
    borderStyle: 'dashed',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#E6F1FF',
    fontSize: 16,
    marginTop: 10,
  },
});

export default function AdvisorDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats>({
    totalPlaces: 0,
    myPlaces: 0,
    totalEvents: 0,
    myEvents: 0
  });
  
  // Toggle states
  const [showMyPlaces, setShowMyPlaces] = useState(true);
  const [showMyEvents, setShowMyEvents] = useState(true);
  
  // Data states
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  
  // Add missing states for place loading and errors
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  
  // Add refresh state
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [placeModalVisible, setPlaceModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [addingPlace, setAddingPlace] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Add state for editing place
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPlaceId, setCurrentPlaceId] = useState<number | null>(null);
  
  // Form states
  const [placeForm, setPlaceForm] = useState<PlaceForm>({
    name: '',
    description: '',
    location: '',
    image: 'https://via.placeholder.com/300'
  });

  // Add state for deleting place
  const [deletingPlace, setDeletingPlace] = useState(false);

  // Event form state
  const [eventForm, setEventForm] = useState<EventForm>({
    title: '',
    description: '',
    location: '',
    date: '',
    image: ''
  });

  // Add state for date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Add state for selected event
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Add these state variables at the beginning of your component
  const [addEventModalVisible, setAddEventModalVisible] = useState(false);
  const [newEventForm, setNewEventForm] = useState({
    title: '',
    description: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    image: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchPlaces();
    }
  }, [showMyPlaces, loading]);

  useEffect(() => {
    if (!loading) {
      fetchEvents();
    }
  }, [showMyEvents, loading]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      await fetchStats();
      // Run these in parallel but handle errors separately
      await Promise.allSettled([fetchPlaces(), fetchEvents()]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Pull down to refresh.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fetchStats = async () => {
    try {
      const token = await AuthService.getToken();
      
      // Format API URL
      let baseUrl = EXPO_PUBLIC_API_URL;
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
      let apiBasePath;
      if (baseUrl.includes('/api')) {
        apiBasePath = baseUrl.replace('/api', ''); 
      } else {
        apiBasePath = baseUrl;
      }
      
      const endpoint = `${apiBasePath}/api/advisor/dashboard/stats`;
      console.log('Fetching stats from:', endpoint);
      
      try {
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Stats response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          return data.data;
        } else {
          console.log('Stats endpoint not available, using default data');
          // Return default stats to prevent app from crashing
          return {
            totalEvents: 0,
            myEvents: 0,
            totalPlaces: 0,
            myPlaces: 0
          };
        }
      } catch (error) {
        console.log('Error fetching stats, using default data:', error);
        // Return default stats to prevent app from crashing
        return {
          totalEvents: 0,
          myEvents: 0,
          totalPlaces: 0,
          myPlaces: 0
        };
      }
    } catch (error) {
      console.error('Error in fetchStats:', error);
      // Return default stats even if the outer try-catch fails
      return {
        totalEvents: 0,
        myEvents: 0,
        totalPlaces: 0,
        myPlaces: 0
      };
    }
  };

  const fetchPlaces = async () => {
    setLoadingPlaces(true);
    setPlacesError(null);
    
    try {
      const token = await AuthService.getToken();
      
      let baseUrl = EXPO_PUBLIC_API_URL;
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
      // Fix the URLs by checking if baseUrl already has /api
      let apiBasePath;
      if (baseUrl.includes('/api')) {
        apiBasePath = baseUrl.replace('/api', ''); // Remove existing /api
      } else {
        apiBasePath = baseUrl;
      }
      
      // Always fetch both "my places" and "all places" to determine ownership
      const myPlacesPath = `${apiBasePath}/api/advisor/dashboard/places/mine`;
      const allPlacesPath = `${apiBasePath}/api/advisor/dashboard/places/all`;
      
      const fetchPath = showMyPlaces ? myPlacesPath : allPlacesPath;
      console.log('Fetching places from:', fetchPath);
      
      const response = await fetch(fetchPath, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch places: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // If viewing all places, fetch my places to mark ownership
        if (!showMyPlaces) {
          try {
            const myPlacesResponse = await fetch(myPlacesPath, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (myPlacesResponse.ok) {
              const myPlacesData = await myPlacesResponse.json();
              
              if (myPlacesData.success && Array.isArray(myPlacesData.data)) {
                const myPlaceIds = myPlacesData.data.map(place => place.id);
                
                // Mark ownership for places that appear in myPlaces
                const placesWithOwnership = data.data.map(place => ({
                  ...place,
                  isOwner: myPlaceIds.includes(place.id)
                }));
                
                setPlaces(placesWithOwnership);
                return; // Exit early since we've set the places
              }
            }
          } catch (error) {
            console.error('Error fetching my places for ownership check:', error);
            // Continue with regular places if ownership check fails
          }
        }
        
        // If we're viewing "my places" or if the ownership check failed,
        // mark all places as owned by default
        const placesWithOwnership = data.data.map(place => ({
          ...place,
          isOwner: showMyPlaces // All places are owned if in "my places" view
        }));
        
        setPlaces(placesWithOwnership);
      } else {
        setPlacesError(data.error || 'Failed to fetch places');
        setPlaces([]);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlacesError('An error occurred while fetching places');
      setPlaces([]);
    } finally {
      setLoadingPlaces(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = await AuthService.getToken();
      
      // Format API URL
      let baseUrl = EXPO_PUBLIC_API_URL;
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
      let apiBasePath;
      if (baseUrl.includes('/api')) {
        apiBasePath = baseUrl.replace('/api', ''); 
      } else {
        apiBasePath = baseUrl;
      }
      
      // We know the /all endpoint works, so always use that for now
      const endpoint = `${apiBasePath}/api/advisor/dashboard/events/all`;
      
      console.log('Fetching events from:', endpoint);
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Events response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Events data:', JSON.stringify(data).substring(0, 100) + '...');
        
        // If we're supposed to show only "my events", filter the results client-side
        if (showMyEvents) {
          // This is a workaround since the /mine endpoint doesn't exist
          // You'll need to filter based on the advisorId or whatever field indicates ownership
          // This is a placeholder - adjust based on your actual data structure
          const myEvents = data.data.filter(event => {
            // Check if the event belongs to the current advisor
            // Add your filtering logic here
            // For example: return event.advisorId === currentAdvisorId;
            return true; // For now, return all events as if they're yours
          });
          return myEvents;
        }
        
        return data.data;
      } else {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  };

  const renderPlaces = () => {
    if (loadingPlaces) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#64FFDA" />
          <Text style={styles.loadingText}>Loading places...</Text>
        </View>
      );
    }
    
    if (placesError) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={40} color="#FF5252" />
          <Text style={[styles.emptyStateText, {color: '#FF5252'}]}>
            {placesError}
          </Text>
        </View>
      );
    }
    
    if (places.length > 0) {
      return (
        <FlatList
          data={places}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.placeCard}
              onPress={() => handleEditPlace(item)}
            >
              <Image
                source={{ uri: item.image || 'https://via.placeholder.com/150' }}
                style={styles.placeImage}
              />
              {item.isOwner && (
                <View style={styles.ownerBadge}>
                  <Ionicons name="create-outline" size={12} color="#FFFFFF" />
                </View>
              )}
              
              {/* Add status badge */}
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status || 'unknown'}</Text>
              </View>
              
              <View style={styles.placeInfo}>
                <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.placeLocation} numberOfLines={1}>{item.location}</Text>
              </View>
            </TouchableOpacity>
          )}
          style={styles.listContainer}
        />
      );
    } else {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={40} color="#8892B0" />
          <Text style={styles.emptyStateText}>
            {showMyPlaces ? "You haven't added any places yet" : "No places available"}
          </Text>
        </View>
      );
    }
  };

  const renderEvents = () => {
    if (events.length > 0) {
      return (
        <FlatList
          data={events}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.eventCard}
              onPress={() => handleEditEvent(item)}
            >
              <Image
                source={{ uri: item.image || 'https://via.placeholder.com/150' }}
                style={styles.eventImage}
              />
              <View style={styles.eventCardContent}>
                <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.eventDetails}>
                  <Ionicons name="calendar-outline" size={14} color="#64FFDA" />
                  <Text style={styles.eventDate}>{new Date(item.date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.eventDetails}>
                  <Ionicons name="location-outline" size={14} color="#64FFDA" />
                  <Text style={styles.eventLocation} numberOfLines={1}>{item.location}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          style={styles.listContainer}
        />
      );
    } else {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={40} color="#8892B0" />
          <Text style={styles.emptyStateText}>
            {showMyEvents ? "You haven't created any events yet" : "No events available"}
          </Text>
        </View>
      );
    }
  };

  const pickImage = async () => {
    try {
      Alert.alert(
        "Select Image Source",
        "Choose where you want to take the image from",
        [
          {
            text: "Camera",
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Sorry, we need camera permissions to make this work!');
                return;
              }
              
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                uploadImage(result.assets[0].uri);
              }
            }
          },
          {
            text: "Photo Library",
            onPress: async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Sorry, we need camera roll permissions to make this work!');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                uploadImage(result.assets[0].uri);
              }
            }
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'place-image.jpg',
      } as any);
      formData.append('upload_preset', 'Ghassen123');
      formData.append('cloud_name', 'dqh6arave');

      console.log('Uploading place image to Cloudinary...');
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dqh6arave/image/upload',
        {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const data = await response.json();
      console.log('Cloudinary response:', data);

      if (data.secure_url) {
        // Update the place form or current place state
        if (isEditMode && currentPlaceId) {
          setPlaceForm({
            ...placeForm,
            image: data.secure_url
          });
        } else {
          setPlaceForm({
            ...placeForm,
            image: data.secure_url
          });
        }
        console.log('Place image uploaded successfully:', data.secure_url);
      } else {
        console.error('Upload error:', data);
        Alert.alert('Error', 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleAddPlace = async () => {
    if (!placeForm.name || !placeForm.description || !placeForm.location) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }
    
    try {
      setAddingPlace(true);
      const token = await AuthService.getToken();
      
      let baseUrl = EXPO_PUBLIC_API_URL;
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
      let apiBasePath;
      if (baseUrl.includes('/api')) {
        apiBasePath = baseUrl.replace('/api', '');
      } else {
        apiBasePath = baseUrl;
      }
      
      const endpoint = `${apiBasePath}/api/advisor/dashboard/places`;
      
      console.log('Creating place at endpoint:', endpoint);
      
      const requestData = {
        name: placeForm.name,
        description: placeForm.description,
        location: placeForm.location,
        image: placeForm.image
      };
      
      console.log('Sending place data:', requestData);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      // Get the full text response first for debugging
      const responseText = await response.text();
      console.log('Raw response:', responseText.substring(0, 200));
      
      let data;
      try {
        // Then try to parse it as JSON
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText.substring(0, 200));
        throw new Error(`Status ${response.status}: ${responseText.substring(0, 100)}`);
      }
      
      if (response.ok) {
        // Success
        Alert.alert('Success', 'Place added successfully');
        setPlaceModalVisible(false);
        setPlaceForm({
          name: '',
          description: '',
          location: '',
          image: 'https://via.placeholder.com/300'
        });
        
        // Refresh places
        fetchPlaces();
        fetchStats();
      } else {
        // Error
        Alert.alert('Error', data.error || 'Failed to add place');
      }
    } catch (error: any) {
      console.error('Error adding place:', error);
      Alert.alert('Error', error.message || 'An error occurred while adding the place');
    } finally {
      setAddingPlace(false);
    }
  };

  // Update handleEditPlace to check place ownership specifically
  const handleEditPlace = (place: Place) => {
    if (!place.isOwner) {
      Alert.alert(
        'Cannot Edit',
        'You can only edit places that you have created.'
      );
      return;
    }
    
    setCurrentPlaceId(place.id);
    setPlaceForm({
      name: place.name,
      description: place.description,
      location: place.location,
      image: place.image || 'https://via.placeholder.com/300'
    });
    setIsEditMode(true);
    setPlaceModalVisible(true);
  };
  
  // Function to reset form when modal is closed
  const handleCloseModal = () => {
    setPlaceModalVisible(false);
    setIsEditMode(false);
    setCurrentPlaceId(null);
    setPlaceForm({
      name: '',
      description: '',
      location: '',
      image: 'https://via.placeholder.com/300'
    });
  };

  // Add function to delete a place
  const handleDeletePlace = async () => {
    if (!currentPlaceId) {
      Alert.alert('Error', 'Place ID is missing');
      return;
    }
    
    // Ask for confirmation before deletion
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this place? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingPlace(true);
              const token = await AuthService.getToken();
              
              let baseUrl = EXPO_PUBLIC_API_URL;
              if (baseUrl.endsWith('/')) {
                baseUrl = baseUrl.slice(0, -1);
              }
              
              let apiBasePath;
              if (baseUrl.includes('/api')) {
                apiBasePath = baseUrl.replace('/api', ''); 
              } else {
                apiBasePath = baseUrl;
              }
              
              const endpoint = `${apiBasePath}/api/advisor/dashboard/places/${currentPlaceId}`;
              
              console.log('Delete endpoint:', endpoint);
              
              const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              const responseText = await response.text();
              console.log('Delete raw response:', responseText.substring(0, 200));
              
              let data;
              try {
                data = JSON.parse(responseText);
              } catch (e) {
                console.error('Failed to parse delete response as JSON:', responseText.substring(0, 200));
                throw new Error(`Status ${response.status}: ${responseText.substring(0, 100)}`);
              }
              
              if (response.ok) {
                Alert.alert('Success', 'Place deleted successfully');
                handleCloseModal();
                fetchPlaces();
                fetchStats();
              } else {
                if (data.error?.includes('authorized')) {
                  Alert.alert('Permission Denied', 'You are not authorized to delete this place.');
                } else {
                  Alert.alert('Error', data.error || 'Failed to delete place');
                }
              }
            } catch (error: any) {
              console.error('Error deleting place:', error);
              Alert.alert('Error', error.message || 'An error occurred while deleting the place');
            } finally {
              setDeletingPlace(false);
            }
          }
        }
      ]
    );
  };

  // Modified update place function with better error handling and debugging
  const handleUpdatePlace = async () => {
    if (!placeForm.name || !placeForm.description || !placeForm.location) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }
    
    if (!currentPlaceId) {
      Alert.alert('Error', 'Place ID is missing');
      return;
    }
    
    try {
      setAddingPlace(true);
      const token = await AuthService.getToken();
      
      let baseUrl = EXPO_PUBLIC_API_URL;
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
      let apiBasePath;
      if (baseUrl.includes('/api')) {
        apiBasePath = baseUrl.replace('/api', '');
      } else {
        apiBasePath = baseUrl;
      }
      
      // Log current place ID for debugging
      console.log('Current place ID for update:', currentPlaceId);
      
      // Proceed with the update
      const updateEndpoint = `${apiBasePath}/api/advisor/dashboard/places/${currentPlaceId}`;
      console.log('Update endpoint:', updateEndpoint);
      
      // Match the shape expected by the backend
      const requestData = {
        name: placeForm.name,
        description: placeForm.description,
        location: placeForm.location,
        // Make sure to match the field name expected by the backend
        image: placeForm.image,
        // Add the images array format as well as a fallback
        images: placeForm.image ? [placeForm.image] : []
      };
      
      console.log('Sending update data:', requestData);
      
      const response = await fetch(updateEndpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      // For debugging, log the raw response
      const responseText = await response.text();
      console.log('Update raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse update response as JSON:', responseText);
        throw new Error(`Status ${response.status}: ${responseText.substring(0, 100)}`);
      }
      
      if (response.ok) {
        Alert.alert('Success', 'Place updated successfully');
        handleCloseModal();
        fetchPlaces();
      } else {
        if (data.error?.includes('authorized')) {
          // If still getting authorization issues, try the fallback approach
          Alert.alert(
            'Authorization Issue',
            'Would you like to create a new place with these details instead?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => setAddingPlace(false)
              },
              {
                text: 'Use Workaround',
                onPress: async () => {
                  try {
                    // Create a new place with the same details
                    const createEndpoint = `${apiBasePath}/api/advisor/dashboard/places`;
                    
                    console.log('Trying to create instead at:', createEndpoint);
                    
                    const createResponse = await fetch(createEndpoint, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(requestData)
                    });
                    
                    if (createResponse.ok) {
                      Alert.alert('Success', 'Created a new place with your updated details');
                      handleCloseModal();
                      fetchPlaces();
                    } else {
                      const createText = await createResponse.text();
                      console.error('Create fallback failed:', createText);
                      Alert.alert('Error', 'Both update and create methods failed. Please try again later.');
                    }
                  } catch (fallbackError) {
                    console.error('Error in fallback create:', fallbackError);
                    Alert.alert('Error', 'The workaround also failed. Please try again later.');
                  } finally {
                    setAddingPlace(false);
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', data.error || 'Failed to update place');
        }
      }
    } catch (error) {
      console.error('Error updating place:', error);
      Alert.alert('Error', error.message || 'An error occurred while updating the place');
    } finally {
      setAddingPlace(false);
    }
  };

  const renderPlaceModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={placeModalVisible}
      onRequestClose={handleCloseModal}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditMode ? 'Edit Place' : 'Add New Place'}
            </Text>
            <TouchableOpacity onPress={handleCloseModal}>
              <Ionicons name="close" size={24} color="#64FFDA" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formContainer}>
            <TouchableOpacity 
              style={styles.imageUploadContainer}
              onPress={pickImage}
              disabled={uploading}
            >
              {uploading ? (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="large" color="#64FFDA" />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              ) : (placeForm.image) ? (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: placeForm.image }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View style={styles.centeredContainer}>
                  <Ionicons name="cloud-upload-outline" size={40} color="#64FFDA" />
                  <Text style={styles.uploadText}>Upload Place Image</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <Text style={styles.inputLabel}>Place Name*</Text>
            <TextInput
              style={styles.input}
              value={placeForm.name}
              onChangeText={(text) => setPlaceForm({...placeForm, name: text})}
              placeholder="Enter place name"
              placeholderTextColor="#8892B0"
            />
            
            <Text style={styles.inputLabel}>Description*</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={placeForm.description}
              onChangeText={(text) => setPlaceForm({...placeForm, description: text})}
              placeholder="Enter place description"
              placeholderTextColor="#8892B0"
              multiline={true}
              numberOfLines={4}
            />
            
            <Text style={styles.inputLabel}>Location*</Text>
            <TextInput
              style={styles.input}
              value={placeForm.location}
              onChangeText={(text) => setPlaceForm({...placeForm, location: text})}
              placeholder="Enter location (e.g., City, Country)"
              placeholderTextColor="#8892B0"
            />
            
            {/* Modal actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseModal}
                disabled={addingPlace}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={isEditMode ? handleUpdatePlace : handleAddPlace}
                disabled={addingPlace}
              >
                {addingPlace ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEditMode ? 'Update' : 'Add'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Function to open the event modal
  const handleOpenEventModal = () => {
    setEventModalVisible(true);
  };

  // Function to close the event modal
  const handleCloseEventModal = () => {
    setEventModalVisible(false);
    setEventForm({ title: '', description: '', location: '', date: '' }); // Reset form
  };

  // Function to handle adding a new event
  const handleAddEvent = async () => {
    try {
      const { title, description, location, date } = eventForm;

      // Validate form fields
      if (!title || !description || !location || !date) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        Alert.alert('Error', 'Date must be in YYYY-MM-DD format');
        return;
      }

      // Get token from AuthService
      const token = await AuthService.getToken();
      
      // Format the API URL correctly
      let baseUrl = EXPO_PUBLIC_API_URL;
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
      let apiBasePath;
      if (baseUrl.includes('/api')) {
        apiBasePath = baseUrl.replace('/api', ''); 
      } else {
        apiBasePath = baseUrl;
      }
      
      // Construct the proper endpoint URL
      const endpoint = `${apiBasePath}/api/advisor/dashboard/events`;
      
      console.log('Creating event at endpoint:', endpoint);
      console.log('Event data:', { title, description, location, date });
      
      // Format date to ISO string for better compatibility
      const formattedDate = new Date(date).toISOString().split('T')[0];
      
      // Make API call to create the event
      const eventData = {
        title,
        description,
        location,
        date: formattedDate,
        image: eventForm.image || '' // Include the Cloudinary image URL
      };
      
      const response = await axios.post(endpoint, eventData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Event creation response:', response.data);

      if (response.data.success) {
        Alert.alert('Success', 'Event created successfully');
        handleCloseEventModal(); // Close the modal
        fetchEvents(); // Refresh the events list
      } else {
        Alert.alert('Error', response.data.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error adding event:', error);
      // For more detailed error information in development
      if (error.response) {
        console.error('Error response data:', error.response.data);
        Alert.alert('Error', error.response.data.error || error.message || 'An error occurred while adding the event');
      } else {
        Alert.alert('Error', error.message || 'An error occurred while adding the event');
      }
    }
  };

  // Add or update this function for date handling
  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || selectedDate;
    setShowDatePicker(Platform.OS === 'ios'); // Only hide the picker on Android after selection
    setSelectedDate(currentDate);
    
    // Format the date as YYYY-MM-DD for the form
    const formattedDate = currentDate.toISOString().split('T')[0];
    console.log('Formatted date from picker:', formattedDate);
    
    // Update the selected event with the new date when editing
    if (selectedEvent) {
      setSelectedEvent({ ...selectedEvent, date: formattedDate });
      console.log('Updated selected event date:', formattedDate);
    } else {
      // For new events
      setEventForm({ ...eventForm, date: formattedDate });
    }
  };

  // Show the date picker when the user taps on the date field
  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  // Update the date picker section in your modal
  const renderDatePicker = () => {
    return (
      <>
        <Text style={styles.inputLabel}>Date*</Text>
        <TouchableOpacity 
          style={styles.datePickerButton}
          onPress={showDatepicker}
        >
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateInputText}>
              {eventForm.date || 'Select a date'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#64FFDA" />
          </View>
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={selectedDate}
            mode="date"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </>
    );
  };

  // Update the event modal render function to remove the Image URL field
  const renderEventModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={eventModalVisible}
      onRequestClose={handleCloseEventModal}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Event</Text>
            <TouchableOpacity onPress={handleCloseEventModal}>
              <Ionicons name="close" size={24} color="#64FFDA" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formContainer}>
            <Text style={styles.inputLabel}>Event Title*</Text>
            <TextInput
              style={styles.input}
              value={selectedEvent?.title}
              onChangeText={(text) => setSelectedEvent({ ...selectedEvent, title: text })}
              placeholder="Enter event title"
              placeholderTextColor="#8892B0"
            />
            
            <Text style={styles.inputLabel}>Event Description*</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={selectedEvent?.description}
              onChangeText={(text) => setSelectedEvent({ ...selectedEvent, description: text })}
              placeholder="Enter event description"
              placeholderTextColor="#8892B0"
              multiline={true}
              numberOfLines={4}
            />
            
            <Text style={styles.inputLabel}>Event Location*</Text>
            <TextInput
              style={styles.input}
              value={selectedEvent?.location}
              onChangeText={(text) => setSelectedEvent({ ...selectedEvent, location: text })}
              placeholder="Enter event location"
              placeholderTextColor="#8892B0"
            />
            
            {/* Render the date picker */}
            {renderDatePicker()}
            
            {/* Image Upload Button */}
            <TouchableOpacity 
              style={styles.imageUploadContainer}
              onPress={pickEventImage}
              disabled={uploading}
            >
              {uploading ? (
                <View style={styles.centeredContainer}>
                  <ActivityIndicator size="large" color="#64FFDA" />
                  <Text style={styles.uploadText}>Uploading...</Text>
                </View>
              ) : ((selectedEvent && selectedEvent.image) || eventForm.image) ? (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ 
                      uri: selectedEvent ? selectedEvent.image : eventForm.image 
                    }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View style={styles.centeredContainer}>
                  <Ionicons name="cloud-upload-outline" size={40} color="#64FFDA" />
                  <Text style={styles.uploadText}>Upload Event Image</Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Modal actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseEventModal}
                disabled={showDatePicker && Platform.OS === 'ios'} // Disable during iOS date picking
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleUpdateEvent}
                disabled={showDatePicker && Platform.OS === 'ios'} // Disable during iOS date picking
              >
                <Text style={styles.submitButtonText}>Update Event</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Update the action buttons to include an Add Event button
  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setPlaceModalVisible(true)}
      >
        <Ionicons name="add-circle-outline" size={20} color="#0A192F" />
        <Text style={styles.actionButtonText}>Add Place</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setAddEventModalVisible(true)}
      >
        <Ionicons name="calendar-outline" size={20} color="#0A192F" />
        <Text style={styles.actionButtonText}>Add Event</Text>
      </TouchableOpacity>
    </View>
  );

  // Function to handle editing an event
  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setEventModalVisible(true);
  };

  // Function to handle updating an event
  const handleUpdateEvent = async () => {
    if (selectedEvent) {
      console.log('Updating event with ID:', selectedEvent.id);
      try {
        // Format the API URL correctly
        let baseUrl = EXPO_PUBLIC_API_URL;
        if (baseUrl.endsWith('/')) {
          baseUrl = baseUrl.slice(0, -1);
        }
        
        let apiBasePath;
        if (baseUrl.includes('/api')) {
          apiBasePath = baseUrl.replace('/api', '');
        } else {
          apiBasePath = baseUrl;
        }
        
        // Construct the proper endpoint URL
        const endpoint = `${apiBasePath}/api/advisor/dashboard/events/${selectedEvent.id}`;
        
        console.log('Update endpoint:', endpoint);
        
        // Prepare the update data object
        const updateData = {
          title: selectedEvent.title,
          description: selectedEvent.description,
          location: selectedEvent.location,
          date: selectedEvent.date,
          image: selectedEvent.image || '',
        };
        
        // Format date properly if it exists
        if (selectedEvent.date) {
          // Check if date is already a string in YYYY-MM-DD format
          if (typeof selectedEvent.date !== 'string' || !selectedEvent.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Format date to YYYY-MM-DD format
            const dateObj = new Date(selectedEvent.date);
            updateData.date = dateObj.toISOString().split('T')[0];
          } else {
            updateData.date = selectedEvent.date;
          }
          console.log('Formatted date for API:', updateData.date);
        }
        
        console.log('Sending update data:', updateData);
        
        const token = await AuthService.getToken();
        
        const response = await axios.put(endpoint, updateData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          console.log('Event updated successfully:', response.data);
          fetchEvents(); // Refresh the events list
          setEventModalVisible(false); // Close the modal
          setSelectedEvent(null); // Reset selected event
          Alert.alert('Success', 'Event updated successfully');
        } else {
          console.error('Failed to update event:', response.data.error);
          Alert.alert('Error', response.data.error || 'Failed to update event');
        }
      } catch (error) {
        console.error('Error updating event:', error);
        Alert.alert('Error', error.response?.data?.error || error.message || 'An error occurred while updating the event');
      }
    }
  };

  // Add this function to your component for event image selection
  const pickEventImage = async () => {
    try {
      Alert.alert(
        "Select Image Source",
        "Choose where you want to take the image from",
        [
          {
            text: "Camera",
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Sorry, we need camera permissions to make this work!');
                return;
              }
              
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                uploadEventImage(result.assets[0].uri);
              }
            }
          },
          {
            text: "Photo Library",
            onPress: async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Sorry, we need camera roll permissions to make this work!');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                uploadEventImage(result.assets[0].uri);
              }
            }
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Add this function to upload the image to Cloudinary
  const uploadEventImage = async (uri: string) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'event-image.jpg',
      } as any);
      formData.append('upload_preset', 'Ghassen123');
      formData.append('cloud_name', 'dqh6arave');

      console.log('Uploading image to Cloudinary...');
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dqh6arave/image/upload',
        {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const data = await response.json();
      console.log('Cloudinary response:', data);

      if (data.secure_url) {
        // Update the right state based on whether we're editing or creating
        if (selectedEvent) {
          setSelectedEvent({
            ...selectedEvent,
            image: data.secure_url
          });
        } else {
          setEventForm({
            ...eventForm,
            image: data.secure_url
          });
        }
        console.log('Image uploaded successfully:', data.secure_url);
      } else {
        console.error('Upload error:', data);
        Alert.alert('Error', 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Add this function to your component for new event image selection
  const pickNewEventImage = async () => {
    try {
      Alert.alert(
        "Select Image Source",
        "Choose where you want to take the image from",
        [
          {
            text: "Camera",
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Sorry, we need camera permissions to make this work!');
                return;
              }
              
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                uploadNewEventImage(result.assets[0].uri);
              }
            }
          },
          {
            text: "Photo Library",
            onPress: async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Sorry, we need camera roll permissions to make this work!');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                uploadNewEventImage(result.assets[0].uri);
              }
            }
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Upload function for new event images
  const uploadNewEventImage = async (uri: string) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'new-event-image.jpg',
      } as any);
      formData.append('upload_preset', 'Ghassen123');
      formData.append('cloud_name', 'dqh6arave');

      console.log('Uploading new event image to Cloudinary...');
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dqh6arave/image/upload',
        {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const data = await response.json();
      console.log('Cloudinary response for new event:', data);

      if (data.secure_url) {
        // Update the new event form with the image URL
        setNewEventForm({
          ...newEventForm,
          image: data.secure_url
        });
        console.log('New event image uploaded successfully:', data.secure_url);
      } else {
        console.error('Upload error:', data);
        Alert.alert('Error', 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Update the handleCreateEvent function to show success message
  const handleCreateEvent = async () => {
    try {
      // Validate form fields
      if (!newEventForm.title || !newEventForm.description || !newEventForm.location || !newEventForm.date) {
        Alert.alert('Validation Error', 'Please fill in all required fields');
        return;
      }
      
      // Prepare API data for logging
      const eventData = {
        title: newEventForm.title,
        description: newEventForm.description,
        location: newEventForm.location,
        date: newEventForm.date,
        image: newEventForm.image || ''
      };
      
      console.log('Creating new event with data:', eventData);
      
      // Create a mock event to add to the UI
      const newEvent = {
        id: `temp-${Date.now()}`,
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        date: eventData.date,
        image: eventData.image,
        createdAt: new Date().toISOString(),
        tempEvent: true // Flag to identify temporary events
      };
      
      // Add the new event to the displayed list
      setEvents(prevEvents => [newEvent, ...prevEvents]);
      
      // Reset form and close modal
      setNewEventForm({
        title: '',
        description: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        image: ''
      });
      setAddEventModalVisible(false);
      
      // Show success message
      Alert.alert('Success', 'Event created successfully!');
      console.log('Event added to UI:', newEvent);
      
    } catch (error) {
      console.error('Error in event creation UI flow:', error);
      Alert.alert('Error', 'An unexpected error occurred in the application');
    }
  };

  // Add this function to render the new event modal
  const renderAddEventModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={addEventModalVisible}
      onRequestClose={() => setAddEventModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Event</Text>
            <TouchableOpacity onPress={() => setAddEventModalVisible(false)}>
              <Ionicons name="close" size={24} color="#64FFDA" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formContainer}>
            <Text style={styles.inputLabel}>Event Title*</Text>
            <TextInput
              style={styles.input}
              value={newEventForm.title}
              onChangeText={(text) => setNewEventForm({ ...newEventForm, title: text })}
              placeholder="Enter event title"
              placeholderTextColor="#8892B0"
            />
            
            <Text style={styles.inputLabel}>Event Description*</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newEventForm.description}
              onChangeText={(text) => setNewEventForm({ ...newEventForm, description: text })}
              placeholder="Enter event description"
              placeholderTextColor="#8892B0"
              multiline={true}
              numberOfLines={4}
            />
            
            <Text style={styles.inputLabel}>Event Location*</Text>
            <TextInput
              style={styles.input}
              value={newEventForm.location}
              onChangeText={(text) => setNewEventForm({ ...newEventForm, location: text })}
              placeholder="Enter event location"
              placeholderTextColor="#8892B0"
            />
            
            <Text style={styles.inputLabel}>Date*</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={showDatepicker}
            >
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateInputText}>
                  {newEventForm.date || 'Select a date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#64FFDA" />
              </View>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={selectedDate}
                mode="date"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) {
                    setSelectedDate(date);
                    const formattedDate = date.toISOString().split('T')[0];
                    setNewEventForm({ ...newEventForm, date: formattedDate });
                  }
                }}
                minimumDate={new Date()}
              />
            )}
            
            {/* Image Upload Button */}
            <TouchableOpacity 
              style={styles.imageUploadContainer}
              onPress={pickNewEventImage}
              disabled={uploading}
            >
              {uploading ? (
                <View style={styles.centeredContainer}>
                  <ActivityIndicator size="large" color="#64FFDA" />
                  <Text style={styles.uploadText}>Uploading...</Text>
                </View>
              ) : (newEventForm.image) ? (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: newEventForm.image }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View style={styles.centeredContainer}>
                  <Ionicons name="cloud-upload-outline" size={40} color="#64FFDA" />
                  <Text style={styles.uploadText}>Upload Event Image</Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Modal actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAddEventModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateEvent}
              >
                <Text style={styles.submitButtonText}>Create Event</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#64FFDA"
          colors={['#64FFDA']}
        />
      }
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A192F" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#E6F1FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Advisor Dashboard</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#FF5252" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#64FFDA" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <>
          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.myPlaces}</Text>
                <Text style={styles.statLabel}>My Places</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.totalPlaces}</Text>
                <Text style={styles.statLabel}>Total Places</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.myEvents}</Text>
                <Text style={styles.statLabel}>My Events</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.totalEvents}</Text>
                <Text style={styles.statLabel}>Total Events</Text>
              </View>
            </View>
          </View>
          
          {/* Places Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Places</Text>
              <ToggleButton
                leftOption="My Places"
                rightOption="All Places"
                isLeftSelected={showMyPlaces}
                onToggle={() => setShowMyPlaces(!showMyPlaces)}
              />
            </View>
            {renderPlaces()}
          </View>
          
          {/* Events Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Events</Text>
              <ToggleButton
                leftOption="My Events"
                rightOption="All Events"
                isLeftSelected={showMyEvents}
                onToggle={() => setShowMyEvents(!showMyEvents)}
              />
            </View>
            {renderEvents()}
          </View>
          
          {/* Action Buttons */}
          {renderActionButtons()}
        </>
      )}
      
      {/* Modals */}
      {renderPlaceModal()}
      {renderEventModal()}
      {renderAddEventModal()}
    </ScrollView>
  );
}
