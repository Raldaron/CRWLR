// components/equipment/Utility.tsx
'use client';

import React, { useState } from 'react';
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
  useToast
} from '@chakra-ui/react';
import { Package, Plus, Minus } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import AmmunitionCard from '@/components/ItemCards/AmmunitionCard';
import TrapCard from '@/components/ItemCards/TrapCard';
import ExplosivesCard from '@/components/ItemCards/ExplosivesCard';
import CraftingComponentCard from '@/components/ItemCards/CraftingComponentCard';
import PotionCard from '@/components/ItemCards/PotionCard';
import ScrollCard from '@/components/ItemCards/ScrollCard';
import type { InventoryItem } from '@/types/inventory';
import AmmunitionDetailModal from '@/components/Modals/AmmunitionDetailModal';
import ScrollDetailModal from '@/components/Modals/ScrollDetailModal';
import TrapDetailModal from '@/components/Modals/TrapDetailModal';
import ExplosivesDetailModal from '@/components/Modals/ExplosivesDetailModal';
import CraftingComponentDetailModal from '@/components/Modals/CraftingComponentDetailModal';
import PotionDetailModal from '@/components/Modals/PotionDetailModal';
import type { AmmunitionItem } from '@/types/ammunition';
import type { ScrollItem } from '@/types/scroll';
import type { TrapItem } from '@/types/trap';
import type { ExplosiveItem } from '@/types/explosives';
import type { PotionItem } from '@/types/potion';
import type { CraftingComponentItem } from '@/types/craftingcomponent';

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
  'Explosive',
  'Scroll',
  'Trap',
  'Throwable',
  'Potion'
];

// Utility Slot Card component
const UtilitySlotCard: React.FC<{
  slot: UtilitySlot;
  onAddItem: () => void;
  onViewDetails: (item: InventoryItem) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onUnequip: () => void;
}> = ({
  slot,
  onAddItem,
  onViewDetails,
  onIncrement,
  onDecrement,
  onUnequip
}) => (
    <Box
      p={3}
      border="2px"
      borderColor={slot.stack ? "brand.500" : "gray.700"}
      borderRadius="lg"
      cursor="pointer"
      onClick={slot.stack?.item ? () => onViewDetails(slot.stack!.item) : onAddItem}
      _hover={{ borderColor: slot.stack ? "brand.400" : "gray.600" }}
      minH="120px"
      bg="gray.800"
      position="relative"
    >
      <VStack spacing={1} align="center" justify="center" h="full">
        {slot.stack ? (
          // Show item info if equipped, with quantity badge
          <>
            <Package size={20} className="text-brand-400" />
            <Text fontWeight="bold" fontSize="sm" textAlign="center" noOfLines={1} color="gray.200">
              {slot.stack.item.name}
            </Text>
            <Badge colorScheme="brand">
              {slot.stack.item.itemType}
            </Badge>

            {/* Quantity controls */}
            {slot.stack && (
              <HStack mt={1}>
                <Button
                  size="xs"
                  colorScheme="accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecrement();
                  }}
                  aria-label="Use/Decrease quantity"
                >
                  <Minus size={12} />
                </Button>
                <Badge colorScheme="teal" fontSize="md" px={2}>
                  {slot.stack.quantity}
                </Badge>
                <Button
                  size="xs"
                  colorScheme="brand"
                  onClick={(e) => {
                    e.stopPropagation();
                    onIncrement();
                  }}
                  aria-label="Add quantity"
                >
                  <Plus size={12} />
                </Button>
              </HStack>
            )}

            {/* Unequip button */}
            <Button
              size="xs"
              colorScheme="accent"
              position="absolute"
              top={1}
              right={1}
              height="20px"
              minWidth="20px"
              p={0}
              children="×"
              onClick={(e) => {
                e.stopPropagation();
                onUnequip();
              }}
            />
          </>
        ) : (
          // Show empty slot message
          <>
            <Package size={20} className="text-gray-500" />
            <Text color="gray.400" fontSize="sm" textAlign="center">
              {slot.name}
            </Text>
            <Text fontSize="xs" color="gray.500" textAlign="center">
              (Empty)
            </Text>
            <Button size="xs" colorScheme="brand" mt={1}>
              Equip Item
            </Button>
          </>
        )}
      </VStack>
    </Box>
  );

// Safely render item cards based on item type
const getItemCard = (item: InventoryItem, onClick: () => void) => {
  switch (item.itemType) {
    case 'Ammunition':
      return <AmmunitionCard item={item as AmmunitionItem} onClick={onClick} />;
    case 'Crafting Component':
      return <CraftingComponentCard item={item as CraftingComponentItem} onClick={onClick} />;
    case 'Explosive':
    case 'Throwable':
      return <ExplosivesCard item={item as ExplosiveItem} onClick={onClick} />;
    case 'Scroll':
      return <ScrollCard item={item as ScrollItem} onClick={onClick} />;
    case 'Trap':
      return <TrapCard item={item as TrapItem} onClick={onClick} />;
    case 'Potion':
      return <PotionCard item={item as PotionItem} onClick={onClick} />;
    default:
      return null;
  }
};

const Utility: React.FC = () => {
  const toast = useToast();
  const {
    getInventoryByType,
    getItemQuantity,
    utilitySlots,
    addItemToUtilitySlot,
    removeItemFromUtilitySlot,
    updateUtilitySlotQuantity
  } = useCharacter();

  // Modal and item selection states
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemToAdd, setItemToAdd] = useState<InventoryItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Modal controls
  const { isOpen: isItemSelectOpen, onOpen: openItemSelect, onClose: closeItemSelect } = useDisclosure();
  const { isOpen: isItemDetailOpen, onOpen: openItemDetail, onClose: closeItemDetail } = useDisclosure();
  const { isOpen: isQuantityOpen, onOpen: openQuantity, onClose: closeQuantity } = useDisclosure();

  // Items to display in tabs
  const itemTypes = ['Ammunition', 'Crafting Component', 'Explosive', 'Scroll', 'Trap', 'Potion'];

  // Get items from inventory
  const getItems = (type: string) => {
    return getInventoryByType(type).filter(
      (inventoryItem) => inventoryItem.item.itemType === type
    );
  };

  // Function to open item details modal
  const handleViewDetails = (item: InventoryItem) => {
    setSelectedItem(item);
    openItemDetail();
  };

  // Function to add item to a utility slot
  const handleAddItem = (slotId: string) => {
    setSelectedSlot(slotId);
    setSelectedTabIndex(0);
    openItemSelect();
  };

  // Prepare to add an item to a slot with quantity
  const prepareAddItem = (item: InventoryItem) => {
    setItemToAdd(item);
    closeItemSelect();
    openQuantity();
  };

  // Add item to slot with specific quantity
  const handleAddItemToSlot = (quantity: number) => {
    if (!itemToAdd || !selectedSlot || quantity <= 0) {
      closeQuantity();
      return;
    }

    setIsAddingItem(true);

    try {
      // Use the context function to add the item to the utility slot
      addItemToUtilitySlot(selectedSlot, itemToAdd, quantity);
  
      // Show success toast
      toast({
        title: "Item Added",
        description: `${quantity} × ${itemToAdd.name} added to ${selectedSlot}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error adding item to slot:", error);
      toast({
        title: "Error",
        description: "Failed to add item to slot",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      // Reset and close
      closeQuantity();
      setItemToAdd(null);
      setIsAddingItem(false);
    }
  };

  // Increment quantity of an item in a slot
  const handleIncrement = (slotId: string) => {
    const slot = utilitySlots.find(slot => slot.id === slotId);
    if (!slot || !slot.stack) return;

    const { item } = slot.stack;

    // Get available quantity in inventory
    const inventoryQuantity = getItemQuantity(item.id);

    // Only increment if we have more in inventory
    if (inventoryQuantity > 0) {
      // Update quantity using the context function
      updateUtilitySlotQuantity(slotId, 1);

      // Show feedback
      toast({
        title: "Item Added",
        description: `Added 1 more ${item.name} to slot`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Not enough items",
        description: `No more ${item.name} available in inventory`,
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // Decrement/use quantity of an item in a slot
  const handleDecrement = (slotId: string) => {
    const slot = utilitySlots.find(slot => slot.id === slotId);
    if (!slot || !slot.stack) return;

    const { item } = slot.stack;

    // Update quantity using the context function
    updateUtilitySlotQuantity(slotId, -1);

    // Notify about item use
    toast({
      title: "Item Used",
      description: `1 × ${item.name} has been used.`,
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  // Unequip an item from a slot
  const handleUnequip = (slotId: string) => {
    // Use the context function to remove the item
    removeItemFromUtilitySlot(slotId);

    toast({
      title: "Items Returned",
      description: "Items have been returned to your inventory",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

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
      <Modal isOpen={isItemSelectOpen} onClose={closeItemSelect} size="4xl">
        <ModalOverlay />
        <ModalContent maxH="85vh" overflowY="auto" bg="gray.800" borderColor="gray.700">
          <ModalHeader color="gray.200">Select Item for {selectedSlot}</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={6}>
            <Tabs index={selectedTabIndex} onChange={setSelectedTabIndex} colorScheme="brand">
              <TabList borderColor="gray.700">
                {itemTypes.map((type) => (
                  <Tab key={type} color="gray.300" _selected={{ color: 'brand.400', borderColor: 'brand.400' }}>
                    {type}
                  </Tab>
                ))}
              </TabList>

              <TabPanels>
                {itemTypes.map((type) => (
                  <TabPanel key={type}>
                    {getItems(type).length === 0 ? (
                      <Alert status="info" bg="gray.700" color="gray.200">
                        <AlertIcon color="brand.400" />
                        No {type} items available in inventory
                      </Alert>
                    ) : (
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                        {getItems(type).map((inventoryItem) => (
                          <Box key={inventoryItem.item.id} position="relative">
                            {/* Quantity badge */}
                            <Badge
                              position="absolute"
                              top={2}
                              right={2}
                              zIndex={1}
                              colorScheme="teal"
                              fontSize="md"
                              px={2}
                              py={1}
                              borderRadius="full"
                            >
                              {inventoryItem.quantity}
                            </Badge>

                            {getItemCard(
                              inventoryItem.item,
                              () => prepareAddItem(inventoryItem.item)
                            )}
                          </Box>
                        ))}
                      </SimpleGrid>
                    )}
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
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
                <Text color="gray.200">
                  How many {itemToAdd.name} would you like to add?
                </Text>

                <Text fontSize="sm" color="gray.400">
                  Available: {getItemQuantity(itemToAdd.id)}
                </Text>

                <NumberInput
                  defaultValue={1}
                  min={1}
                  max={getItemQuantity(itemToAdd.id)}
                  keepWithinRange={true}
                  width="120px"
                  borderColor="gray.600"
                >
                  <NumberInputField bg="gray.700" color="gray.200" _hover={{ borderColor: "brand.500" }} />
                  <NumberInputStepper>
                    <NumberIncrementStepper borderColor="gray.600" color="gray.400" />
                    <NumberDecrementStepper borderColor="gray.600" color="gray.400" />
                  </NumberInputStepper>
                </NumberInput>

                <Button
                  colorScheme="brand"
                  onClick={() => {
                    const quantity = Number(
                      (document.querySelector('.chakra-numberinput__field') as HTMLInputElement).value
                    );
                    handleAddItemToSlot(quantity);
                  }}
                  isLoading={isAddingItem}
                  loadingText="Adding..."
                >
                  Add to Slot
                </Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Item Detail Modals */}
      {selectedItem && (
        <>
          {/* Ammunition Detail Modal */}
          {selectedItem.itemType === 'Ammunition' && (
            <AmmunitionDetailModal
              ammunition={selectedItem as AmmunitionItem}
              isOpen={isItemDetailOpen}
              onClose={closeItemDetail}
            />
          )}

          {/* Scroll Detail Modal */}
          {selectedItem.itemType === 'Scroll' && (
            <ScrollDetailModal
              scroll={selectedItem as ScrollItem}
              isOpen={isItemDetailOpen}
              onClose={closeItemDetail}
            />
          )}

          {/* Trap Detail Modal */}
          {selectedItem.itemType === 'Trap' && (
            <TrapDetailModal
              trap={selectedItem as TrapItem}
              isOpen={isItemDetailOpen}
              onClose={closeItemDetail}
            />
          )}

          {/* Explosives Detail Modal */}
          {(selectedItem.itemType === 'Explosive' || selectedItem.itemType === 'Throwable') && (
            <ExplosivesDetailModal
              explosive={selectedItem as ExplosiveItem}
              isOpen={isItemDetailOpen}
              onClose={closeItemDetail}
            />
          )}

          {/* Crafting Component Detail Modal */}
          {selectedItem.itemType === 'Crafting Component' && (
            <CraftingComponentDetailModal
              component={selectedItem as CraftingComponentItem}
              isOpen={isItemDetailOpen}
              onClose={closeItemDetail}
            />
          )}

          {/* Potion Detail Modal */}
          {selectedItem.itemType === 'Potion' && (
            <PotionDetailModal
              potion={selectedItem as PotionItem}
              isOpen={isItemDetailOpen}
              onClose={closeItemDetail}
            />
          )}
        </>
      )}
    </Box>
  );
};

export default Utility;