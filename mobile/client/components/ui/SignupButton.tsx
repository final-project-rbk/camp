import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface SignupButtonProps {
  onPress: () => void;
}

export const SignupButton = ({ onPress }: SignupButtonProps) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>Sign Up</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 320,
    height: 56,
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