// src/components/loot/ItemSelect.tsx

import React, { useState, useEffect, useMemo } from 'react';
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
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    useDisclosure,
    Spinner,
    Badge,
    SimpleGrid,
    useToast,
    IconButton,
    Center,
    InputGroup,
    InputLeftElement,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Divider,
    Heading,
} from '@chakra-ui/react';
import { Search, Plus, Trash, Package } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { InventoryItem } from '@/types/inventory';

// Firestore imports
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig'; // Adjust path if needed

// --- Define Utility Function Locally ---
const getRarityScheme = (rarity: string = 'common'): string => {
    // (Keep the existing getRarityScheme function as it was)
    switch(rarity.toLowerCase()) {
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      case 'unique': return 'yellow';
      case 'heirloom': return 'red';
      case 'very rare': return 'red';
      case 'exceedingly rare': return 'pink';
      case 'ordinary': return 'gray';
      default: return 'gray';
    }
};

// Helper to get ItemType string from collection name
const getItemTypeFromCollectionName = (collectionName: string): string => {
    if (collectionName === 'crafting_components') {
      return 'Crafting Component';
    }
    // Basic singularization and capitalization
    const singular = collectionName.replace(/s$/, '');
    return singular.charAt(0).toUpperCase() + singular.slice(1);
};


// --- Adjusted Props (Keep as before) ---
type SelectableInventoryItem = InventoryItem & { quantity?: number };

interface ItemSelectProps {
    selectedItems: SelectableInventoryItem[];
    onItemSelect: (item: InventoryItem, quantity: number) => void;
    onItemRemove: (itemId: string) => void;
    allowQuantityEditing?: boolean;
}

// Simple Item Card for Display (Keep as before)
const ItemDisplayCard: React.FC<{ item: InventoryItem; onSelect: () => void }> = ({ item, onSelect }) => (
     <Box
        key={item.id}
        p={3}
        borderWidth="1px"
        borderRadius="md"
        borderColor="gray.700"
        bg="gray.800"
        _hover={{ borderColor: 'brand.500', cursor: 'pointer', bg: 'gray.750' }}
        onClick={onSelect}
        height="100%"
    >
        <VStack align="start" spacing={1} height="100%" justify="space-between">
            <Box>
                <Text fontWeight="bold" color="gray.200" noOfLines={1}>{item.name}</Text>
                <HStack mt={1}>
                    <Badge fontSize="2xs">{item.itemType}</Badge>
                    <Badge fontSize="2xs" colorScheme={getRarityScheme(item.rarity || 'common')}>
                        {item.rarity || 'Common'}
                    </Badge>
                </HStack>
            </Box>
            <Text fontSize="xs" color="gray.400" noOfLines={2} mt={2}>{item.description}</Text>
        </VStack>
    </Box>
);


const ItemSelect: React.FC<ItemSelectProps> = ({
    selectedItems,
    onItemSelect,
    onItemRemove,
    allowQuantityEditing = false
}) => {
    const [allItems, setAllItems] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterRarity, setFilterRarity] = useState('');
    const toast = useToast();
    const { isOpen: isQuantityOpen, onOpen: onQuantityOpen, onClose: onQuantityClose } = useDisclosure();
    const [itemToQuantify, setItemToQuantify] = useState<InventoryItem | null>(null);
    const [quantity, setQuantity] = useState<string>('1');

    // --- Data Loading from Firestore ---
    useEffect(() => {
        const loadItemsFromFirestore = async () => {
            setIsLoading(true);
            const fetchedItems: InventoryItem[] = [];
            // Define Firestore collection names
            const collectionNames = [
                'weapons', 'armor', 'ammunition', 'potions',
                'scrolls', 'crafting_components', 'traps', 'explosives'
                // Add any other relevant item collections here
            ];

            try {
                for (const collectionName of collectionNames) {
                    const itemsCollectionRef = collection(db, collectionName);
                    const querySnapshot = await getDocs(itemsCollectionRef);

                    querySnapshot.forEach((doc) => {
                        const itemData = doc.data();
                        if (itemData && itemData.name) {
                            // Normalize item data
                            const normalizedItem: InventoryItem = {
                                id: doc.id, // Use Firestore document ID
                                name: itemData.name,
                                description: itemData.description || '',
                                // Prioritize itemType field from DB, else infer
                                itemType: itemData.itemType || getItemTypeFromCollectionName(collectionName),
                                rarity: itemData.rarity || 'Common',
                                // Include all other fields from Firestore
                                ...itemData,
                                // Ensure essential fields have defaults if somehow missing
                                armorRating: itemData.armorRating ?? undefined,
                                tankModifier: itemData.tankModifier ?? undefined,
                                damageAmount: itemData.damageAmount ?? undefined,
                                effect: itemData.effect ?? undefined,
                                // DO NOT add quantity here for the catalog item
                            };
                             fetchedItems.push(normalizedItem);
                        } else {
                            console.warn(`Document ${doc.id} in ${collectionName} is missing data or name.`);
                        }
                    });
                    console.log(`Loaded ${querySnapshot.size} items from ${collectionName}`);
                }

                 setAllItems(fetchedItems);

                toast({
                    title: "Catalog Loaded",
                    description: `Loaded ${fetchedItems.length} items from the database.`,
                    status: "success",
                    duration: 2000,
                    isClosable: true,
                });

            } catch (error) {
                console.error("Error loading item catalog from Firestore:", error);
                toast({
                    title: "Catalog Load Error",
                    description: "Could not load items from the database.",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
                 setAllItems([]); // Set empty on error
            } finally {
                setIsLoading(false);
            }
        };

        loadItemsFromFirestore();
    }, [toast]); // Run once on mount


    // --- Filtering Logic (Keep existing useMemo) ---
    const { filteredItems, uniqueTypes, uniqueRarities } = useMemo(() => {
        const types = new Set<string>();
        const rarities = new Set<string>();
        allItems.forEach(item => {
            // Ensure itemType and rarity are strings before adding
            if (typeof item.itemType === 'string') types.add(item.itemType);
            if (typeof item.rarity === 'string') rarities.add(item.rarity);
        });

        const filtered = allItems.filter(item => {
             // Ensure search term targets are strings
             const nameMatch = typeof item.name === 'string' && item.name.toLowerCase().includes(searchTerm.toLowerCase());
             const descMatch = typeof item.description === 'string' && item.description.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesSearch = nameMatch || descMatch;
            const matchesType = filterType ? item.itemType === filterType : true;
            const matchesRarity = filterRarity ? item.rarity === filterRarity : true;
            return matchesSearch && matchesType && matchesRarity;
        });

        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'unique', 'very rare', 'heirloom', 'exceedingly rare', 'ordinary'];
        const sortedRarities = Array.from(rarities).sort((a, b) => {
            const indexA = rarityOrder.indexOf(a.toLowerCase());
            const indexB = rarityOrder.indexOf(b.toLowerCase());
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
         });

        return {
            filteredItems: filtered,
            uniqueTypes: Array.from(types).sort(),
            uniqueRarities: sortedRarities
        };
    }, [allItems, searchTerm, filterType, filterRarity]);

    // --- Event Handlers (Keep existing handlers) ---
     const handleItemClick = (item: InventoryItem) => {
        if (allowQuantityEditing) {
            setItemToQuantify(item);
            setQuantity('1');
            onQuantityOpen();
        } else {
            onItemSelect(item, 1);
             toast({
                title: 'Item Added', description: `${item.name} added.`,
                status: 'success', duration: 1500, isClosable: true
            });
        }
    };

    const handleQuantityConfirm = () => {
        if (itemToQuantify) {
            const q = Math.max(1, parseInt(quantity, 10));
            onItemSelect(itemToQuantify, q);
             toast({
                title: 'Item Added', description: `${q} x ${itemToQuantify.name} added.`,
                status: 'success', duration: 1500, isClosable: true
            });
            onQuantityClose();
            setItemToQuantify(null);
        }
    };


    // --- JSX Rendering (Largely unchanged, ensure safe access to quantity) ---
    return (
        <Box>
            {/* --- Catalog Section --- */}
            <VStack spacing={4} mb={4} align="stretch">
                <Heading size="sm">Available Items Catalog</Heading>
                <InputGroup size="sm">
                    <InputLeftElement pointerEvents="none">
                        <Search size={16} color="gray.500" />
                    </InputLeftElement>
                    <Input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        bg="gray.700"
                        borderColor="gray.600"
                        borderRadius="md"
                        pl={8}
                    />
                </InputGroup>
                <HStack spacing={4}>
                    <Select
                        placeholder="All Item Types"
                        size="sm"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        bg="gray.700"
                        borderColor="gray.600"
                        borderRadius="md"
                        flex={1}
                    >
                        {uniqueTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </Select>
                    <Select
                        placeholder="All Rarities"
                        size="sm"
                        value={filterRarity}
                        onChange={(e) => setFilterRarity(e.target.value)}
                        bg="gray.700"
                        borderColor="gray.600"
                        borderRadius="md"
                        flex={1}
                    >
                        {uniqueRarities.map(rarity => (
                            <option key={rarity} value={rarity}>{rarity}</option>
                        ))}
                    </Select>
                </HStack>
            </VStack>

            {/* Item Grid */}
             <ScrollArea className="h-[300px] border border-gray-700 rounded-md p-2 bg-gray.900">
                 {isLoading ? (
                     <Center h="100%"><Spinner size="xl" color="brand.400" /></Center>
                 ) : filteredItems.length === 0 ? (
                     <Center h="100%"> <Text color="gray.500">No items match filters.</Text></Center>
                 ) : (
                     <SimpleGrid columns={[2, 3, 4]} spacing={3}>
                         {filteredItems.map(item => (
                             <ItemDisplayCard key={item.id} item={item} onSelect={() => handleItemClick(item)} />
                         ))}
                     </SimpleGrid>
                 )}
             </ScrollArea>

            <Divider my={6} borderColor="gray.600" />

            {/* --- Selected Items Section --- */}
            <VStack spacing={4} align="stretch">
                <Heading size="sm">
                     Selected Items ({selectedItems.reduce((sum, item) => sum + (item.quantity || 0), 0)})
                 </Heading>
                 <ScrollArea className="h-[200px] border border-gray-700 rounded-md p-2 bg-gray.900">
                     {selectedItems.length === 0 ? (
                         <Center h="100%"><Text color="gray.500">No items selected yet.</Text></Center>
                     ) : (
                         <VStack spacing={2} align="stretch">
                             {selectedItems.map(item => (
                                 <HStack
                                     key={item.id}
                                     p={2}
                                     bg="gray.750"
                                     borderRadius="md"
                                     justify="space-between"
                                 >
                                     <VStack align="start" spacing={0}>
                                          <Text color="gray.200" fontSize="sm">{item.name}</Text>
                                          <HStack>
                                             <Badge fontSize="2xs">{item.itemType}</Badge>
                                             <Badge fontSize="2xs" colorScheme={getRarityScheme(item.rarity || 'common')}>
                                                 {item.rarity || 'Common'}
                                             </Badge>
                                         </HStack>
                                     </VStack>
                                     <HStack>
                                         <Badge colorScheme="blue" variant="solid" fontSize="sm">
                                             x {item.quantity ?? 1}
                                         </Badge>
                                         <IconButton
                                             aria-label="Remove item"
                                             icon={<Trash size={14} />}
                                             size="xs"
                                             colorScheme="red"
                                             variant="ghost"
                                             onClick={() => onItemRemove(item.id)}
                                         />
                                     </HStack>
                                 </HStack>
                             ))}
                         </VStack>
                     )}
                 </ScrollArea>
            </VStack>

            {/* Quantity Selection Modal */}
             <Modal isOpen={isQuantityOpen} onClose={onQuantityClose} isCentered size="sm">
                 <ModalOverlay bg="blackAlpha.600"/>
                 <ModalContent bg="gray.800" color="gray.100">
                     <ModalHeader borderBottom="1px" borderColor="gray.700">Set Quantity for {itemToQuantify?.name}</ModalHeader>
                     <ModalCloseButton />
                     <ModalBody py={6}>
                         <VStack spacing={4}>
                             <Text textAlign="center">How many of this item do you want to add?</Text>
                             <NumberInput
                                 min={1}
                                 max={99}
                                 value={quantity}
                                onChange={(_, value) => setQuantity(value.toString())}
                                 width="100px"
                                 size="md"
                                 variant="filled"
                                 bg="gray.700"
                                 _focus={{bg: "gray.600"}}
                             >
                                 <NumberInputField textAlign="center"/>
                                 <NumberInputStepper>
                                     <NumberIncrementStepper />
                                     <NumberDecrementStepper />
                                 </NumberInputStepper>
                             </NumberInput>
                         </VStack>
                     </ModalBody>
                     <ModalFooter borderTop="1px" borderColor="gray.700">
                         <Button variant="ghost" mr={3} onClick={onQuantityClose}>Cancel</Button>
                         <Button colorScheme="brand" onClick={handleQuantityConfirm} leftIcon={<Plus size={16} />}>
                             Add Items
                         </Button>
                     </ModalFooter>
                 </ModalContent>
             </Modal>
        </Box>
    );
};

export default ItemSelect;