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
        sanitizedObject[key] = null;
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
        const validatedInventory: PlayerInventoryItem[] = rawInventory
          .filter(invItem => invItem && typeof invItem === 'object' && invItem.item && typeof invItem.quantity === 'number')
          .map(invItem => ({ item: invItem.item as InventoryItem, quantity: invItem.quantity }));
        setPlayerInventory(validatedInventory);
      } else {
        console.warn(`Player doc ${player.id} not found.`);
        setPlayerInventory([]);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({ title: 'Error', status: 'error' });
      setPlayerInventory([]);
    } finally {
      setIsLoadingInventory(false);
    }
  }, [player?.id, toast]);

  // Fetch Item Catalog
  const fetchCatalog = useCallback(async () => {
    setIsLoadingCatalog(true);
    const itemCollections = [
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
    let allFetchedItems: CatalogItem[] = [];
    try {
      for (const collectionName of itemCollections) {
        const itemsRef = collection(db, collectionName);
        const q = query(itemsRef, limit(1000));
        const querySnapshot = await getDocs(q);
        const fetchedItems = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data() as Omit<InventoryItem, 'id'>;
          return {
            id: docSnap.id,
            collectionName,
            ...data,
            itemType: data.itemType || getItemTypeFromCollectionName(collectionName),
            rarity: data.rarity || 'Common'
          } as CatalogItem;
        });
        allFetchedItems = [...allFetchedItems, ...fetchedItems];
      }
      const uniqueItems = Array.from(new Map(allFetchedItems.map(item => [item.id, item])).values());
      uniqueItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setItemCatalog(uniqueItems);
    } catch (error) {
      console.error("Error loading catalog:", error);
      toast({ title: 'Error Loading Catalog', status: 'error' });
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
          if (data.name && data.itemType?.toLowerCase() === 'recipe' && data.craftedItemId) {
            const craftedInfo = await findCraftedItemInfoCallback(data.craftedItemId);

            return {
              id: docId,
              name: data.name,
              itemType: 'Recipe',
              rarity: data.rarity || 'Common',
              craftedItemId: data.craftedItemId,
              craftedItemName: craftedInfo?.name || 'Unknown Item',
              craftedItemRarity: craftedInfo?.rarity || 'Common'
            };
          } else {
            console.warn(
              `RecipeComponent doc ${docId} missing required fields or wrong itemType ('${data.itemType}'). Required: name, itemType='Recipe', craftedItemId`
            );
            return null;
          }
        })();
        recipesListPromises.push(recipePromise);
      });

      const resolvedRecipes = await Promise.all(recipesListPromises);
      const validRecipes = resolvedRecipes.filter((r): r is RecipeDefinition => r !== null);
      validRecipes.sort((a, b) => a.name.localeCompare(b.name));
      setRecipeCatalog(validRecipes);
      console.log(`Loaded and processed ${validRecipes.length} recipe definitions.`);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast({ title: 'Error Loading Recipes', status: 'error' });
    } finally {
      setIsLoadingRecipes(false);
    }
  }, [toast, findCraftedItemInfoCallback]);

  // Fetch data when modal opens or player changes
  useEffect(() => {
    if (isOpen && player) {
      fetchInventory();
      fetchCatalog();
      fetchRecipes();
    } else {
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

  // Get Item Details
  const getItemDetails = useCallback((itemIdOrName: string): CatalogItem | undefined => {
    const term = itemIdOrName?.toLowerCase();
    if (!term) return undefined;
    return itemCatalog.find(item => item.id === itemIdOrName) ||
      itemCatalog.find(item => item.name?.toLowerCase() === term);
  }, [itemCatalog]);

  // Save Inventory Changes
  const saveInventory = useCallback(async (newInventory: PlayerInventoryItem[]) => {
    if (!player) return;
    setIsSaving(true);
    try {
      const playerDocRef = doc(db, 'characters', player.id);
      const inventoryToSave = newInventory.map(inv => ({
        item: sanitizeDataForFirestore(inv.item),
        quantity: inv.quantity
      }));
      await updateDoc(playerDocRef, {
        inventory: inventoryToSave,
        lastUpdated: serverTimestamp()
      });
      // Optimistically update local state ONLY after successful save
      setPlayerInventory(newInventory);
    } catch (error) {
      console.error('Error saving player inventory:', error);
      toast({ title: 'Save Error', description: 'Failed to save inventory changes.', status: 'error' });
      // Re-fetch to ensure UI consistency after save failure
      fetchInventory();
    } finally {
      setIsSaving(false);
    }
  }, [player?.id, toast, fetchInventory]);

  // Add Item from Catalog
  const handleAddItem = (itemToAdd: CatalogItem, quantity: number = 1) => {
    if (quantity <= 0 || !itemToAdd?.id) return;
    const inventoryItemObject: InventoryItem = {
      id: itemToAdd.id,
      name: itemToAdd.name || 'Unknown Item',
      description: itemToAdd.description || '',
      itemType: itemToAdd.itemType || 'Miscellaneous',
      rarity: itemToAdd.rarity || 'Common',
      ...(itemToAdd.buyValue !== undefined && { buyValue: itemToAdd.buyValue }),
      ...(itemToAdd.sellValue !== undefined && { sellValue: itemToAdd.sellValue }),
      ...(itemToAdd.weight !== undefined && { weight: itemToAdd.weight })
    };
    const existingIndex = playerInventory.findIndex(invItem => invItem.item.id === inventoryItemObject.id);
    let updatedInventory;
    if (existingIndex > -1) {
      updatedInventory = playerInventory.map((invItem, index) =>
        index === existingIndex ? { ...invItem, quantity: invItem.quantity + quantity } : invItem
      );
    } else {
      updatedInventory = [...playerInventory, { item: inventoryItemObject, quantity }];
    }
    saveInventory(updatedInventory); // Save change
    toast({ title: `Added ${quantity}x ${inventoryItemObject.name}`, status: 'success', duration: 1500 });
  };

  // Add Recipe Item
  const handleAddRecipe = (recipeToAdd: RecipeDefinition) => {
    if (!recipeToAdd || !recipeToAdd.id) {
      toast({ title: 'Error', description: 'Invalid recipe selected.', status: 'error' });
      return;
    }
    const alreadyHasRecipe = playerInventory.some(invItem =>
      invItem.item.id === recipeToAdd.id && invItem.item.itemType === 'Recipe'
    );
    if (alreadyHasRecipe) {
      toast({ title: 'Recipe Already Known', status: 'info', duration: 2500 });
      return;
    }
    const recipeInventoryItem: InventoryItem = {
      id: recipeToAdd.id,
      name: recipeToAdd.name,
      itemType: 'Recipe',
      rarity: recipeToAdd.rarity || 'Common',
      description: `Recipe to craft: ${recipeToAdd.craftedItemName || 'Unknown Item'}`,
      buyValue: 0,
      sellValue: 0,
      weight: 0.1
    };
    const updatedInventory = [...playerInventory, { item: recipeInventoryItem, quantity: 1 }];
    saveInventory(updatedInventory); // Save change
    toast({ title: `Added Recipe: ${recipeInventoryItem.name}`, status: 'success' });
  };

  // Remove Item
  const handleRemoveItem = (itemId: string, quantityToRemove: number = 1) => {
    if (quantityToRemove <= 0) return;
    const existingIndex = playerInventory.findIndex(invItem => invItem.item.id === itemId);
    if (existingIndex === -1) return;
    const currentQuantity = playerInventory[existingIndex].quantity;
    const itemName = playerInventory[existingIndex].item.name;
    let updatedInventory;
    if (currentQuantity <= quantityToRemove) {
      updatedInventory = playerInventory.filter((_, index) => index !== existingIndex);
    } else {
      updatedInventory = playerInventory.map((invItem, index) =>
        index === existingIndex ? { ...invItem, quantity: invItem.quantity - quantityToRemove } : invItem
      );
    }
    saveInventory(updatedInventory); // Save change
    toast({ title: `Removed ${quantityToRemove}x ${itemName}`, status: 'info', duration: 1500 });
  };

  // Update Quantity
  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 0 || isNaN(newQuantity)) {
      return; // Invalid quantity
    }

    try {
      // Find the item in the player's inventory
      const existingIndex = playerInventory.findIndex(invItem => invItem.item.id === itemId);
      if (existingIndex === -1) {
        console.error(`Item ID ${itemId} not found in inventory`);
        return;
      }

      const currentItem = playerInventory[existingIndex];
      const currentQuantity = currentItem.quantity;

      // If quantity is the same, no change needed
      if (newQuantity === currentQuantity) {
        return;
      }

      // Create updated inventory
      let updatedInventory;
      if (newQuantity === 0) {
        // Remove the item if quantity is 0
        updatedInventory = playerInventory.filter(invItem => invItem.item.id !== itemId);
      } else {
        // Update the quantity
        updatedInventory = playerInventory.map(invItem =>
          invItem.item.id === itemId ? { ...invItem, quantity: newQuantity } : invItem
        );
      }

      // Save the updated inventory
      await saveInventory(updatedInventory);

      // Show confirmation toast
      if (newQuantity === 0) {
        toast({
          title: "Item Removed",
          description: `${currentItem.item.name} has been removed from inventory`,
          status: "info"
        });
      } else if (newQuantity < currentQuantity) {
        toast({
          title: "Quantity Updated",
          description: `${currentItem.item.name} quantity decreased to ${newQuantity}`,
          status: "info"
        });
      } else {
        toast({
          title: "Quantity Updated",
          description: `${currentItem.item.name} quantity increased to ${newQuantity}`,
          status: "info"
        });
      }
    } catch (error) {
      console.error('Error updating item quantity:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error"
      });
      // Refresh to ensure UI is consistent
      fetchInventory();
    }
  };

  // Filter Catalogs
  const filteredCatalogItems = useMemo(() => {
    if (!catalogSearchTerm) return itemCatalog;
    const lowerSearch = catalogSearchTerm.toLowerCase();
    return itemCatalog.filter(item =>
      (item.name?.toLowerCase().includes(lowerSearch) ?? false) ||
      (item.description?.toLowerCase().includes(lowerSearch) ?? false) ||
      (item.itemType?.toLowerCase().includes(lowerSearch) ?? false)
    );
  }, [itemCatalog, catalogSearchTerm]);

  const filteredRecipeCatalog = useMemo(() => {
    if (!recipeSearchTerm) return recipeCatalog;
    const lowerSearch = recipeSearchTerm.toLowerCase();
    return recipeCatalog.filter(recipe =>
      (recipe.name?.toLowerCase().includes(lowerSearch) ?? false) ||
      (recipe.craftedItemName?.toLowerCase().includes(lowerSearch) ?? false)
    );
  }, [recipeCatalog, recipeSearchTerm]);

  // Main view rendered as 3 tabs for better mobile experience
  const renderContent = () => {
    if (isLoading) {
      return (
        <Center h="300px">
          <Spinner size="xl" color="brand.400" />
        </Center>
      );
    }

    return (
      <Tabs isFitted colorScheme="brand" variant="soft-rounded" size="sm" index={activeTabIndex} onChange={setActiveTabIndex}>
        <TabList mb={4}>
          <Tab>
            <HStack spacing={1}>
              <Package size={14} />
              <Text>Inventory</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={1}>
              <Plus size={14} />
              <Text>Add Items</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={1}>
              <BookOpen size={14} />
              <Text>Recipes</Text>
            </HStack>
          </Tab>
        </TabList>
        <TabPanels>
          {/* INVENTORY TAB */}
          <TabPanel p={0}>
            <Box bg="gray.800" p={3} borderRadius="md" borderWidth="1px" borderColor="gray.700">
              <Heading size="xs" mb={3} color="gray.300">
                Current Items ({playerInventory.reduce((sum, item) => sum + item.quantity, 0)})
              </Heading>
              <ScrollArea className="h-[60vh] max-h-[500px]">
                {playerInventory.length === 0 ? (
                  <Center h="100px">
                    <Text color="gray.500">Inventory is empty.</Text>
                  </Center>
                ) : (
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead bg="gray.750" position="sticky" top={0} zIndex={1}>
                        <Tr>
                          <Th color="gray.300" borderColor="gray.600" fontSize="xs" px={2}>Item</Th>
                          <Th color="gray.300" borderColor="gray.600" fontSize="xs" px={2} isNumeric width="60px">Qty</Th>
                          <Th color="gray.300" borderColor="gray.600" fontSize="xs" px={2} width="40px"></Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {playerInventory.map(({ item, quantity }) => (
                          <Tr key={item.id} _hover={{ bg: 'gray.700' }} borderColor="gray.600">
                            <Td borderColor="gray.600" px={2} py={1.5}>
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="medium" color="gray.200" fontSize="xs">
                                  {item.name}
                                </Text>
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
                            <Td isNumeric borderColor="gray.600" px={1} py={1.5}>
                              <NumberInput
                                size="xs"
                                value={quantity}
                                onChange={(_, valueNumber) => {
                                  const newQuantity = isNaN(valueNumber) ? 0 : Math.max(0, valueNumber);
                                  handleUpdateQuantity(item.id, newQuantity);
                                }}
                                min={0}
                                maxW="55px"
                                bg="gray.750"
                                borderColor="gray.600"
                                borderRadius="md"
                                isDisabled={isSaving}
                              >
                                <NumberInputField textAlign="center" py={1} fontSize="xs" />
                                <NumberInputStepper>
                                  <NumberIncrementStepper bg="gray.700" borderColor="gray.600" />
                                  <NumberDecrementStepper bg="gray.700" borderColor="gray.600" />
                                </NumberInputStepper>
                              </NumberInput>
                            </Td>
                            <Td borderColor="gray.600" px={1} py={1.5} textAlign="right">
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
            <Box bg="gray.800" p={3} borderRadius="md" borderWidth="1px" borderColor="gray.700">
              <Heading size="xs" mb={3} color="gray.300">
                Add Items
              </Heading>
              <InputGroup size="sm" mb={3}>
                <InputLeftElement pointerEvents="none" height="32px">
                  <Search size={14} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search items..."
                  value={catalogSearchTerm}
                  onChange={(e) => setCatalogSearchTerm(e.target.value)}
                  bg="gray.700"
                  borderColor="gray.600"
                  pl={8}
                  fontSize="xs"
                />
              </InputGroup>
              <ScrollArea className="h-[60vh] max-h-[500px]">
                {isLoadingCatalog ? (
                  <Center h="100px">
                    <Spinner />
                  </Center>
                ) : filteredCatalogItems.length === 0 ? (
                  <Center h="100px">
                    <Text color="gray.500" fontSize="sm">
                      No items match search.
                    </Text>
                  </Center>
                ) : (
                  <VStack spacing={1} align="stretch">
                    {filteredCatalogItems.map((item) => (
                      <Flex
                        key={item.id}
                        p={2}
                        bg="gray.750"
                        borderRadius="md"
                        justify="space-between"
                        align="center"
                        _hover={{ bg: 'gray.700' }}
                      >
                        <Box flex={1} mr={2}>
                          <Text fontWeight="medium" color="gray.200" fontSize="xs" noOfLines={1}>
                            {item.name}
                          </Text>
                          <HStack spacing={1} mt={1}>
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
                              aria-label="Add item"
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
            <Box bg="gray.800" p={3} borderRadius="md" borderWidth="1px" borderColor="gray.700">
              <Heading size="xs" mb={3} color="gray.300">
                Add Recipes
              </Heading>
              <InputGroup size="sm" mb={3}>
                <InputLeftElement pointerEvents="none" height="32px">
                  <Search size={14} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search recipes..."
                  value={recipeSearchTerm}
                  onChange={(e) => setRecipeSearchTerm(e.target.value)}
                  bg="gray.700"
                  borderColor="gray.600"
                  pl={8}
                  fontSize="xs"
                />
              </InputGroup>
              <ScrollArea className="h-[60vh] max-h-[500px]">
                {isLoadingRecipes ? (
                  <Center h="100px">
                    <Spinner />
                  </Center>
                ) : filteredRecipeCatalog.length === 0 ? (
                  <Center h="100px">
                    <Text color="gray.500" fontSize="sm">
                      No recipes match search.
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
                          p={2}
                          bg="gray.750"
                          borderRadius="md"
                          justify="space-between"
                          align="center"
                          _hover={{ bg: 'gray.700' }}
                        >
                          <Box flex={1} mr={2}>
                            <Text fontWeight="medium" color="gray.200" fontSize="xs" noOfLines={1}>
                              {recipe.name}
                            </Text>
                            <Text fontSize="2xs" color="gray.400">
                              Crafts: {recipe.craftedItemName || '...'}
                            </Text>
                            <HStack spacing={1} mt={1}>
                              <Badge colorScheme={getRarityColor(recipe.rarity)} fontSize="2xs">
                                {recipe.rarity || 'Common'}
                              </Badge>
                              {recipe.craftedItemRarity && recipe.craftedItemRarity !== recipe.rarity && (
                                <Badge colorScheme={getRarityColor(recipe.craftedItemRarity)} fontSize="2xs">
                                  ({recipe.craftedItemRarity} Item)
                                </Badge>
                              )}
                            </HStack>
                          </Box>
                          <Tooltip label={alreadyHas ? "Player already has this recipe" : "Add Recipe to Inventory"}>
                            <IconButton
                              aria-label={alreadyHas ? "Recipe already added" : "Add recipe"}
                              icon={alreadyHas ? <CheckCircle size={12} /> : <Plus size={12} />}
                              size="xs"
                              colorScheme={alreadyHas ? "gray" : "green"}
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
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg="gray.800" borderColor="gray.600" borderWidth="1px">
        <ModalHeader>
          Player Inventory - {player?.characterName || 'Unknown Player'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>{renderContent()}</ModalBody>
        <ModalFooter>
          <Button onClick={onClose} colorScheme="blue">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DMPlayerInventoryModal;
