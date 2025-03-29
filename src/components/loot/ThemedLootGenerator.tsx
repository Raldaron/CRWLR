// components/loot/ThemedLootGenerator.tsx
import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  useToast,
  IconButton,
} from '@chakra-ui/react';
import {
  Plus,
  Search,
  Package,
  Send,
  Users,
  BookOpen,
  Trash,
  ShoppingBag,
  RefreshCw
} from 'lucide-react';

// Define interfaces for type safety
interface LootTheme {
  itemTypes: string[];
  rarityBoost: number;
  keywords: string[];
}

interface LootThemes {
  [key: string]: LootTheme;
}

interface LootItem {
  id: string;
  name: string;
  description: string;
  itemType: string;
  rarity: string;
  quantity: number;
  [key: string]: any;
}

interface Character {
  id: string;
  characterName: string;
  userId: string;
}

interface Player {
  id: string;
  displayName: string;
  email: string;
  characters: Character[];
}

// Loot Themes Configuration
const LOOT_THEMES: LootThemes = {
  'assassins-box': {
    itemTypes: ['dagger', 'poison', 'throwing weapon', 'cloak', 'stealth item'],
    rarityBoost: 1,
    keywords: ['stealth', 'poison', 'shadow', 'silent', 'assassin', 'backstab']
  },
  // ... (rest of the themes remain the same as in the original file)
  'boss-box': {
    itemTypes: ['weapon', 'armor', 'magic item', 'artifact', 'unique item'],
    rarityBoost: 3,
    keywords: ['powerful', 'legendary', 'boss', 'monster', 'unique', 'special']
  }
};

// Rarity levels in order
const RARITIES = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Epic', 'Legendary', 'Artifact'];

// Helper function to get a random item from an array
const getRandomItem = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Helper function to determine rarity based on box type
const determineRarity = (themeKey: string, force = ''): string => {
  if (force) return force;
  
  const theme = LOOT_THEMES[themeKey] || { rarityBoost: 0 };
  const boost = theme.rarityBoost || 0;
  
  // Weighted random rarity
  const roll = Math.random() * 100;
  
  if (roll + boost * 5 > 98) return 'Artifact';
  if (roll + boost * 8 > 95) return 'Legendary';
  if (roll + boost * 10 > 85) return 'Epic';
  if (roll + boost * 12 > 70) return 'Very Rare';
  if (roll + boost * 15 > 50) return 'Rare';
  if (roll + boost * 20 > 30) return 'Uncommon';
  return 'Common';
};

// Main ThemedLootGenerator Component
const ThemedLootGenerator: React.FC<{
  onGenerateItems: (items: LootItem[], theme: string) => void;
  availableItems?: LootItem[];
}> = ({ onGenerateItems, availableItems = [] }) => {
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [itemCount, setItemCount] = useState(5);
  const [forceRarity, setForceRarity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [themeInfo, setThemeInfo] = useState<LootTheme | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Get theme keys for dropdown
  const themeKeys = Object.keys(LOOT_THEMES);

  // Handle theme selection
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const theme = e.target.value;
    setSelectedTheme(theme);
  };

  // View theme info
  const handleViewThemeInfo = () => {
    if (!selectedTheme) {
      toast({
        title: "No Theme Selected",
        description: "Please select a loot box theme first",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setThemeInfo(LOOT_THEMES[selectedTheme]);
    onOpen();
  };

  // Generate items based on selected theme
  const handleGenerateItems = () => {
    if (!selectedTheme) {
      toast({
        title: "No Theme Selected",
        description: "Please select a loot box theme first",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate loading (would be replaced with actual item filtering logic)
    setTimeout(() => {
      try {
        const theme = LOOT_THEMES[selectedTheme];
        const generatedItems: LootItem[] = [];
        
        // If we have available items to filter from
        if (availableItems.length > 0) {
          // Filter items based on theme
          const filteredItems = availableItems.filter(item => {
            // Check if item matches theme types
            const matchesType = theme.itemTypes.some(type => 
              item.itemType?.toLowerCase().includes(type.toLowerCase()) || 
              item.name?.toLowerCase().includes(type.toLowerCase())
            );
            
            // Check if item matches keywords
            const matchesKeyword = theme.keywords.some(keyword => 
              item.name?.toLowerCase().includes(keyword.toLowerCase()) || 
              item.description?.toLowerCase().includes(keyword.toLowerCase())
            );
            
            return matchesType || matchesKeyword;
          });
          
          // Select random items from filtered list
          const itemPool = filteredItems.length > 0 ? filteredItems : availableItems;
          
          for (let i = 0; i < itemCount; i++) {
            if (itemPool.length > 0) {
              const randomIndex = Math.floor(Math.random() * itemPool.length);
              const selectedItem = itemPool[randomIndex];
              
              // Apply rarity if needed
              const finalItem: LootItem = {
                ...selectedItem,
                rarity: forceRarity || selectedItem.rarity || determineRarity(selectedTheme),
                quantity: Math.max(1, Math.floor(Math.random() * 3)) // Random quantity 1-3
              };
              
              generatedItems.push(finalItem);
              
              // Remove selected item to avoid duplicates
              itemPool.splice(randomIndex, 1);
            }
          }
        } else {
          // Generate placeholder items if no available items
          for (let i = 0; i < itemCount; i++) {
            const itemType = getRandomItem(theme.itemTypes);
            const rarity = determineRarity(selectedTheme, forceRarity);
            
            generatedItems.push({
              id: `generated-${i}`,
              name: `${rarity} ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`,
              description: `A ${rarity.toLowerCase()} ${itemType} with magical properties.`,
              itemType: itemType.charAt(0).toUpperCase() + itemType.slice(1),
              rarity: rarity,
              quantity: Math.max(1, Math.floor(Math.random() * 3)) // Random quantity 1-3
            });
          }
        }
        
        // Call the callback function with generated items
        onGenerateItems(generatedItems, selectedTheme);
        
        toast({
          title: "Items Generated",
          description: `Generated ${generatedItems.length} items based on ${selectedTheme.replace('-box', '').replace(/-/g, ' ')} theme`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error generating items:', error);
        toast({
          title: "Generation Failed",
          description: "An error occurred while generating items",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  // Format theme key for display
  const formatThemeName = (key: string) => {
    return key
      .replace('-box', '')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') + ' Box';
  };

  // Get color for rarity badge
  const getRarityColor = (rarity: string) => {
    switch(rarity.toLowerCase()) {
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'very rare': return 'purple';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      case 'artifact': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Box borderWidth="1px" borderColor="gray.700" borderRadius="md" p={4} bg="gray.800">
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontWeight="bold" fontSize="lg" color="gray.200">
                Themed Loot Generator
              </Text>
              {selectedTheme && (
                <Button 
                  size="sm" 
                  onClick={handleViewThemeInfo}
                  variant="ghost"
                  colorScheme="blue"
                >
                  Theme Info
                </Button>
              )}
            </HStack>
            
            <Text color="gray.400" fontSize="sm">
              Select a theme to automatically generate loot items.
            </Text>
            
            <Box>
              <Text mb={1} color="gray.300">Loot Box Theme</Text>
              <select
                value={selectedTheme}
                onChange={handleThemeChange}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200"
              >
                <option value="">Select a Theme</option>
                {themeKeys.map(key => (
                  <option key={key} value={key}>{formatThemeName(key)}</option>
                ))}
              </select>
            </Box>
            
            <HStack spacing={4}>
              <Box flex="1">
                <Text mb={1} color="gray.300">Number of Items</Text>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={itemCount}
                  onChange={(e) => setItemCount(parseInt(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200"
                />
              </Box>
              
              <Box flex="1">
                <Text mb={1} color="gray.300">Force Rarity (Optional)</Text>
                <select
                  value={forceRarity}
                  onChange={(e) => setForceRarity(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200"
                >
                  <option value="">Random (Based on Theme)</option>
                  {RARITIES.map(rarity => (
                    <option key={rarity} value={rarity}>{rarity}</option>
                  ))}
                </select>
              </Box>
            </HStack>
            
            <Button
              colorScheme="brand"
              size="lg"
              onClick={handleGenerateItems}
              isLoading={isLoading}
              loadingText="Generating..."
              disabled={!selectedTheme}
            >
              Generate Themed Items
            </Button>
          </VStack>
        </Box>
      </VStack>
      
      {/* Theme Info Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader color="gray.200">
            {selectedTheme && formatThemeName(selectedTheme)}
          </ModalHeader>
          <ModalCloseButton color="gray.400" />
          
          <ModalBody>
            {themeInfo && (
              <VStack align="start" spacing={4}>
                <Box>
                  <Text fontWeight="bold" color="gray.300">Theme Focuses On:</Text>
                  <Box mt={2}>
                    {themeInfo.itemTypes.map((type, index) => (
                      <Badge key={index} colorScheme="blue" mr={2} mb={2}>{type}</Badge>
                    ))}
                  </Box>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" color="gray.300">Rarity Tendency:</Text>
                  <Text color="gray.400" mt={1}>
                    {themeInfo.rarityBoost > 1 ? 'High rarity items more common' :
                      themeInfo.rarityBoost > 0 ? 'Slightly higher chance of rare items' :
                      themeInfo.rarityBoost < 0 ? 'Tends toward common items' :
                      'Balanced rarity distribution'}
                  </Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" color="gray.300">Related Keywords:</Text>
                  <Text color="gray.400" mt={1}>
                    {themeInfo.keywords.join(', ')}
                  </Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button colorScheme="brand" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ThemedLootGenerator;