// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  Heading,
  useToast
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation'; // Use App Router's navigation
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, signup } = useAuth();
  const router = useRouter(); // Use App Router's router
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage('');
      if (isLoginMode) {
        await login(email, password);
      } else {
        await signup(email, password);
      }

      // --- CHANGE HERE ---
      // Redirect to character manager after successful authentication
      router.push('/character-manager');
      // --- END CHANGE ---

    } catch (error) {
      // Type-safe error handling
      const errorMessageText = error instanceof Error
        ? error.message
        : 'Authentication failed';

      setErrorMessage(errorMessageText);

      toast({
        title: 'Authentication Error',
        description: errorMessageText,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      minH="100vh"
      bg="gray.900" // Dark background
      color="gray.100" // Light text
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        bg="gray.800" // Slightly lighter card background
        p={6}
        borderRadius="md"
        boxShadow="lg"
        width={{ base: '90%', md: '400px' }}
        borderWidth="1px"
        borderColor="gray.700" // Subtle border
      >
        <Heading size="md" mb={4} textAlign="center" color="brand.300"> {/* Use theme color */}
          {isLoginMode ? 'Sign In' : 'Sign Up'}
        </Heading>
        {errorMessage && (
          <Text color="red.400" mb={2}> {/* Adjusted error color */}
            {errorMessage}
          </Text>
        )}
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              bg="gray.700" // Darker input background
              borderColor="gray.600"
              _hover={{ borderColor: "brand.400" }}
              _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)" }}
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              bg="gray.700" // Darker input background
              borderColor="gray.600"
              _hover={{ borderColor: "brand.400" }}
              _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)" }}
            />
            <Button colorScheme="brand" type="submit" width="full">
              {isLoginMode ? 'Login' : 'Create Account'}
            </Button>
          </VStack>
        </form>
        <Text mt={4} textAlign="center" color="gray.400"> {/* Adjust text color */}
          {isLoginMode ? 'Need an account?' : 'Already have an account?'}{' '}
          <Button
            variant="link"
            color="brand.300" // Use theme color
            onClick={() => setIsLoginMode(!isLoginMode)}
          >
            {isLoginMode ? 'Sign Up' : 'Sign In'}
          </Button>
        </Text>
      </Box>
    </Box>
  );
}