export const lightTheme = {
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  backgroundTertiary: '#EFEFEF',
  
  // Text colors
  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  
  // Primary brand colors
  primary: '#64FFDA',
  primaryDark: '#4DB4A6',
  primaryLight: '#A5FFE9',
  
  // UI element colors
  border: '#E0E0E0',
  divider: '#EEEEEE',
  shadow: 'rgba(0, 0, 0, 0.1)',
  
  // Status colors
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#0A84FF',
  
  // Card and container colors
  card: '#FFFFFF',
  cardHighlight: '#F8F8F8',
  
  // Navigation colors
  tabBar: '#FFFFFF',
  tabBarInactive: '#999999',
  tabBarActive: '#64FFDA',
  
  // Input and form colors
  input: '#FFFFFF',
  inputBorder: '#E0E0E0',
  placeholder: '#999999',
  
  // Button colors
  buttonPrimary: '#64FFDA',
  buttonSecondary: '#F5F5F5',
  buttonText: '#333333',
  buttonDisabled: '#CCCCCC',
};

export const darkTheme = {
  // Background colors
  background: '#0A192F',
  backgroundSecondary: '#112240',
  backgroundTertiary: '#1D2D50',
  
  // Text colors
  text: '#CCD6F6',
  textSecondary: '#8892B0',
  textTertiary: '#64FFDA',
  
  // Primary brand colors
  primary: '#64FFDA',
  primaryDark: '#4DB4A6',
  primaryLight: '#A5FFE9',
  
  // UI element colors
  border: 'rgba(100, 255, 218, 0.2)',
  divider: 'rgba(100, 255, 218, 0.1)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  
  // Status colors
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#0A84FF',
  
  // Card and container colors
  card: '#112240',
  cardHighlight: '#1D2D50',
  
  // Navigation colors
  tabBar: '#0A192F',
  tabBarInactive: '#8892B0',
  tabBarActive: '#64FFDA',
  
  // Input and form colors
  input: '#1D2D50',
  inputBorder: 'rgba(100, 255, 218, 0.2)',
  placeholder: '#8892B0',
  
  // Button colors
  buttonPrimary: '#64FFDA',
  buttonSecondary: '#1D2D50',
  buttonText: '#0A192F',
  buttonDisabled: '#1D2D50',
};

export type Theme = typeof lightTheme;

// Animation durations
export const THEME_ANIMATION_DURATION = 300;

// Theme transition configuration
export const themeTransition = {
  duration: THEME_ANIMATION_DURATION,
  easing: 'ease-in-out',
};

// Shared styles
export const sharedStyles = {
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xl: 16,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  shadow: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
}; 