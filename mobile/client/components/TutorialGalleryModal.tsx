import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';

interface TutorialStep {
  image: string | any;  // Updated to handle both string URLs and required images
  description: string;
}

interface TutorialGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  steps: TutorialStep[];
}

// Helper function to handle different image types
const getImageSource = (image: string | any) => {
  if (typeof image === 'string') {
    return { uri: image };
  }
  return image;
};

const TutorialGalleryModal: React.FC<TutorialGalleryModalProps> = ({
  isOpen,
  onClose,
  title,
  steps,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [validSteps, setValidSteps] = useState<TutorialStep[]>([]);
  
  // Reset currentStep when steps change or modal opens/closes
  useEffect(() => {
    if (isOpen && Array.isArray(steps) && steps.length > 0) {
      // Filter out any invalid steps that don't have image or description
      const filtered = steps.filter(step => 
        step && (step.image || step.description)
      );
      setValidSteps(filtered);
      setCurrentStep(0); // Reset to first step when modal opens
    } else {
      setValidSteps([]);
    }
  }, [isOpen, steps]);

  if (!isOpen) return null;

  // If there are no valid steps, show a placeholder
  if (!validSteps || validSteps.length === 0) {
    return (
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#64FFDA" />
          </TouchableOpacity>
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>No tutorial steps available.</Text>
          </View>
        </View>
      </View>
    );
  }

  // Ensure currentStep is within bounds
  const safeCurrentStep = Math.min(currentStep, validSteps.length - 1);
  const currentStepData = validSteps[safeCurrentStep];

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % validSteps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + validSteps.length) % validSteps.length);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        {/* Close button */}
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color="#64FFDA" />
        </TouchableOpacity>

        {/* Image container */}
        <View style={styles.imageContainer}>
          <Image
            source={getImageSource(currentStepData.image)}
            style={styles.image}
            resizeMode="cover"
            defaultSource={require('../assets/images/icon.png')} // Fallback image
          />
          
          {/* Navigation arrows */}
          {validSteps.length > 1 && (
            <>
              <TouchableOpacity onPress={prevStep} style={styles.navButtonLeft}>
                <ChevronLeft size={24} color="#64FFDA" />
              </TouchableOpacity>
              <TouchableOpacity onPress={nextStep} style={styles.navButtonRight}>
                <ChevronRight size={24} color="#64FFDA" />
              </TouchableOpacity>
            </>
          )}

          {/* Step indicator */}
          {validSteps.length > 1 && (
            <View style={styles.stepIndicator}>
              {validSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.stepDot,
                    index === safeCurrentStep && styles.activeStepDot
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {validSteps.length > 1 && (
            <View style={styles.progressContainer}>
              <Text style={styles.stepText}>
                Step {safeCurrentStep + 1} of {validSteps.length}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${((safeCurrentStep + 1) / validSteps.length) * 100}%` }
                  ]}
                />
              </View>
            </View>
          )}
          <Text style={styles.description}>{currentStepData.description || 'No description available'}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
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
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  image: {
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
  content: {
    padding: 16,
  },
  title: {
    color: '#64FFDA',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressContainer: {
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
  description: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});

export default TutorialGalleryModal; 