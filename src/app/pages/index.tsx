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
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, signup } = useAuth();
  const router = useRouter();
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
      
      // Redirect to character manager after successful authentication
      router.push('/character-manager');
    } catch (error) {
      // Type-safe error handling
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Authentication failed';
      
      setErrorMessage(errorMessage);
      
      toast({
        title: 'Authentication Error',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      minH="100vh"
      bg="gray.50"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        bg="white"
        p={6}
        borderRadius="md"
        boxShadow="md"
        width={{ base: '90%', md: '400px' }}
      >
        <Heading size="md" mb={4} textAlign="center">
          {isLoginMode ? 'Sign In' : 'Sign Up'}
        </Heading>
        {errorMessage && (
          <Text color="red.500" mb={2}>
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
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button colorScheme="blue" type="submit">
              {isLoginMode ? 'Login' : 'Create Account'}
            </Button>
          </VStack>
        </form>
        <Text mt={4} textAlign="center">
          {isLoginMode ? 'Need an account?' : 'Already have an account?'}{' '}
          <Button
            variant="link"
            color="blue.500"
            onClick={() => setIsLoginMode(!isLoginMode)}
          >
            {isLoginMode ? 'Sign Up' : 'Sign In'}
          </Button>
        </Text>
      </Box>
    </Box>
  );
}