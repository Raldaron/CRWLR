// app/layout.tsx
'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { Inter } from 'next/font/google';
import { CharacterProvider } from '@/context/CharacterContext';

const inter = Inter({ subsets: ['latin'] });

// Create a separate component for providers to maintain proper HTML structure
function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider>
      <CharacterProvider>
        {children}
      </CharacterProvider>
    </ChakraProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}