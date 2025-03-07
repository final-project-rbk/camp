import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Tent, Map, Compass, Sun, Moon, Droplets, Wind, ThermometerSun, Info, AlertTriangle, CheckCircle, MapPin, Users, Calendar, Flame, Shield, BookOpen, Menu, X, ChevronLeft, Share2, Heart, Download } from "lucide-react-native";
import { useState } from "react";
import EssentialsTab from '../../components/EssentialsTab';
import SafetyTab from '../../components/SafetyTab';
import WeatherTab from '../../components/WeatherTab';
import TutorialGalleryModal from '../../components/TutorialGalleryModal';

interface Tutorial {
  id: number;
  title: string;
  image: string | any;
  description: string;
  difficulty: string;
  timeToComplete: string;
  gallerySteps?: { image: string; description: string }[];
}

const getImageUri = (image: string | any): string => {
  if (typeof image === 'string') {
    return image;
  }
  return `asset:/${image}`;
};

export default function Hints() {
  const [activeTab, setActiveTab] = useState('essentials');
  const [activeTutorialTab, setActiveTutorialTab] = useState<'fire' | 'shelter' | 'food' | 'gear'>('fire');
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  const tutorials: { [key: string]: Tutorial[] } = {
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

  const openGallery = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setGalleryVisible(true);
  };

  return (
    <ScrollView style={styles.container}>
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
          {(tutorials[activeTutorialTab] || []).map((tutorial) => (
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
                </View>
              </View>
            </View>
          ))}
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
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  galleryButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(100, 255, 218, 0.9)',
    padding: 8,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});
