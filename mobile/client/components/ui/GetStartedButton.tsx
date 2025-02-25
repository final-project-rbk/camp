import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface GetStartedButtonProps {
  onPress: () => void;
}

export const GetStartedButton = ({ onPress }: GetStartedButtonProps) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>Get Started</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: 320,
    height: 56,
    top: 54,
    left: 10,
    borderRadius: 1000,
    backgroundColor: '#193C50',
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});