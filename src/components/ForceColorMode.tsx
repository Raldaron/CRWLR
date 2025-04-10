// components/ForceColorMode.tsx
'use client';

import { useEffect } from 'react';
import { useColorMode } from '@chakra-ui/react';

export function ForceColorMode({ children }: { children: React.ReactNode }) {
  const { colorMode, setColorMode } = useColorMode();
  
  useEffect(() => {
    // Always set to dark mode on client
    if (colorMode !== 'dark') {
      setColorMode('dark');
    }
  }, [colorMode, setColorMode]);

  return <>{children}</>;
}