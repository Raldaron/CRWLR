// app/layout.jsx
'use client';

import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { AuthProvider } from '@/context/AuthContext';
import { Inter } from 'next/font/google';
import darkTheme from './theme';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Dungeon Crawler World</title>
        <meta name="description" content="Character Manager for Dungeon Crawler World" />
      </head>
      <body className={inter.className}>
        {/* Add ColorModeScript with our theme's colorMode config */}
        <ColorModeScript initialColorMode={darkTheme.config.initialColorMode} />
        <ChakraProvider theme={darkTheme}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ChakraProvider>
      </body>
    </html>
  );
}