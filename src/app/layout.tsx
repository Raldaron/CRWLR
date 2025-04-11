'use client';

import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { AuthProvider } from '@/context/AuthContext';
import { DMProvider } from '@/context/DMContext';
import { Inter } from 'next/font/google';
import darkTheme from './theme';
import { CacheProvider } from '@chakra-ui/next-js';
import { ForceColorMode } from '@/components/ForceColorMode';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Dungeon Crawler World</title>
        <meta name="description" content="Character Manager for Dungeon Crawler World" />
        {/* Move ColorModeScript here */}
        <ColorModeScript initialColorMode="dark" />
      </head>
      <body className={inter.className}>
        <CacheProvider>
          <ChakraProvider theme={darkTheme} resetCSS={true}>
            <ForceColorMode>
              <AuthProvider>
                <DMProvider>
                  {children}
                </DMProvider>
              </AuthProvider>
            </ForceColorMode>
          </ChakraProvider>
        </CacheProvider>
      </body>
    </html>
  );
}
