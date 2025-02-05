// lib/chakra.ts
'use client';

import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const theme = extendTheme({ 
  config,
  styles: {
    global: {
      body: {
        bg: 'gray.50',
      },
    },
  },
  components: {
    Tabs: {
      baseStyle: {
        tab: {
          _selected: {
            color: 'blue.500',
            borderColor: 'currentColor',
          },
        },
      },
    },
  },
});

export default theme;