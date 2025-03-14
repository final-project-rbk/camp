import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Tent, Map, Compass, Sun, Moon, Droplets, Wind, ThermometerSun, Info, AlertTriangle, CheckCircle, MapPin, Users, Calendar, Flame, Shield, BookOpen, Menu, X, ChevronLeft, Share2, Heart, Download, Eye } from "lucide-react-native";
import { useState, useEffect } from "react";
import EssentialsTab from '../../components/EssentialsTab';
import SafetyTab from '../../components/SafetyTab';
import WeatherTab from '../../components/WeatherTab';
import TutorialGalleryModal from '../../components/TutorialGalleryModal';
import React from "react";
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Tutorial {
  id: number;
  title: string;
  image: string | any;
  description: string;
  difficulty: string;
  timeToComplete: string;
  gallerySteps?: { image: string; description: string }[];
  views?: number;
}

interface BackendHint {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  timeToComplete: string;
  image: string;
  gallerySteps: string;
  views: number;
  category: string;
}

const getImageUri = (image: string | any): string => {
  if (typeof image === 'string') {
    // If the image is a URL (starts with http), use it directly
    if (image.startsWith('http')) {
      return image;
    }
    // If it's a relative path from the backend, prepend the API base URL
    else if (image.startsWith('/')) {
      return `${EXPO_PUBLIC_API_URL.replace('/api/', '')}${image}`;
    }
    return image;
  }
  // If it's a required image, return the asset path
  return `asset:/${image}`;
};

// Convert backend hint to frontend tutorial format
const transformHintToTutorial = (hint: BackendHint): Tutorial => {
  let gallerySteps = [];
  try {
    if (typeof hint.gallerySteps === 'string') {
      gallerySteps = JSON.parse(hint.gallerySteps);
    } else if (Array.isArray(hint.gallerySteps)) {
      gallerySteps = hint.gallerySteps;
    }
    
    // Process image paths in gallery steps - ensure it's an array first
    if (Array.isArray(gallerySteps)) {
      gallerySteps = gallerySteps.map((step: any) => ({
        ...step,
        image: typeof step.image === 'string' 
          ? (step.image.startsWith('/') 
            ? `${EXPO_PUBLIC_API_URL.replace('/api/', '')}${step.image}`
            : step.image)
          : step.image
      }));
    } else {
      // If gallerySteps isn't an array at this point, reset it
      gallerySteps = [];
    }
  } catch (error) {
    console.error('Error parsing gallerySteps:', error);
    gallerySteps = []; // Ensure we have a valid array even if parsing fails
  }

  // Create a fallback gallery step using the main image and description if empty
  if (!Array.isArray(gallerySteps) || gallerySteps.length === 0) {
    gallerySteps = [{
      image: typeof hint.image === 'string'
        ? (hint.image.startsWith('/') 
          ? `${EXPO_PUBLIC_API_URL.replace('/api/', '')}${hint.image}`
          : hint.image)
        : hint.image || 'https://via.placeholder.com/800x600?text=No+Image',
      description: hint.description || 'No detailed steps available for this tutorial.'
    }];
  }

  // Ensure all required fields exist and have safe default values
  return {
    id: hint.id || Math.floor(Math.random() * 1000), // Generate a random ID if missing
    title: hint.title || 'Untitled Tutorial',
    image: typeof hint.image === 'string'
      ? (hint.image.startsWith('/') 
        ? `${EXPO_PUBLIC_API_URL.replace('/api/', '')}${hint.image}`
        : hint.image)
      : hint.image || 'https://via.placeholder.com/800x600?text=No+Image',
    description: hint.description || 'No description available.',
    difficulty: hint.difficulty 
      ? hint.difficulty.charAt(0).toUpperCase() + hint.difficulty.slice(1)
      : 'Beginner',
    timeToComplete: hint.timeToComplete || '10-15 mins',
    gallerySteps: gallerySteps,
    views: hint.views || 0 // Include views from backend or default to 0
  };
};

// Add this function before the openGallery function
const incrementViewCount = async (tutorialId: number, currentTutorial: Tutorial) => {
  try {
    // Check if this tutorial has already been viewed by the user
    const viewedKey = `tutorial_viewed_${tutorialId}`;
    const alreadyViewed = await AsyncStorage.getItem(viewedKey);
    
    // If the tutorial has already been viewed, don't increment
    if (alreadyViewed) {
      console.log('Tutorial already viewed by this user');
      return currentTutorial;
    }
    
    // Make API call to increment the view
    try {
      console.log(`Incrementing view count for tutorial ID: ${tutorialId}`);
      const response = await axios.post(`${EXPO_PUBLIC_API_URL}hints/${tutorialId}/view`);
      
      // Log the response for debugging
      console.log('View increment response:', response.data);
      
      // If the API returns updated data, use it
      if (response.data && response.data.data) {
        // Mark this tutorial as viewed AFTER successful API call
        await AsyncStorage.setItem(viewedKey, 'true');
        return transformHintToTutorial(response.data.data);
      } else {
        console.warn('View increment API returned unexpected response format:', response.data);
      }
    } catch (error: any) {
      // Log detailed error information
      console.error('View increment API error:', error.message);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
    }
    
    // If API call fails or doesn't return data, increment locally but don't mark as viewed
    // This ensures we'll try again next time
    return {
      ...currentTutorial,
      views: (currentTutorial.views || 0) + 1
    };
  } catch (error) {
    console.log('Error incrementing view count:', error);
    return currentTutorial;
  }
};

export default function Hints() {
  const [activeTab, setActiveTab] = useState('essentials');
  const [activeTutorialTab, setActiveTutorialTab] = useState<'fire' | 'shelter' | 'food' | 'gear'>('fire');
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [tutorials, setTutorials] = useState<{ [key: string]: Tutorial[] }>({
    fire: [],
    shelter: [],
    food: [],
    gear: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fallback local tutorials data in case of API failure
  const localTutorials: { [key: string]: Tutorial[] } = {
    fire: [
      {
        id: 1,
        title: "5 Ways to Start a Fire Without Matches",
        image: require('../../assets/images/fire-main.jpeg'),
        description: "Master the art of fire starting using natural materials and basic tools.",
        difficulty: "Intermediate",
        timeToComplete: "15-20 mins",
        gallerySteps: [
          {
            image: require('../../assets/images/fire-step1.jpeg'),
            description: 'Start by gathering dry tinder like small twigs, dry leaves, and bark.'
          },
          {
            image: require('../../assets/images/fire-step2.jpeg'),
            description: 'Create a fire bow using a flexible branch and a shoelace.'
          },
          {
            image: require('../../assets/images/fire-step3.jpeg'),
            description: 'Position the spindle and apply downward pressure'
          },
          {
            image: require('../../assets/images/fire-step4.jpeg'),
            description: 'Use the ember to ignite your tinder bundle'
          },
          {
            image: require('../../assets/images/fire-step5.jpeg'),
            description: 'Carefully nurture the flame with small kindling'
          }
        ]
      },
      {
        id: 2,
        title: "How to Build a Campfire That Lasts All Night",
        image: require('../../assets/images/tutfire.jpeg'),
        description: "Learn to build a long-lasting, safe campfire using the teepee method.",
        difficulty: "Beginner",
        timeToComplete: "10-15 mins",
        gallerySteps: [
          {
            image: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
            description: 'Create a teepee structure around the tinder using small sticks'
          },
          {
            image: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad37?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
            description: 'Add larger logs around the teepee structure'
          }
        ]
      }
    ],
    shelter: [
      {
        id: 3,
        title: "Emergency Shelter Building Techniques",
        image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        description: "Create a weatherproof shelter using natural materials.",
        difficulty: "Advanced",
        timeToComplete: "30-45 mins",
        gallerySteps: [
          {
            image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            description: 'Find a suitable location away from hazards'
          },
          {
            image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            description: 'Gather long branches for the frame'
          }
        ]
      }
    ],
    food: [
      {
        id: 4,
        title: "3 One-Pot Camping Meals Anyone Can Make",
        image: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        description: "Master the basics of cooking delicious meals over a campfire.",
        difficulty: "Beginner",
        timeToComplete: "20-25 mins",
        gallerySteps: [
          {
            image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            description: 'Prepare your cooking equipment'
          },
          {
            image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            description: 'Start a cooking-appropriate fire'
          }
        ]
      }
    ],
    gear: [
      {
        id: 5,
        title: "Essential Gear Maintenance",
        image: "https://images.unsplash.com/photo-1445308394109-4ec2920981b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        description: "Keep your camping gear in top condition with these maintenance tips.",
        difficulty: "Intermediate",
        timeToComplete: "25-30 mins",
        gallerySteps: [
          {
            image: 'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            description: 'Clean and dry tent after each use'
          },
          {
            image: 'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            description: 'Waterproof gear regularly'
          }
        ]
      }
    ]
  };

  // Fetch hints from the backend
  const fetchHints = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      
      const response = await axios.get(`${EXPO_PUBLIC_API_URL}hints`);
      const hintsData = response.data.data || [];
      
      // Group hints by category
      const groupedTutorials: { [key: string]: Tutorial[] } = {
        fire: [],
        shelter: [],
        food: [],
        gear: []
      };
      
      hintsData.forEach((hint: BackendHint) => {
        // Ensure the category is valid, otherwise default to 'fire'
        const category = hint.category && ['fire', 'shelter', 'food', 'gear'].includes(hint.category) 
          ? hint.category 
          : 'fire';
        
        const tutorial = transformHintToTutorial(hint);
        if (groupedTutorials[category]) {
          groupedTutorials[category].push(tutorial);
        }
      });
      
      // If we have data for each category, use it; otherwise, keep the local data
      const updatedTutorials = { ...localTutorials };
      
      Object.keys(groupedTutorials).forEach(category => {
        if (groupedTutorials[category].length > 0) {
          updatedTutorials[category] = groupedTutorials[category];
        }
      });
      
      setTutorials(updatedTutorials);
      setError(null);
    } catch (error) {
      console.error('Error fetching hints:', error);
      setError('Failed to fetch hints from the server. Using local data instead.');
      setTutorials(localTutorials);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHints(true);
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchHints();
  }, []);

  // Update the openGallery function to call incrementViewCount and update UI
  const openGallery = async (tutorial: Tutorial) => {
    // Make sure the tutorial has gallerySteps and they are valid
    if (!tutorial.gallerySteps || !Array.isArray(tutorial.gallerySteps) || tutorial.gallerySteps.length === 0) {
      console.warn('Tutorial has no gallery steps:', tutorial.title);
      
      // Create a single default step if none exist
      tutorial = {
        ...tutorial,
        gallerySteps: [{
          image: tutorial.image,
          description: tutorial.description || 'No detailed steps available for this tutorial.'
        }]
      };
    }
    
    // Increment view count and get updated tutorial
    const updatedTutorial = await incrementViewCount(tutorial.id, tutorial);
    
    // Update the tutorials state to reflect the new view count
    if (updatedTutorial.views !== tutorial.views) {
      const categoryTutorials = [...(tutorials[activeTutorialTab] || [])];
      const tutorialIndex = categoryTutorials.findIndex(t => t.id === tutorial.id);
      
      if (tutorialIndex !== -1) {
        categoryTutorials[tutorialIndex] = updatedTutorial;
        setTutorials({
          ...tutorials,
          [activeTutorialTab]: categoryTutorials
        });
      }
    }
    
    setSelectedTutorial(updatedTutorial);
    setGalleryVisible(true);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={["#64FFDA"]}
          tintColor={"#64FFDA"}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Tent size={22} color="#64FFDA" />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Info size={22} color="#64FFDA" />
          <Text style={styles.sectionTitle}>Camping Hints & Tips</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Essential information to make your camping experience safe and enjoyable.
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'essentials' && styles.activeTab]}
          onPress={() => setActiveTab('essentials')}
        >
          <Text style={[styles.tabText, activeTab === 'essentials' && styles.activeTabText]}>
            Essentials
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'safety' && styles.activeTab]}
          onPress={() => setActiveTab('safety')}
        >
          <Text style={[styles.tabText, activeTab === 'safety' && styles.activeTabText]}>
            Safety
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'weather' && styles.activeTab]}
          onPress={() => setActiveTab('weather')}
        >
          <Text style={[styles.tabText, activeTab === 'weather' && styles.activeTabText]}>
            Weather
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabContent}>
        {activeTab === 'essentials' && <EssentialsTab />}
        {activeTab === 'safety' && <SafetyTab />}
        {activeTab === 'weather' && <WeatherTab />}
      </View>

      {/* Tutorials Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <BookOpen size={18} color="#64FFDA" />
          <Text style={styles.sectionTitle}>Camping Tutorials</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Step-by-step guides with detailed images to master essential camping skills.
        </Text>
        
        {/* Error message if API call fails */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <ScrollView horizontal style={styles.tutorialTabContainer}>
          {['fire', 'shelter', 'food', 'gear'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tutorialTabButton, activeTutorialTab === tab && styles.activeTutorialTab]}
              onPress={() => setActiveTutorialTab(tab as 'fire' | 'shelter' | 'food' | 'gear')}
            >
              <Text style={[styles.tutorialTabText, activeTutorialTab === tab && styles.activeTutorialTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.tutorialList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#64FFDA" />
              <Text style={styles.loadingText}>Loading tutorials...</Text>
            </View>
          ) : (tutorials[activeTutorialTab] || []).length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tutorials available for this category.</Text>
            </View>
          ) : (
            (tutorials[activeTutorialTab] || []).map((tutorial) => (
              <View key={tutorial.id} style={styles.tutorialCard}>
                <View style={styles.imageContainer}>
                  <Image 
                    source={typeof tutorial.image === 'string' ? { uri: tutorial.image } : tutorial.image} 
                    style={styles.tutorialImage} 
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.imageOverlay}
                  />
                  {tutorial.gallerySteps && (
                    <TouchableOpacity 
                      style={styles.galleryButton}
                      onPress={() => openGallery(tutorial)}
                    >
                      <Image
                        source={require('../../assets/images/image-icon.png')}
                        style={styles.imageIcon}
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.tutorialInfo}>
                  <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                  <Text style={styles.tutorialDescription}>{tutorial.description}</Text>
                  <View style={styles.tutorialMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Difficulty:</Text>
                      <Text style={styles.metaValue}>{tutorial.difficulty}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Time:</Text>
                      <Text style={styles.metaValue}>{tutorial.timeToComplete}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Views:</Text>
                      <View style={styles.metaValueRow}>
                        <Eye size={14} color="#64FFDA" style={styles.metaValueIcon} />
                        <Text style={styles.metaValue}>{tutorial.views || 0}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <TutorialGalleryModal
        isOpen={galleryVisible}
        onClose={() => setGalleryVisible(false)}
        title={selectedTutorial?.title || ''}
        steps={selectedTutorial?.gallerySteps || []}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerContent: {
    // Remove this style as it's no longer needed
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#64FFDA',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionDescription: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#374151',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  activeTabText: {
    color: '#64FFDA',
    fontWeight: 'bold',
  },
  tutorialTabContainer: {
    marginVertical: 16,
  },
  tutorialTabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  activeTutorialTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#64FFDA',
  },
  tutorialTabText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  activeTutorialTabText: {
    color: '#64FFDA',
    fontWeight: 'bold',
  },
  tutorialList: {
    marginTop: 16,
  },
  tutorialCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  tutorialImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  tutorialInfo: {
    padding: 16,
  },
  tutorialTitle: {
    color: '#F3F4F6',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  tutorialDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tutorialMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  metaValue: {
    color: '#64FFDA',
    fontSize: 14,
    fontWeight: '500',
  },
  viewGalleryButton: {
    backgroundColor: '#64FFDA',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  navButtonLeft: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  navButtonRight: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  stepIndicator: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: [{ translateX: -50 }],
    flexDirection: 'row',
    gap: 4,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeStepDot: {
    backgroundColor: '#64FFDA',
  },
  galleryContent: {
    padding: 16,
  },
  galleryTitle: {
    color: '#64FFDA',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stepText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#0A192F',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#64FFDA',
  },
  galleryDescription: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  tabContent: {
    marginTop: 16,
  },
  imageIcon: {
    width: 24,
    height: 24,
    tintColor: 'white'
  },
  galleryButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  metaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaValueIcon: {
    marginRight: 4,
  },
});
