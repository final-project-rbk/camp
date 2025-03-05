import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tent, Flame, Droplets, Map, Sun, Moon } from 'lucide-react-native';

const EssentialsTab: React.FC = () => {
  const essentials = [
    { icon: <Tent size={20} color="#64FFDA" />, name: 'Shelter', description: 'Tent, tarp, sleeping bag, sleeping pad' },
    { icon: <Flame size={20} color="#64FFDA" />, name: 'Fire', description: 'Matches, lighter, fire starter, kindling' },
    { icon: <Droplets size={20} color="#64FFDA" />, name: 'Water', description: 'Water bottles, filter, purification tablets' },
    { icon: <Map size={20} color="#64FFDA" />, name: 'Navigation', description: 'Map, compass, GPS device, trail guide' },
    { icon: <Sun size={20} color="#64FFDA" />, name: 'Clothing', description: 'Weather-appropriate layers, rain gear, extra socks' },
    { icon: <Moon size={20} color="#64FFDA" />, name: 'Lighting', description: 'Headlamp, flashlight, lantern, extra batteries' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        These essential items will ensure you're prepared for your camping adventure. 
        Always pack according to your specific needs and the environment you'll be in.
      </Text>
      
      <View style={styles.grid}>
        {essentials.map((item, index) => (
          <View key={index} style={styles.item}>
            <View style={styles.iconContainer}>
              {item.icon}
            </View>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.descriptionText}>{item.description}</Text>
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
    fontSize: 14,
    marginBottom: 16,
  },
  grid: {
    gap: 12,
  },
  item: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    backgroundColor: '#0A192F',
    padding: 8,
    borderRadius: 6,
  },
  name: {
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '500',
  },
  descriptionText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});

export default EssentialsTab; 