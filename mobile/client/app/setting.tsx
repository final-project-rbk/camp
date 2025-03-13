import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  Switch,
  Linking,
  Image 
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { TAB_BAR_HEIGHT } from '../components/TabBar';

export default function Setting() {
  // State for toggle settings
  const [toggleSettings, setToggleSettings] = useState({
    tripReminders: true,
    eventAlerts: true,
    marketplaceUpdates: true,
    communityActivity: false,
    weatherAlerts: true,
    offlineMode: false,
    locationSharing: true,
  });

  // Toggle setting handler
  const toggleSetting = (setting: string) => {
    setToggleSettings({
      ...toggleSettings,
      [setting]: !toggleSettings[setting as keyof typeof toggleSettings]
    });
  };

  // Handle contact methods
  const handleContact = (method: string, value: string) => {
    switch (method) {
      case 'email':
        Linking.openURL(`mailto:${value}`);
        break;
      case 'phone':
        Linking.openURL(`tel:${value}`);
        break;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: TAB_BAR_HEIGHT + 20 }]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        
        {/* App Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.card}>
            <View style={styles.logoContainer}>
              <Image 
                source={{ uri: 'https://tse2.mm.bing.net/th?id=OIP.K2x67hQ69-pwC-YodDsU_AHaEK&pid=Api&P=0&h=180' }} 
                style={styles.logo} 
              />
              <View>
                <Text style={styles.appName}>Campy</Text>
                <Text style={styles.appVersion}>Version 1.0.0</Text>
              </View>
            </View>
            
            <Text style={styles.cardTitle}>About Campy</Text>
            <Text style={styles.cardText}>
              Campy is a mobile app designed to make camping in Tunisia easier and more enjoyable. 
              It helps users discover top camping destinations, get personalized trip recommendations, 
              and connect with a community of outdoor enthusiasts. With features like an itinerary planner, 
              a marketplace for camping gear, and real-time event updates, Campy is your all-in-one travel 
              companion for unforgettable adventures.
            </Text>
          </View>
        </View>
        
        {/* Contact Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <Text style={styles.sectionSubtitle}>Need help? Our support team is here for you!</Text>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleContact('email', 'support@campyapp.com')}
          >
            <View style={styles.contactIconContainer}>
              <Ionicons name="mail-outline" size={24} color="#64FFDA" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>support@campyapp.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8892B0" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleContact('phone', '+216XXXXXXXX')}
          >
            <View style={styles.contactIconContainer}>
              <Ionicons name="call-outline" size={24} color="#64FFDA" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>+216 XXX XXX XXX</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8892B0" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactItem}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="chatbubble-outline" size={24} color="#64FFDA" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Live Chat</Text>
              <Text style={styles.contactValue}>Available 9 AM - 6 PM</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8892B0" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => Linking.openURL('https://maps.google.com/?q=Tunis,Tunisia')}
          >
            <View style={styles.contactIconContainer}>
              <Ionicons name="location-outline" size={24} color="#64FFDA" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Address</Text>
              <Text style={styles.contactValue}>Tunis, Tunisia</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8892B0" />
          </TouchableOpacity>
        </View>
        
        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          {/* Language & Region */}
          <View style={styles.preferencesGroup}>
            <Text style={styles.preferencesGroupTitle}>
              <Ionicons name="language-outline" size={20} color="#64FFDA" style={styles.prefIcon} />
              Language & Region
            </Text>
            
            <TouchableOpacity style={styles.preferencesItem}>
              <Text style={styles.preferencesLabel}>App Language</Text>
              <View style={styles.preferencesValue}>
                <Text style={styles.preferencesValueText}>English</Text>
                <Ionicons name="chevron-forward" size={18} color="#8892B0" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.preferencesItem}>
              <Text style={styles.preferencesLabel}>Currency</Text>
              <View style={styles.preferencesValue}>
                <Text style={styles.preferencesValueText}>TND</Text>
                <Ionicons name="chevron-forward" size={18} color="#8892B0" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.preferencesItem}>
              <Text style={styles.preferencesLabel}>Measurement Units</Text>
              <View style={styles.preferencesValue}>
                <Text style={styles.preferencesValueText}>Kilometers</Text>
                <Ionicons name="chevron-forward" size={18} color="#8892B0" />
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Notifications */}
          <View style={styles.preferencesGroup}>
            <Text style={styles.preferencesGroupTitle}>
              <Ionicons name="notifications-outline" size={20} color="#64FFDA" style={styles.prefIcon} />
              Notifications
            </Text>
            
            <View style={styles.preferencesItem}>
              <Text style={styles.preferencesLabel}>Trip Reminders</Text>
              <Switch
                trackColor={{ false: "#1D2D50", true: "rgba(100, 255, 218, 0.3)" }}
                thumbColor={toggleSettings.tripReminders ? "#64FFDA" : "#8892B0"}
                ios_backgroundColor="#1D2D50"
                onValueChange={() => toggleSetting('tripReminders')}
                value={toggleSettings.tripReminders}
              />
            </View>
            
            <View style={styles.preferencesItem}>
              <Text style={styles.preferencesLabel}>Event Alerts</Text>
              <Switch
                trackColor={{ false: "#1D2D50", true: "rgba(100, 255, 218, 0.3)" }}
                thumbColor={toggleSettings.eventAlerts ? "#64FFDA" : "#8892B0"}
                ios_backgroundColor="#1D2D50"
                onValueChange={() => toggleSetting('eventAlerts')}
                value={toggleSettings.eventAlerts}
              />
            </View>
            
            <View style={styles.preferencesItem}>
              <Text style={styles.preferencesLabel}>Marketplace Updates</Text>
              <Switch
                trackColor={{ false: "#1D2D50", true: "rgba(100, 255, 218, 0.3)" }}
                thumbColor={toggleSettings.marketplaceUpdates ? "#64FFDA" : "#8892B0"}
                ios_backgroundColor="#1D2D50"
                onValueChange={() => toggleSetting('marketplaceUpdates')}
                value={toggleSettings.marketplaceUpdates}
              />
            </View>
            
            <View style={styles.preferencesItem}>
              <Text style={styles.preferencesLabel}>Community Activity</Text>
              <Switch
                trackColor={{ false: "#1D2D50", true: "rgba(100, 255, 218, 0.3)" }}
                thumbColor={toggleSettings.communityActivity ? "#64FFDA" : "#8892B0"}
                ios_backgroundColor="#1D2D50"
                onValueChange={() => toggleSetting('communityActivity')}
                value={toggleSettings.communityActivity}
              />
            </View>
          </View>
          
          {/* Display & Accessibility */}
          <View style={styles.preferencesGroup}>
            <Text style={styles.preferencesGroupTitle}>
              <Ionicons name="color-palette-outline" size={20} color="#64FFDA" style={styles.prefIcon} />
              Display & Accessibility
            </Text>
            
            <TouchableOpacity style={styles.preferencesItem}>
              <Text style={styles.preferencesLabel}>Theme Mode</Text>
              <View style={styles.preferencesValue}>
                <Text style={styles.preferencesValueText}>Dark</Text>
                <Ionicons name="chevron-forward" size={18} color="#8892B0" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.preferencesItem}>
              <Text style={styles.preferencesLabel}>Font Size</Text>
              <View style={styles.preferencesValue}>
                <Text style={styles.preferencesValueText}>Medium</Text>
                <Ionicons name="chevron-forward" size={18} color="#8892B0" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.preferencesItem}>
              <Text style={styles.preferencesLabel}>Map Style</Text>
              <View style={styles.preferencesValue}>
                <Text style={styles.preferencesValueText}>Standard</Text>
                <Ionicons name="chevron-forward" size={18} color="#8892B0" />
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Camping & Travel Preferences */}
          <View style={styles.preferencesGroup}>
            <Text style={styles.preferencesGroupTitle}>
              <Ionicons name="compass-outline" size={20} color="#64FFDA" style={styles.prefIcon} />
              Camping & Travel Preferences
            </Text>
            
            <TouchableOpacity style={styles.preferencesItem}>
              <Text style={styles.preferencesLabel}>Preferred Destinations</Text>
              <View style={styles.preferencesValue}>
                <Text style={styles.preferencesValueText}>Mountains, Forests</Text>
                <Ionicons name="chevron-forward" size={18} color="#8892B0" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.preferencesItem}>
              <Text style={styles.preferencesLabel}>Trip Duration</Text>
              <View style={styles.preferencesValue}>
                <Text style={styles.preferencesValueText}>Medium (4-7 days)</Text>
                <Ionicons name="chevron-forward" size={18} color="#8892B0" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.preferencesItem}>
              <Text style={styles.preferencesLabel}>Weather Alerts</Text>
              <Switch
                trackColor={{ false: "#1D2D50", true: "rgba(100, 255, 218, 0.3)" }}
                thumbColor={toggleSettings.weatherAlerts ? "#64FFDA" : "#8892B0"}
                ios_backgroundColor="#1D2D50"
                onValueChange={() => toggleSetting('weatherAlerts')}
                value={toggleSettings.weatherAlerts}
              />
            </View>
            
            <View style={styles.preferencesItem}>
              <Text style={styles.preferencesLabel}>Offline Mode</Text>
              <Switch
                trackColor={{ false: "#1D2D50", true: "rgba(100, 255, 218, 0.3)" }}
                thumbColor={toggleSettings.offlineMode ? "#64FFDA" : "#8892B0"}
                ios_backgroundColor="#1D2D50"
                onValueChange={() => toggleSetting('offlineMode')}
                value={toggleSettings.offlineMode}
              />
            </View>
          </View>
          
          {/* Privacy & Security */}
          <View style={styles.preferencesGroup}>
            <Text style={styles.preferencesGroupTitle}>
              <Ionicons name="shield-outline" size={20} color="#64FFDA" style={styles.prefIcon} />
              Privacy & Security
            </Text>
            
            <View style={styles.preferencesItem}>
              <Text style={styles.preferencesLabel}>Location Sharing</Text>
              <Switch
                trackColor={{ false: "#1D2D50", true: "rgba(100, 255, 218, 0.3)" }}
                thumbColor={toggleSettings.locationSharing ? "#64FFDA" : "#8892B0"}
                ios_backgroundColor="#1D2D50"
                onValueChange={() => toggleSetting('locationSharing')}
                value={toggleSettings.locationSharing}
              />
            </View>
            
            <TouchableOpacity style={styles.preferencesItem}>
              <Text style={styles.preferencesLabel}>Profile Visibility</Text>
              <View style={styles.preferencesValue}>
                <Text style={styles.preferencesValueText}>Public</Text>
                <Ionicons name="chevron-forward" size={18} color="#8892B0" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.preferencesItem}>
              <Text style={styles.preferencesLabel}>Block/Report Users</Text>
              <View style={styles.preferencesValue}>
                <Text style={styles.preferencesValueText}>Manage</Text>
                <Ionicons name="chevron-forward" size={18} color="#8892B0" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerButton}>
            <Text style={styles.footerButtonText}>Terms & Conditions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButton}>
            <Text style={styles.footerButtonText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={18} color="#FF6B6B" style={{marginRight: 8}} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#CCD6F6',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#64FFDA',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8892B0',
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'rgba(29, 45, 80, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appVersion: {
    fontSize: 14,
    color: '#8892B0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#8892B0',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 45, 80, 0.5)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.1)',
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#CCD6F6',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 14,
    color: '#8892B0',
  },
  preferencesGroup: {
    backgroundColor: 'rgba(29, 45, 80, 0.5)',
    borderRadius: 12,
    marginBottom: 16,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.1)',
  },
  preferencesGroupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#CCD6F6',
    padding: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefIcon: {
    marginRight: 8,
  },
  preferencesItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 255, 218, 0.1)',
  },
  preferencesLabel: {
    fontSize: 15,
    color: '#CCD6F6',
  },
  preferencesValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferencesValueText: {
    fontSize: 14,
    color: '#64FFDA',
    marginRight: 8,
  },
  footer: {
    marginTop: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 255, 218, 0.1)',
    alignItems: 'center',
  },
  footerButton: {
    paddingVertical: 12,
  },
  footerButtonText: {
    fontSize: 14,
    color: '#8892B0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
});
    