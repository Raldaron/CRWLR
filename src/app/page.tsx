'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { CharacterProvider } from '@/context/CharacterContext';
import { Box } from '@chakra-ui/react';
import GameApp from '@/components/Layout/GameApp';


export default function Page() {
  return (
    <Box minH="100vh" bg="gray.50">
      <AuthProvider>
        <CharacterProvider>
          <GameApp />
        </CharacterProvider>
      </AuthProvider>
    </Box>
  );
}
