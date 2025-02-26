import { View, Text, StyleSheet } from "react-native";

export default function Favorites() {
    return (
        <View style={styles.container}>
        <Text style={styles.text}>favorites</Text>
        </View>
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
    