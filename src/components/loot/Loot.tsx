'use client';
import React, { useState } from 'react';
import {
  Box,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  Button,
  VStack,
  Spinner,
  Link,
} from '@chakra-ui/react';
import { Package, Gift, Settings } from 'lucide-react';
import EnhancedLootDistribution from './EnhancedLootDistribution';
import { useAuth } from '@/context/AuthContext';
import { useDM } from '@/context/DMContext';
import NextLink from 'next/link';

// Import PlayerLoot for the player view
import PlayerLoot from './PlayerLoot';

const Loot: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { currentUser } = useAuth();
  const { isDM, isLoading } = useDM();
  
  if (isLoading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner size="xl" color="brand.400" />
        <Text mt={4} color="gray.300">Loading loot system...</Text>
      </Box>
    );
  }
  
  if (!isDM) {
    return <PlayerLoot />;
  }
  
  return (
    <Box p={4}>
      <Alert status="info" mb={4} bg="blue.900" color="white">
        <AlertIcon color="blue.200" />
        <Text>You are in DM mode. Use this interface to distribute loot boxes to your players.</Text>
      </Alert>
      
      <Tabs
        index={activeTab}
        onChange={setActiveTab}
        colorScheme="brand"
        variant="line"
      >
        <TabList>
          <Tab>
            <Box display="flex" alignItems="center">
              <Gift className="mr-2" size={18} />
              <Text>Loot Distribution</Text>
            </Box>
          </Tab>
          <Tab>
            <Box display="flex" alignItems="center">
              <Settings className="mr-2" size={18} />
              <Text>DM Settings</Text>
            </Box>
          </Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel px={0}>
            <EnhancedLootDistribution />
          </TabPanel>
          <TabPanel px={0}>
            <VStack spacing={4} align="stretch">
              <Text color="gray.300">
                Manage DM settings to control who can distribute loot boxes in your game.
              </Text>
              <Button
                as={NextLink}
                href="/dm-settings"
                colorScheme="brand"
              >
                Go to DM Settings
              </Button>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Loot;