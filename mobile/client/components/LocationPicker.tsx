import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tunisiaGovernorates, LocationType } from '@/utils/tunisiaLocations';

interface LocationPickerProps {
  value: LocationType | null;
  onChange: (location: LocationType) => void;
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGovernorate, setSelectedGovernorate] = useState<string | null>(null);
  const [step, setStep] = useState<'governorate' | 'city'>('governorate');

  useEffect(() => {
    if (value) {
      setSelectedGovernorate(value.governorate);
    }
  }, [value]);

  const handleGovernorateSelect = (governorateName: string) => {
    setSelectedGovernorate(governorateName);
    setStep('city');
  };

  const handleCitySelect = (cityName: string) => {
    onChange({
      governorate: selectedGovernorate!,
      city: cityName
    });
    setModalVisible(false);
    setStep('governorate');
  };

  const renderGovernorateItem = ({ item }: { item: typeof tunisiaGovernorates[0] }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleGovernorateSelect(item.name)}
    >
      <Text style={styles.itemText}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color="#64FFDA" />
    </TouchableOpacity>
  );

  const renderCityItem = ({ item }: { item: { id: number; name: string } }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleCitySelect(item.name)}
    >
      <Text style={styles.itemText}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color="#64FFDA" />
    </TouchableOpacity>
  );

  const selectedCities = selectedGovernorate
    ? tunisiaGovernorates.find(g => g.name === selectedGovernorate)?.cities
    : [];

  return (
    <View>
      <TouchableOpacity
        style={styles.picker}
        onPress={() => {
          setModalVisible(true);
          setStep('governorate');
        }}
      >
        <Text style={styles.pickerText}>
          {value
            ? `${value.city}, ${value.governorate}`
            : 'Select location'}
        </Text>
        <Ionicons name="location" size={20} color="#64FFDA" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          setStep('governorate');
        }}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  if (step === 'city') {
                    setStep('governorate');
                  } else {
                    setModalVisible(false);
                  }
                }}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#64FFDA" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {step === 'governorate' ? 'Select Governorate' : 'Select City'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setStep('governorate');
                }}
              >
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={step === 'governorate' ? tunisiaGovernorates : selectedCities}
              renderItem={step === 'governorate' ? renderGovernorateItem : renderCityItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.list}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1D2D50',
    borderRadius: 8,
    padding: 12,
  },
  pickerText: {
    color: '#CCD6F6',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.95)',
  },
  modalContent: {
    flex: 1,
    marginTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1D2D50',
  },
  backButton: {
    padding: 8,
  },
  modalTitle: {
    color: '#CCD6F6',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#64FFDA',
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1D2D50',
  },
  itemText: {
    color: '#CCD6F6',
    fontSize: 16,
  },
}); 