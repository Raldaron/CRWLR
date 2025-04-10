// components/loot/EnhancedLootDistribution.tsx
import React, { useState } from 'react'; // Removed useEffect as it wasn't used here
import {
  Box,
  VStack,
  HStack,
  Text,
  Button, // Keep Button if used elsewhere, though not directly in this snippet
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Divider, // Keep Divider if used elsewhere
  Heading,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
// Added History icon import
import { Plus, Gift, Package, Wand, History } from 'lucide-react';
import LootDistribution from './LootDistribution'; // Displays existing boxes and allows distribution
import PremadeLootBoxes from './PremadeLootBoxes'; // For selecting templates
import DMLootHistoryLog from './DMLootHistoryLog'; // Import the new history component
// Assuming LootCreationForm is the component handling the creation UI previously part of LootDistribution or a separate file
// If the creation UI is still within LootDistribution, we might need to extract it or adjust the imports/logic.
// For this example, let's assume the creation UI is either handled within LootDistribution's modal or needs a separate component.
// The placeholder <Box> in TabPanel 2 will represent where the creation UI goes.

// Define the interface for the template object passed from PremadeLootBoxes
interface LootTemplate {
  id: string; // Assuming templates have IDs
  name: string;
  description: string;
  category: string;
  rarity: string;
  // Add other properties if your template object contains more details
}

// Sponsors list remains the same
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
  // State to hold the selected template name/info for the creation tab
  const [selectedTemplateInfo, setSelectedTemplateInfo] = useState<LootTemplate | null>(null);
  const toast = useToast();

  // Handle template selection from PremadeLootBoxes
  const handleTemplateSelect = (template: LootTemplate) => {
    setSelectedTemplateInfo(template); // Store selected template info

    // Switch to the Create Package tab (index 1)
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

  // Reset template info when switching away from the Create tab
  const handleTabChange = (index: number) => {
    setActiveTab(index);
    if (index !== 1) {
        setSelectedTemplateInfo(null); // Clear template when leaving create tab
    }
  };

  return (
    <Box p={4}>
      {/* Use the updated handleTabChange */}
      <Tabs index={activeTab} onChange={handleTabChange} colorScheme="brand" variant="enclosed">
        <TabList mb={4}>
          {/* Tab 0: View/Distribute Existing Boxes */}
          <Tab>
            <HStack>
              <Package size={18} />
              <Text>Your Loot Boxes</Text>
            </HStack>
          </Tab>
          {/* Tab 1: Create New Box */}
          <Tab>
            <HStack>
              <Plus size={18} />
              <Text>Create New</Text>
            </HStack>
          </Tab>
          {/* Tab 2: Premade Templates */}
          <Tab>
            <HStack>
              <Gift size={18} />
              <Text>Premade Templates</Text>
            </HStack>
          </Tab>
           {/* Tab 3: Sponsors List */}
          <Tab>
            <HStack>
              <Wand size={18} />
              <Text>Sponsors</Text>
            </HStack>
          </Tab>
          {/* Tab 4: History Log - NEW */}
          <Tab>
            <HStack>
              <History size={18} />
              <Text>History</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* TabPanel 0: Original LootDistribution component (View/Distribute) */}
          <TabPanel px={0}>
            {/* LootDistribution handles listing existing packages and initiating distribution */}
            <LootDistribution />
          </TabPanel>

          {/* TabPanel 1: Create New (potentially using template info) */}
          <TabPanel px={0}>
            {/* Alert if creating from a template */}
            {selectedTemplateInfo && (
              <Alert status="info" mb={4} borderRadius="md" bg="blue.900" color="white">
                <AlertIcon color="blue.200"/>
                <VStack align="start" spacing={1}>
                  <Text>
                    Creating a new loot box based on <strong>{selectedTemplateInfo.name}</strong> template.
                  </Text>
                  <Text fontSize="sm">
                    Add items from the catalog below to complete your loot box.
                  </Text>
                </VStack>
              </Alert>
            )}

            {/* Placeholder for the Loot Creation UI */}
            {/* This UI should be part of LootDistribution or a dedicated LootCreationForm component */}
            {/* It needs inputs for Name, Description, Sponsor (optional), and the ItemSelect component */}
            <Box p={4} borderWidth="1px" borderColor="gray.700" borderRadius="md" bg="gray.800">
                <Heading size="md" mb={4} color="gray.200">Loot Box Creation Area</Heading>
                <Text color="gray.400">
                    {/* Replace this with your actual form/components for creating a loot package */}
                    (TODO: Integrate the loot package creation form here. It should take `selectedTemplateInfo` into account if present, perhaps pre-filling the name/description.)
                </Text>
                 {/* Example of how you might pass template data */}
                 {/* <LootCreationForm template={selectedTemplateInfo} /> */}
            </Box>
          </TabPanel>

          {/* TabPanel 2: Premade Templates */}
          <TabPanel px={0}>
            <VStack align="start" spacing={4} mb={4}>
              <Heading size="md" color="gray.200">Premade Loot Box Templates</Heading>
              <Text color="gray.400">
                Choose from these Dungeon Crawler Carl inspired loot box templates to quickly create themed loot boxes for your players.
              </Text>
            </VStack>
            {/* PremadeLootBoxes component triggers handleTemplateSelect */}
            <PremadeLootBoxes onSelectTemplate={handleTemplateSelect} />
          </TabPanel>

          {/* TabPanel 3: Sponsors List */}
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
                    '&::-webkit-scrollbar': { width: '8px' },
                    '&::-webkit-scrollbar-track': { background: '#2D3748' },
                    '&::-webkit-scrollbar-thumb': { background: '#4A5568', borderRadius: '4px' },
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

           {/* TabPanel 4: History Log - NEW */}
          <TabPanel px={0}>
             {/* Render the history log component */}
             <DMLootHistoryLog />
          </TabPanel>

        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default EnhancedLootDistribution;