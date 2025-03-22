// components/inventory/ItemCatalog.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  IconButton,
  Button,
  Spinner,
  Center,
  useToast,
  useBreakpointValue,
  VStack,
  HStack,
  Collapse,
  Divider,
} from '@chakra-ui/react';
import { 
  Search, 
  Filter,
  Plus,
  Eye,
  Sword, 
  Shield, 
  Crosshair, 
  Beaker, 
  ScrollText, 
  Wrench, 
  Key, 
  Bomb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useCharacter } from '@/context/CharacterContext';
import type { InventoryItem } from '@/types/inventory';

// Import our modals
import WeaponDetailModal from '../Modals/WeaponDetailModal';
import ArmorDetailModal from '../Modals/ArmorDetailModal';
import AmmunitionDetailModal from '../Modals/AmmunitionDetailModal';
import PotionDetailModal from '../Modals/PotionDetailModal';
import ScrollDetailModal from '../Modals/ScrollDetailModal';
import TrapDetailModal from '../Modals/TrapDetailModal';
import CraftingComponentDetailModal from '../Modals/CraftingComponentDetailModal';
import ExplosivesDetailModal from '../Modals/ExplosivesDetailModal';
import QuantitySelectorModal from '../Modals/QuantitySelectorModal';

// Define a simpler version of InventoryItem that works for our catalog
interface CatalogItem {
  id: string;
  name: string;
  description: string;
  itemType: string;
  rarity: string;
  [key: string]: any;  // Allow for any additional properties
}

// The main ItemCatalog component
const ItemCatalog: React.FC = () => {
  const { addToInventory } = useCharacter();
  const toast = useToast();
  
  // State for filtering and search
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<{[key: string]: boolean}>({
    Weapon: false,
    Armor: false,
    Ammunition: false,
    Potion: false,
    Scroll: false,
    'Crafting Component': false,
    Trap: false,
    Explosive: false,
    Throwable: false
  });

  // Quantity selector modal
  const [isQuantitySelectorOpen, setIsQuantitySelectorOpen] = useState(false);
  const [itemToAdd, setItemToAdd] = useState<InventoryItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Catalog data state
  const [catalog, setCatalog] = useState<{[key: string]: CatalogItem[]}>({
    Weapon: [],
    Armor: [],
    Ammunition: [],
    Potion: [],
    Scroll: [],
    'Crafting Component': [],
    Trap: [],
    Explosive: [],
    Throwable: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Item category configuration
  const itemCategories = [
    { id: 'All', label: 'All Items', icon: Filter },
    { id: 'Weapon', label: 'Weapons', icon: Sword },
    { id: 'Armor', label: 'Armor', icon: Shield },
    { id: 'Ammunition', label: 'Ammunition', icon: Crosshair },
    { id: 'Potion', label: 'Potions', icon: Beaker },
    { id: 'Scroll', label: 'Scrolls', icon: ScrollText },
    { id: 'Crafting Component', label: 'Crafting', icon: Wrench },
    { id: 'Trap', label: 'Traps', icon: Key },
    { id: 'Explosive', label: 'Explosives', icon: Bomb },
  ];

  // Determine grid columns based on screen size
  const columns = useBreakpointValue({ base: 1, sm: 2, md: 3, lg: 4 }) || 1;
  
  // Function to view item details
  const handleViewDetails = (item: CatalogItem) => {
    if (!item || !item.itemType) return;
    
    setSelectedItem(item);
    setIsModalOpen({ 
      ...isModalOpen, 
      [item.itemType]: true 
    });
  };

  // Function to close modal
  const handleCloseModal = (itemType: string) => {
    setIsModalOpen({ 
      ...isModalOpen, 
      [itemType]: false 
    });
    setSelectedItem(null);
  };

  // Function to open quantity selector
  const handleOpenQuantitySelector = (item: CatalogItem) => {
    // Prevent opening when already adding
    if (isAddingItem) return;
    
    // Convert CatalogItem to InventoryItem
    const inventoryItem: InventoryItem = {
      ...item,
      id: item.id,
      name: item.name,
      description: item.description,
      itemType: item.itemType,
      rarity: item.rarity,
    };
    
    setItemToAdd(inventoryItem);
    setIsQuantitySelectorOpen(true);
  };

  // Function to add item to inventory with quantity
  const handleAddToInventoryWithQuantity = async (item: InventoryItem, quantity: number) => {
    try {
      // Prevent multiple calls
      if (isAddingItem) return;
      setIsAddingItem(true);
      
      if (!item || !item.id) {
        toast({
          title: "Error",
          description: "Unable to add invalid item to inventory",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setIsAddingItem(false);
        setIsQuantitySelectorOpen(false);
        return;
      }
      
      if (quantity <= 0) {
        setIsAddingItem(false);
        setIsQuantitySelectorOpen(false);
        return;
      }
  
      // Using a simpler approach - just add the item multiple times
      for (let i = 0; i < quantity; i++) {
        addToInventory(item);
      }
      
      toast({
        title: "Items added",
        description: `${quantity} × ${item.name} added to your inventory`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Use setTimeout to prevent UI freeze - this gives React time to process state updates
      setTimeout(() => {
        setIsQuantitySelectorOpen(false);
        setItemToAdd(null);
        setIsAddingItem(false);
      }, 100);
      
    } catch (error) {
      console.error("Error adding items to inventory:", error);
      toast({
        title: "Error",
        description: "Failed to add items to inventory",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setIsAddingItem(false);
    }
  };

  // Load catalog data
  useEffect(() => {
    const loadCatalogData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Map of file names to item types
        const fileToItemType: {[key: string]: string} = {
          'weapons': 'Weapon',
          'armor': 'Armor',
          'ammunition': 'Ammunition',
          'potions': 'Potion',
          'scrolls': 'Scroll',
          'crafting_components': 'Crafting Component',
          'traps': 'Trap',
          'explosives': 'Explosive'
        };

        // Files to load
        const filesToLoad = Object.keys(fileToItemType);
        const newCatalog: {[key: string]: CatalogItem[]} = { ...catalog };

        // Load each file
        for (const fileName of filesToLoad) {
          const response = await fetch(`/data/${fileName}.json`);
          const data = await response.json();
          
          // Get items based on file structure
          let items: any[] = [];
          
          if (data[fileName]) {
            // For files like weapons.json where data is in format { "weapons": { ... } }
            items = Object.values(data[fileName]);
          } else if (data.hasOwnProperty(fileName.replace(/s$/, ''))) {
            // For files that might be singular in the JSON (e.g., "weapon" instead of "weapons")
            items = Object.values(data[fileName.replace(/s$/, '')]);
          } else {
            // Just take all values if we don't find a matching key
            items = Object.values(data);
          }

          // Process items for catalog
          const itemType = fileToItemType[fileName];
          const processedItems = items.map((item: any) => {
            // Make sure each item has an ID
            if (!item.id) {
              item.id = `${fileName}-${Math.random().toString(36).substring(2, 9)}`;
            }
            
            // Make sure itemType is set correctly
            return {
              ...item,
              itemType: item.itemType || itemType
            };
          });
          
          // Special handling for Explosives - they might be "Explosive" or "Throwable"
          if (itemType === 'Explosive') {
            const explosives = processedItems.filter((item: any) => 
              item.itemType === 'Explosive' || !item.itemType
            );
            const throwables = processedItems.filter((item: any) => 
              item.itemType === 'Throwable'
            );
            
            newCatalog['Explosive'] = explosives;
            newCatalog['Throwable'] = throwables;
          } else {
            newCatalog[itemType] = processedItems;
          }
        }
        
        setCatalog(newCatalog);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading catalog data:', error);
        setError('Failed to load item data. Please try again later.');
        setIsLoading(false);
      }
    };

    loadCatalogData();
  }, []);

  // Get rarity color for badges
  const getRarityColor = (rarity: string = 'common') => {
    switch(rarity.toLowerCase()) {
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      case 'unique': return 'yellow';
      case 'exceedingly rare': return 'pink';
      case 'very rare': return 'red';
      default: return 'gray';
    }
  };

  // Get filtered items based on selected category and search term
  const getFilteredItems = () => {
    let items: CatalogItem[] = [];
    
    // Get items for the selected category
    if (activeFilter === 'All') {
      // Combine all categories
      Object.values(catalog).forEach(categoryItems => {
        items = [...items, ...categoryItems];
      });
    } else if (activeFilter === 'Explosive') {
      // Combine Explosive and Throwable items
      items = [...(catalog['Explosive'] || []), ...(catalog['Throwable'] || [])];
    } else {
      // Get items for the specific category
      items = catalog[activeFilter] || [];
    }
    
    // Apply search filter if there's a search term
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchLower) || 
        item.description.toLowerCase().includes(searchLower)
      );
    }
    
    return items;
  };

  // Item card component
  const ItemCard = ({ item }: { item: CatalogItem }) => (
    <Card className="h-full transition-all hover:shadow-md">
      <CardContent className="p-0">
        <Box p={3} h="full">
          <VStack spacing={2} align="stretch" h="full">
            <Text fontWeight="bold" fontSize="md" noOfLines={1}>{item.name}</Text>
            
            <HStack>
              <Badge colorScheme={getRarityColor(item.rarity)}>
                {item.rarity}
              </Badge>
              <Badge variant="outline">{item.itemType}</Badge>
            </HStack>
            
            <Text fontSize="sm" color="gray.600" noOfLines={2} flexGrow={1}>
              {item.description}
            </Text>
            
            <HStack spacing={2} justify="space-between" mt="auto">
              <IconButton
                aria-label="View details"
                icon={<Eye size={18} />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(item);
                }}
              />
              <IconButton
                aria-label="Add to inventory"
                icon={<Plus size={18} />}
                size="sm"
                colorScheme="green"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenQuantitySelector(item);
                }}
              />
            </HStack>
          </VStack>
        </Box>
      </CardContent>
    </Card>
  );

  // If loading, show spinner
  if (isLoading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading item catalog...</Text>
        </VStack>
      </Center>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <Center h="300px">
        <Text color="red.500">{error}</Text>
      </Center>
    );
  }

  // Get the items to display
  const filteredItems = getFilteredItems();

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        {/* Search and Filter UI */}
        <Box borderRadius="md" bg="white" p={4} shadow="sm">
          <VStack spacing={3}>
            {/* Search Input */}
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Search size={18} color="gray.300" />
              </InputLeftElement>
              <Input 
                placeholder="Search items..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                borderRadius="md"
              />
            </InputGroup>
            
            {/* Filter Toggle */}
            <Button 
              variant="ghost" 
              rightIcon={showFilters ? <ChevronUp /> : <ChevronDown />}
              onClick={() => setShowFilters(!showFilters)}
              width="full"
              justifyContent="space-between"
              fontWeight="normal"
              color="gray.600"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            
            {/* Filter Options */}
            <Collapse in={showFilters} animateOpacity>
              <SimpleGrid columns={{ base: 3, md: 5 }} spacing={2} width="full">
                {itemCategories.map(category => (
                  <Button
                    key={category.id}
                    size="sm"
                    variant={activeFilter === category.id ? "solid" : "outline"}
                    colorScheme={activeFilter === category.id ? "blue" : "gray"}
                    leftIcon={<category.icon size={14} />}
                    onClick={() => setActiveFilter(category.id)}
                    width="full"
                  >
                    {category.label === 'Crafting' ? 'Crafting' : category.label}
                  </Button>
                ))}
              </SimpleGrid>
            </Collapse>
          </VStack>
        </Box>
        
        {/* Results Count */}
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.600">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
          </Text>
          <Badge colorScheme="blue">{activeFilter === 'All' ? 'All Items' : activeFilter}</Badge>
        </HStack>
        
        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <Center h="200px" bg="white" borderRadius="md" p={4}>
            <VStack spacing={2}>
              <Text>No items found</Text>
              <Text fontSize="sm" color="gray.500">Try adjusting your search or filters</Text>
            </VStack>
          </Center>
        ) : (
          <ScrollArea className="h-[450px] pr-2">
            <SimpleGrid columns={columns} spacing={4}>
              {filteredItems.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </SimpleGrid>
          </ScrollArea>
        )}
      </VStack>

      {/* Item Detail Modals */}
      <WeaponDetailModal
        weapon={selectedItem && selectedItem.itemType === 'Weapon' ? selectedItem : null}
        isOpen={isModalOpen['Weapon']}
        onClose={() => handleCloseModal('Weapon')}
      />
      
      <ArmorDetailModal
        armor={selectedItem && selectedItem.itemType === 'Armor' ? selectedItem : null}
        isOpen={isModalOpen['Armor']}
        onClose={() => handleCloseModal('Armor')}
      />
      
      <AmmunitionDetailModal
        ammunition={selectedItem && selectedItem.itemType === 'Ammunition' ? selectedItem : null}
        isOpen={isModalOpen['Ammunition']}
        onClose={() => handleCloseModal('Ammunition')}
      />
      
      <PotionDetailModal
        potion={selectedItem && selectedItem.itemType === 'Potion' ? selectedItem : null}
        isOpen={isModalOpen['Potion']}
        onClose={() => handleCloseModal('Potion')}
      />
      
      <ScrollDetailModal
        scroll={selectedItem && selectedItem.itemType === 'Scroll' ? selectedItem : null}
        isOpen={isModalOpen['Scroll']}
        onClose={() => handleCloseModal('Scroll')}
      />
      
      <TrapDetailModal
        trap={selectedItem && selectedItem.itemType === 'Trap' ? selectedItem : null}
        isOpen={isModalOpen['Trap']}
        onClose={() => handleCloseModal('Trap')}
      />
      
      <CraftingComponentDetailModal
        component={selectedItem && selectedItem.itemType === 'Crafting Component' ? selectedItem : null}
        isOpen={isModalOpen['Crafting Component']}
        onClose={() => handleCloseModal('Crafting Component')}
      />
      
      <ExplosivesDetailModal
        explosive={selectedItem && (selectedItem.itemType === 'Explosive' || selectedItem.itemType === 'Throwable') ? selectedItem : null}
        isOpen={isModalOpen['Explosive'] || isModalOpen['Throwable']}
        onClose={() => {
          handleCloseModal('Explosive');
          handleCloseModal('Throwable');
        }}
      />

      {/* Quantity Selector Modal */}
      <QuantitySelectorModal
        item={itemToAdd}
        isOpen={isQuantitySelectorOpen}
        onClose={() => {
          if (!isAddingItem) {
            setIsQuantitySelectorOpen(false);
            setItemToAdd(null);
          }
        }}
        onAddToInventory={handleAddToInventoryWithQuantity}
      />
    </Box>
  );
};

export default ItemCatalog;