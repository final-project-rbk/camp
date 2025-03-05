import React from 'react';
import { View, Text, StyleSheet } from "react-native";
import { Stack } from 'expo-router';

export default function HintsScreen() {
    return (
        <>
            <Stack.Screen 
                options={{
                    title: 'Hints',
                    headerStyle: { backgroundColor: '#0A192F' },
                    headerTintColor: '#64FFDA'
                }}
            />
            <View style={styles.container}>
                <Text style={styles.text}>hints</Text>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0A192F',
    },
    text: {
        color: '#64FFDA',
        fontSize: 20,
    },
}); 