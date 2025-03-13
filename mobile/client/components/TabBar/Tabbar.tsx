import React, { useState, useEffect } from 'react';
import { View, Dimensions, StyleSheet, Animated, Platform } from 'react-native';
import * as shape from 'd3-shape';
import Svg, { Path } from 'react-native-svg';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StaticTabbar, { tabHeight as height } from './StaticTabbar';

const { width } = Dimensions.get('window');

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

// Define our tab configurations
const tabs = [
  { name: 'Market', ionIconName: 'cart-outline', route: '/(tabs)/market' },
  { name: 'Favorites', ionIconName: 'heart', route: '/(tabs)/favorites' },
  { name: 'Home', ionIconName: 'home', route: '/(tabs)/home' },
  { name: 'Hints', ionIconName: 'bulb', route: '/(tabs)/hints' },
  { name: 'Story', ionIconName: 'book', route: '/(tabs)/story' },
];

const tabWidth = width / tabs.length;

// Define point type
interface Point {
  x: number;
  y: number;
}

const getPath = (): string => {
  const left = shape.line<Point>()
    .x(d => d.x)
    .y(d => d.y)([
      { x: 0, y: 0 },
      { x: width, y: 0 },
    ]);
    
  const tab = shape.line<Point>()
    .x(d => d.x)
    .y(d => d.y)
    .curve(shape.curveBasis)([
      { x: width, y: 0 },
      { x: width + 5, y: 0 },
      { x: width + 10, y: 10 },
      { x: width + 10, y: height },
      { x: width + tabWidth - 10, y: height },
      { x: width + tabWidth - 10, y: 10 },
      { x: width + tabWidth - 5, y: 0 },
      { x: width + tabWidth, y: 0 },
    ]);
    
  const right = shape.line<Point>()
    .x(d => d.x)
    .y(d => d.y)([
      { x: width + tabWidth, y: 0 },
      { x: width * 2, y: 0 },
      { x: width * 2, y: height },
      { x: 0, y: height },
      { x: 0, y: 0 },
    ]);
    
  return `${left} ${tab} ${right}`;
};

const d = getPath();

// Export the tabBar height for other components to use
export const TAB_BAR_HEIGHT = height + 34; // Tab height + safe area

export default function Tabbar() {
  const translateX = React.useRef(new Animated.Value(-width)).current;
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Calculate the safe area height
  const safeAreaHeight = Platform.OS === 'ios' ? insets.bottom : 0;

  // Determine active tab based on current route
  useEffect(() => {
    const currentTabIndex = tabs.findIndex(tab => 
      pathname.startsWith(tab.route.replace('/(tabs)', ''))
    );
    if (currentTabIndex >= 0 && currentTabIndex !== activeIndex) {
      setActiveIndex(currentTabIndex);
    }
  }, [pathname]);

  const handleTabPress = (index: number) => {
    setActiveIndex(index);
    // Use type assertion to handle the router.push type error
    router.push(tabs[index].route as any);
  };

  return (
    <View style={[styles.container, { paddingBottom: safeAreaHeight }]}>
      <AnimatedSvg
        width={width * 2}
        height={height}
        style={{
          transform: [{ translateX }],
          backgroundColor: 'transparent',
        }}
      >
        <Path 
          d={d} 
          fill="#0A192F"
          stroke="#1D2D50" 
          strokeWidth={1}
        />
      </AnimatedSvg>
      <View style={[StyleSheet.absoluteFill, { height }]}>
        <StaticTabbar
          value={translateX}
          tabs={tabs}
          activeIndex={activeIndex}
          onTabPress={handleTabPress}
        />
      </View>
      {Platform.OS === 'ios' && <View style={[styles.safeArea, { height: safeAreaHeight }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  safeArea: {
    backgroundColor: '#0A192F',
  },
}); 