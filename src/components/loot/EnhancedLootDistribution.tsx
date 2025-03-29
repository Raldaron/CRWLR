// components/loot/EnhancedLootDistribution.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Divider,
  Heading,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { Plus, Gift, Package, Wand } from 'lucide-react';
import LootDistribution from './LootDistribution';
import PremadeLootBoxes from './PremadeLootBoxes';

// Additional sponsor ideas from Dungeon Crawler Carl
interface LootTemplate {
  name: string;
  // Add other properties that your template object contains
}

const DCC_SPONSORS = [
  "Open Intellect Pacifist Action Network",
  "The Apothecary",
  "The Plenty",
  "Hank's Crab Ranch",
  "Dictum Waystation Controls ltd.",
  "The Valtay Corporation",
  "The Prism Kingdom",
  "Princess Formidable - The Skull Empire",
  "The Society for The Eradication of Koalas",
  "Parchment Zephyr Syndicate",
  "Dwarven Forge Collective",
  "Elven Moonlight Enterprises",
  "Goblin Junk Trading Co.",
  "DragonScale Industries",
  "Wizard's College of Arcane Arts",
  "The Bard's Tale Tavern",
  "Temple of Eternal Light",
  "Shadow Guild Acquisitions",
  "Royal Treasury Department",
  "Monster Hunter's Association"
];

const EnhancedLootDistribution = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<LootTemplate | null>(null);
  const toast = useToast();

  // Handle template selection from PremadeLootBoxes
  const handleTemplateSelect = (template: LootTemplate) => {
    setSelectedTemplate(template);
    
    // Switch to the Create Package tab
    setActiveTab(1);
    
    // Notify user of the next steps
    toast({
      title: "Template Selected",
      description: `Now customize your ${template.name} with specific items!`,
      status: "info",
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Box p={4}>
      <Tabs index={activeTab} onChange={setActiveTab} colorScheme="brand" variant="enclosed">
        <TabList mb={4}>
          <Tab>
            <HStack>
              <Package size={18} />
              <Text>Your Loot Boxes</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <Plus size={18} />
              <Text>Create New</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <Gift size={18} />
              <Text>Premade Templates</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <Wand size={18} />
              <Text>Sponsors</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Tab 1: Original LootDistribution component */}
          <TabPanel px={0}>
            <LootDistribution />
          </TabPanel>

          {/* Tab 2: Create New (with template application if selected) */}
          <TabPanel px={0}>
            {selectedTemplate && (
              <Alert status="info" mb={4} borderRadius="md">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text>
                    Creating a new loot box based on <strong>{selectedTemplate.name}</strong> template
                  </Text>
                  <Text fontSize="sm">
                    Add items from the catalog below to complete your loot box
                  </Text>
                </VStack>
              </Alert>
            )}
            
            {/* This would be replaced by the create package UI from your LootDistribution component */}
            <Box>
              <Text color="gray.300">
                Create a new loot box by adding items from the catalog.
              </Text>
            </Box>
          </TabPanel>

          {/* Tab 3: Premade Templates */}
          <TabPanel px={0}>
            <VStack align="start" spacing={4} mb={4}>
              <Heading size="md" color="gray.200">Premade Loot Box Templates</Heading>
              <Text color="gray.400">
                Choose from these Dungeon Crawler Carl inspired loot box templates to quickly create themed loot boxes for your players.
              </Text>
            </VStack>
            
            <PremadeLootBoxes onSelectTemplate={handleTemplateSelect} />
          </TabPanel>

          {/* Tab 4: Sponsors List */}
          <TabPanel px={0}>
            <VStack align="start" spacing={4}>
              <Heading size="md" color="gray.200">Loot Box Sponsors</Heading>
              <Text color="gray.400">
                In Dungeon Crawler Carl, loot boxes are often sponsored by in-universe organizations or entities.
                Use these sponsors to add flavor to your loot boxes.
              </Text>
              
              <Box 
                bg="gray.800" 
                borderRadius="md" 
                p={4} 
                borderWidth="1px" 
                borderColor="gray.700" 
                width="full"
              >
                <Text fontWeight="bold" mb={4} color="gray.200">Available Sponsors</Text>
                
                <Box 
                  maxH="400px" 
                  overflowY="auto" 
                  pr={2} 
                  css={{
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#2D3748',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#4A5568',
                      borderRadius: '4px',
                    },
                  }}
                >
                  {DCC_SPONSORS.map((sponsor, index) => (
                    <Box 
                      key={index} 
                      p={3} 
                      bg="gray.750" 
                      mb={2} 
                      borderRadius="md"
                      cursor="pointer"
                      _hover={{ bg: 'gray.700' }}
                      onClick={() => {
                        navigator.clipboard.writeText(sponsor);
                        toast({
                          title: "Sponsor Copied",
                          description: "Sponsor name has been copied to clipboard",
                          status: "success",
                          duration: 2000,
                          isClosable: true,
                        });
                      }}
                    >
                      <Text color="gray.200">{sponsor}</Text>
                    </Box>
                  ))}
                </Box>
              </Box>
              
              <Text fontSize="sm" color="gray.500" mt={2}>
                Click on a sponsor to copy it to your clipboard. You can then paste it when creating a new loot box.
              </Text>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default EnhancedLootDistribution;