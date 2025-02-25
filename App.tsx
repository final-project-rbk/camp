import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TestButtons } from './client/components/TestButtons'; // Adjust the path as necessary

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="TestButtons">
        <Stack.Screen 
          name="TestButtons" 
          component={TestButtons} 
          options={{ title: 'Welcome' }} // Optional: Set the title of the screen
        />
        {/* Add other screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App; 