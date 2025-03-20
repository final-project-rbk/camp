import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, Shield, ThermometerSun, MapPin, Zap, Info, Phone } from 'lucide-react-native';

const SafetyTab: React.FC = () => {
  const safetyTips = [
    { 
      icon: <AlertTriangle size={20} color="#64FFDA" />, 
      title: 'Wildlife Awareness', 
      description: 'Store food properly,make noise while hiking,and know how to respond to wildlife encounters.' 
    },
    { 
      icon: <Shield size={20} color="#64FFDA" />, 
      title: 'Campfire Safety', 
      description: 'Never leave fires unattended, keep water nearby, and fully extinguish before leaving or sleeping.' 
    },
    { 
      icon: <ThermometerSun size={20} color="#64FFDA" />, 
      title: 'Weather Preparedness', 
      description: 'Check forecasts, pack for changing conditions,know signs of hypothermia and heat exhaustion.' 
    },
    { 
      icon: <MapPin size={20} color="#64FFDA" />, 
      title: 'Navigation', 
      description: 'Carry maps , mark your campsite, inform others of your plans.' 
    },
    { 
      icon: <Zap size={20} color="#64FFDA" />, 
      title: 'Severe Weather', 
      description: 'Know what to do during lightning, high winds, or flash floods. ' 
    },
    { 
      icon: <Info size={20} color="#64FFDA" />, 
      title: 'Poisonous Plants', 
      description: 'Learn to identify poison ivy, oak, and sumac. Wash skin and clothing after contact.' 
    },
    { 
      icon: <Phone size={20} color="#64FFDA" />, 
      title: 'Emergency Contact', 
      description: 'Have emergency contacts, know your exact location,carry a whistle for signaling and stay aware of your surroundings.' 
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Safety should always be your top priority when camping. These tips will help you prepare for and respond to common camping hazards.
      </Text>
      
      <View style={styles.grid}>
        {safetyTips.map((tip, index) => (
          <View key={index} style={styles.item}>
            <View style={styles.iconContainer}>
              {tip.icon}
            </View>
            <View>
              <Text style={styles.title}>{tip.title}</Text>
              <Text style={styles.descriptionText}>{tip.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  description: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 16,
  },
  grid: {
    gap: 12,
  },
  item: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  iconContainer: {
    backgroundColor: '#0A192F',
    padding: 6,
    borderRadius: 6,
  },
  title: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '500',
  },
  descriptionText: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 16,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
});

export default SafetyTab; 