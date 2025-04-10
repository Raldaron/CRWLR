// components/loot/PremadeLootBoxes.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  SimpleGrid,
  Input,
  Button,
  Spinner,
  useToast,
  Heading,
  Badge,
  HStack,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { Search, Package, Info, Gift } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define a list of premade loot boxes based on Dungeon Crawler Carl
const PREMADE_BOXES = [
  {
    id: 'adventurer-box',
    name: 'Adventurer Box',
    description: 'A starter kit for any aspiring adventurer with basic equipment.',
    category: 'General',
    rarity: 'Common'
  },
  {
    id: 'assassins-box',
    name: 'Assassin\'s Box',
    description: 'Silent weapons and tools for those who prefer to strike from the shadows.',
    category: 'Combat',
    rarity: 'Rare'
  },
  {
    id: 'brawlers-box',
    name: 'Brawler\'s Box',
    description: 'For those who prefer to solve problems with their fists.',
    category: 'Combat',
    rarity: 'Uncommon'
  },
  {
    id: 'crafters-box',
    name: 'Crafter\'s Box',
    description: 'Tools and materials for those who create their own equipment.',
    category: 'Utility',
    rarity: 'Uncommon'
  },
  {
    id: 'crowd-control-box',
    name: 'Crowd Control Box',
    description: 'Items designed to handle multiple opponents at once.',
    category: 'Combat',
    rarity: 'Rare'
  },
  {
    id: 'damage-dealer-box',
    name: 'Damage Dealer Box',
    description: 'Pure offensive power for those who just want to deal damage.',
    category: 'Combat',
    rarity: 'Uncommon'
  },
  {
    id: 'deity-box',
    name: 'Deity\'s Box',
    description: 'Divine gifts from the gods themselves.',
    category: 'Magic',
    rarity: 'Legendary'
  },
  {
    id: 'engineering-box',
    name: 'Engineering Box',
    description: 'For those who like to build and tinker with mechanical devices.',
    category: 'Utility',
    rarity: 'Rare'
  },
  {
    id: 'explosives-box',
    name: 'Explosives Box',
    description: 'Things that go boom. Handle with care!',
    category: 'Combat',
    rarity: 'Rare'
  },
  {
    id: 'good-shit-box',
    name: 'Good Shit Box',
    description: 'A random assortment of quality items. You never know what you\'ll get!',
    category: 'General',
    rarity: 'Rare'
  },
  {
    id: 'goblin-box',
    name: 'Goblin Box',
    description: 'Chaotic and unpredictable items, perfect for causing mischief.',
    category: 'General',
    rarity: 'Uncommon'
  },
  {
    id: 'lucky-bastard-box',
    name: 'Lucky Bastard Box',
    description: 'For those who seem to have all the luck in the world.',
    category: 'General',
    rarity: 'Rare'
  },
  {
    id: 'magic-item-box',
    name: 'Magic Item Box',
    description: 'Contains various magical artifacts and enchanted items.',
    category: 'Magic',
    rarity: 'Rare'
  },
  {
    id: 'melee-weapon-box',
    name: 'Melee Weapon Box',
    description: 'For those who prefer to get up close and personal in combat.',
    category: 'Combat',
    rarity: 'Uncommon'
  },
  {
    id: 'pacifists-box',
    name: 'Pacifist\'s Box',
    description: 'Items for those who prefer non-violent solutions to problems.',
    category: 'Utility',
    rarity: 'Uncommon'
  },
  {
    id: 'pet-box',
    name: 'Pet Box',
    description: 'Companions and familiars to aid you on your adventures.',
    category: 'Companion',
    rarity: 'Rare'
  },
  {
    id: 'quest-box',
    name: 'Quest Box',
    description: 'Special items tied to adventure hooks and story opportunities.',
    category: 'Story',
    rarity: 'Epic'
  },
  {
    id: 'ranged-weapon-box',
    name: 'Ranged Weapon Box',
    description: 'For those who prefer to keep their distance in combat.',
    category: 'Combat',
    rarity: 'Uncommon'
  },
  {
    id: 'sappers-box',
    name: 'Sapper\'s Box',
    description: 'Tools and explosives for breaching obstacles and fortifications.',
    category: 'Utility',
    rarity: 'Rare'
  },
  {
    id: 'survivors-box',
    name: 'Survivor\'s Box',
    description: 'Tools and gear for surviving in harsh environments.',
    category: 'Utility',
    rarity: 'Common'
  },
  {
    id: 'trapmaster-box',
    name: 'Trapmaster Box',
    description: 'Traps and tools for those who prefer to let their enemies come to them.',
    category: 'Utility',
    rarity: 'Rare'
  },
  {
    id: 'wand-box',
    name: 'Wand Box',
    description: 'Magical wands with various enchantments and effects.',
    category: 'Magic',
    rarity: 'Rare'
  },
  {
    id: 'weapon-box',
    name: 'Weapon Box',
    description: 'A variety of weapons for combat enthusiasts.',
    category: 'Combat',
    rarity: 'Common'
  },
  {
    id: 'heavy-metal-box',
    name: 'Heavy Metal Box',
    description: 'Heavy armor and weapons for the tankiest of characters.',
    category: 'Combat',
    rarity: 'Rare'
  },
  {
    id: 'hunter-champion-box',
    name: 'Hunter Champion Box',
    description: 'Gear for the most skilled hunters and trackers.',
    category: 'Combat',
    rarity: 'Epic'
  },
  {
    id: 'boss-box',
    name: 'Boss Box',
    description: 'Epic loot worthy of a dungeon boss.',
    category: 'General',
    rarity: 'Legendary'
  },
  {
    id: 'apparel-box',
    name: 'Apparel Box',
    description: 'Clothing and armor for fashion-conscious adventurers.',
    category: 'Utility',
    rarity: 'Uncommon'
  },
  {
    id: 'spicy-box',
    name: 'Spicy Box',
    description: 'Items with unpredictable and potentially dangerous effects.',
    category: 'General',
    rarity: 'Epic'
  },
  {
    id: 'sniper-box',
    name: 'Sniper\'s Box',
    description: 'Long-range weapons and tools for precision shooting.',
    category: 'Combat',
    rarity: 'Rare'
  }
];

// Define the loot box template component
const PremadeLootBoxes = ({ onSelectTemplate }: { onSelectTemplate: (box: typeof PREMADE_BOXES[0]) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [selectedBox, setSelectedBox] = useState<typeof PREMADE_BOXES[0] | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Filter the boxes based on search term and filters
  const filteredBoxes = PREMADE_BOXES.filter(box => {
    const matchesSearch = box.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          box.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter ? box.category === categoryFilter : true;
    const matchesRarity = rarityFilter ? box.rarity === rarityFilter : true;
    
    return matchesSearch && matchesCategory && matchesRarity;
  });

  // Get unique categories and rarities for filters
  const categories = Array.from(new Set(PREMADE_BOXES.map(box => box.category)));
  const rarities = Array.from(new Set(PREMADE_BOXES.map(box => box.rarity)));

  // Handle box selection
  const handleBoxClick = (box: typeof PREMADE_BOXES[0]) => {
    setSelectedBox(box);
    onOpen();
  };

  // Use the selected template
  const handleUseTemplate = () => {
    if (selectedBox) {
      onSelectTemplate(selectedBox);
      onClose();
      toast({
        title: "Template Selected",
        description: `${selectedBox.name} has been selected as a template`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Get color based on rarity
  const getRarityColor = (rarity: string) => {
    switch(rarity.toLowerCase()) {
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <Box>
      {/* Search and filters */}
      <VStack spacing={4} mb={4} align="stretch">
        <Box position="relative">
          <Input
            placeholder="Search loot boxes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg="gray.700"
            borderColor="gray.600"
            pr="40px"
          />
          <Search 
            size={20} 
            style={{ 
              position: 'absolute', 
              right: '10px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'gray' 
            }} 
          />
        </Box>
        
        <HStack>
          <Box flex="1">
            <Text mb={1} fontSize="sm" color="gray.400">Filter by Category</Text>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </Box>
          
          <Box flex="1">
            <Text mb={1} fontSize="sm" color="gray.400">Filter by Rarity</Text>
            <select 
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200"
            >
              <option value="">All Rarities</option>
              {rarities.map(rarity => (
                <option key={rarity} value={rarity}>{rarity}</option>
              ))}
            </select>
          </Box>
        </HStack>
      </VStack>

      {/* Loot box grid */}
      <ScrollArea className="h-[450px]">
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {filteredBoxes.map(box => (
            <Box
              key={box.id}
              bg="gray.800"
              p={4}
              borderRadius="md"
              borderWidth="1px"
              borderColor="gray.700"
              _hover={{ borderColor: 'brand.400', cursor: 'pointer' }}
              onClick={() => handleBoxClick(box)}
            >
              <VStack align="start" spacing={2}>
                <HStack>
                  <Package size={16} className="text-brand-400" />
                  <Text fontWeight="bold" color="gray.200">{box.name}</Text>
                </HStack>
                
                <Text fontSize="sm" color="gray.400" noOfLines={2}>
                  {box.description}
                </Text>
                
                <HStack>
                  <Badge>{box.category}</Badge>
                  <Badge colorScheme={getRarityColor(box.rarity)}>{box.rarity}</Badge>
                </HStack>
              </VStack>
            </Box>
          ))}
          
          {filteredBoxes.length === 0 && (
            <Box gridColumn="span 3" textAlign="center" p={6} bg="gray.800" borderRadius="md">
              <Text color="gray.400">No loot boxes found matching your search criteria</Text>
            </Box>
          )}
        </SimpleGrid>
      </ScrollArea>

      {/* Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader color="gray.200">
            <HStack>
              <Gift className="text-brand-400" />
              <Text>{selectedBox?.name}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="gray.400" />
          
          <ModalBody>
            {selectedBox && (
              <VStack align="start" spacing={4}>
                <HStack>
                  <Badge>{selectedBox.category}</Badge>
                  <Badge colorScheme={getRarityColor(selectedBox.rarity)}>{selectedBox.rarity}</Badge>
                </HStack>
                
                <Text color="gray.300">{selectedBox.description}</Text>
                
                <Box bg="gray.700" p={4} borderRadius="md" width="full">
                  <Text fontWeight="bold" color="gray.200" mb={2}>What's typically included:</Text>
                  <Text color="gray.400" fontSize="sm">
                    This is a template that you can customize. When you select this template,
                    you'll still need to add specific items to the loot box from your item catalog.
                  </Text>
                </Box>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={handleUseTemplate}>
              Use This Template
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PremadeLootBoxes;