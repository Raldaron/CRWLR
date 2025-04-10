// components/inventory/ItemCatalog.tsx
'use client'; // Add this if it's a client component

import React, { useState, useEffect, Suspense, lazy, useMemo, useCallback } from 'react';
import {
    Box, Flex, Text, Badge, SimpleGrid, Input, InputGroup, InputLeftElement, Button,
    Spinner, Center, useToast, useBreakpointValue, VStack, HStack, Collapse,
} from '@chakra-ui/react';
import {
    Search, Filter, Plus, Eye, Sword, Shield, Crosshair, Beaker, ScrollText,
    Wrench, Key, Bomb, ChevronDown, ChevronUp,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import DarkThemedCard from '@/components/ui/DarkThemedCard';
import { useCharacter } from '@/context/CharacterContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import type { InventoryItem } from '@/types/inventory';
import type { WeaponItem } from '@/types/weapon';
import type { ArmorItem } from '@/types/armor';
import type { AmmunitionItem } from '@/types/ammunition';
import type { PotionItem } from '@/types/potion';
import type { ScrollItem } from '@/types/scroll';
import type { TrapItem } from '@/types/trap';
import type { CraftingComponentItem } from '@/types/craftingcomponent';
import type { ExplosiveItem } from '@/types/explosives';

// Lazy load the detail modals
const WeaponDetailModal = lazy(() => import('../Modals/WeaponDetailModal'));
const ArmorDetailModal = lazy(() => import('../Modals/ArmorDetailModal'));
const AmmunitionDetailModal = lazy(() => import('../Modals/AmmunitionDetailModal'));
const PotionDetailModal = lazy(() => import('../Modals/PotionDetailModal'));
const ScrollDetailModal = lazy(() => import('../Modals/ScrollDetailModal'));
const TrapDetailModal = lazy(() => import('../Modals/TrapDetailModal'));
const CraftingComponentDetailModal = lazy(() => import('../Modals/CraftingComponentDetailModal'));
const ExplosivesDetailModal = lazy(() => import('../Modals/ExplosivesDetailModal'));
const QuantitySelectorModal = lazy(() => import('../Modals/QuantitySelectorModal'));

// Catalog Item Interface
interface CatalogItem {
  id: string;
  name: string;
  description: string;
  itemType: string;
  rarity: string;
  _collectionName?: string;
  _uniqueKey?: string;
  [key: string]: any;
}

// Helper: Create Unique Key
const createUniqueKey = (collectionName: string, item: { id?: string; [key: string]: any }, index: number): string => {
  if (item.id) return `${collectionName}-${item.id}`;
  return `${collectionName}-item-${index}`;
};

// Helper: Get Rarity Color
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

// Item Card Component
const ItemCard = React.memo(({ item, onViewDetails, onAddToInventory }: {
    item: CatalogItem;
    onViewDetails: () => void;
    onAddToInventory: () => void;
}) => (
    <DarkThemedCard>
        <VStack spacing={2} align="stretch" h="full">
            <Text fontWeight="bold" fontSize="md" noOfLines={1} color="gray.200">{item.name}</Text>
            <HStack>
                <Badge colorScheme={getRarityColor(item.rarity)} variant="solid">{item.rarity}</Badge>
                <Badge variant="outline" color="gray.300">{item.itemType}</Badge>
            </HStack>
            <Text fontSize="sm" color="gray.400" noOfLines={2} flexGrow={1}>{item.description}</Text>
            <HStack spacing={2} justify="space-between" mt="auto">
                <Button aria-label="View details" leftIcon={<Eye size={18} />} size="sm" variant="ghost" colorScheme="brand" onClick={(e) => { e.stopPropagation(); onViewDetails(); }}>Details</Button>
                <Button aria-label="Add to inventory" leftIcon={<Plus size={18} />} size="sm" colorScheme="brand" onClick={(e) => { e.stopPropagation(); onAddToInventory(); }}>Add</Button>
            </HStack>
        </VStack>
    </DarkThemedCard>
));
ItemCard.displayName = 'ItemCard'; // Add display name for React DevTools

// Main ItemCatalog Component
const ItemCatalog: React.FC = () => {
  // Use the direct addItemsWithQuantity function from the character context
  const { addItemsWithQuantity } = useCharacter();
  const toast = useToast();

  // --- State ---
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<{[key: string]: boolean}>({});
  const [isQuantitySelectorOpen, setIsQuantitySelectorOpen] = useState(false);
  const [itemToAdd, setItemToAdd] = useState<InventoryItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [catalog, setCatalog] = useState<{[key: string]: CatalogItem[]}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Item Categories Config
  const itemCategories = useMemo(() => [ // Use useMemo if categories don't change often
    { id: 'All', label: 'All Items', icon: Filter }, { id: 'Weapon', label: 'Weapons', icon: Sword },
    { id: 'Armor', label: 'Armor', icon: Shield }, { id: 'Ammunition', label: 'Ammunition', icon: Crosshair },
    { id: 'Potion', label: 'Potions', icon: Beaker }, { id: 'Scroll', label: 'Scrolls', icon: ScrollText },
    { id: 'Crafting Component', label: 'Crafting', icon: Wrench }, { id: 'Trap', label: 'Traps', icon: Key },
    { id: 'Explosive', label: 'Explosives', icon: Bomb },
  ], []);

  // Responsive Columns
  const columns = useBreakpointValue({ base: 1, sm: 2, md: 3, lg: 4 }) || 1;

  // --- Load Catalog Data ---
  useEffect(() => {
    const loadCatalogData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const newCatalog: {[key: string]: CatalogItem[]} = { Weapon: [], Armor: [], Ammunition: [], Potion: [], Scroll: [], 'Crafting Component': [], Trap: [], Explosive: [], Throwable: [] };
        const collections = ['weapons', 'armor', 'ammunition', 'potions', 'scrolls', 'crafting_components', 'traps', 'explosives'];

        for (const collectionName of collections) {
          try {
            const collectionRef = collection(db, collectionName);
            const querySnapshot = await getDocs(collectionRef);
            const items: CatalogItem[] = Array.from(querySnapshot.docs).map((doc, index) => {
              const itemData = doc.data();
              let itemType = '';
              switch(collectionName) {
                  case 'weapons': itemType = 'Weapon'; break; case 'armor': itemType = 'Armor'; break;
                  case 'ammunition': itemType = 'Ammunition'; break; case 'potions': itemType = 'Potion'; break;
                  case 'scrolls': itemType = 'Scroll'; break; case 'crafting_components': itemType = 'Crafting Component'; break;
                  case 'traps': itemType = 'Trap'; break;
                  case 'explosives': itemType = itemData.itemType === 'Throwable' ? 'Throwable' : 'Explosive'; break;
                  default: itemType = 'Unknown';
              }
              const uniqueKey = createUniqueKey(collectionName, { id: doc.id, ...itemData }, index);
              return {
                id: doc.id,
                name: itemData.name || 'Unnamed',
                description: itemData.description || '',
                itemType: itemData.itemType || itemType,
                rarity: itemData.rarity || 'Common',
                _collectionName: collectionName,
                _uniqueKey: uniqueKey,
                ...itemData
              };
            });

            if (collectionName === 'explosives') {
                newCatalog['Explosive'] = items.filter(item => item.itemType === 'Explosive' || !item.itemType);
                newCatalog['Throwable'] = items.filter(item => item.itemType === 'Throwable');
            } else {
                  let categoryKey = '';
                  switch(collectionName) {
                      case 'weapons': categoryKey = 'Weapon'; break; case 'armor': categoryKey = 'Armor'; break;
                      case 'ammunition': categoryKey = 'Ammunition'; break; case 'potions': categoryKey = 'Potion'; break;
                      case 'scrolls': categoryKey = 'Scroll'; break; case 'crafting_components': categoryKey = 'Crafting Component'; break;
                      case 'traps': categoryKey = 'Trap'; break;
                      default: categoryKey = 'Unknown';
                  }
                  if (categoryKey !== 'Unknown') { newCatalog[categoryKey] = items; }
            }
          } catch (collectionError) {
            console.error(`Error loading collection ${collectionName}:`, collectionError);
          }
        }
        setCatalog(newCatalog);
      } catch (error) {
        console.error('Error loading catalog:', error); 
        setError('Failed to load item catalog.');
      } finally {
        setIsLoading(false);
      }
    };
    loadCatalogData();
  }, []); // Empty dependency array - load once

  // --- Event Handlers ---
  const handleViewDetails = useCallback((item: CatalogItem) => {
    if (!item?.itemType) return;
    setSelectedItem(item);
    const modalKey = (item.itemType === 'Explosive' || item.itemType === 'Throwable') ? 'Explosive' : item.itemType;
    setIsModalOpen(prev => ({ ...prev, [modalKey]: true }));
  }, []);

  const handleCloseModal = useCallback((itemType: string) => {
    const modalKey = (itemType === 'Explosive' || itemType === 'Throwable') ? 'Explosive' : itemType;
    setIsModalOpen(prev => ({ ...prev, [modalKey]: false }));
    setSelectedItem(null);
  }, []);

  const handleOpenQuantitySelector = useCallback((item: CatalogItem) => {
    if (isAddingItem) return;
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
  }, [isAddingItem]);

  const handleAddToInventoryWithQuantity = useCallback(async (item: InventoryItem, quantity: number) => {
    if (isAddingItem || !item?.id || quantity <= 0) return;
    
    setIsAddingItem(true);
    try {
      console.log(`Adding ${quantity} × ${item.name} to inventory`);
      
      // Use the direct function from context - this is the key fix
      addItemsWithQuantity(item, quantity);
      
      toast({
        title: "Items added", 
        description: `${quantity} × ${item.name} added`,
        status: "success", 
        duration: 2000, 
        isClosable: true, 
        position: 'bottom-right'
      });
      
      setIsQuantitySelectorOpen(false);
      setItemToAdd(null);
    } catch (error) {
      console.error("Error adding items:", error);
      toast({ 
        title: "Error", 
        description: "Failed to add items", 
        status: "error", 
        duration: 3000, 
        isClosable: true 
      });
    } finally {
      setIsAddingItem(false);
    }
  }, [addItemsWithQuantity, isAddingItem, toast]);

  // --- Filtering Logic ---
  const filteredItems = useMemo(() => {
    let items: CatalogItem[] = [];
    if (activeFilter === 'All') {
      Object.entries(catalog).forEach(([category, categoryItems]) => {
        items.push(...categoryItems.map((item, index) => ({ 
          ...item, 
          _uniqueKey: item._uniqueKey || createUniqueKey(category, item, index) 
        })));
      });
    } else if (activeFilter === 'Explosive') {
      items = [
        ...(catalog['Explosive'] || []).map((item, index) => ({ 
          ...item, 
          _uniqueKey: item._uniqueKey || createUniqueKey('Explosive', item, index) 
        })),
        ...(catalog['Throwable'] || []).map((item, index) => ({ 
          ...item, 
          _uniqueKey: item._uniqueKey || createUniqueKey('Throwable', item, index) 
        }))
      ];
    } else {
      items = (catalog[activeFilter] || []).map((item, index) => ({ 
        ...item, 
        _uniqueKey: item._uniqueKey || createUniqueKey(activeFilter, item, index) 
      }));
    }
    
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
      );
    }
    
    return items;
  }, [catalog, activeFilter, searchTerm]);

  // --- Render ---
  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        {/* Search & Filter */}
        <Box borderRadius="md" bg="gray.800" p={4} shadow="sm" borderWidth="1px" borderColor="gray.700">
          <VStack spacing={3}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Search size={18} className="text-gray-400" />
              </InputLeftElement>
              <Input 
                placeholder="Search items..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                borderRadius="md" 
                bg="gray.750" 
                borderColor="gray.600" 
                _hover={{ borderColor: "brand.600" }} 
                _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)" }} 
                color="gray.200" 
              />
            </InputGroup>
            
            <Button 
              variant="ghost" 
              rightIcon={showFilters ? <ChevronUp /> : <ChevronDown />} 
              onClick={() => setShowFilters(!showFilters)} 
              width="full" 
              justifyContent="space-between" 
              fontWeight="normal" 
              color="gray.300"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            
            <Collapse in={showFilters} animateOpacity>
              <SimpleGrid columns={{ base: 3, md: 5 }} spacing={2} width="full">
                {itemCategories.map(category => (
                  <Button 
                    key={category.id} 
                    size="sm" 
                    variant={activeFilter === category.id ? "solid" : "outline"} 
                    colorScheme={activeFilter === category.id ? "brand" : "gray"} 
                    leftIcon={<category.icon size={14} />} 
                    onClick={() => setActiveFilter(category.id)} 
                    width="full"
                  >
                    {category.label === 'Crafting Component' ? 'Crafting' : category.label}
                  </Button>
                ))}
              </SimpleGrid>
            </Collapse>
          </VStack>
        </Box>

        {/* Results Info */}
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.400">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
          </Text>
          <Badge colorScheme="brand">{activeFilter === 'All' ? 'All Items' : activeFilter}</Badge>
        </HStack>

        {/* Items Grid */}
        {isLoading ? (
          <Center h="400px"><Spinner size="xl" color="brand.500" /></Center>
        ) : error ? (
          <Center h="300px"><Text color="accent.400">{error}</Text></Center>
        ) : filteredItems.length === 0 ? (
          <Center h="200px" bg="gray.800" borderRadius="md" p={4} borderWidth="1px" borderColor="gray.700">
            <VStack spacing={2}>
              <Text color="gray.300">No items found</Text>
              <Text fontSize="sm" color="gray.500">Try adjusting filters</Text>
            </VStack>
          </Center>
        ) : (
          <ScrollArea className="h-[450px] pr-2">
            <SimpleGrid columns={columns} spacing={4}>
              {filteredItems.map(item => (
                <ItemCard
                  key={item._uniqueKey || `${item._collectionName || 'item'}-${item.id}`}
                  item={item}
                  onViewDetails={() => handleViewDetails(item)}
                  onAddToInventory={() => handleOpenQuantitySelector(item)}
                />
              ))}
            </SimpleGrid>
          </ScrollArea>
        )}
      </VStack>

      {/* Modals */}
      <Suspense fallback={<Center><Spinner color="brand.500" /></Center>}>
          {selectedItem && isModalOpen['Weapon'] && (
            <WeaponDetailModal 
              weapon={selectedItem as WeaponItem} 
              isOpen={isModalOpen['Weapon']} 
              onClose={() => handleCloseModal('Weapon')} 
            />
          )}
          
          {selectedItem && isModalOpen['Armor'] && (
            <ArmorDetailModal 
              armor={selectedItem as ArmorItem} 
              isOpen={isModalOpen['Armor']} 
              onClose={() => handleCloseModal('Armor')} 
            />
          )}
          
          {selectedItem && isModalOpen['Ammunition'] && (
            <AmmunitionDetailModal 
              ammunition={selectedItem as AmmunitionItem} 
              isOpen={isModalOpen['Ammunition']} 
              onClose={() => handleCloseModal('Ammunition')} 
            />
          )}
          
          {selectedItem && isModalOpen['Potion'] && (
            <PotionDetailModal 
              potion={selectedItem as PotionItem} 
              isOpen={isModalOpen['Potion']} 
              onClose={() => handleCloseModal('Potion')} 
            />
          )}
          
          {selectedItem && isModalOpen['Scroll'] && (
            <ScrollDetailModal 
              scroll={selectedItem as ScrollItem} 
              isOpen={isModalOpen['Scroll']} 
              onClose={() => handleCloseModal('Scroll')} 
            />
          )}
          
          {selectedItem && isModalOpen['Trap'] && (
            <TrapDetailModal 
              trap={selectedItem as TrapItem} 
              isOpen={isModalOpen['Trap']} 
              onClose={() => handleCloseModal('Trap')} 
            />
          )}
          
          {selectedItem && isModalOpen['Crafting Component'] && (
            <CraftingComponentDetailModal 
              component={selectedItem as CraftingComponentItem} 
              isOpen={isModalOpen['Crafting Component']} 
              onClose={() => handleCloseModal('Crafting Component')} 
            />
          )}
          
          {selectedItem && (isModalOpen['Explosive'] || isModalOpen['Throwable']) && (
            <ExplosivesDetailModal 
              explosive={selectedItem as ExplosiveItem} 
              isOpen={isModalOpen['Explosive'] || isModalOpen['Throwable']} 
              onClose={() => { 
                handleCloseModal('Explosive'); 
                handleCloseModal('Throwable'); 
              }} 
            />
          )}

        {isQuantitySelectorOpen && itemToAdd && (
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
        )}
      </Suspense>
    </Box>
  );
};

export default ItemCatalog;