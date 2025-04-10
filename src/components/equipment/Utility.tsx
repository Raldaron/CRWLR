// components/equipment/Utility.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Badge,
  Alert,
  AlertIcon,
  VStack,
  HStack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Spinner,
  Center
} from '@chakra-ui/react';
import { Package, Plus, Minus } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';
import { ScrollArea } from '@/components/ui/scroll-area';
// Card Imports (ensure paths are correct)
import AmmunitionCard from '@/components/ItemCards/AmmunitionCard';
import TrapCard from '@/components/ItemCards/TrapCard';
import ExplosivesCard from '@/components/ItemCards/ExplosivesCard';
import CraftingComponentCard from '@/components/ItemCards/CraftingComponentCard';
import PotionCard from '@/components/ItemCards/PotionCard';
import ScrollCard from '@/components/ItemCards/ScrollCard';
import type { InventoryItem } from '@/types/inventory';
// Modal Imports (ensure paths are correct)
import AmmunitionDetailModal from '@/components/Modals/AmmunitionDetailModal';
import ScrollDetailModal from '@/components/Modals/ScrollDetailModal';
import TrapDetailModal from '@/components/Modals/TrapDetailModal';
import ExplosivesDetailModal from '@/components/Modals/ExplosivesDetailModal';
import CraftingComponentDetailModal from '@/components/Modals/CraftingComponentDetailModal';
import PotionDetailModal from '@/components/Modals/PotionDetailModal';
// Type Imports (ensure paths are correct)
import type { AmmunitionItem } from '@/types/ammunition';
import type { ScrollItem } from '@/types/scroll';
import type { TrapItem } from '@/types/trap';
import type { ExplosiveItem } from '@/types/explosives';
import type { PotionItem } from '@/types/potion';
import type { CraftingComponentItem } from '@/types/craftingcomponent';
// Firestore Imports
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
// Import the utility slot card component
import UtilitySlotCard from './UtilitySlotCard'; // Adjusted path if needed

// Specify the type for a utility slot
interface UtilitySlot {
  id: string;
  name: string;
  stack: {
    item: InventoryItem;
    quantity: number;
  } | null;
}

// Allowed item types for utility slots
const ALLOWED_TYPES = [
  'Ammunition',
  'Crafting Component',
  'Explosive', // Covers Explosive and Throwable for filtering
  'Scroll',
  'Trap',
  'Potion' // Covers Potion and Pharmaceutical for filtering
];

// Interface for the fetched item catalog structure
interface ItemCatalogData {
    ammunition: AmmunitionItem[];
    craftingComponents: CraftingComponentItem[];
    explosives: ExplosiveItem[];
    scrolls: ScrollItem[];
    traps: TrapItem[];
    potions: PotionItem[];
}

// *** Function definition restored ***
// Safely render item cards based on item type
const getItemCard = (item: InventoryItem, onClick: () => void) => {
  // Add null/undefined check for item itself
  if (!item) {
      console.warn("getItemCard received null or undefined item");
      return <Box p={3} borderWidth="1px" borderRadius="md" bg="gray.700"><Text color="red.400">Invalid Item Data</Text></Box>;
  }
  // Add null/undefined check for itemType
  if (!item.itemType) {
       console.warn("getItemCard received item with no itemType:", item);
       return ( // Fallback card for items with missing type
            <Box p={3} borderWidth="1px" borderRadius="md" onClick={onClick} cursor="pointer" bg="gray.700">
                <Text fontWeight="bold">{item.name || "Unknown Item"}</Text>
                <Badge colorScheme="red">Type Missing</Badge>
            </Box>
       );
  }

  switch (item.itemType) {
    case 'Ammunition':
      return <AmmunitionCard item={item as AmmunitionItem} onClick={onClick} />;
    case 'Crafting Component':
      return <CraftingComponentCard item={item as CraftingComponentItem} onClick={onClick} />;
    case 'Explosive':
    case 'Throwable':
      return <ExplosivesCard item={item as ExplosiveItem} onClick={onClick} />;
    case 'Scroll':
       const safeScrollItem = {
           ...item,
           duration: typeof item.duration === 'string' ? parseInt(item.duration, 10) || 0 : typeof item.duration === 'number' ? item.duration : 0,
        };
       return <ScrollCard item={safeScrollItem as unknown as ScrollItem} onClick={onClick} />;
    case 'Trap':
      return <TrapCard item={item as TrapItem} onClick={onClick} />;
    case 'Potion':
    case 'Pharmaceutical':
      return <PotionCard item={item as PotionItem} onClick={onClick} />;
    default:
       console.warn(`Utility: No card defined for itemType "${item.itemType}"`);
       return ( // Fallback card
           <Box p={3} borderWidth="1px" borderRadius="md" onClick={onClick} cursor="pointer" bg="gray.700">
               <Text fontWeight="bold">{item.name}</Text>
               <Badge>{item.itemType}</Badge>
           </Box>
       );
  }
};


const Utility: React.FC = () => {
  const toast = useToast();
  const {
    getItemQuantity,
    utilitySlots,
    addItemToUtilitySlot,
    removeItemFromUtilitySlot,
    updateUtilitySlotQuantity
  } = useCharacter();

  // States (Restored)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null); // For detail view
  const [itemToAdd, setItemToAdd] = useState<InventoryItem | null>(null); // For quantity selection
  const [isAddingItem, setIsAddingItem] = useState(false); // Loading state for adding
  const [isLoading, setIsLoading] = useState(true); // Loading state for catalog fetch
  const [error, setError] = useState<string | null>(null); // Error state for catalog fetch
  const [quantityToAdd, setQuantityToAdd] = useState(1); // State for quantity modal
  const [itemCatalog, setItemCatalog] = useState<ItemCatalogData>({
    ammunition: [], craftingComponents: [], explosives: [], scrolls: [], traps: [], potions: []
  });

  // Modal controls (Restored)
  const { isOpen: isItemSelectOpen, onOpen: openItemSelect, onClose: closeItemSelect } = useDisclosure();
  const { isOpen: isItemDetailOpen, onOpen: openItemDetail, onClose: closeItemDetail } = useDisclosure();
  const { isOpen: isQuantityOpen, onOpen: openQuantity, onClose: closeQuantity } = useDisclosure();

  // *** Function definition restored with blastradius fix ***
  // Load items from Firestore
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log("Fetching items from Firestore...");

    try {
      const newItemCatalog: ItemCatalogData = {
        ammunition: [], craftingComponents: [], explosives: [], scrolls: [], traps: [], potions: []
      };

      const collectionsToFetch: { name: string; key: keyof ItemCatalogData; type: string }[] = [
        { name: 'ammunition', key: 'ammunition', type: 'Ammunition' },
        { name: 'crafting_components', key: 'craftingComponents', type: 'Crafting Component' },
        { name: 'explosives', key: 'explosives', type: 'Explosive' },
        { name: 'scrolls', key: 'scrolls', type: 'Scroll' },
        { name: 'traps', key: 'traps', type: 'Trap' },
        { name: 'potions', key: 'potions', type: 'Potion' },
        { name: 'pharmaceuticals', key: 'potions', type: 'Pharmaceutical' },
      ];

      for (const { name, key, type } of collectionsToFetch) {
        try {
          const collectionRef = collection(db, name);
          const snapshot = await getDocs(collectionRef);

          snapshot.forEach(doc => {
            const data = doc.data();
            if (data && data.name) {
              let finalItemType = data.itemType || type;
              if (name === 'explosives' && data.itemType !== 'Explosive' && data.itemType !== 'Throwable') {
                finalItemType = 'Explosive';
              }
              if ((name === 'potions' || name === 'pharmaceuticals') && data.itemType !== 'Potion' && data.itemType !== 'Pharmaceutical') {
                finalItemType = type;
              }

              // Process blastradius - Keep original string if not just a number
              let processedBlastRadius: string | number | undefined = data.blastradius;
              if (typeof data.blastradius === 'string') {
                const trimmed = data.blastradius.trim();
                const parsed = parseFloat(trimmed);
                if (!isNaN(parsed) && String(parsed) === trimmed) {
                  processedBlastRadius = parsed;
                }
              } else if (typeof data.blastradius !== 'number') {
                processedBlastRadius = undefined;
              }

              let specificData: any = {};
              if (finalItemType === 'Explosive' || finalItemType === 'Throwable') {
                 specificData.blastradius = processedBlastRadius;
              }
              if (finalItemType === 'Potion' || finalItemType === 'Pharmaceutical') {
                 specificData.statBonus = {}; specificData.skillBonus = {};
                 if (data.statBonus && typeof data.statBonus === 'object') Object.entries(data.statBonus).forEach(([k, v]) => specificData.statBonus[k] = typeof v === 'string' ? parseFloat(v) || 0 : (v || 0));
                 if (data.skillBonus && typeof data.skillBonus === 'object') Object.entries(data.skillBonus).forEach(([k, v]) => specificData.skillBonus[k] = typeof v === 'string' ? parseFloat(v) || 0 : (v || 0));
              }

              const itemToAdd = { ...data, id: doc.id, itemType: finalItemType, ...specificData };
              (newItemCatalog[key] as any[]).push(itemToAdd);

            } else {
              console.warn(`Document ${doc.id} in ${name} missing name or data.`);
            }
          });
        } catch (collectionError) {
          console.error(`Error fetching ${name}:`, collectionError);
          setError(`Failed to load ${name}.`);
        }
      }

      setItemCatalog(newItemCatalog);
      setError(null);
    } catch (err) {
      console.error("Error fetching items:", err);
      setError("Failed to load item catalog. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencies: empty array means fetch once on mount

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // *** Function definition restored ***
  // Get items based on the selected tab/type
   const getItemsByType = (type: string): InventoryItem[] => {
       switch (type) {
         case 'Ammunition': return itemCatalog.ammunition as InventoryItem[];
         case 'Crafting Component': return itemCatalog.craftingComponents as InventoryItem[];
         case 'Explosive': return itemCatalog.explosives as InventoryItem[];
         case 'Scroll': return itemCatalog.scrolls as InventoryItem[];
         case 'Trap': return itemCatalog.traps as InventoryItem[];
         case 'Potion': return itemCatalog.potions as InventoryItem[];
         default: return [];
       }
   };

  // Items to display in tabs
  const itemTypesForTabs = ALLOWED_TYPES;
  const tabLabels: { [key: string]: string } = {
      'Ammunition': 'Ammo',
      'Crafting Component': 'Crafting',
      'Explosive': 'Explosives/Throwables',
      'Scroll': 'Scrolls',
      'Trap': 'Traps',
      'Potion': 'Potions/Pharma'
  };

  // --- Event Handlers (Restored/Verified) ---
  const handleViewDetails = (item: InventoryItem) => { setSelectedItem(item); openItemDetail(); };
  const handleAddItem = (slotId: string) => { setSelectedSlot(slotId); setSelectedTabIndex(0); openItemSelect(); };
  const prepareAddItem = (item: InventoryItem) => { setItemToAdd(item); setQuantityToAdd(1); closeItemSelect(); openQuantity(); };

  const handleAddItemToSlot = (quantity: number) => {
    if (!itemToAdd || !selectedSlot || quantity <= 0) {
      closeQuantity(); return;
    }
    setIsAddingItem(true);
    try {
      addItemToUtilitySlot(selectedSlot, itemToAdd, quantity);
      toast({ title: "Item Added", description: `${quantity} × ${itemToAdd.name} added`, status: "success", duration: 2000, isClosable: true });
    } catch (error) { toast({ title: "Error", description: "Failed to add item", status: "error" }); }
    finally { closeQuantity(); setItemToAdd(null); setIsAddingItem(false); }
  };

  const handleIncrement = (slotId: string) => {
    const slot = utilitySlots.find(s => s.id === slotId);
    if (!slot || !slot.stack) return;
    const { item } = slot.stack;
    const invQty = getItemQuantity(item.id);
    if (invQty > 0) {
      updateUtilitySlotQuantity(slotId, 1);
      toast({ title: "Added to Slot", description: `Added 1 more ${item.name}`, status: "success", duration: 1500, isClosable: true });
    } else {
      toast({ title: "Out of Stock", description: `No more ${item.name} in inventory`, status: "warning", duration: 2000, isClosable: true });
    }
  };

  const handleDecrement = (slotId: string) => {
    const slot = utilitySlots.find(s => s.id === slotId);
    if (!slot || !slot.stack) return;
    const { item } = slot.stack;
    updateUtilitySlotQuantity(slotId, -1);
    toast({ title: "Item Used", description: `1 × ${item.name} used`, status: "info", duration: 2000, isClosable: true });
  };

  const handleUnequip = (slotId: string) => {
    const slot = utilitySlots.find(s => s.id === slotId);
    if (!slot || !slot.stack) return;
    removeItemFromUtilitySlot(slotId);
    toast({ title: "Items Returned", description: `${slot.stack.quantity} × ${slot.stack.item.name} returned`, status: "info", duration: 2000, isClosable: true });
  };

  // Error state UI
  if (error) {
    return ( <Box p={4} textAlign="center"><Alert status="error"><AlertIcon /><Text>{error}</Text><Button onClick={fetchItems} ml={4} size="sm">Retry</Button></Alert></Box> );
  }

  // --- Main Render (Restored Full Structure) ---
  return (
    <Box p={4} bg="gray.900">
      {/* Utility Slots Grid */}
      <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={4} mb={6}>
        {utilitySlots.map((slot) => (
          <UtilitySlotCard
            key={slot.id}
            slot={slot}
            onAddItem={() => handleAddItem(slot.id)}
            onViewDetails={handleViewDetails}
            onIncrement={() => handleIncrement(slot.id)}
            onDecrement={() => handleDecrement(slot.id)}
            onUnequip={() => handleUnequip(slot.id)}
          />
        ))}
      </SimpleGrid>

      {/* Item Selection Modal */}
      <Modal isOpen={isItemSelectOpen} onClose={closeItemSelect} size="4xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxH="85vh" bg="gray.800" borderColor="gray.700">
           <ModalHeader color="gray.200">Select Item for Slot {selectedSlot?.replace('utility','')}</ModalHeader>
           <ModalCloseButton color="gray.400" />
           <ModalBody pb={6} px={0}>
             {isLoading ? ( <Center p={8}><VStack> <Spinner size="xl" color="brand.400" /> <Text mt={4} color="gray.400">Loading items...</Text> </VStack></Center> ) : (
               <Tabs index={selectedTabIndex} onChange={setSelectedTabIndex} colorScheme="brand" isLazy variant="line">
                 <TabList px={6} borderColor="gray.700">
                   {itemTypesForTabs.map((type) => ( <Tab key={type} color="gray.300" _selected={{ color: 'brand.400', borderColor: 'brand.400' }}>{tabLabels[type] || type}</Tab> ))}
                 </TabList>
                 <TabPanels>
                   {itemTypesForTabs.map((type) => (
                     <TabPanel key={type} px={6} py={4}>
                        <ScrollArea className="h-[50vh]">
                           {getItemsByType(type).length === 0 ? ( <Alert status="info" bg="gray.700" color="gray.200" borderRadius="md"> <AlertIcon color="brand.400" /> No {tabLabels[type] || type} items available. </Alert> ) : (
                             <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                               {getItemsByType(type).map((item) => ( <Box key={item.id} position="relative">{getItemCard(item,() => prepareAddItem(item))}</Box> ))}
                             </SimpleGrid>
                           )}
                        </ScrollArea>
                     </TabPanel>
                   ))}
                 </TabPanels>
               </Tabs>
             )}
           </ModalBody>
        </ModalContent>
      </Modal>

      {/* Quantity Selection Modal */}
      <Modal isOpen={isQuantityOpen} onClose={closeQuantity} isCentered>
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.700">
          <ModalHeader color="gray.200">Select Quantity</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={6}>
            {itemToAdd && (
              <VStack spacing={4} align="center">
                 <Text color="gray.200"> How many {itemToAdd.name}?</Text>
                 <Text fontSize="sm" color="gray.400"> Available in Inventory: {getItemQuantity(itemToAdd.id)} </Text>
                 <NumberInput value={quantityToAdd} onChange={(_, value) => setQuantityToAdd(value)} min={1} max={getItemQuantity(itemToAdd.id) || 1} keepWithinRange={true} width="120px" borderColor="gray.600" focusBorderColor="brand.500">
                    <NumberInputField bg="gray.700" color="gray.200" _hover={{ borderColor: "brand.500" }} />
                    <NumberInputStepper><NumberIncrementStepper borderColor="gray.600" color="gray.400" /><NumberDecrementStepper borderColor="gray.600" color="gray.400" /></NumberInputStepper>
                 </NumberInput>
                 <Button colorScheme="brand" onClick={() => handleAddItemToSlot(quantityToAdd)} isLoading={isAddingItem} loadingText="Adding..." isDisabled={getItemQuantity(itemToAdd.id) === 0}> Add to Slot </Button>
                 {getItemQuantity(itemToAdd.id) === 0 && <Text fontSize="xs" color="orange.300">None left in inventory!</Text>}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Item Detail Modals */}
       {selectedItem && (
        <>
          {(selectedItem.itemType === 'Ammunition') && ( <AmmunitionDetailModal ammunition={selectedItem as AmmunitionItem} isOpen={isItemDetailOpen} onClose={closeItemDetail}/> )}
          {(selectedItem.itemType === 'Scroll') && ( <ScrollDetailModal scroll={selectedItem as ScrollItem} isOpen={isItemDetailOpen} onClose={closeItemDetail}/> )}
          {(selectedItem.itemType === 'Trap') && ( <TrapDetailModal trap={selectedItem as TrapItem} isOpen={isItemDetailOpen} onClose={closeItemDetail}/> )}
          {(selectedItem.itemType === 'Explosive' || selectedItem.itemType === 'Throwable') && ( <ExplosivesDetailModal explosive={selectedItem as ExplosiveItem} isOpen={isItemDetailOpen} onClose={closeItemDetail}/> )}
          {(selectedItem.itemType === 'Crafting Component') && ( <CraftingComponentDetailModal component={selectedItem as CraftingComponentItem} isOpen={isItemDetailOpen} onClose={closeItemDetail}/> )}
          {(selectedItem.itemType === 'Potion' || selectedItem.itemType === 'Pharmaceutical') && ( <PotionDetailModal potion={selectedItem as PotionItem} isOpen={isItemDetailOpen} onClose={closeItemDetail}/> )}
        </>
      )}
    </Box>
  );
};

export default Utility;