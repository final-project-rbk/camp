import { useTheme } from '../context/ThemeContext';
import { darkTheme, lightTheme, Theme, sharedStyles } from '../constants/theme';

export function useAppTheme() {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;

  return {
    colors: theme,
    isDark,
    styles: sharedStyles,
    // Helper functions for commonly used style combinations
    getBackgroundStyle: (variant?: 'primary' | 'secondary' | 'tertiary') => {
      switch (variant) {
        case 'secondary':
          return { backgroundColor: theme.backgroundSecondary };
        case 'tertiary':
          return { backgroundColor: theme.backgroundTertiary };
        default:
          return { backgroundColor: theme.background };
      }
    },
    getTextStyle: (variant?: 'primary' | 'secondary' | 'tertiary') => {
      switch (variant) {
        case 'secondary':
          return { color: theme.textSecondary };
        case 'tertiary':
          return { color: theme.textTertiary };
        default:
          return { color: theme.text };
      }
    },
    getBorderStyle: (width: number = 1) => ({
      borderWidth: width,
      borderColor: theme.border,
    }),
    getShadowStyle: (size: 'small' | 'medium' | 'large' = 'small') => ({
      ...sharedStyles.shadow[size],
      shadowColor: theme.shadow,
    }),
    getCardStyle: (highlighted?: boolean) => ({
      backgroundColor: highlighted ? theme.cardHighlight : theme.card,
      borderRadius: sharedStyles.borderRadius.medium,
      ...sharedStyles.shadow.small,
      shadowColor: theme.shadow,
    }),
    getButtonStyle: (variant: 'primary' | 'secondary' = 'primary', disabled?: boolean) => {
      if (disabled) {
        return {
          backgroundColor: theme.buttonDisabled,
          opacity: 0.7,
        };
      }
      return {
        backgroundColor: variant === 'primary' ? theme.buttonPrimary : theme.buttonSecondary,
      };
    },
    getInputStyle: () => ({
      backgroundColor: theme.input,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      color: theme.text,
      borderRadius: sharedStyles.borderRadius.medium,
      padding: sharedStyles.spacing.md,
    }),
  };
} 