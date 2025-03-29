'use client';

import React from 'react';
import { Box, VStack, Heading, Button, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Text } from '@chakra-ui/react';
import { Shield, ChevronRight, Home } from 'lucide-react';
import DMSettings from '@/components/admin/DMSettings';
import { useAuth } from '@/context/AuthContext';
import { useDM } from '@/context/DMContext';
import Link from 'next/link';

const DMSettingsPage = () => {
  const { currentUser } = useAuth();
  const { isDM, isLoading } = useDM();

  if (!currentUser) {
    return (
      <Box p={8} textAlign="center">
        <Text color="gray.400">Please log in to view this page</Text>
        <Button as={Link} href="/" colorScheme="brand" mt={4}>
          Go to Login
        </Button>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.900" p={{ base: 4, md: 8 }}>
      <VStack spacing={6} align="stretch" maxW="6xl" mx="auto">
        {/* Breadcrumb */}
        <Breadcrumb separator={<ChevronRight size={14} />} color="gray.400">
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href="/" _hover={{ color: 'brand.400' }}>
              <Home size={16} className="inline mr-1" />
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href="/character-manager" _hover={{ color: 'brand.400' }}>
              Character Manager
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink color="brand.400">DM Settings</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        {/* Page Header */}
        <Heading size="lg" color="gray.100" display="flex" alignItems="center">
          <Shield className="mr-2" /> Dungeon Master Settings
        </Heading>
        
        {/* Main Content */}
        <Box bg="gray.800" p={6} borderRadius="lg" borderWidth="1px" borderColor="gray.700">
          <DMSettings />
        </Box>
        
        {/* Navigation Buttons */}
        <Box display="flex" justifyContent="space-between" pt={4}>
          <Button as={Link} href="/character-manager" variant="outline" colorScheme="gray">
            Back to Character Manager
          </Button>
          
          {isDM && (
            <Button as={Link} href="/game" colorScheme="brand">
              Go to Game
            </Button>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default DMSettingsPage;