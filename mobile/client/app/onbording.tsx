import { useState, useRef, useEffect } from "react"
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ImageBackground, Animated, FlatList } from "react-native"
import { useRouter } from "expo-router"
import AsyncStorage from '@react-native-async-storage/async-storage'
import React from "react"

const { width, height } = Dimensions.get("window")

const slides = [
  {
    id: "1",
    title: "Discover Hidden Camping Spots",
    description: "Explore the best camping destinations in Tunisia, from mountains to deserts!",
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1470&auto=format&fit=crop",
    buttonText: "Next",
  },
  {
    id: "2",
    title: "Plan & Organize Your Trips",
    description: "Create personalized trip plans with weather updates and recommendations.",
    image: "https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?q=80&w=1374&auto=format&fit=crop",
    buttonText: "Next",
  },
  {
    id: "3",
    title: "Connect & Share with the Community",
    description: "Meet fellow campers, share your adventures, and find the best camping gear!",
    image: "https://images.unsplash.com/photo-1517824806704-9040b037703b?q=80&w=1470&auto=format&fit=crop",
    buttonText: "Get Started",
  },
]

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollX = useRef(new Animated.Value(0)).current
  const slidesRef = useRef(null)
  const router = useRouter()

  const completeOnboarding = async () => {
    try {
      console.log('Completing onboarding...');
      
      // Mark that user has seen onboarding
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      console.log('Onboarding marked as complete');
      
      // Clear any existing auth tokens to ensure clean login state
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      console.log('Cleared any existing auth data');
      
      // Navigate to auth screen
      console.log('Navigating to auth screen...');
      router.replace('/auth');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // If there's an error, still try to navigate to auth
      router.replace('/auth');
    }
  }

  const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number }> }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index)
    }
  }).current

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      // Cast slidesRef.current to FlatList type to access scrollToIndex
      const flatList = slidesRef.current as any;
      flatList?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // On last slide, complete onboarding
      completeOnboarding()
    }
  }

  const Indicator = ({ scrollX }: { scrollX: Animated.Value }) => {
    return (
      <View style={styles.indicatorContainer}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width]

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1.4, 0.8],
            extrapolate: "clamp",
          })

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: "clamp",
          })

          return (
            <Animated.View
              key={`indicator-${i}`}
              style={[
                styles.indicator,
                {
                  transform: [{ scale }],
                  opacity,
                  backgroundColor: i === currentIndex ? "#ffffff" : "rgba(255, 255, 255, 0.5)",
                },
              ]}
            />
          )
        })}
      </View>
    )
  }
  const OnboardingItem = ({ item }: { item: {
    buttonText: any
    description: string
    title: string;
    image: string;
  } }) => {
  
    return (
      <View style={styles.slide}>
        <ImageBackground source={{ uri: item.image }} style={styles.image} resizeMode="cover">
          <View style={styles.overlay}>
            <View style={styles.contentContainer}>
              <Text style={styles.title}>{item.title || ''}</Text>
              <Text style={styles.description}>{item.description || ''}</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={scrollTo}>
              <Text style={styles.buttonText}>{item.buttonText}</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    )
  }
  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={slides}
        renderItem={({ item }) => <OnboardingItem item={item} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        scrollEventThrottle={32}
        onViewableItemsChanged={(info: any) => {
          if (info.viewableItems[0]?.index !== null) {
            setCurrentIndex(info.viewableItems[0].index);
          }
        }}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />
      <Indicator scrollX={scrollX} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1c24",
  },
  slide: {
    width,
    height,
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(11, 28, 36, 0.7)",
    justifyContent: "space-between",
    paddingVertical: 100,
    paddingHorizontal: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    color: "#ffffff",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 26,
  },
  button: {
    backgroundColor: "#19545c",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignSelf: "center",
    marginBottom: 50,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 50,
    width: "100%",
  },
  indicator: {
    height: 10,
    width: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
})

