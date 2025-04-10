// src/app/dm/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Use App Router's navigation
import {
    Box,
    Spinner,
    Alert,
    AlertIcon,
    Center,
    Text,
    VStack,
    Button, // Added Button
    Heading // Added Heading
} from '@chakra-ui/react';
import { useAuth } from '@/context/AuthContext';
import { useDM } from '@/context/DMContext';
import DMDashboard from '@/components/dm/DMDashboard'; // Adjust path if needed
import Link from 'next/link'; // Added Link

export default function DMPage() {
    const { currentUser, loading: authLoading } = useAuth();
    const { isDM, isLoading: dmLoading, error: dmError } = useDM();
    const router = useRouter();

    useEffect(() => {
        // Perform checks only after both loading states are false
        if (!authLoading && !dmLoading) {
            if (!currentUser) {
                // If not logged in, redirect to home/login
                console.log("DM Page: No user found, redirecting to /");
                router.push('/');
            } else if (!isDM && !dmError) {
                // If logged in but NOT a DM (and no error fetching status), redirect to player view
                console.log("DM Page: User is not DM, redirecting to /character-manager");
                router.push('/character-manager'); // Or '/game' or another appropriate player page
            }
            // If currentUser exists AND isDM is true, the component will render the dashboard below
        }
    }, [currentUser, isDM, authLoading, dmLoading, router, dmError]); // Dependencies

    // --- Loading State ---
    if (authLoading || dmLoading) {
        return (
            <Center h="100vh">
                <VStack>
                    <Spinner size="xl" color="brand.400" />
                    <Text mt={4} color="gray.300">Loading DM Portal...</Text>
                </VStack>
            </Center>
        );
    }

    // --- Error State ---
    if (dmError) {
        return (
            <Center h="100vh" p={4}>
                <Alert status="error" maxW="lg" variant="solid" bg="red.800" color="white">
                    <AlertIcon color="red.200" />
                     <VStack align="start" spacing={1}>
                         <Heading size="sm">Error Loading DM Status</Heading>
                        <Text fontSize="sm">Could not verify DM privileges: {dmError}. Please try refreshing the page or contact support if the issue persists.</Text>
                        <Button as={Link} href="/character-manager" size="sm" mt={2} colorScheme='red'>
                           Back to Character Manager
                        </Button>
                    </VStack>
                </Alert>
            </Center>
        );
    }

    // --- Access Denied State (Explicit check after loading) ---
     if (!isDM && currentUser) {
         return (
             <Center h="100vh" p={4}>
                 <Alert status="warning" maxW="lg" variant="solid" bg="yellow.800" color="white">
                     <AlertIcon color="yellow.200"/>
                     <VStack align="start" spacing={1}>
                        <Heading size="sm">Access Denied</Heading>
                        <Text fontSize="sm">You do not have the required privileges to access the DM Dashboard.</Text>
                        <Button as={Link} href="/character-manager" size="sm" mt={2} colorScheme='yellow'>
                            Go to Character Manager
                        </Button>
                    </VStack>
                 </Alert>
             </Center>
         );
    }

    // --- Authorized DM View ---
    // Only render if loading is done, user exists, and isDM is true
    if (currentUser && isDM) {
        return (
            <Box minH="100vh" /* Add background/padding if needed via layout */>
                {/* Render the main DM Dashboard component */}
                <DMDashboard />
            </Box>
        );
    }

    // Fallback if checks are somehow bypassed or during initial render before effect runs
    return (
         <Center h="100vh">
            <Text color="gray.400">Verifying authorization...</Text>
        </Center>
    );
}