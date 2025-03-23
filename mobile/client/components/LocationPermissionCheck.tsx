import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LocationService from '../services/location.service';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocationPermissionCheckProps {
  children: React.ReactNode;
}

const LocationPermissionCheck: React.FC<LocationPermissionCheckProps> = ({ children }) => {
  const { user, accessToken, checkAuth } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setChecking(true);
        if (!user) {
          setHasPermission(false);
          setChecking(false);
          return;
        }
        
        const permission = await LocationService.checkLocationPermission();
        setHasPermission(permission);
        
        // If not granted, show modal
        if (!permission) {
          setShowModal(true);
        } else {
          setShowModal(false);
        }
        
        // If user exists but permission status is different than what we have stored,
        // update the backend
        if (user?.locationPermission !== permission && user && accessToken) {
          await LocationService.updatePermissionStatus(user.id, permission, accessToken);
          // Update local user data
          await checkAuth();
        }
      } catch (error) {
        console.error('Error checking location permission:', error);
        setHasPermission(false);
      } finally {
        setChecking(false);
      }
    };
    
    checkPermission();
  }, [user, accessToken]);

  const handleRequestPermission = async () => {
    const granted = await LocationService.requestLocationPermission();
    
    if (granted && user) {
      // Update permission status in database
      await LocationService.updateLocationPermissionStatus(true);
      
      // Also get the current location when permission is granted
      const location = await LocationService.getCurrentLocation();
      if (location) {
        console.log('Location obtained:', location);
      }
      
      setShowModal(false);
      setHasPermission(true);
    } else {
      // Keep modal open with option to open settings
      LocationService.showLocationPermissionAlert();
    }
  };

  const handleOpenSettings = () => {
    LocationService.openLocationSettings();
  };

  if (!showModal || !user) {
    return <>{children}</>;
  }

  return (
    <>
      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="location" size={80} color="#64FFDA" />
            </View>
            
            <Text style={styles.title}>Enable Location Services</Text>
            
            <Text style={styles.description}>
              Campy uses your location to show nearby camping sites, provide distance information, and give you the best experience.
            </Text>
            
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="compass" size={24} color="#64FFDA" />
                <Text style={styles.featureText}>Find camping sites near you</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="map" size={24} color="#64FFDA" />
                <Text style={styles.featureText}>See distance to locations</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="navigate" size={24} color="#64FFDA" />
                <Text style={styles.featureText}>Get directions to your destination</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.allowButton}
              onPress={handleRequestPermission}
            >
              <Text style={styles.allowButtonText}>Allow Location Access</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleOpenSettings}
            >
              <Text style={styles.settingsButtonText}>Open Settings</Text>
            </TouchableOpacity>
            
            <Text style={styles.privacyNote}>
              Your location data is only used when you are using the app and never shared with third parties.
            </Text>
          </View>
        </View>
      </Modal>
      
      {children}
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1D2D50',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.3)',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(100, 255, 218, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(100, 255, 218, 0.5)',
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#CCD6F6',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  featureList: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    borderRadius: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#E6F1FF',
    marginLeft: 12,
  },
  allowButton: {
    backgroundColor: '#64FFDA',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  allowButtonText: {
    color: '#0A192F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#64FFDA',
  },
  settingsButtonText: {
    color: '#64FFDA',
    fontSize: 16,
    fontWeight: 'bold',
  },
  privacyNote: {
    fontSize: 12,
    color: '#8892B0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default LocationPermissionCheck; 