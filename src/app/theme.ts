// app/theme.ts - Updated with no blue colors
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Define the color mode config
const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

// Custom color palette without blues
const colors = {
  // New primary color - purple replacing blue
  brand: {
    50: '#f8f0ff',
    100: '#e9d5ff',
    200: '#d8b4fe',
    300: '#c084fc',
    400: '#a855f7',
    500: '#9333ea',
    600: '#7e22ce',
    700: '#6b21a8',
    800: '#581c87',
    900: '#4c1d95',
  },
  gray: {
    50: '#f7fafc',
    100: '#edf2f7',
    200: '#e2e8f0',
    300: '#cbd5e0',
    400: '#a0aec0',
    500: '#718096',
    600: '#4a5568',
    700: '#2d3748',
    750: '#222836', // Custom intermediate shade
    800: '#1a202c',
    900: '#171923',
  },
  accent: {
    50: '#fff5f5',
    100: '#fed7d7',
    200: '#feb2b2',
    300: '#fc8181',
    400: '#f56565',
    500: '#e53e3e',
    600: '#c53030',
    700: '#9b2c2c',
    800: '#822727',
    900: '#63171b',
  },
  // Teal replaced with emerald green
  teal: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  // Gold/amber for highlights
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
};

// Component style overrides
const components = {
  Button: {
    baseStyle: {
      borderRadius: 'md',
    },
    variants: {
      solid: {
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
        },
      },
      outline: {
        borderColor: 'brand.400',
        color: 'brand.300', 
        _hover: {
          bg: 'rgba(168, 85, 247, 0.15)', // Semi-transparent brand color
        },
      },
      ghost: {
        color: 'gray.300',
        _hover: {
          bg: 'gray.700',
        },
      },
      // High contrast option
      'high-contrast': {
        bg: 'amber.400',
        color: 'gray.900', // Dark text on amber background for maximum contrast
        _hover: {
          bg: 'amber.300',
        },
      },
      // Secondary theme color - green
      'secondary': {
        bg: 'teal.500',
        color: 'white',
        _hover: {
          bg: 'teal.600',
        },
      },
    },
    defaultProps: {
      variant: 'solid',
      colorScheme: 'brand',
    },
  },
  IconButton: {
    baseStyle: {
      borderRadius: 'md',
    },
    variants: {
      solid: {
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
        },
      },
      outline: {
        borderColor: 'brand.400',
        color: 'brand.300',
        _hover: {
          bg: 'rgba(168, 85, 247, 0.15)',
        },
      },
      ghost: {
        color: 'gray.300',
        _hover: {
          bg: 'gray.700',
        },
      },
      'secondary': {
        bg: 'teal.500',
        color: 'white',
        _hover: {
          bg: 'teal.600',
        },
      },
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: 'md',
    },
    variants: {
      solid: (props: { colorScheme: string }) => ({
        bg: `${props.colorScheme}.500`,
        color: 'white',
      }),
      subtle: (props: { colorScheme: string }) => ({
        bg: `${props.colorScheme}.100`,
        color: `${props.colorScheme}.800`,
      }),
      outline: (props: { colorScheme: string }) => ({
        color: `${props.colorScheme}.500`,
        boxShadow: `inset 0 0 0px 1px ${props.colorScheme}.500`,
      }),
    },
    defaultProps: {
      variant: 'solid',
      colorScheme: 'brand',
    },
  },
  Tabs: {
    baseStyle: {
      tab: {
        _selected: {
          color: 'brand.300',
        },
      },
    },
  },
};

// Define semantic tokens
const semanticTokens = {
  colors: {
    bg: {
      default: 'gray.900',
      _dark: 'gray.900',
    },
    bgAlt: {
      default: 'gray.800',
      _dark: 'gray.800',
    },
    text: {
      default: 'gray.100',
      _dark: 'gray.100',
    },
    border: {
      default: 'gray.700',
      _dark: 'gray.700',
    },
    primary: {
      default: 'brand.500',
      _dark: 'brand.400',
    },
    secondary: {
      default: 'teal.500',
      _dark: 'teal.400',
    },
    highlight: {
      default: 'amber.400',
      _dark: 'amber.300',
    },
  },
};

// Define global styles
const styles = {
  global: {
    body: {
      bg: 'bg',
      color: 'text',
    },
  },
};

// Create the theme
const darkTheme = extendTheme({
  config,
  colors,
  components,
  semanticTokens,
  styles,
});

export default darkTheme;