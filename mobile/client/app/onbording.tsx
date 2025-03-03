import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  SafeAreaView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const App = () => {
  // Animation values
  const moonY = useRef(new Animated.Value(0)).current;
  const moonRotation = useRef(new Animated.Value(0)).current;
  const fireScale1 = useRef(new Animated.Value(1)).current;
  const fireScale2 = useRef(new Animated.Value(0.9)).current;
  const fireOpacity = useRef(new Animated.Value(0.8)).current;

  // Moon floating animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(moonY, {
          toValue: -15,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(moonY, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Moon rotation animation
    Animated.loop(
      Animated.timing(moonRotation, {
        toValue: 1,
        duration: 30000, // 30 seconds for a full rotation
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [moonY, moonRotation]);

  // Fire flickering animations
  useEffect(() => {
    interface FireAnimationParams {
      value: any;
      min: any;
      max: any;
      duration: any;
    }

    const createFireAnimation = ({ value, min, max, duration }: FireAnimationParams): Animated.CompositeAnimation => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: max,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: min,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    };

    createFireAnimation({ value: fireScale1, min: 0.9, max: 1.1, duration: 700 }).start();
    createFireAnimation({ value: fireScale2, min: 0.85, max: 1.05, duration: 500 }).start();
    createFireAnimation({ value: fireOpacity, min: 0.7, max: 1, duration: 600 }).start();
  }, [fireScale1, fireScale2, fireOpacity]);

  // Interpolate moon rotation to degrees
  const moonSpin = moonRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Sky background */}
        <Image 
          source={{ uri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sky-P4O74VD0VeAkYxUAXD59ALFy5s8GgO.png' }} 
          style={styles.skyBackground} 
          resizeMode="cover" 
        />
        
        {/* Stars */}
        <Image 
          source={{ uri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Stars-U2dtVHVNrwmUrL4rrXyoSl2vippfRZ.png' }} 
          style={styles.stars} 
          resizeMode="cover" 
        />
        
        {/* Animated Moon */}
        <Animated.View
          style={[
            styles.moonContainer,
            {
              transform: [
                { translateY: moonY },
                { rotate: moonSpin },
              ],
            },
          ]}
        >
          <Image 
            source={{ uri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Moon-zPVfkjllg1i4DBN64UVNfsraVgkT8d.png' }} 
            style={styles.moon} 
            resizeMode="contain" 
          />
        </Animated.View>
        
        {/* Hills and Trees */}
        <View style={styles.landscapeContainer}>
          <Image 
            source={{ uri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hills%20and%20trees-q9t2JWCRvFB76KWgRMksWZ81RRpozc.png' }} 
            style={styles.landscape} 
            resizeMode="stretch" 
          />
        </View>
        
        {/* Tent */}
        <View style={styles.tentContainer}>
          <Image 
            source={{ uri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tent-WlkeLGHB2WkMFJn42WytTl9c0jtIsu.png' }} 
            style={styles.tent} 
            resizeMode="contain" 
          />
        </View>
        
        {/* Animated Fire */}
        <View style={styles.fireContainer}>
          <Animated.View
            style={[
              styles.fireGlow,
              {
                opacity: fireOpacity,
                transform: [{ scale: fireScale2 }],
              },
            ]}
          />
          <Animated.Image
            source={{ uri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Fire-oEDx1qhwDiUeDCYkRe0smiImm1UMAs.png' }}
            style={[
              styles.fire,
              {
                transform: [{ scale: fireScale1 }],
              },
            ]}
            resizeMode="contain"
          />
        </View>
        
        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Camp-tastic!</Text>
          <Text style={styles.quote}>
            "the most wonderful, awe-inspiring and{'\n'}
            simply fantastic camping experiences"
          </Text>
        </View>
        
        {/* Button */}
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Get Started!</Text>
        </TouchableOpacity>
        
        {/* Bottom Line */}
        <View style={styles.bottomLine} />
      </View>
    </SafeAreaView>
  );
};

    const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F2231',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
    position: 'relative',
  },
  skyBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  stars: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    opacity: 0.8,
  },
  moonContainer: {
    position: 'absolute',
    top: '10%',
    right: '15%',
    width: 80,
    height: 80,
    zIndex: 10,
  },
  moon: {
    width: '100%',
    height: '100%',
  },
  landscapeContainer: {
    position: 'absolute',
    bottom: '40%',
    width: '100%',
    height: '20%',
    zIndex: 20,
  },
  landscape: {
    width: '100%',
    height: '100%',
  },
  tentContainer: {
    position: 'absolute',
    bottom: '30%',
    left: '20%',
    width: 150,
    height: 100,
    zIndex: 30,
  },
  tent: {
    width: '100%',
    height: '100%',
  },
  fireContainer: {
    position: 'absolute',
    bottom: '28%',
    right: '25%',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  fireGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 165, 0, 0.3)',
    zIndex: 39,
  },
  fire: {
    width: '100%',
    height: '100%',
    zIndex: 40,
  },
  textContainer: {
    position: 'absolute',
    bottom: '15%',
    alignItems: 'center',
    zIndex: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 5,
  },
  phonetic: {
    fontSize: 16,
    color: '#4ECDC4',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  quote: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  button: {
    position: 'absolute',
    bottom: '5%',
    backgroundColor: '#1D3E53',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
    zIndex: 60,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomLine: {
    position: 'absolute',
    bottom: '2%',
    width: 50,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    opacity: 0.5,
  },
});

export default App;