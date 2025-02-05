'use client';

import React from 'react';
import { Box } from '@chakra-ui/react';
import GameApp from '@/components/Layout/GameApp';
import { CharacterProvider } from '@/context/CharacterContext';

export default function Page() {
  return (
    <Box minH="100vh" bg="gray.50">
      <CharacterProvider>
        <GameApp />
      </CharacterProvider>
    </Box>
  );
}