import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  // Removed ModalFooter
  ModalBody,
  ModalCloseButton,
  Box,
  VStack,
  HStack,
  Text,
  // Removed Button from footer context
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
  // Removed Divider as it wasn't used
  InputGroup,
  InputLeftElement,
  Input,
  Center,
  Heading,
  TableContainer,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tooltip,
  Flex
} from '@chakra-ui/react';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  limit,
  serverTimestamp,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Package, Trash, Search, Plus, BookOpen, CheckCircle } from 'lucide-react';
import type { InventoryItem } from '@/types/inventory';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- Interfaces ---
interface Player {
  id: string;
  characterName: string;
}

interface PlayerInventoryItem {
  item: InventoryItem;
  quantity: number;
}

interface CatalogItem extends InventoryItem {
  id: string;
  collectionName?: string;
}

// Simplified RecipeDefinition
interface RecipeDefinition {
  id: string;
  name: string;
  itemType: 'Recipe';
  rarity?: string;
  craftedItemId: string;
  craftedItemName?: string;
  craftedItemRarity?: string;
}

interface DMPlayerInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
}

// Helper Functions
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
    case 'pharmaceuticals': return 'Pharmaceutical';
    default: return 'Unknown';
  }
};

const sanitizeDataForFirestore = (data: any): any => {
  if (data === undefined) return null;
  if (data === null || typeof data !== 'object' || data instanceof Timestamp || data instanceof Date)
    return data;
  if (Array.isArray(data))
    return data.map(item => sanitizeDataForFirestore(item)).filter(item => item !== undefined);
  const sanitizedObject: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value !== undefined) {
        sanitizedObject[key] = sanitizeDataForFirestore(value);
      } else {
        sanitizedObject[key] = null; // Ensure undefined fields become null in Firestore
      }
    }
  }
  return sanitizedObject;
};

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
    case 'celestial': return 'pink';
    case 'exceedingly rare': return 'pink';
    default: return 'gray';
  }
};

// Helper for finding crafted item information
async function findCraftedItemInfo(itemId: string): Promise<{ name: string; rarity: string } | null> {
  if (!itemId || typeof itemId !== 'string') {
    console.warn("findCraftedItemInfo called with invalid itemId:", itemId);
    return null;
  }
  const possibleCollections = [
    'weapons',
    'armor',
    'ammunition',
    'potions',
    'scrolls',
    'crafting_components',
    'traps',
    'explosives',
    'miscellaneous_items',
    'pharmaceuticals'
  ];
  for (const collectionName of possibleCollections) {
    try {
      const itemRef = doc(db, collectionName, itemId);
      const itemSnap = await getDoc(itemRef);
      if (itemSnap.exists()) {
        const data = itemSnap.data() as DocumentData;
        return { name: data?.name || 'Unknown Item', rarity: data?.rarity || 'Common' };
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('invalid path')) {
        console.warn(`Invalid path searching for item ${itemId} in ${collectionName}:`, error.message);
      } else {
        console.error(`Error searching for item ${itemId} in ${collectionName}:`, error);
      }
    }
  }
  console.warn(`Crafted item with ID ${itemId} not found in any known item collection.`);
  return null;
}

// Main Component
const DMPlayerInventoryModal: React.FC<DMPlayerInventoryModalProps> = ({ isOpen, onClose, player }) => {
  const [playerInventory, setPlayerInventory] = useState<PlayerInventoryItem[]>([]);
  const [itemCatalog, setItemCatalog] = useState<CatalogItem[]>([]);
  const [recipeCatalog, setRecipeCatalog] = useState<RecipeDefinition[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [recipeSearchTerm, setRecipeSearchTerm] = useState('');
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const toast = useToast();

  const isLoading = isLoadingInventory || isLoadingCatalog || isLoadingRecipes;

  // Use callback for findCraftedItemInfo
  const findCraftedItemInfoCallback = useCallback(findCraftedItemInfo, []);

  // Fetch Player Inventory
  const fetchInventory = useCallback(async () => {
    if (!player) return;
    setIsLoadingInventory(true);
    try {
      const playerDocRef = doc(db, 'characters', player.id);
      const playerDocSnap = await getDoc(playerDocRef);
      if (playerDocSnap.exists()) {
        const data = playerDocSnap.data() as DocumentData;
        const rawInventory = Array.isArray(data.inventory) ? data.inventory : [];
        // Validate inventory structure defensively
        const validatedInventory: PlayerInventoryItem[] = rawInventory
          .filter(invItem =>
            invItem &&
            typeof invItem === 'object' &&
            invItem.item && typeof invItem.item === 'object' && invItem.item.id && // Ensure item and item.id exist
            typeof invItem.quantity === 'number' && invItem.quantity >= 0 // Ensure quantity is a non-negative number
          )
          .map(invItem => ({ item: invItem.item as InventoryItem, quantity: invItem.quantity }));
        setPlayerInventory(validatedInventory);
      } else {
        console.warn(`Player doc ${player.id} not found.`);
        setPlayerInventory([]);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({ title: 'Error Loading Inventory', status: 'error', description: error instanceof Error ? error.message : undefined });
      setPlayerInventory([]);
    } finally {
      setIsLoadingInventory(false);
    }
  }, [player?.id, toast]);

  // Fetch Item Catalog
  const fetchCatalog = useCallback(async () => {
    setIsLoadingCatalog(true);
    const itemCollections = [
      'weapons', 'armor', 'ammunition', 'potions', 'scrolls',
      'crafting_components', 'traps', 'explosives', 'miscellaneous_items',
      'pharmaceuticals'
    ];
    let allFetchedItems: CatalogItem[] = [];
    try {
      for (const collectionName of itemCollections) {
        const itemsRef = collection(db, collectionName);
        const q = query(itemsRef, limit(1000)); // Consider pagination for very large catalogs
        const querySnapshot = await getDocs(q);
        const fetchedItems = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data() as Omit<InventoryItem, 'id'>;
          return {
            id: docSnap.id,
            collectionName, // Store source collection
            ...data,
            itemType: data.itemType || getItemTypeFromCollectionName(collectionName),
            rarity: data.rarity || 'Common' // Default rarity if missing
          } as CatalogItem;
        });
        allFetchedItems = [...allFetchedItems, ...fetchedItems];
      }
      // Ensure uniqueness based on ID
      const uniqueItems = Array.from(new Map(allFetchedItems.map(item => [item.id, item])).values());
      uniqueItems.sort((a, b) => (a.name || '').localeCompare(b.name || '')); // Sort alphabetically by name
      setItemCatalog(uniqueItems);
    } catch (error) {
      console.error("Error loading item catalog:", error);
      toast({ title: 'Error Loading Catalog', status: 'error', description: error instanceof Error ? error.message : undefined });
    } finally {
      setIsLoadingCatalog(false);
    }
  }, [toast]);

  // Fetch Recipes
  const fetchRecipes = useCallback(async () => {
    setIsLoadingRecipes(true);
    try {
      const recipesRef = collection(db, 'recipeComponents');
      const recipesSnapshot = await getDocs(recipesRef);
      const recipesListPromises: Promise<RecipeDefinition | null>[] = [];

      recipesSnapshot.forEach((docSnap) => {
        const data = docSnap.data() as DocumentData;
        const docId = docSnap.id;

        const recipePromise = (async (): Promise<RecipeDefinition | null> => {
          // Validate required fields
          if (data.name && data.itemType?.toLowerCase() === 'recipe' && data.craftedItemId) {
            const craftedInfo = await findCraftedItemInfoCallback(data.craftedItemId);

            return {
              id: docId,
              name: data.name,
              itemType: 'Recipe',
              rarity: data.rarity || 'Common', // Default rarity
              craftedItemId: data.craftedItemId,
              craftedItemName: craftedInfo?.name || 'Unknown Item',
              craftedItemRarity: craftedInfo?.rarity || 'Common'
            };
          } else {
            // Log specific reasons for skipping a document
            console.warn(
              `RecipeComponent doc ${docId} skipped. Missing required fields (name, craftedItemId) or incorrect itemType (expected 'recipe', got '${data.itemType}'). Data:`, data
            );
            return null;
          }
        })();
        recipesListPromises.push(recipePromise);
      });

      const resolvedRecipes = await Promise.all(recipesListPromises);
      const validRecipes = resolvedRecipes.filter((r): r is RecipeDefinition => r !== null);
      validRecipes.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
      setRecipeCatalog(validRecipes);
      // console.log(`Loaded and processed ${validRecipes.length} recipe definitions.`);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast({ title: 'Error Loading Recipes', status: 'error', description: error instanceof Error ? error.message : undefined });
    } finally {
      setIsLoadingRecipes(false);
    }
  }, [toast, findCraftedItemInfoCallback]);

  // Fetch data when modal opens or player changes
  useEffect(() => {
    if (isOpen && player) {
      // Reset state before fetching new data
      setPlayerInventory([]);
      setItemCatalog([]);
      setRecipeCatalog([]);
      setCatalogSearchTerm('');
      setRecipeSearchTerm('');
      setActiveTabIndex(0); // Reset to first tab

      fetchInventory();
      // Fetch catalog and recipes in parallel
      fetchCatalog();
      fetchRecipes();
    } else if (!isOpen) {
      // Clear state when modal closes
      setPlayerInventory([]);
      setItemCatalog([]);
      setRecipeCatalog([]);
      setCatalogSearchTerm('');
      setRecipeSearchTerm('');
      setIsLoadingInventory(false);
      setIsLoadingCatalog(false);
      setIsLoadingRecipes(false);
      setIsSaving(false);
    }
  }, [isOpen, player, fetchInventory, fetchCatalog, fetchRecipes]);


  // Save Inventory Changes (wrapped in useCallback for stability)
  const saveInventory = useCallback(async (newInventory: PlayerInventoryItem[]) => {
    if (!player?.id) {
      console.error("Cannot save inventory: Player ID is missing.");
      toast({ title: 'Save Error', description: 'Player information is missing.', status: 'error' });
      return;
    }
    setIsSaving(true);
    try {
      const playerDocRef = doc(db, 'characters', player.id);
      // Ensure data is clean before saving
      const inventoryToSave = newInventory
        .filter(inv => inv.item && inv.item.id && typeof inv.quantity === 'number' && inv.quantity >= 0) // Extra check
        .map(inv => ({
          item: sanitizeDataForFirestore(inv.item),
          quantity: inv.quantity
      }));

      await updateDoc(playerDocRef, {
        inventory: inventoryToSave,
        lastUpdated: serverTimestamp() // Track last modification time
      });

      // OPTIMISTIC UPDATE: Update local state immediately after successful save
      // Use the validated `newInventory` passed to the function
      setPlayerInventory(newInventory);

    } catch (error) {
      console.error('Error saving player inventory:', error);
      toast({ title: 'Save Error', description: 'Failed to save inventory changes.', status: 'error' });
      // Re-fetch to ensure UI consistency after save failure
      fetchInventory(); // Re-sync with DB
    } finally {
      setIsSaving(false);
    }
  }, [player?.id, toast, fetchInventory]); // Dependencies: player ID, toast, and fetchInventory for error recovery

  // Add Item from Catalog
  const handleAddItem = (itemToAdd: CatalogItem, quantity: number = 1) => {
    if (quantity <= 0 || !itemToAdd?.id) {
        console.warn("Attempted to add invalid item or quantity:", itemToAdd, quantity);
        return;
    }
    // Create a minimal but complete InventoryItem object
    const inventoryItemObject: InventoryItem = {
      id: itemToAdd.id,
      name: itemToAdd.name || 'Unknown Item',
      description: itemToAdd.description || '',
      itemType: itemToAdd.itemType || 'Miscellaneous',
      rarity: itemToAdd.rarity || 'Common',
      // Include other core properties if they exist on the catalog item
      ...(itemToAdd.buyValue !== undefined && { buyValue: itemToAdd.buyValue }),
      ...(itemToAdd.sellValue !== undefined && { sellValue: itemToAdd.sellValue }),
      ...(itemToAdd.weight !== undefined && { weight: itemToAdd.weight }),
      // Add specific properties based on item type if needed and available
      // e.g., ...(itemToAdd.damage && { damage: itemToAdd.damage }) for weapons
    };

    const existingIndex = playerInventory.findIndex(invItem => invItem.item.id === inventoryItemObject.id);
    let updatedInventory;

    if (existingIndex > -1) {
      // Item exists, update quantity
      updatedInventory = playerInventory.map((invItem, index) =>
        index === existingIndex ? { ...invItem, quantity: invItem.quantity + quantity } : invItem
      );
    } else {
      // Item doesn't exist, add new entry
      updatedInventory = [...playerInventory, { item: inventoryItemObject, quantity }];
    }

    saveInventory(updatedInventory); // Trigger save
    toast({ title: `Added ${quantity}x ${inventoryItemObject.name}`, status: 'success', duration: 1500, isClosable: true });
  };

  // Add Recipe Item
  const handleAddRecipe = (recipeToAdd: RecipeDefinition) => {
    if (!recipeToAdd || !recipeToAdd.id) {
      toast({ title: 'Error', description: 'Invalid recipe selected.', status: 'error', isClosable: true });
      return;
    }
    // Check if the player already has this specific recipe
    const alreadyHasRecipe = playerInventory.some(invItem =>
      invItem.item.id === recipeToAdd.id && invItem.item.itemType === 'Recipe'
    );

    if (alreadyHasRecipe) {
      toast({ title: 'Recipe Already Known', status: 'info', duration: 2500, isClosable: true });
      return;
    }

    // Create the InventoryItem representation for the recipe
    const recipeInventoryItem: InventoryItem = {
      id: recipeToAdd.id,
      name: recipeToAdd.name,
      itemType: 'Recipe', // Explicitly set itemType
      rarity: recipeToAdd.rarity || 'Common',
      description: `Recipe to craft: ${recipeToAdd.craftedItemName || 'Unknown Item'} (Rarity: ${recipeToAdd.craftedItemRarity || 'N/A'})`,
    };

    const updatedInventory = [...playerInventory, { item: recipeInventoryItem, quantity: 1 }];
    saveInventory(updatedInventory); // Trigger save
    toast({ title: `Added Recipe: ${recipeInventoryItem.name}`, status: 'success', isClosable: true });
  };

  // Remove Item (by specific quantity)
  const handleRemoveItem = (itemId: string, quantityToRemove: number = 1) => {
    if (quantityToRemove <= 0) return; // Cannot remove zero or negative quantity

    const existingIndex = playerInventory.findIndex(invItem => invItem.item.id === itemId);
    if (existingIndex === -1) {
      console.warn(`Attempted to remove item ID ${itemId} which is not in inventory.`);
      return; // Item not found
    }

    const currentItem = playerInventory[existingIndex];
    const currentQuantity = currentItem.quantity;
    const itemName = currentItem.item.name || 'Item'; // Fallback name

    let updatedInventory;
    if (currentQuantity <= quantityToRemove) {
      // Remove the item completely
      updatedInventory = playerInventory.filter((_, index) => index !== existingIndex);
       toast({ title: `Removed ${itemName}`, status: 'info', duration: 1500, isClosable: true });
    } else {
      // Decrease the quantity
      updatedInventory = playerInventory.map((invItem, index) =>
        index === existingIndex ? { ...invItem, quantity: invItem.quantity - quantityToRemove } : invItem
      );
       toast({ title: `Removed ${quantityToRemove}x ${itemName}`, status: 'info', duration: 1500, isClosable: true });
    }

    saveInventory(updatedInventory); // Trigger save
  };

  // Update Quantity via NumberInput
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
     // Debounce or delay this if needed to avoid rapid fire updates
    if (newQuantity < 0 || isNaN(newQuantity)) {
      console.warn(`Invalid quantity provided for item ${itemId}: ${newQuantity}`);
      return; // Prevent negative or NaN quantities
    }

    const existingIndex = playerInventory.findIndex(invItem => invItem.item.id === itemId);
    if (existingIndex === -1) {
      console.error(`Item ID ${itemId} not found in inventory for quantity update.`);
      return;
    }

    const currentItem = playerInventory[existingIndex];

    // Avoid saving if quantity hasn't changed
    if (newQuantity === currentItem.quantity) {
        return;
    }

    let updatedInventory;
    if (newQuantity === 0) {
      // Remove item if quantity becomes 0
      updatedInventory = playerInventory.filter(invItem => invItem.item.id !== itemId);
      toast({ title: "Item Removed", description: `${currentItem.item.name} removed from inventory.`, status: "info", duration: 1500 });
    } else {
      // Update quantity for the specific item
      updatedInventory = playerInventory.map(invItem =>
        invItem.item.id === itemId ? { ...invItem, quantity: newQuantity } : invItem
      );
      // Optionally provide feedback on quantity change (can be noisy)
      // toast({ title: "Quantity Updated", description: `${currentItem.item.name} quantity set to ${newQuantity}.`, status: "info", duration: 1000 });
    }

    // Directly call saveInventory - no need for async here as saveInventory handles it
    saveInventory(updatedInventory);
  };


  // Filter Catalogs (Memoized for performance)
  const filteredCatalogItems = useMemo(() => {
    if (!catalogSearchTerm) return itemCatalog;
    const lowerSearch = catalogSearchTerm.toLowerCase().trim();
    if (!lowerSearch) return itemCatalog;
    return itemCatalog.filter(item =>
      (item.name?.toLowerCase().includes(lowerSearch) ?? false) ||
      (item.description?.toLowerCase().includes(lowerSearch) ?? false) ||
      (item.itemType?.toLowerCase().includes(lowerSearch) ?? false)
    );
  }, [itemCatalog, catalogSearchTerm]);

  const filteredRecipeCatalog = useMemo(() => {
    if (!recipeSearchTerm) return recipeCatalog;
    const lowerSearch = recipeSearchTerm.toLowerCase().trim();
     if (!lowerSearch) return recipeCatalog;
    return recipeCatalog.filter(recipe =>
      (recipe.name?.toLowerCase().includes(lowerSearch) ?? false) ||
      (recipe.craftedItemName?.toLowerCase().includes(lowerSearch) ?? false)
    );
  }, [recipeCatalog, recipeSearchTerm]);

  // Debounced handler for NumberInput onChange
  // (Optional but recommended for performance if users rapidly click steppers)
  // Example using a simple timeout:
  const quantityUpdateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const handleDebouncedUpdateQuantity = (itemId: string, valueAsString: string, valueAsNumber: number) => {
      if (quantityUpdateTimeoutRef.current) {
          clearTimeout(quantityUpdateTimeoutRef.current);
      }
      quantityUpdateTimeoutRef.current = setTimeout(() => {
          handleUpdateQuantity(itemId, isNaN(valueAsNumber) ? 0 : Math.max(0, valueAsNumber));
      }, 300); // 300ms delay
  };

  // Main view rendered as 3 tabs
  const renderContent = () => {
    if (isLoading) {
      return (
        <Center h="300px">
          <Spinner size="xl" color="brand.400" />
        </Center>
      );
    }

    return (
      // Adjusted Tabs styling for compactness
      <Tabs isFitted colorScheme="brand" variant="soft-rounded" size="sm" index={activeTabIndex} onChange={setActiveTabIndex}>
        <TabList mb={3}> {/* Reduced margin-bottom */}
          <Tab>
            <HStack spacing={1}>
              <Package size={14} />
              <Text fontSize="xs">Inventory</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={1}>
              <Plus size={14} />
              <Text fontSize="xs">Add Items</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={1}>
              <BookOpen size={14} />
              <Text fontSize="xs">Add Recipes</Text>
            </HStack>
          </Tab>
        </TabList>
        <TabPanels>
          {/* INVENTORY TAB */}
          <TabPanel p={0}>
             {/* Reduced padding */}
            <Box bg="gray.800" p={2} borderRadius="md" borderWidth="1px" borderColor="gray.700">
              <Heading size="xs" mb={2} color="gray.300">
                Current Items ({playerInventory.reduce((sum, item) => sum + item.quantity, 0)})
              </Heading>
               {/* Adjusted ScrollArea height */}
              <ScrollArea className="h-[auto] max-h-[450px]">
                {playerInventory.length === 0 ? (
                  <Center h="100px">
                    <Text color="gray.500" fontSize="sm">Inventory is empty.</Text>
                  </Center>
                ) : (
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead bg="gray.750" position="sticky" top={0} zIndex={1}>
                        <Tr>
                           {/* Adjusted table cell padding */}
                          <Th color="gray.300" borderColor="gray.600" fontSize="xs" px={1.5} py={1}>Item</Th>
                          <Th color="gray.300" borderColor="gray.600" fontSize="xs" px={1.5} py={1} isNumeric width="70px">Qty</Th> {/* Slightly wider for number input */}
                          <Th color="gray.300" borderColor="gray.600" fontSize="xs" px={1} py={1} width="40px"></Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {playerInventory.map(({ item, quantity }) => (
                          <Tr key={item.id} _hover={{ bg: 'gray.700' }} borderColor="gray.600">
                             {/* Adjusted table cell padding */}
                            <Td borderColor="gray.600" px={1.5} py={1}>
                              <VStack align="start" spacing={0}>
                                <Tooltip label={item.description || item.name} placement="top-start" openDelay={500}>
                                <Text fontWeight="medium" color="gray.200" fontSize="xs" noOfLines={1}>
                                  {item.name}
                                </Text>
                                </Tooltip>
                                <HStack spacing={1} mt={0.5}>
                                  <Badge colorScheme={getRarityColor(item.rarity)} fontSize="2xs">
                                    {item.rarity || 'Common'}
                                  </Badge>
                                  <Badge variant="outline" colorScheme="gray" fontSize="2xs">
                                    {item.itemType || 'N/A'}
                                  </Badge>
                                </HStack>
                              </VStack>
                            </Td>
                             {/* Adjusted table cell padding */}
                            <Td isNumeric borderColor="gray.600" px={1} py={1}>
                              <NumberInput
                                size="xs"
                                value={quantity}
                                // Use the debounced handler here
                                onChange={(valueAsString, valueAsNumber) => handleDebouncedUpdateQuantity(item.id, valueAsString, valueAsNumber)}
                                // Or use the direct handler if debounce isn't needed:
                                // onChange={(_, valueNumber) => handleUpdateQuantity(item.id, isNaN(valueNumber) ? 0 : Math.max(0, valueNumber))}
                                min={0}
                                maxW="60px" // Adjusted width
                                bg="gray.750"
                                borderColor="gray.600"
                                borderRadius="md"
                                isDisabled={isSaving}
                                allowMouseWheel // Optional: allow quantity change with scroll wheel
                              >
                                <NumberInputField textAlign="center" py={0.5} px={1} fontSize="xs" /> {/* Adjusted padding */}
                                <NumberInputStepper>
                                  <NumberIncrementStepper bg="gray.700" borderColor="gray.600" children='+' />
                                  <NumberDecrementStepper bg="gray.700" borderColor="gray.600" children='-' />
                                </NumberInputStepper>
                              </NumberInput>
                            </Td>
                            {/* Adjusted table cell padding */}
                            <Td borderColor="gray.600" px={1} py={1} textAlign="right">
                              <Tooltip label="Remove 1">
                                <IconButton
                                  aria-label="Remove one item"
                                  icon={<Trash size={12} />}
                                  size="xs"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => handleRemoveItem(item.id, 1)}
                                  isDisabled={isSaving || quantity <= 0}
                                />
                              </Tooltip>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
              </ScrollArea>
            </Box>
          </TabPanel>

          {/* ADD ITEMS TAB */}
          <TabPanel p={0}>
             {/* Reduced padding */}
            <Box bg="gray.800" p={2} borderRadius="md" borderWidth="1px" borderColor="gray.700">
              <Heading size="xs" mb={2} color="gray.300">
                Add Items from Catalog
              </Heading>
              <InputGroup size="sm" mb={2}>
                <InputLeftElement pointerEvents="none" height="32px">
                  <Search size={14} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search items by name, type, description..."
                  value={catalogSearchTerm}
                  onChange={(e) => setCatalogSearchTerm(e.target.value)}
                  bg="gray.700"
                  borderColor="gray.600"
                  pl={8}
                  fontSize="xs"
                />
              </InputGroup>
              {/* Adjusted ScrollArea height */}
              <ScrollArea className="h-[auto] max-h-[450px]">
                {isLoadingCatalog ? (
                  <Center h="100px"><Spinner /></Center>
                ) : filteredCatalogItems.length === 0 ? (
                  <Center h="100px">
                    <Text color="gray.500" fontSize="sm">
                      {catalogSearchTerm ? 'No items match search.' : 'Catalog empty or loading...'}
                    </Text>
                  </Center>
                ) : (
                  <VStack spacing={1} align="stretch">
                    {filteredCatalogItems.map((item) => (
                      <Flex
                        key={item.id}
                        p={1.5} // Reduced padding
                        bg="gray.750"
                        borderRadius="md"
                        justify="space-between"
                        align="center"
                        _hover={{ bg: 'gray.700' }}
                      >
                        <Box flex={1} mr={2} overflow="hidden">
                           <Tooltip label={item.description || item.name} placement="top-start" openDelay={500}>
                            <Text fontWeight="medium" color="gray.200" fontSize="xs" noOfLines={1}>
                              {item.name}
                            </Text>
                          </Tooltip>
                          <HStack spacing={1} mt={0.5}>
                            <Badge colorScheme={getRarityColor(item.rarity)} fontSize="2xs">
                              {item.rarity || 'Common'}
                            </Badge>
                            <Badge variant="outline" colorScheme="gray" fontSize="2xs">
                              {item.itemType || 'N/A'}
                            </Badge>
                          </HStack>
                        </Box>
                        <HStack spacing={1}>
                          <Tooltip label="Add 1 to Inventory">
                            <IconButton
                              aria-label={`Add ${item.name}`}
                              icon={<Plus size={12} />}
                              size="xs"
                              colorScheme="green"
                              variant="ghost"
                              onClick={() => handleAddItem(item, 1)}
                              isDisabled={isSaving}
                            />
                          </Tooltip>
                        </HStack>
                      </Flex>
                    ))}
                  </VStack>
                )}
              </ScrollArea>
            </Box>
          </TabPanel>

          {/* RECIPES TAB */}
          <TabPanel p={0}>
            {/* Reduced padding */}
            <Box bg="gray.800" p={2} borderRadius="md" borderWidth="1px" borderColor="gray.700">
              <Heading size="xs" mb={2} color="gray.300">
                Add Recipes
              </Heading>
              <InputGroup size="sm" mb={2}>
                <InputLeftElement pointerEvents="none" height="32px">
                  <Search size={14} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search recipes by name or crafted item..."
                  value={recipeSearchTerm}
                  onChange={(e) => setRecipeSearchTerm(e.target.value)}
                  bg="gray.700"
                  borderColor="gray.600"
                  pl={8}
                  fontSize="xs"
                />
              </InputGroup>
              {/* Adjusted ScrollArea height */}
              <ScrollArea className="h-[auto] max-h-[450px]">
                {isLoadingRecipes ? (
                  <Center h="100px"><Spinner /></Center>
                ) : filteredRecipeCatalog.length === 0 ? (
                  <Center h="100px">
                    <Text color="gray.500" fontSize="sm">
                     {recipeSearchTerm ? 'No recipes match search.' : 'No recipes found or loading...'}
                    </Text>
                  </Center>
                ) : (
                  <VStack spacing={1} align="stretch">
                    {filteredRecipeCatalog.map((recipe) => {
                      const alreadyHas = playerInventory.some(
                        pi => pi.item.id === recipe.id && pi.item.itemType === 'Recipe'
                      );
                      return (
                        <Flex
                          key={recipe.id}
                          p={1.5} // Reduced padding
                          bg="gray.750"
                          borderRadius="md"
                          justify="space-between"
                          align="center"
                          _hover={{ bg: 'gray.700' }}
                        >
                          <Box flex={1} mr={2} overflow="hidden">
                             <Tooltip label={`Recipe ID: ${recipe.id}`} placement="top-start" openDelay={500}>
                                <Text fontWeight="medium" color="gray.200" fontSize="xs" noOfLines={1}>
                                {recipe.name}
                                </Text>
                              </Tooltip>
                            <Text fontSize="2xs" color="gray.400" noOfLines={1}>
                              Crafts: {recipe.craftedItemName || '...'} ({recipe.craftedItemRarity || 'N/A'})
                            </Text>
                            <HStack spacing={1} mt={0.5}>
                              <Badge colorScheme={getRarityColor(recipe.rarity)} fontSize="2xs">
                                {recipe.rarity || 'Common'} Recipe
                              </Badge>
                               {/* Show crafted item rarity only if different or notable */}
                              {/* <Badge colorScheme={getRarityColor(recipe.craftedItemRarity)} fontSize="2xs">
                                  ({recipe.craftedItemRarity || 'N/A'} Item)
                              </Badge> */}
                            </HStack>
                          </Box>
                          <Tooltip label={alreadyHas ? "Player already has this recipe" : "Add Recipe to Inventory"}>
                            <IconButton
                              aria-label={alreadyHas ? `Recipe ${recipe.name} already added` : `Add recipe ${recipe.name}`}
                              icon={alreadyHas ? <CheckCircle size={12} /> : <Plus size={12} />}
                              size="xs"
                              colorScheme={alreadyHas ? "gray" : "blue"} // Changed add color for visibility
                              variant="ghost"
                              onClick={() => !alreadyHas && handleAddRecipe(recipe)}
                              isDisabled={isSaving || alreadyHas}
                            />
                          </Tooltip>
                        </Flex>
                      );
                    })}
                  </VStack>
                )}
              </ScrollArea>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    );
  };

  return (
    // Adjusted modal size and removed footer
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" /> {/* Slightly darker overlay */}
      <ModalContent bg="gray.800" borderColor="gray.600" borderWidth="1px" mx={2}>
        <ModalHeader fontSize="lg" fontWeight="semibold" pb={2}> {/* Reduced padding-bottom */}
          {player?.characterName || 'Unknown Player'} - Inventory
          <ModalCloseButton />
        </ModalHeader>
        <ModalBody pt={2} pb={4}> {/* Adjusted padding */}
           {renderContent()}
        </ModalBody>
         {/* ModalFooter removed */}
      </ModalContent>
    </Modal>
  );
};

export default DMPlayerInventoryModal;