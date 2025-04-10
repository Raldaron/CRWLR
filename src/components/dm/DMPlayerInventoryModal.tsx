// src/components/dm/DMPlayerInventoryModal.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Spinner,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  InputGroup,
  InputLeftElement,
  Input,
  SimpleGrid,
  Center,
  Grid,
  Heading,
  TableContainer, // Added TableContainer
} from '@chakra-ui/react';
import { doc, getDoc, updateDoc, collection, getDocs, query, limit, serverTimestamp, Timestamp } from 'firebase/firestore'; // Added Timestamp
import { db } from '@/firebase/firebaseConfig';
import { Package, Trash, Search, Plus, Eye } from 'lucide-react';
import type { InventoryItem } from '@/types/inventory';
import { ScrollArea } from '@/components/ui/scroll-area';

// Interface for player prop (matching DMPlayerManager)
interface Player {
  id: string; // Character document ID
  characterName: string;
  // Add other relevant player fields if needed
}

// Interface for inventory items within this modal state
interface PlayerInventoryItem {
  item: InventoryItem; // This should contain the full item details
  quantity: number;
}

// Interface for catalog items within this modal state
interface CatalogItem extends InventoryItem {
    id: string; // Ensure ID is always present
    collectionName?: string; // Added collectionName as optional
}

interface DMPlayerInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
}

// Helper to infer item type from collection name
const getItemTypeFromCollectionName = (collectionName: string): string => {
    switch (collectionName) {
        case 'weapons': return 'Weapon';
        case 'armor': return 'Armor';
        case 'ammunition': return 'Ammunition';
        case 'potions': return 'Potion';
        case 'scrolls': return 'Scroll';
        case 'crafting_components': return 'Crafting Component';
        case 'traps': return 'Trap';
        case 'explosives': return 'Explosive';
        case 'miscellaneous_items': return 'Miscellaneous';
        default: return 'Unknown';
    }
};

// --- FIX: ADD SANITIZE HELPER FUNCTION ---
const sanitizeDataForFirestore = (data: any): any => {
    if (data === undefined) {
        return null; // Replace top-level undefined with null
    }
    if (data === null || typeof data !== 'object' || data instanceof Timestamp || data instanceof Date) {
        // Allow Timestamps and Dates through
        return data; // Primitives, null, Timestamps, or Dates are fine
    }

    if (Array.isArray(data)) {
        // Recurse into arrays, filtering out undefined values if desired, or replacing them
        return data.map(item => sanitizeDataForFirestore(item)).filter(item => item !== undefined); // Or replace undefined with null in the map
    }

    const sanitizedObject: { [key: string]: any } = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (value !== undefined) {
                sanitizedObject[key] = sanitizeDataForFirestore(value); // Recurse into object properties
            }
            // Implicitly omits undefined properties
            // If you MUST have the field with null, add: else { sanitizedObject[key] = null; }
        }
    }
    return sanitizedObject;
};
// --- END FIX ---


const DMPlayerInventoryModal: React.FC<DMPlayerInventoryModalProps> = ({ isOpen, onClose, player }) => {
  const [playerInventory, setPlayerInventory] = useState<PlayerInventoryItem[]>([]);
  const [itemCatalog, setItemCatalog] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // For save operations
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const toast = useToast();

  // Fetch Player Inventory
  const fetchInventory = useCallback(async () => {
    if (!player) return;
    setIsLoading(true);
    try {
      const playerDocRef = doc(db, 'characters', player.id);
      const playerDocSnap = await getDoc(playerDocRef);

      if (playerDocSnap.exists()) {
        const data = playerDocSnap.data();
         const rawInventory = Array.isArray(data.inventory) ? data.inventory : [];
         const validatedInventory: PlayerInventoryItem[] = rawInventory
             .filter(invItem => invItem && typeof invItem === 'object' && invItem.item && typeof invItem.quantity === 'number')
             .map(invItem => ({
                 item: invItem.item as InventoryItem,
                 quantity: invItem.quantity
             }));

        setPlayerInventory(validatedInventory);
      } else {
        console.warn(`Player document ${player.id} not found.`);
        setPlayerInventory([]);
        toast({ title: "Error", description: "Player data not found.", status: "error", duration: 3000 });
        onClose();
      }
    } catch (error) {
      console.error('Error fetching player inventory:', error);
      toast({ title: 'Error', description: 'Failed to load player inventory.', status: 'error' });
      setPlayerInventory([]);
    } finally {
      setIsLoading(false);
    }
  }, [player, toast, onClose]);

  // Fetch Item Catalog
  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
     const itemCollections = [
        'weapons', 'armor', 'ammunition', 'potions',
        'scrolls', 'crafting_components', 'traps', 'explosives',
        'miscellaneous_items'
    ];
    try {
      let allFetchedItems: CatalogItem[] = [];
       for (const collectionName of itemCollections) {
            const itemsRef = collection(db, collectionName);
            const q = query(itemsRef, limit(500));
             const querySnapshot = await getDocs(q);
            const fetchedItems = querySnapshot.docs.map(docSnap => {
                const data = docSnap.data() as Omit<InventoryItem, 'id'>;
                const itemType = data.itemType || getItemTypeFromCollectionName(collectionName);
                return {
                    id: docSnap.id,
                    collectionName: collectionName,
                    ...data,
                    itemType: itemType,
                } as CatalogItem;
            });
             allFetchedItems = [...allFetchedItems, ...fetchedItems];
        }
         const uniqueItems = Array.from(new Map(allFetchedItems.map(item => [item.id, item])).values());
        uniqueItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setItemCatalog(uniqueItems);
    } catch (error) {
      console.error("Error loading item catalog:", error);
      toast({ title: 'Error Loading Catalog', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch data when modal opens or player changes
  useEffect(() => {
    if (isOpen && player) {
      fetchInventory();
      fetchCatalog();
    } else {
      setPlayerInventory([]);
      setItemCatalog([]);
      setCatalogSearchTerm('');
      setIsLoading(false);
      setIsSaving(false);
    }
  }, [isOpen, player, fetchInventory, fetchCatalog]);


  // Save Inventory Changes back to Firestore
  const saveInventory = async (newInventory: PlayerInventoryItem[]) => {
    if (!player) return;
    setIsSaving(true);
    try {
      const playerDocRef = doc(db, 'characters', player.id);

       // --- FIX: Sanitize each item in the inventory array ---
       const inventoryToSave = newInventory.map(inv => ({
           item: sanitizeDataForFirestore(inv.item), // Sanitize the 'item' object
           quantity: inv.quantity
       }));
       // --- END FIX ---

      await updateDoc(playerDocRef, {
        inventory: inventoryToSave, // Save the sanitized inventory
        lastUpdated: serverTimestamp(),
      });
      setPlayerInventory(newInventory);
      // toast({ title: "Inventory Updated", status: "success", duration: 1500 }); // Optional: Re-enable if desired
    } catch (error) {
      console.error('Error saving player inventory:', error);
      toast({ title: 'Save Error', description: 'Failed to save inventory changes.', status: 'error' });
      fetchInventory();
    } finally {
      setIsSaving(false);
    }
  };

  // Add Item to Player's Inventory
  const handleAddItem = (itemToAdd: CatalogItem, quantity: number = 1) => {
      if (quantity <= 0) return;
      if (!itemToAdd || !itemToAdd.id) {
           toast({ title: 'Error', description: 'Invalid item selected.', status: 'error' });
           return;
       }

       // --- FIX: Only include core fields plus known existing optional fields ---
       // Avoid spreading potentially undefined fields directly
       const inventoryItemObject: InventoryItem = {
           id: itemToAdd.id,
           name: itemToAdd.name || 'Unknown Item',
           description: itemToAdd.description || '',
           itemType: itemToAdd.itemType || 'Miscellaneous',
           rarity: itemToAdd.rarity || 'Common',
           // Explicitly add optional fields *if they exist* on itemToAdd
           ...(itemToAdd.buyValue !== undefined && { buyValue: itemToAdd.buyValue }),
           ...(itemToAdd.sellValue !== undefined && { sellValue: itemToAdd.sellValue }),
           ...(itemToAdd.weight !== undefined && { weight: itemToAdd.weight }),
           ...(itemToAdd.effects !== undefined && { effects: itemToAdd.effects }), // Example
           ...(itemToAdd.damageAmount !== undefined && { damageAmount: itemToAdd.damageAmount }), // Example for Weapon
           ...(itemToAdd.armorRating !== undefined && { armorRating: itemToAdd.armorRating }), // Example for Armor
           // Add other optional fields from InventoryItem type *only if present* in itemToAdd
       };
       // --- END FIX ---

      const existingIndex = playerInventory.findIndex(invItem => invItem.item.id === inventoryItemObject.id);
      let updatedInventory;

      if (existingIndex > -1) {
          updatedInventory = playerInventory.map((invItem, index) =>
              index === existingIndex
                  ? { ...invItem, quantity: invItem.quantity + quantity }
                  : invItem
          );
      } else {
          updatedInventory = [...playerInventory, { item: inventoryItemObject, quantity }];
      }
      saveInventory(updatedInventory);
       toast({ title: `Added ${quantity}x ${inventoryItemObject.name}`, status: 'success', duration: 1500, isClosable: true });
  };


 // Remove Item from Player's Inventory
  const handleRemoveItem = (itemId: string, quantityToRemove: number = 1) => {
    const existingIndex = playerInventory.findIndex(invItem => invItem.item.id === itemId);
     if (existingIndex === -1) return;

    const currentQuantity = playerInventory[existingIndex].quantity;
    const itemName = playerInventory[existingIndex].item.name;
    let updatedInventory;

    if (currentQuantity <= quantityToRemove) {
      updatedInventory = playerInventory.filter((_, index) => index !== existingIndex);
    } else {
      updatedInventory = playerInventory.map((invItem, index) =>
        index === existingIndex
          ? { ...invItem, quantity: invItem.quantity - quantityToRemove }
          : invItem
      );
    }
    saveInventory(updatedInventory);
     toast({ title: `Removed ${quantityToRemove}x ${itemName}`, status: 'info', duration: 1500, isClosable: true });
  };


   // Update Item Quantity
    const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity < 0 || isNaN(newQuantity)) return;

        let updatedInventory;
        if (newQuantity === 0) {
            updatedInventory = playerInventory.filter(invItem => invItem.item.id !== itemId);
        } else {
            updatedInventory = playerInventory.map(invItem =>
                invItem.item.id === itemId
                    ? { ...invItem, quantity: newQuantity }
                    : invItem
            );
        }
        saveInventory(updatedInventory);
    };


  // Filter Catalog Items
  const filteredCatalogItems = useMemo(() => {
    if (!catalogSearchTerm) return itemCatalog;
    const lowerSearch = catalogSearchTerm.toLowerCase();
    return itemCatalog.filter(item =>
      (item.name?.toLowerCase().includes(lowerSearch) ?? false) ||
      (item.description?.toLowerCase().includes(lowerSearch) ?? false) ||
      (item.itemType?.toLowerCase().includes(lowerSearch) ?? false)
    );
  }, [itemCatalog, catalogSearchTerm]);

   const getRarityColor = (rarity?: string): string => {
      switch (rarity?.toLowerCase()) {
         case 'common': return 'gray';
         case 'uncommon': return 'green';
         case 'rare': return 'blue';
         case 'very rare': return 'cyan';
         case 'epic': return 'purple';
         case 'legendary': return 'orange';
         case 'unique': return 'yellow';
         case 'artifact': return 'red';
         case 'exceedingly rare': return 'pink';
         default: return 'gray';
      }
   };


  return (
     <Modal isOpen={isOpen} onClose={onClose} size={{base: "full", md: "4xl"}} scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg="gray.850" color="gray.100">
        <ModalHeader borderBottomWidth="1px" borderColor="gray.700">
          Inventory: {player?.characterName || 'Player'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={{base: 3, md: 6}}>
          {isLoading ? (
            <Center h="300px">
              <Spinner size="xl" color="brand.400" />
            </Center>
          ) : (
             <Grid templateColumns={{ base: "1fr", lg: "1.5fr 1fr" }} gap={{base: 4, md: 6}}>
              {/* Left Column: Current Inventory */}
              <Box>
                <Heading size="md" mb={4} color="gray.200">Current Items</Heading>
                 <Box bg="gray.800" p={{base: 2, md: 4}} borderRadius="md" borderWidth="1px" borderColor="gray.700">
                    <ScrollArea className="h-[450px]">
                     {playerInventory.length === 0 ? (
                        <Center h="100px"><Text color="gray.500">Inventory is empty.</Text></Center>
                     ) : (
                          <TableContainer>
                             <Table variant="simple" size="sm">
                             <Thead bg="gray.750" position="sticky" top={0} zIndex={1}>
                                <Tr>
                                    <Th color="gray.300" borderColor="gray.600" px={2}>Item</Th>
                                    <Th color="gray.300" borderColor="gray.600" px={2} isNumeric>Qty</Th>
                                    <Th color="gray.300" borderColor="gray.600" textAlign="right" px={2}>Actions</Th>
                                </Tr>
                             </Thead>
                             <Tbody>
                                {playerInventory.map(({ item, quantity }) => (
                                    <Tr key={item.id} _hover={{ bg: 'gray.700' }} borderColor="gray.600">
                                        <Td borderColor="gray.600" px={2}>
                                            <Text fontWeight="medium" color="gray.200">{item.name}</Text>
                                            <HStack spacing={1} mt={1}>
                                                <Badge colorScheme={getRarityColor(item.rarity)} fontSize="xs">{item.rarity || 'Common'}</Badge>
                                                <Badge variant="outline" colorScheme="gray" fontSize="xs">{item.itemType || 'N/A'}</Badge>
                                            </HStack>
                                        </Td>
                                        <Td isNumeric borderColor="gray.600" px={2}>
                                            <NumberInput
                                                size="xs"
                                                value={quantity}
                                                 onChange={(_, valueAsNumber) => handleUpdateQuantity(item.id, isNaN(valueAsNumber) ? 0 : valueAsNumber)}
                                                min={0}
                                                maxW="60px"
                                                bg="gray.750"
                                                borderColor="gray.600"
                                                borderRadius="md"
                                                isDisabled={isSaving}
                                            >
                                                <NumberInputField textAlign="center" py={1} />
                                            </NumberInput>
                                        </Td>
                                        <Td textAlign="right" borderColor="gray.600" px={2}>
                                            <IconButton
                                                aria-label="Remove one item"
                                                icon={<Trash size={14} />}
                                                size="xs"
                                                colorScheme="red"
                                                variant="ghost"
                                                onClick={() => handleRemoveItem(item.id, 1)}
                                                isDisabled={isSaving}
                                            />
                                        </Td>
                                    </Tr>
                                ))}
                             </Tbody>
                             </Table>
                          </TableContainer>
                     )}
                   </ScrollArea>
                 </Box>
              </Box>

              {/* Right Column: Add Items from Catalog */}
              <Box>
                <Heading size="md" mb={4} color="gray.200">Add Items</Heading>
                  <Box bg="gray.800" p={{base: 2, md: 4}} borderRadius="md" borderWidth="1px" borderColor="gray.700">
                    <InputGroup mb={4} size="sm">
                         <InputLeftElement pointerEvents="none" height="32px">
                           <Search size={14} color="gray.400" />
                        </InputLeftElement>
                        <Input
                            placeholder="Search catalog..."
                            value={catalogSearchTerm}
                            onChange={(e) => setCatalogSearchTerm(e.target.value)}
                            bg="gray.700" borderColor="gray.600" pl={8}
                        />
                    </InputGroup>

                     <ScrollArea className="h-[400px]">
                        {itemCatalog.length === 0 && !isLoading ? (
                             <Center h="100px"><Text color="gray.500">Catalog is empty.</Text></Center>
                        ) : filteredCatalogItems.length === 0 ? (
                            <Center h="100px"><Text color="gray.500">No items match search.</Text></Center>
                        ) : (
                            <VStack spacing={2} align="stretch">
                                {filteredCatalogItems.map((item) => (
                                <HStack key={item.id} p={2} bg="gray.750" borderRadius="md" justify="space-between" _hover={{ bg: 'gray.700' }}>
                                     <Box flex={1} mr={2}>
                                        <Text fontWeight="medium" color="gray.200" fontSize="sm">{item.name}</Text>
                                        <HStack spacing={1} mt={1}>
                                            <Badge colorScheme={getRarityColor(item.rarity)} fontSize="xs">{item.rarity || 'Common'}</Badge>
                                            <Badge variant="outline" colorScheme="gray" fontSize="xs">{item.itemType || 'N/A'}</Badge>
                                        </HStack>
                                    </Box>
                                    <IconButton
                                        aria-label="Add item"
                                        icon={<Plus size={14} />}
                                        size="xs"
                                        colorScheme="green"
                                        variant="ghost"
                                        onClick={() => handleAddItem(item, 1)}
                                        isDisabled={isSaving}
                                    />
                                </HStack>
                                ))}
                            </VStack>
                        )}
                    </ScrollArea>
                 </Box>
              </Box>
            </Grid>
          )}
        </ModalBody>
        <ModalFooter borderTopWidth="1px" borderColor="gray.700">
          <Button colorScheme="gray" variant="ghost" onClick={onClose} isDisabled={isSaving}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DMPlayerInventoryModal;