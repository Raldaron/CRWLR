// app/dm-character-manager/page.tsx
'use client';

import React from 'react';
import { Box, Text, Button, useToast, Alert, AlertIcon } from '@chakra-ui/react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useDM } from '@/context/DMContext';
import DMCharacterManager from '@/components/admin/DMCharacterManager';

export default function DMCharacterManagerPage() {
  const { currentUser } = useAuth();
  const { isDM, isLoading } = useDM();
  const toast = useToast();

  // If loading, show minimal loading state
  if (isLoading) {
    return (
      <Box p={8} textAlign="center">
        <Text color="gray.400">Checking DM status...</Text>
      </Box>
    );
  }
  
  // If not logged in, show login prompt
  if (!currentUser) {
    return (
      <Box p={8} textAlign="center">
        <Text color="gray.400">Please log in to access DM features</Text>
        <Button as={Link} href="/" colorScheme="brand" mt={4}>
          Go to Login
        </Button>
      </Box>
    );
  }
  
  // If not a DM, show access denied
  if (!isDM) {
    return (
      <Box p={8} textAlign="center">
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Text>Access denied. You must be a Dungeon Master to view this page.</Text>
        </Alert>
        <Button as={Link} href="/character-manager" colorScheme="brand" mt={4}>
          Back to Character Manager
        </Button>
      </Box>
    );
  }
  
  // If DM, render the character manager
  return <DMCharacterManager />;
}