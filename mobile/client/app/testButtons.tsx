import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GetStartedButton } from '../components/ui/GetStartedButton';
import { SignupButton } from '../components/ui/SignupButton';

export const TestButtons = () => {
  return (
    <View style={styles.container}>
      <GetStartedButton 
        onPress={() => console.log('Get Started pressed')} 
      />
     
        <SignupButton 
          onPress={() => console.log('Signup pressed')} 
        />
      </View>
   
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // or any background color you prefer
  },
  buttonContainer: {
    marginTop: 120, // To avoid overlap with GetStartedButton
    gap: 16, // Space between Login and Signup buttons
    alignItems: 'center',
  },
}); 