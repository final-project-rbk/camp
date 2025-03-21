import React, { Component } from 'react';
import { View, TouchableWithoutFeedback, StyleSheet, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Tab {
  name: string;
  ionIconName: string;
  route: string;
}

type Props = {
  tabs: Tab[];
  value: Animated.Value;
  activeIndex: number;
  onTabPress: (index: number) => void;
};

export const tabHeight = 70;
const { width } = Dimensions.get('window');

export default class StaticTabbar extends Component<Props> {
  values: Animated.Value[] = [];

  constructor(props: Props) {
    super(props);
    const { tabs, activeIndex } = this.props;
    this.values = tabs.map((tab, index) => new Animated.Value(index === activeIndex ? 1 : 0));
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.activeIndex !== this.props.activeIndex) {
      this.onPress(this.props.activeIndex);
    }
  }

  onPress = (index: number) => {
    const { value, tabs, onTabPress } = this.props;
    const tabWidth = width / tabs.length;
    
    Animated.sequence([
      ...this.values.map(value => Animated.timing(value, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      })),

      Animated.parallel([
        Animated.spring(this.values[index], {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(value, {
          toValue: -width + tabWidth * index,
          useNativeDriver: true,
        })
      ]),
    ]).start();

    onTabPress(index);
  };

  render() {
    const { tabs, value } = this.props;
    const tabWidth = width / tabs.length;
    
    return (
      <View style={styles.container}>
        {tabs.map(({ ionIconName }, index) => {
          const activeValue = this.values[index];

          const opacity = value.interpolate({
            inputRange: [
              -width + tabWidth * (index - 1),
              -width + tabWidth * index,
              -width + tabWidth * (index + 1),
            ],
            outputRange: [1, 0, 1],
            extrapolate: 'clamp'
          });

          const translateY = activeValue.interpolate({
            inputRange: [0, 1],
            outputRange: [tabHeight, 0]
          });

          return (
            <React.Fragment key={index}>
              <TouchableWithoutFeedback onPress={() => this.onPress(index)}>
                <Animated.View style={[styles.tab, { opacity }]}>
                  <Ionicons name={ionIconName as any} size={25} color="#8892B0" />
                </Animated.View>
              </TouchableWithoutFeedback>

              <Animated.View
                style={{
                  position: 'absolute',
                  top: -8,
                  width: tabWidth,
                  left: tabWidth * index,
                  height: tabHeight,
                  justifyContent: 'center',
                  alignItems: 'center',
                  transform: [{ translateY }]
                }}>
                <View style={[
                  styles.circle, 
                  index === 2 && styles.homeCircle
                ]}>
                  <Ionicons 
                    name={ionIconName as any} 
                    size={index === 2 ? 30 : 25} 
                    color={index === 2 ? "#64FFDA" : "#0A192F"} 
                  />
                </View>
              </Animated.View>
            </React.Fragment>
          );
        })}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    height: tabHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 60,
    height: 60,
    marginTop: 10,
    borderRadius: 50,
    backgroundColor: '#64FFDA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  homeCircle: {
    backgroundColor: '#0A192F',
    width: 65,
    height: 65,
    borderWidth: 2,
    borderColor: '#64FFDA',
    elevation: 8,
    shadowOpacity: 0.35,
    shadowRadius: 6,
  }
}); 