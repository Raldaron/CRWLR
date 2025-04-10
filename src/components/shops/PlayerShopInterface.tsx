// --- START OF FILE PlayerShopInterface.tsx ---
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, VStack, HStack, Select, Button, Spinner, useToast, Heading, Text,
  SimpleGrid, Divider, Badge, InputGroup, InputLeftElement, Input,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  useDisclosure, Center, Tag, TagLabel, TagCloseButton, Wrap,
  NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
  Tooltip, IconButton, Alert, AlertIcon,
  FormControl,
  FormLabel,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react';
import { 
  Store, ShoppingCart, DollarSign, Search, Coins, CheckCircle, XCircle, Package 
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  writeBatch,
  addDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  orderBy,
  limit,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { useCharacter } from '@/context/CharacterContext'; // <-- Ensure this matches your new file
import { ScrollArea } from '@/components/ui/scroll-area';
import type { InventoryItem, InventoryItemWithQuantity } from '@/types/inventory';
import DarkThemedCard from '@/components/ui/DarkThemedCard';
import { useSearchParams } from 'next/navigation';

// --- Interfaces ---
interface PlayerShopItem extends InventoryItem {
  shopQuantity: number;
  itemCollection: string;
}

interface PlayerInventoryItemForSale extends InventoryItem {
  inventoryQuantity: number;
}

interface AccessibleShop {
  id: string;
  name: string;
  description: string;
  shopType: string;
  shopkeeperName: string;
  location: string;
  items: {
    itemId: string;
    itemCollection: string;
    quantity: number;
    maxQuantity?: number | null;
  }[];
}

// Helper for color
const getRarityColor = (rarity: string | undefined): string => {
  switch (rarity?.toLowerCase()) {
    case 'common': return 'gray';
    case 'uncommon': return 'green';
    case 'rare': return 'blue';
    case 'very rare': return 'red';
    case 'epic': return 'purple';
    case 'legendary': return 'orange';
    case 'unique': return 'yellow';
    case 'artifact': return 'pink';
    case 'exceedingly rare': return 'pink';
    case 'ordinary': return 'gray';
    default: return 'gray';
  }
};

// Fetch item data
const fetchBaseItemData = async (itemId: string, collectionName: string): Promise<InventoryItem | null> => {
  try {
    const itemRef = doc(db, collectionName, itemId);
    const snap = await getDoc(itemRef);
    if (snap.exists()) {
      const baseData = snap.data();
      return { id: snap.id, ...baseData } as InventoryItem;
    } else {
      console.warn(`Item doc not found: ${collectionName}/${itemId}`);
      return null;
    }
  } catch (err) {
    console.error(`Error fetching item ${itemId} from ${collectionName}:`, err);
    return null;
  }
};

// Main
const PlayerShopInterface: React.FC = () => {
  const searchParams = useSearchParams();
  const characterIdFromUrl = searchParams?.get('characterId');
  const { currentUser } = useAuth();
  const {
    inventory: playerInventoryContext,
    gold: playerGold,
    processTransaction, // <--- Add this
  } = useCharacter();

  const toast = useToast();

  const [accessibleShops, setAccessibleShops] = useState<AccessibleShop[]>([]);
  const [selectedShop, setSelectedShop] = useState<AccessibleShop | null>(null);
  const [shopItems, setShopItems] = useState<PlayerShopItem[]>([]);
  const [playerSellableItems, setPlayerSellableItems] = useState<PlayerInventoryItemForSale[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);

  // modal
  const { isOpen: isTxModalOpen, onOpen: onTxModalOpen, onClose: onTxModalClose } = useDisclosure();
  const [transactionItem, setTransactionItem] = useState<PlayerShopItem | PlayerInventoryItemForSale | null>(null);
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy');
  const [transactionQuantity, setTransactionQuantity] = useState(1);

  // filters
  const [buySearchTerm, setBuySearchTerm] = useState('');
  const [sellSearchTerm, setSellSearchTerm] = useState('');

  // Load open shops
  useEffect(() => {
    const loadAccessibleShops = async () => {
      setIsLoadingShops(true);
      try {
        const shopsRef = collection(db, 'shops');
        const qShops = query(shopsRef, where('isOpen', '==', true));
        const snap = await getDocs(qShops);
        const shopsList: AccessibleShop[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AccessibleShop[];
        shopsList.sort((a: AccessibleShop, b: AccessibleShop) =>
          a.name.localeCompare(b.name)
        );
        setAccessibleShops(shopsList);
      } catch (err) {
        console.error("Error loading shops:", err);
        toast({ title: 'Error Loading Shops', status: 'error' });
      } finally {
        setIsLoadingShops(false);
      }
    };
    loadAccessibleShops();
  }, [toast]);

  // load shop items when selected
  useEffect(() => {
    const loadShopItems = async () => {
      if (!selectedShop) {
        setShopItems([]);
        return;
      }
      setIsLoadingItems(true);
      try {
        const itemPromises = selectedShop.items
          .filter((shopItemEntry) => shopItemEntry.itemId && shopItemEntry.itemCollection)
          .map(async (shopItemEntry) => {
            const baseItemData = await fetchBaseItemData(
              shopItemEntry.itemId,
              shopItemEntry.itemCollection
            );
            if (baseItemData) {
              return {
                ...baseItemData,
                shopQuantity: shopItemEntry.quantity,
                itemCollection: shopItemEntry.itemCollection,
              } as PlayerShopItem;
            }
            return null;
          });
        const resolved = (await Promise.all(itemPromises)).filter(
          (item): item is PlayerShopItem => !!item && item.shopQuantity > 0
        );
        resolved.sort((a: PlayerShopItem, b: PlayerShopItem) => a.name.localeCompare(b.name));
        setShopItems(resolved);
      } catch (err) {
        console.error("Error loading shop items:", err);
        toast({ title: 'Error Loading Shop Items', status: 'error' });
      } finally {
        setIsLoadingItems(false);
      }
    };
    loadShopItems();
  }, [selectedShop, toast]);

  // filter items in player's inventory that can be sold
  useEffect(() => {
    const sellable = playerInventoryContext
      .filter((invItem: InventoryItemWithQuantity) => {
        // must have a sellValue > 0
        const sVal = invItem.item?.sellValue || 0;
        return sVal > 0;
      })
      .map((invItem: InventoryItemWithQuantity) => ({
        ...invItem.item,
        inventoryQuantity: invItem.quantity,
      })) as PlayerInventoryItemForSale[];
    sellable.sort((a: PlayerInventoryItemForSale, b: PlayerInventoryItemForSale) =>
      a.name.localeCompare(b.name)
    );
    setPlayerSellableItems(sellable);
  }, [playerInventoryContext]);

  // filtering logic
  const filteredShopItems = useMemo(() => {
    if (!buySearchTerm) return shopItems;
    const lower = buySearchTerm.toLowerCase();
    return shopItems.filter((it: PlayerShopItem) =>
      it.name.toLowerCase().includes(lower) ||
      (it.description && it.description.toLowerCase().includes(lower)) ||
      it.itemType.toLowerCase().includes(lower)
    );
  }, [shopItems, buySearchTerm]);

  const filteredSellableItems = useMemo(() => {
    if (!sellSearchTerm) return playerSellableItems;
    const lower = sellSearchTerm.toLowerCase();
    return playerSellableItems.filter((it: PlayerInventoryItemForSale) =>
      it.name.toLowerCase().includes(lower) ||
      (it.description && it.description.toLowerCase().includes(lower)) ||
      it.itemType.toLowerCase().includes(lower)
    );
  }, [playerSellableItems, sellSearchTerm]);

  // open modal
  const openTransactionModal = (
    item: PlayerShopItem | PlayerInventoryItemForSale,
    type: 'buy' | 'sell'
  ) => {
    setTransactionItem(item);
    setTransactionType(type);
    setTransactionQuantity(1);
    onTxModalOpen();
  };

  // handle transaction
  const handleTransaction = async () => {
    if (!currentUser || !selectedShop || !transactionItem) {
      toast({
        title: "Error",
        description: "Missing required data for transaction.",
        status: "error",
      });
      return;
    }
    if (transactionQuantity <= 0) {
      toast({ title: "Invalid Quantity", status: "warning" });
      return;
    }

    setIsProcessingTransaction(true);

    try {
      let goldChange = 0;
      let transactionReason = '';
      let updatedShopItems = [...selectedShop.items];

      if (transactionType === 'buy') {
        const itemToBuy = transactionItem as PlayerShopItem;
        const cost = (itemToBuy.buyValue || 0) * transactionQuantity;
        if (playerGold < cost) {
          throw new Error("Not enough gold for this purchase");
        }
        const shopIx = updatedShopItems.findIndex((si) => si.itemId === itemToBuy.id);
        if (shopIx === -1 || updatedShopItems[shopIx].quantity < transactionQuantity) {
          throw new Error("Shop doesn't have enough stock");
        }
        goldChange = -cost;
        transactionReason = `Purchased ${transactionQuantity}x ${itemToBuy.name}`;
        updatedShopItems[shopIx].quantity -= transactionQuantity;
      } else {
        // sell
        const itemToSell = transactionItem as PlayerInventoryItemForSale;
        const earnings = (itemToSell.sellValue || 0) * transactionQuantity;
        const playerItem = playerInventoryContext.find(
          (inv: InventoryItemWithQuantity) => inv.item.id === itemToSell.id
        );
        if (!playerItem || playerItem.quantity < transactionQuantity) {
          throw new Error("You don't have enough of this item to sell");
        }
        goldChange = earnings;
        transactionReason = `Sold ${transactionQuantity}x ${itemToSell.name}`;

        const shopIx = updatedShopItems.findIndex((si) => si.itemId === itemToSell.id);
        if (shopIx > -1) {
          updatedShopItems[shopIx].quantity += transactionQuantity;
        } else {
          const itemCollection =
            (itemToSell as any).itemCollection ||
            itemToSell.itemType?.toLowerCase().replace(/\s+/g, '_') ||
            'items';
          updatedShopItems.push({
            itemId: itemToSell.id,
            itemCollection,
            quantity: transactionQuantity,
          });
        }

        // Mark as shop transaction so setGold allows it to increase gold
        transactionReason += ' (shop transaction)';
      }

      const newGoldAmount = playerGold + goldChange;
      if (newGoldAmount < 0) {
        throw new Error("Transaction would result in negative gold");
      }

      // update shop in Firestore
      try {
        const shopDocRef = doc(db, 'shops', selectedShop.id);
        await updateDoc(shopDocRef, {
          items: updatedShopItems,
          lastUpdated: serverTimestamp(),
        });
      } catch (err) {
        console.error("Error updating shop inventory:", err);
        throw new Error("Could not update shop inventory. Please try again.");
      }
      // Process character update via context AFTER shop update is successful
try {
  await processTransaction({
      itemId: transactionItem.id,
      // Pass the full item details only when buying, context needs it
      item: transactionType === 'buy' ? {
          id: transactionItem.id,
          name: transactionItem.name,
          description: transactionItem.description || '',
          itemType: transactionItem.itemType || 'Miscellaneous',
          rarity: transactionItem.rarity || 'Common',
          buyValue: transactionItem.buyValue,
          sellValue: transactionItem.sellValue,
          // Add any other core InventoryItem fields if necessary
      } : undefined, 
      quantity: transactionQuantity,
      goldChange: goldChange, // Use the already calculated goldChange
      transactionType: transactionType,
      reason: transactionReason // Use the detailed reason
  });
} catch (charUpdateError) {
  console.error("Error processing character transaction:", charUpdateError);
  // NOTE: Shop inventory was already updated. This is a partial failure state.
  // You might want to add logic here to *attempt* to revert the shop change,
  // but that adds significant complexity. For now, warn the user.
   toast({
      title: "Character Update Failed",
      description: "Shop inventory updated, but your character data (gold/items) might be out of sync. Please contact your DM or try refreshing.",
      status: "error",
      duration: 7000, // Longer duration for error
  });
  // We should probably stop execution here to avoid misleading success message
   setIsProcessingTransaction(false); // Make sure loading stops
   return; // Exit handleTransaction
}

      setSelectedShop((prev) => (prev ? { ...prev, items: updatedShopItems } : null));
      toast({
        title: 'Transaction Complete',
        description: transactionReason,
        status: 'success',
        duration: 2000,
      });
      onTxModalClose();
    } catch (error) {
      console.error("Transaction failed:", error);
      toast({
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Could not complete transaction',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsProcessingTransaction(false);
    }
  };

  // buy item card
  const renderShopItem = (item: PlayerShopItem) => (
    <DarkThemedCard key={item.id} isHoverable={true}>
      <VStack align="start" spacing={2} h="full">
        <HStack justify="space-between" w="full">
          <Text fontWeight="bold">{item.name}</Text>
          <Badge colorScheme={getRarityColor(item.rarity)}>{item.rarity}</Badge>
        </HStack>
        <Badge variant="outline" fontSize="xs">
          {item.itemType}
        </Badge>
        <Text fontSize="xs" noOfLines={2} minH="2.5em">
          {item.description || 'No description.'}
        </Text>
        <Divider />
        <HStack justify="space-between" w="full" mt="auto">
          <HStack spacing={1}>
            <Coins size={14} />
            <Text fontSize="sm" fontWeight="bold" color="green.300">
              {item.buyValue ?? 'N/A'}
            </Text>
          </HStack>
          <Badge
            colorScheme={item.shopQuantity > 0 ? 'blue' : 'red'}
            variant={item.shopQuantity > 0 ? 'solid' : 'outline'}
            fontSize="xs"
          >
            Stock: {item.shopQuantity}
          </Badge>
        </HStack>
        <Button
          size="xs"
          colorScheme="green"
          onClick={() => openTransactionModal(item, 'buy')}
          isDisabled={
            isProcessingTransaction ||
            item.shopQuantity <= 0 ||
            playerGold < (item.buyValue ?? Infinity)
          }
          leftIcon={<ShoppingCart size={14} />}
          w="full"
        >
          Buy
        </Button>
      </VStack>
    </DarkThemedCard>
  );

  // sell item card
  const renderSellableItem = (item: PlayerInventoryItemForSale) => (
    <DarkThemedCard key={item.id} isHoverable={true}>
      <VStack align="start" spacing={2} h="full">
        <HStack justify="space-between" w="full">
          <Text fontWeight="bold">{item.name}</Text>
          <Badge colorScheme={getRarityColor(item.rarity)}>{item.rarity}</Badge>
        </HStack>
        <Badge variant="outline" fontSize="xs">
          {item.itemType}
        </Badge>
        <Text fontSize="xs" noOfLines={2} minH="2.5em">
          {item.description || 'No description.'}
        </Text>
        <Divider />
        <HStack justify="space-between" w="full" mt="auto">
          <HStack spacing={1}>
            <DollarSign size={14} />
            <Text fontSize="sm" fontWeight="bold" color="orange.300">
              {item.sellValue ?? 'N/A'}
            </Text>
          </HStack>
          <Badge colorScheme="purple" variant="solid" fontSize="xs">
            Own: {item.inventoryQuantity}
          </Badge>
        </HStack>
        <Button
          size="xs"
          colorScheme="orange"
          onClick={() => openTransactionModal(item, 'sell')}
          isDisabled={
            isProcessingTransaction ||
            (item.sellValue ?? 0) <= 0 ||
            item.inventoryQuantity <= 0
          }
          leftIcon={<DollarSign size={14} />}
          w="full"
        >
          Sell
        </Button>
      </VStack>
    </DarkThemedCard>
  );

  return (
    <Box p={4} bg="gray.900" color="gray.100" minH="80vh">
      <Heading size="lg" mb={4}>
        <HStack>
          <Store />
          <Text>Shops</Text>
        </HStack>
      </Heading>

      {/* Shop dropdown */}
      <FormControl mb={6} maxW={{ base: '100%', md: '400px' }}>
        <FormLabel fontSize="sm" color="gray.300">
          Select a Shop
        </FormLabel>
        <Select
          placeholder={isLoadingShops ? "Loading shops..." : "Choose a shop"}
          value={selectedShop?.id || ''}
          onChange={(e) =>
            setSelectedShop(accessibleShops.find((s) => s.id === e.target.value) || null)
          }
          isDisabled={isLoadingShops || accessibleShops.length === 0}
          bg="gray.800"
          borderColor="gray.600"
        >
          {accessibleShops.map((shop: AccessibleShop) => (
            <option key={shop.id} value={shop.id} style={{ backgroundColor: "#1A202C" }}>
              {shop.name} ({shop.location})
            </option>
          ))}
        </Select>
        {accessibleShops.length === 0 && !isLoadingShops && (
          <Text fontSize="sm" color="gray.500" mt={1}>
            No shops currently accessible.
          </Text>
        )}
      </FormControl>

      {selectedShop ? (
        <Box bg="gray.800" p={5} borderRadius="lg" borderWidth="1px" borderColor="gray.700">
          <VStack align="stretch" spacing={6}>
            {/* Shop header */}
            <Box>
              <Heading size="md" color="gray.100">
                {selectedShop.name}
              </Heading>
              <Text fontSize="sm" color="gray.400">
                Keeper: {selectedShop.shopkeeperName}
              </Text>
              <Text fontSize="sm" color="gray.500" mt={1}>
                {selectedShop.description}
              </Text>
            </Box>

            {/* Player gold */}
            <HStack bg="gray.700" p={3} borderRadius="md" justify="space-between">
              <Text fontWeight="semibold">Your Gold:</Text>
              <HStack spacing={1}>
                <Coins size={16} />
                <Text fontWeight="bold" fontSize="lg" color="yellow.300">
                  {playerGold}
                </Text>
              </HStack>
            </HStack>

            {/* Buy / Sell Tabs */}
            <Tabs isLazy variant="soft-rounded" colorScheme="brand">
              <TabList>
                <Tab>
                  <ShoppingCart size={16} className="mr-2" /> Buy Items
                </Tab>
                <Tab>
                  <DollarSign size={16} className="mr-2" /> Sell Items
                </Tab>
              </TabList>
              <TabPanels>
                {/* Buy Panel */}
                <TabPanel px={0} py={4}>
                  <InputGroup size="sm" mb={4}>
                    <InputLeftElement pointerEvents="none">
                      <Search size={16} color="gray.500" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search items to buy..."
                      value={buySearchTerm}
                      onChange={(e) => setBuySearchTerm(e.target.value)}
                      bg="gray.700"
                      borderColor="gray.600"
                      pl={8}
                    />
                  </InputGroup>
                  {isLoadingItems ? (
                    <Center h="200px">
                      <Spinner color="brand.400" />
                    </Center>
                  ) : filteredShopItems.length === 0 ? (
                    <Center h="150px" bg="gray.750" borderRadius="md">
                      <Text color="gray.500">
                        No items available for purchase
                        {buySearchTerm ? ' matching search' : ''}.
                      </Text>
                    </Center>
                  ) : (
                    <ScrollArea className="h-[400px] pr-2">
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
                        {filteredShopItems.map((itm: PlayerShopItem) => renderShopItem(itm))}
                      </SimpleGrid>
                    </ScrollArea>
                  )}
                </TabPanel>

                {/* Sell Panel */}
                <TabPanel px={0} py={4}>
                  <InputGroup size="sm" mb={4}>
                    <InputLeftElement pointerEvents="none">
                      <Search size={16} color="gray.500" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search your inventory to sell..."
                      value={sellSearchTerm}
                      onChange={(e) => setSellSearchTerm(e.target.value)}
                      bg="gray.700"
                      borderColor="gray.600"
                      pl={8}
                    />
                  </InputGroup>
                  {playerSellableItems.length === 0 ? (
                    <Center h="150px" bg="gray.750" borderRadius="md">
                      <Text color="gray.500">
                        You have no items eligible for sale.
                      </Text>
                    </Center>
                  ) : filteredSellableItems.length === 0 ? (
                    <Center h="150px" bg="gray.750" borderRadius="md">
                      <Text color="gray.500">No items match search.</Text>
                    </Center>
                  ) : (
                    <ScrollArea className="h-[400px] pr-2">
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
                        {filteredSellableItems.map((itm: PlayerInventoryItemForSale) =>
                          renderSellableItem(itm)
                        )}
                      </SimpleGrid>
                    </ScrollArea>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Box>
      ) : (
        <Center h="300px" bg="gray.800" borderRadius="lg" borderWidth="1px" borderColor="gray.700">
          <VStack>
            <Store size={40} className="text-gray-600 mb-2" />
            <Text color="gray.500">
              Select a shop from the dropdown above to begin trading.
            </Text>
          </VStack>
        </Center>
      )}

      {/* Tx Modal */}
      <Modal isOpen={isTxModalOpen} onClose={onTxModalClose} size="lg" isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.800" color="gray.100" borderWidth="1px" borderColor="gray.600">
          <ModalHeader borderBottomWidth="1px" borderColor="gray.700">
            Confirm {transactionType === 'buy' ? 'Purchase' : 'Sale'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            {transactionItem && (
              <VStack spacing={4} align="stretch">
                <HStack bg="gray.700" p={3} borderRadius="md">
                  <Package size={20} className="text-brand-300" />
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontWeight="bold">{transactionItem.name}</Text>
                    <HStack spacing={2}>
                      <Badge colorScheme={getRarityColor(transactionItem.rarity)} fontSize="xs">
                        {transactionItem.rarity}
                      </Badge>
                      <Badge variant="outline" colorScheme="gray" fontSize="xs">
                        {transactionItem.itemType}
                      </Badge>
                    </HStack>
                  </VStack>
                </HStack>

                <FormControl>
                  <FormLabel fontSize="sm" color="gray.300">
                    Quantity
                  </FormLabel>
                  <NumberInput
                    value={transactionQuantity}
                    onChange={(_, val) => setTransactionQuantity(isNaN(val) ? 1 : val)}
                    min={1}
                    max={
                      transactionType === 'buy'
                        ? (transactionItem as PlayerShopItem).shopQuantity
                        : (transactionItem as PlayerInventoryItemForSale).inventoryQuantity
                    }
                    bg="gray.700"
                    borderColor="gray.600"
                    borderRadius="md"
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {transactionType === 'buy'
                      ? `Shop Stock: ${(transactionItem as PlayerShopItem).shopQuantity}`
                      : `You Own: ${
                          (transactionItem as PlayerInventoryItemForSale).inventoryQuantity
                        }`}
                  </Text>
                </FormControl>

                <Divider borderColor="gray.600" />

                <VStack spacing={1} align="stretch">
                  <HStack justify="space-between">
                    <Text color="gray.400">Price Per Item:</Text>
                    <HStack spacing={1}>
                      <Text fontWeight="bold">
                        {transactionType === 'buy'
                          ? transactionItem.buyValue ?? 0
                          : transactionItem.sellValue ?? 0}
                      </Text>
                      <Coins size={14} />
                    </HStack>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="bold" color="gray.200">
                      Total {transactionType === 'buy' ? 'Cost' : 'Earnings'}:
                    </Text>
                    <HStack spacing={1}>
                      <Text
                        fontWeight="bold"
                        fontSize="lg"
                        color={transactionType === 'buy' ? 'red.300' : 'green.300'}
                      >
                        {(
                          (transactionType === 'buy'
                            ? transactionItem.buyValue ?? 0
                            : transactionItem.sellValue ?? 0) * transactionQuantity
                        )}
                      </Text>
                      <Coins size={16} />
                    </HStack>
                  </HStack>
                  <HStack justify="space-between" mt={1}>
                    <Text fontSize="sm" color="gray.500">
                      Your Gold After:
                    </Text>
                    <HStack spacing={1}>
                      <Text fontSize="sm" color="gray.300">
                        {transactionType === 'buy'
                          ? playerGold -
                            (transactionItem.buyValue ?? 0) * transactionQuantity
                          : playerGold +
                            (transactionItem.sellValue ?? 0) * transactionQuantity}
                      </Text>
                      <Coins size={14} />
                    </HStack>
                  </HStack>
                </VStack>

                {transactionType === 'buy' &&
                  playerGold < (transactionItem.buyValue ?? 0) * transactionQuantity && (
                    <Alert status="error" size="sm" borderRadius="md">
                      <AlertIcon />
                      <Text fontSize="sm">Insufficient Gold</Text>
                    </Alert>
                  )}
                {transactionType === 'buy' &&
                  (transactionItem as PlayerShopItem)?.shopQuantity < transactionQuantity && (
                    <Alert status="warning" size="sm" borderRadius="md">
                      <AlertIcon />
                      <Text fontSize="sm">Insufficient Shop Stock</Text>
                    </Alert>
                  )}
                {transactionType === 'sell' &&
                  (transactionItem as PlayerInventoryItemForSale)?.inventoryQuantity <
                    transactionQuantity && (
                    <Alert status="error" size="sm" borderRadius="md">
                      <AlertIcon />
                      <Text fontSize="sm">Not Enough Items To Sell</Text>
                    </Alert>
                  )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="gray.700">
            <Button
              variant="ghost"
              mr={3}
              onClick={onTxModalClose}
              isDisabled={isProcessingTransaction}
            >
              Cancel
            </Button>
            <Button
              colorScheme={transactionType === 'buy' ? 'green' : 'orange'}
              onClick={handleTransaction}
              isLoading={isProcessingTransaction}
              isDisabled={
                isProcessingTransaction ||
                transactionQuantity <= 0 ||
                (transactionType === 'buy' &&
                  (playerGold < ((transactionItem?.buyValue ?? 0) * transactionQuantity) ||
                    (transactionItem as PlayerShopItem)?.shopQuantity < transactionQuantity)) ||
                (transactionType === 'sell' &&
                  ((transactionItem as PlayerInventoryItemForSale)?.inventoryQuantity ?? 0) <
                    transactionQuantity)
              }
              leftIcon={
                transactionType === 'buy' ? <ShoppingCart size={16} /> : <DollarSign size={16} />
              }
            >
              Confirm {transactionType === 'buy' ? 'Purchase' : 'Sale'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PlayerShopInterface;
// --- END OF FILE PlayerShopInterface.tsx ---
