// pages/admin/players.tsx
import React, { useState } from 'react';
import { Box, Heading, VStack, Text, Grid, GridItem, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Button } from '@chakra-ui/react';
import { Home, ChevronRight, Users } from 'lucide-react';
import DMPlayerList from '@/components/admin/players/DMPlayerList';
import DMCharacterViewer from '@/components/admin/players/DMCharacterViewer';
import { useAuth } from '@/context/AuthContext';
import { useDM } from '@/context/DMContext';
import Link from 'next/link';

const DMPlayerManagementPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { isDM, isLoading: isDMLoading } = useDM();
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

    if (isDMLoading) {
        return <Box p={8} textAlign="center"><Text color="gray.300">Loading...</Text></Box>;
    }

    if (!currentUser || !isDM) {
        return (
            <Box p={8} textAlign="center">
                <Text color="gray.400">Access Denied. You must be logged in as a DM.</Text>
                <Button as={Link} href="/" colorScheme="brand" mt={4}>
                    Go Home
                </Button>
            </Box>
        );
    }

    return (
        <Box minH="100vh" bg="gray.900" p={{ base: 4, md: 8 }}>
            <VStack spacing={6} align="stretch" maxW="7xl" mx="auto">
                {/* Breadcrumb */}
                <Breadcrumb separator={<ChevronRight size={14} />} color="gray.400">
                  <BreadcrumbItem>
                    <BreadcrumbLink as={Link} href="/" _hover={{ color: 'brand.400' }}>
                      <Home size={16} className="inline mr-1" /> Home
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {/* Add other breadcrumb items if needed */}
                  <BreadcrumbItem isCurrentPage>
                    <BreadcrumbLink color="brand.400">
                        <Users size={16} className="inline mr-1" /> Player Management
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </Breadcrumb>

                <Heading size="lg" color="gray.100">Player Management</Heading>

                 <Grid templateColumns={{ base: "1fr", md: "300px 1fr" }} gap={6}>
                    <GridItem>
                        <Box bg="gray.800" p={4} borderRadius="lg" borderWidth="1px" borderColor="gray.700" h="full">
                             <Heading size="md" mb={4} color="gray.200">Players</Heading>
                             <DMPlayerList
                                onSelectPlayer={setSelectedPlayerId}
                                selectedPlayerId={selectedPlayerId}
                             />
                         </Box>
                     </GridItem>
                     <GridItem>
                         <Box bg="gray.800" p={4} borderRadius="lg" borderWidth="1px" borderColor="gray.700" h="full">
                             {/* Character Viewer loads based on selectedPlayerId */}
                             <DMCharacterViewer selectedPlayerId={selectedPlayerId} />
                         </Box>
                    </GridItem>
                </Grid>
            </VStack>
        </Box>
    );
};

export default DMPlayerManagementPage;