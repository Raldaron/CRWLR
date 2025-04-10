// components/admin/DMShopManager.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Box, Button, Input, Select, Textarea, Spinner, useToast, Heading, VStack, HStack,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, useDisclosure,
    FormControl, FormLabel, SimpleGrid, Checkbox, CheckboxGroup, Stack, Badge, Table, Thead, Tbody, Tr, Th, Td,
    IconButton, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
    Alert, AlertIcon, Divider, Tag, TagLabel, TagCloseButton, Wrap,
    InputGroup, InputLeftElement, TableContainer, Center, Text,
    Grid,
    Tooltip,
    Switch,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogBody,
    AlertDialogHeader,
    AlertDialogFooter,
} from '@chakra-ui/react';
import {
    Store, Plus, Edit, Trash, Search, Package, Users, Save, X, BookOpen, CheckCircle, XCircle, Coins, Tag as TagIcon, ShoppingCart
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, query, where, limit, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { InventoryItem } from '@/types/inventory';

// --- Interfaces ---

// Catalog Item (Base item definition)
interface CatalogItem extends InventoryItem {
    id: string; // Original Firestore document ID
    collectionName: string; // Source collection (e.g., 'weapons', 'armor')
}

// Shop Item (Item instance within a specific shop's inventory)
interface ShopItem {
    itemId: string; // ID referencing the CatalogItem (original Firestore ID)
    itemCollection: string; // Source collection name (e.g., 'weapons')
    name: string; // Copied for display, but itemId is the source of truth
    itemType: string; // Copied for filtering/display
    rarity: string; // Copied for display
    quantity: number; // Current stock in this shop
    maxQuantity?: number | null; // <<< Allow null
    restockRate?: 'none' | 'daily' | 'weekly' | 'monthly' | null; // <<< Allow null
}

// Player (Simplified for access management)
interface Player {
    id: string; // User ID (from auth/users collection)
    displayName: string;
}

// Shop Definition
interface Shop {
    id: string;
    name: string;
    description: string;
    shopType: 'general' | 'weapons' | 'armor' | 'magic' | 'alchemy' | 'blackmarket' | 'specialty';
    shopkeeperName: string;
    location: string;
    items: ShopItem[];
    accessiblePlayerIds: string[]; // List of User IDs who can access
    isOpen: boolean; // Whether the shop is currently open to players
    createdAt: Timestamp;
    lastUpdated?: Timestamp;
    userId?: string; // Added to associate shop with DM user
}

type ShopType = {
    value: Shop['shopType'];
    label: string;
    color: string;
};

const SHOP_TYPES: ShopType[] = [
    { value: 'general', label: 'General Store', color: 'gray' },
    { value: 'weapons', label: 'Weapons Shop', color: 'red' },
    { value: 'armor', label: 'Armor Shop', color: 'blue' },
    { value: 'magic', label: 'Magic Shop', color: 'purple' },
    { value: 'alchemy', label: 'Alchemist', color: 'green' },
    { value: 'blackmarket', label: 'Black Market', color: 'gray' },
    { value: 'specialty', label: 'Specialty Shop', color: 'orange' }
];

const ITEM_TYPES = [
  'Weapon', 'Armor', 'Ammunition', 'Potion', 'Scroll',
  'Crafting Component', 'Trap', 'Explosive', 'Throwable', 'Miscellaneous'
];


// Helper to get ItemType string from collection name
const getItemTypeFromCollectionName = (collectionName: string): string => {
    if (collectionName === 'crafting_components') return 'Crafting Component';
    if (collectionName === 'miscellaneous_items') return 'Miscellaneous';
    const singular = collectionName.replace(/s$/, '');
    return singular.charAt(0).toUpperCase() + singular.slice(1);
};

// --- Helper function to sanitize data for Firestore ---
// Recursively removes `undefined` values or replaces them with `null`
const sanitizeDataForFirestore = (data: any): any => {
    if (data === undefined) {
        return null; // Replace top-level undefined with null
    }
    if (data === null || typeof data !== 'object') {
        return data; // Primitives or null are fine
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizeDataForFirestore(item)); // Recurse into arrays
    }

    const sanitizedObject: { [key: string]: any } = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (value !== undefined) {
                sanitizedObject[key] = sanitizeDataForFirestore(value); // Recurse into object properties
            } else {
                sanitizedObject[key] = null; // Replace undefined property with null
            }
        }
    }
    return sanitizedObject;
};


// --- Main Component ---
const DMShopManager: React.FC = () => {
    const { currentUser } = useAuth();
    const toast = useToast();

    // --- State ---
    const [shops, setShops] = useState<Shop[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [itemCatalog, setItemCatalog] = useState<CatalogItem[]>([]);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal States
    const { isOpen: isShopModalOpen, onOpen: onOpenShopModal, onClose: onCloseShopModal } = useDisclosure();
    const { isOpen: isItemModalOpen, onOpen: onOpenItemModal, onClose: onCloseItemModal } = useDisclosure();
    const { isOpen: isAccessModalOpen, onOpen: onOpenAccessModal, onClose: onCloseAccessModal } = useDisclosure();
    const { isOpen: isDeleteModalOpen, onOpen: onOpenDeleteModal, onClose: onCloseDeleteModal } = useDisclosure();
    // Form States
    const [isEditingShop, setIsEditingShop] = useState(false);
    const [currentShopData, setCurrentShopData] = useState<Partial<Shop>>({});
    const [shopToDelete, setShopToDelete] = useState<string | null>(null);
    const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
    const [selectedPlayerIdsForAccess, setSelectedPlayerIdsForAccess] = useState<string[]>([]);

    const cancelRef = useRef<HTMLButtonElement>(null!);

    // --- Data Loading ---
    const loadData = useCallback(async () => {
        if (!currentUser) {
             setIsLoading(false);
             return;
        };
        setIsLoading(true);
        try {
            // Load Shops owned by the current user
            const shopsRef = collection(db, 'shops');
            const qShops = query(shopsRef, where("userId", "==", currentUser.uid)); // Filter by userId
            const shopsSnapshot = await getDocs(qShops);
            const shopsList = shopsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Shop))
                .sort((a, b) => a.name.localeCompare(b.name));
            setShops(shopsList);

             // Load Players (assuming players are in a general 'users' collection)
             // You might need to adjust this logic if players/characters are structured differently
            const usersRef = collection(db, 'users'); // Or 'characters' if you assign shops to characters
            const usersSnapshot = await getDocs(usersRef);
            const playersList = usersSnapshot.docs.map(docSnap => ({
                id: docSnap.id,
                displayName: docSnap.data().displayName || docSnap.data().email || 'Unknown',
            }));
            setPlayers(playersList);

             // Load Item Catalog (remains the same - catalog is global)
             const itemCollections = ['weapons', 'armor', 'ammunition', 'potions', 'scrolls', 'crafting_components', 'traps', 'explosives', 'miscellaneous_items'];
             let allFetchedItems: CatalogItem[] = [];
             for (const collectionName of itemCollections) {
                 const itemsRef = collection(db, collectionName);
                 const q = query(itemsRef, limit(500)); // Limit load for performance
                 const querySnapshot = await getDocs(q);
                 const fetchedItems = querySnapshot.docs.map(docSnap => {
                     const data = docSnap.data() as Omit<InventoryItem, 'id'>;
                     return {
                         id: docSnap.id,
                         collectionName: collectionName,
                         ...data,
                         itemType: data.itemType || getItemTypeFromCollectionName(collectionName),
                     } as CatalogItem;
                 });
                 allFetchedItems = [...allFetchedItems, ...fetchedItems];
             }
             const uniqueItems = Array.from(new Map(allFetchedItems.map(item => [item.id, item])).values());
             uniqueItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
             setItemCatalog(uniqueItems);

        } catch (error) {
            console.error("Error loading initial data:", error);
            toast({ title: 'Error Loading Data', status: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]); // Dependency array includes loadData

    // --- Filtering ---
    const filteredCatalogItems = useMemo(() => {
        return itemCatalog.filter(item =>
            item.name?.toLowerCase().includes(catalogSearchTerm.toLowerCase())
        );
    }, [itemCatalog, catalogSearchTerm]);

    // --- Shop Management ---
    const handleOpenShopModal = (shop: Shop | null = null) => {
        setIsEditingShop(!!shop);
        setCurrentShopData(shop ? { ...shop } : { name: '', description: '', shopType: 'general', shopkeeperName: '', location: '', items: [], accessiblePlayerIds: [], isOpen: true });
        onOpenShopModal();
    };

    const handleSaveShop = async () => {
        if (!currentUser) return; // Ensure user is logged in
        if (!currentShopData.name?.trim()) {
            toast({ title: 'Name Required', status: 'warning' }); return;
        }
        setIsSaving(true);
        const now = serverTimestamp();
        try {
            // Sanitize the data before saving
            const shopDataToSave = sanitizeDataForFirestore({
                 ...currentShopData,
                 // Ensure arrays are initialized if empty/null before sanitizing
                 items: currentShopData.items || [],
                 accessiblePlayerIds: currentShopData.accessiblePlayerIds || [],
                 userId: currentUser.uid, // Add the current user's ID
            });


            if (isEditingShop && shopDataToSave.id) {
                 const { id, ...data } = shopDataToSave; // Exclude ID from data payload
                 await updateDoc(doc(db, 'shops', id), { ...data, lastUpdated: now });
                 // Fetch the updated timestamp from Firestore for local state consistency (optional but recommended)
                 const updatedDocSnap = await getDoc(doc(db, 'shops', id));
                 const updatedLocalShop = { ...updatedDocSnap.data(), id } as Shop;

                 setShops(prev => prev.map(s => s.id === id ? updatedLocalShop : s));
                 if (selectedShop?.id === id) setSelectedShop(updatedLocalShop);
                toast({ title: 'Shop Updated', status: 'success' });
            } else {
                const { id, ...data } = shopDataToSave; // Exclude potential temp ID
                 const docRef = await addDoc(collection(db, 'shops'), { ...data, createdAt: now, lastUpdated: now });
                  // Fetch the newly created doc to get accurate timestamps for local state
                  const newDocSnap = await getDoc(docRef);
                  const newShop = { ...newDocSnap.data(), id: docRef.id } as Shop;
                 setShops(prev => [newShop, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
                toast({ title: 'Shop Created', status: 'success' });
            }
            onCloseShopModal();
        } catch (error) {
            console.error("Error saving shop:", error);
            toast({ title: 'Error Saving Shop', description: `${error instanceof Error ? error.message : 'Unknown error'}`, status: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const openDeleteConfirmation = (shopId: string) => {
      setShopToDelete(shopId);
      onOpenDeleteModal();
  };

  const handleDeleteShop = async () => {
      if (!shopToDelete) return;
      setIsSaving(true);
      try {
          await deleteDoc(doc(db, 'shops', shopToDelete));
          setShops(prev => prev.filter(s => s.id !== shopToDelete));
          toast({ title: 'Shop Deleted', status: 'info' });
          if (selectedShop?.id === shopToDelete) setSelectedShop(null);
          setShopToDelete(null);
          onCloseDeleteModal();
      } catch (error) {
          console.error("Error deleting shop:", error);
          toast({ title: 'Error Deleting Shop', status: 'error' });
      } finally {
          setIsSaving(false);
      }
  };

    // --- Shop Item Management ---
    const handleAddItemToShop = (catalogItem: CatalogItem) => {
        if (!selectedShop) return;

        const existingItemIndex = selectedShop.items.findIndex(item => item.itemId === catalogItem.id);

        if (existingItemIndex > -1) {
            toast({ title: 'Item Exists', description: `${catalogItem.name} is already in this shop. Edit stock directly.`, status: 'info' });
            return;
        }

        // --- FIX: Ensure optional fields are null, not undefined ---
        const newShopItem: ShopItem = {
            itemId: catalogItem.id,
            itemCollection: catalogItem.collectionName,
            name: catalogItem.name,
            itemType: catalogItem.itemType,
            rarity: catalogItem.rarity,
            quantity: 1,
            maxQuantity: null, // Use null instead of undefined
            restockRate: null, // Use null instead of undefined or 'none' if preferred default
        };

        const updatedItems = [...selectedShop.items, newShopItem];
        handleUpdateShopItems(updatedItems);
        onCloseItemModal();
    };

     const handleRemoveItemFromShop = (itemIdToRemove: string) => {
        if (!selectedShop) return;
        const updatedItems = selectedShop.items.filter(item => item.itemId !== itemIdToRemove);
        handleUpdateShopItems(updatedItems);
    };

     const handleUpdateItemQuantity = (itemId: string, newQuantity: number) => {
         if (!selectedShop || isNaN(newQuantity) || newQuantity < 0) return; // Added NaN check
         const updatedItems = selectedShop.items.map(item =>
             item.itemId === itemId ? { ...item, quantity: newQuantity } : item
         );
         handleUpdateShopItems(updatedItems);
     };

      const handleUpdateShopItems = async (updatedItems: ShopItem[]) => {
         if (!selectedShop) return;
         setIsSaving(true);
         try {
             const shopRef = doc(db, 'shops', selectedShop.id);
             // --- FIX: Sanitize the items array before saving ---
             const sanitizedItems = sanitizeDataForFirestore(updatedItems);
             await updateDoc(shopRef, { items: sanitizedItems, lastUpdated: serverTimestamp() });

             // Fetch updated timestamp for local consistency
              const updatedDocSnap = await getDoc(shopRef);
              const updatedShop = { ...updatedDocSnap.data(), id: selectedShop.id } as Shop;

             setShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
             setSelectedShop(updatedShop);
             // toast({ title: 'Shop Inventory Updated', status: 'success', duration: 1500 }); // Optional success toast
         } catch (error) {
             console.error("Error updating shop items:", error);
             toast({ title: 'Error Updating Inventory', description: `${error instanceof Error ? error.message : 'Unknown error'}`, status: 'error' });
         } finally {
             setIsSaving(false);
         }
     };

    // --- Access Management ---
    const handleOpenAccessModal = (shop: Shop) => {
        setSelectedShop(shop);
        setSelectedPlayerIdsForAccess([...shop.accessiblePlayerIds]);
        onOpenAccessModal();
    };

    const handleTogglePlayerAccess = (playerId: string) => {
        setSelectedPlayerIdsForAccess(prev =>
            prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
        );
    };

     const handleSaveAccessChanges = async () => {
        if (!selectedShop) return;
        setIsSaving(true);
        try {
            const shopRef = doc(db, 'shops', selectedShop.id);
            await updateDoc(shopRef, { accessiblePlayerIds: selectedPlayerIdsForAccess, lastUpdated: serverTimestamp() });

             // Fetch updated timestamp for local consistency
             const updatedDocSnap = await getDoc(shopRef);
             const updatedShop = { ...updatedDocSnap.data(), id: selectedShop.id } as Shop;

            setShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
            setSelectedShop(updatedShop);
            toast({ title: 'Player Access Updated', status: 'success' });
            onCloseAccessModal();
        } catch (error) {
            console.error("Error updating player access:", error);
            toast({ title: 'Error Updating Access', status: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

     const handleToggleShopStatus = async (shop: Shop) => {
         const newStatus = !shop.isOpen;
         setIsSaving(true);
         try {
             const shopRef = doc(db, 'shops', shop.id);
             await updateDoc(shopRef, { isOpen: newStatus, lastUpdated: serverTimestamp() });

             // Fetch updated timestamp for local consistency
             const updatedDocSnap = await getDoc(shopRef);
             const updatedShop = { ...updatedDocSnap.data(), id: shop.id } as Shop;

             setShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
             if (selectedShop?.id === shop.id) setSelectedShop(updatedShop); // Update selected view
             toast({ title: `Shop ${newStatus ? 'Opened' : 'Closed'}`, status: 'info' });
         } catch (error) {
             console.error("Error toggling shop status:", error);
             toast({ title: 'Error Updating Status', status: 'error' });
         } finally {
             setIsSaving(false);
         }
     };

    // --- Rendering ---
    return (
        <Box p={{base: 2, md: 5}} bg="gray.900" minH="80vh"> {/* Added responsive padding and minHeight */}
            {isLoading ? (
                <Center h="400px"><Spinner size="xl" color="brand.400" /></Center>
            ) : (
                 <Grid templateColumns={{ base: "1fr", lg: "300px 1fr" }} gap={{base: 4, md: 6}} > {/* Responsive gap and columns, adjusted breakpoint */}
                    {/* Left Panel: Shop List */}
                     <Box bg="gray.800" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.700" >
                        <VStack align="stretch" spacing={4}>
                             <HStack justify="space-between" wrap="wrap" gap={2}> {/* Allow wrapping */}
                                <Heading size="md" color="gray.200">Shops</Heading>
                                <Button leftIcon={<Plus size={16} />} size="sm" colorScheme="brand" onClick={() => handleOpenShopModal()}>New Shop</Button>
                             </HStack>
                            {/* Add Search/Filter for shops if needed */}
                              <ScrollArea className="h-[calc(100vh - 240px)] pr-2"> {/* Adjusted height */}
                                <VStack spacing={3} align="stretch">
                                    {shops.map(shop => (
                                        <Box
                                            key={shop.id}
                                            p={3}
                                            borderWidth="1px"
                                            borderRadius="md"
                                            borderColor={selectedShop?.id === shop.id ? "brand.500" : "gray.600"}
                                            bg={selectedShop?.id === shop.id ? "gray.750" : "gray.800"}
                                            cursor="pointer"
                                            onClick={() => setSelectedShop(shop)}
                                            _hover={{ bg: 'gray.700' }}
                                        >
                                            <HStack justify="space-between">
                                                <VStack align="start" spacing={0}>
                                                     <Text fontWeight="bold" color="gray.200">{shop.name}</Text>
                                                     <Text fontSize="xs" color="gray.400">{shop.location}</Text>
                                                </VStack>
                                                <Badge colorScheme={shop.isOpen ? "green" : "red"}>{shop.isOpen ? "Open" : "Closed"}</Badge>
                                            </HStack>
                                            <HStack mt={2} spacing={1}>
                                                 <Tooltip label="Edit Shop"><IconButton icon={<Edit size={14} />} aria-label="Edit Shop" size="xs" variant="ghost" onClick={(e) => {e.stopPropagation(); handleOpenShopModal(shop);}} colorScheme="yellow"/></Tooltip>
                                                 <Tooltip label="Manage Player Access"><IconButton icon={<Users size={14} />} aria-label="Manage Access" size="xs" variant="ghost" onClick={(e) => {e.stopPropagation(); handleOpenAccessModal(shop);}} colorScheme="blue"/></Tooltip>
                                                 <Tooltip label="Delete Shop"><IconButton icon={<Trash size={14} />} aria-label="Delete Shop" size="xs" variant="ghost" onClick={(e) => {e.stopPropagation(); openDeleteConfirmation(shop.id);}} colorScheme="red"/></Tooltip>
                                            </HStack>
                                        </Box>
                                    ))}
                                    {shops.length === 0 && <Text color="gray.500" textAlign="center">No shops created yet.</Text>}
                                </VStack>
                            </ScrollArea>
                        </VStack>
                    </Box>

                    {/* Right Panel: Selected Shop Details */}
                     <Box bg="gray.800" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.700" >
                        {selectedShop ? (
                            <VStack align="stretch" spacing={4}>
                                <HStack justify="space-between" wrap="wrap" gap={2}> {/* Allow wrapping */}
                                    <Heading size={{base: "md", md: "lg"}} color="gray.100">{selectedShop.name}</Heading> {/* Responsive heading */}
                                     <Button size="sm" colorScheme={selectedShop.isOpen ? "red" : "green"} onClick={() => handleToggleShopStatus(selectedShop)} isLoading={isSaving}>
                                         {selectedShop.isOpen ? "Close Shop" : "Open Shop"}
                                     </Button>
                                </HStack>
                                <Text color="gray.400">{selectedShop.description}</Text>
                                 <SimpleGrid columns={{base: 1, sm: 2, md: 3}} spacing={4}> {/* Responsive columns */}
                                    <Box><Text fontSize="sm" color="gray.500">Type</Text><Badge colorScheme={SHOP_TYPES.find(t => t.value === selectedShop.shopType)?.color || 'gray'}>{SHOP_TYPES.find(t => t.value === selectedShop.shopType)?.label || selectedShop.shopType}</Badge></Box>
                                    <Box><Text fontSize="sm" color="gray.500">Shopkeeper</Text><Text color="gray.300">{selectedShop.shopkeeperName}</Text></Box>
                                    <Box><Text fontSize="sm" color="gray.500">Location</Text><Text color="gray.300">{selectedShop.location}</Text></Box>
                                </SimpleGrid>
                                <Divider borderColor="gray.700" />
                                <HStack justify="space-between">
                                    <Heading size="md" color="gray.200">Shop Inventory</Heading>
                                    <Button leftIcon={<Package size={16} />} size="sm" colorScheme="blue" onClick={onOpenItemModal}>Add Item</Button>
                                </HStack>
                                 <ScrollArea className="h-[calc(100vh - 480px)] pr-2"> {/* Adjusted height */}
                                    <TableContainer>
                                        <Table variant='simple' size='sm'>
                                            <Thead position="sticky" top={0} bg="gray.800" zIndex={1}> {/* Sticky header */}
                                                <Tr>
                                                    <Th color="gray.400" borderColor="gray.600">Item</Th>
                                                    <Th color="gray.400" borderColor="gray.600" display={{base: 'none', md: 'table-cell'}}>Type</Th> {/* Hide on mobile */}
                                                    <Th color="gray.400" borderColor="gray.600" display={{base: 'none', md: 'table-cell'}}>Rarity</Th> {/* Hide on mobile */}
                                                    <Th color="gray.400" borderColor="gray.600" isNumeric>Stock</Th>
                                                    <Th color="gray.400" borderColor="gray.600"></Th> {/* Actions */}
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {selectedShop.items.length === 0 ? (
                                                    <Tr><Td colSpan={5} textAlign="center" color="gray.500">Shop is empty. Add items.</Td></Tr>
                                                ) : (
                                                    selectedShop.items.map(item => (
                                                        <Tr key={item.itemId} _hover={{ bg: 'gray.750' }}>
                                                            <Td color="gray.200" borderColor="gray.600">
                                                                {item.name}
                                                                {/* Show badges inline or below on mobile if needed */}
                                                                 <HStack display={{base: 'flex', md: 'none'}} mt={1}><Badge variant="outline" fontSize="xs">{item.itemType}</Badge><Badge colorScheme={getRarityColor(item.rarity)} fontSize="xs">{item.rarity}</Badge></HStack>
                                                            </Td>
                                                             <Td borderColor="gray.600" display={{base: 'none', md: 'table-cell'}}><Badge variant="outline">{item.itemType}</Badge></Td>
                                                            <Td borderColor="gray.600" display={{base: 'none', md: 'table-cell'}}><Badge colorScheme={getRarityColor(item.rarity)}>{item.rarity}</Badge></Td>
                                                            <Td isNumeric borderColor="gray.600">
                                                                <NumberInput
                                                                    size="xs"
                                                                    value={item.quantity}
                                                                    onChange={(_, value) => handleUpdateItemQuantity(item.itemId, isNaN(value) ? 0 : value)} // Ensure value is number
                                                                    min={0}
                                                                    maxW="70px"
                                                                    bg="gray.700"
                                                                    borderColor="gray.600"
                                                                    isDisabled={isSaving}
                                                                >
                                                                    <NumberInputField textAlign="center"/>
                                                                    {/* Stepper might be too noisy for a list */}
                                                                </NumberInput>
                                                            </Td>
                                                            <Td borderColor="gray.600">
                                                                <IconButton aria-label="Remove Item" icon={<Trash size={14} />} size="xs" variant="ghost" colorScheme="red" onClick={() => handleRemoveItemFromShop(item.itemId)} isLoading={isSaving}/>
                                                            </Td>
                                                        </Tr>
                                                    ))
                                                )}
                                            </Tbody>
                                        </Table>
                                    </TableContainer>
                                </ScrollArea>
                            </VStack>
                        ) : (
                            <Center h="full"><Text color="gray.500">Select a shop to view details and manage inventory.</Text></Center>
                        )}
                    </Box>
                </Grid>
            )}

             {/* --- Modals --- */}

            {/* Create/Edit Shop Modal */}
            <Modal isOpen={isShopModalOpen} onClose={onCloseShopModal} size="xl">
                 <ModalOverlay />
                 <ModalContent bg="gray.800" color="gray.100">
                     <ModalHeader borderBottomWidth="1px" borderColor="gray.700">{isEditingShop ? 'Edit Shop' : 'Create New Shop'}</ModalHeader>
                     <ModalCloseButton />
                     <ModalBody pb={6}>
                         <VStack spacing={4} align="stretch">
                             <FormControl isRequired><FormLabel>Shop Name</FormLabel><Input name="name" value={currentShopData.name || ''} onChange={(e) => setCurrentShopData(prev => ({...prev, name: e.target.value}))} bg="gray.700" borderColor="gray.600"/></FormControl>
                             <FormControl><FormLabel>Description</FormLabel><Textarea name="description" value={currentShopData.description || ''} onChange={(e) => setCurrentShopData(prev => ({...prev, description: e.target.value}))} bg="gray.700" borderColor="gray.600"/></FormControl>
                             <HStack><FormControl><FormLabel>Shop Type</FormLabel><Select name="shopType" value={currentShopData.shopType || 'general'} onChange={(e) => setCurrentShopData(prev => ({...prev, shopType: e.target.value as Shop['shopType']}))} bg="gray.700" borderColor="gray.600">{SHOP_TYPES.map(t => <option key={t.value} value={t.value} style={{ backgroundColor: "#2D3748"}}>{t.label}</option>)}</Select></FormControl><FormControl><FormLabel>Shopkeeper</FormLabel><Input name="shopkeeperName" value={currentShopData.shopkeeperName || ''} onChange={(e) => setCurrentShopData(prev => ({...prev, shopkeeperName: e.target.value}))} bg="gray.700" borderColor="gray.600"/></FormControl></HStack>
                             <FormControl><FormLabel>Location</FormLabel><Input name="location" value={currentShopData.location || ''} onChange={(e) => setCurrentShopData(prev => ({...prev, location: e.target.value}))} bg="gray.700" borderColor="gray.600"/></FormControl>
                             <FormControl display="flex" alignItems="center"><FormLabel htmlFor="shop-is-open" mb="0">Shop Open?</FormLabel><Switch id="shop-is-open" isChecked={currentShopData.isOpen} onChange={(e) => setCurrentShopData(prev => ({...prev, isOpen: e.target.checked}))} colorScheme="green" /></FormControl>
                         </VStack>
                     </ModalBody>
                     <ModalFooter borderTopWidth="1px" borderColor="gray.700">
                         <Button variant="ghost" mr={3} onClick={onCloseShopModal}>Cancel</Button>
                         <Button colorScheme="brand" onClick={handleSaveShop} isLoading={isSaving} leftIcon={<Save size={16}/>}>{isEditingShop ? 'Save Changes' : 'Create Shop'}</Button>
                     </ModalFooter>
                 </ModalContent>
             </Modal>

             {/* Add Item From Catalog Modal */}
             <Modal isOpen={isItemModalOpen} onClose={onCloseItemModal} size={{base: "full", md: "3xl"}} scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent bg="gray.800" color="gray.100">
                    <ModalHeader borderBottomWidth="1px" borderColor="gray.700">Add Item to Shop</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody py={4}>
                         <InputGroup size="sm" mb={3}>
                            <InputLeftElement pointerEvents='none'><Search size={16} color='gray.400' /></InputLeftElement>
                            <Input placeholder='Search catalog...' value={catalogSearchTerm} onChange={(e) => setCatalogSearchTerm(e.target.value)} bg="gray.700" borderColor="gray.600" pl={8}/>
                         </InputGroup>
                          <ScrollArea className="h-[55vh]"> {/* Adjusted height */}
                             {isLoading ? <Center><Spinner/></Center> :
                             filteredCatalogItems.length === 0 ? <Center><Text color="gray.500">No items found.</Text></Center> :
                              <TableContainer>
                                 {/* Use very small size, fixed layout helps control overflow */}
                                 <Table variant="simple" size="sm" sx={{ tableLayout: 'fixed' }}>
                                      <Thead position="sticky" top={0} bg="gray.800" zIndex={1}>
                                        <Tr>
                                            {/* Give Name column more space */}
                                            <Th color="gray.400" width="45%" px={2}>Name</Th>
                                            {/* Reduce space for Type and Rarity */}
                                            <Th color="gray.400" width="20%" display={{base: 'none', md: 'table-cell'}} px={1}>Type</Th>
                                            <Th color="gray.400" width="20%" display={{base: 'none', md: 'table-cell'}} px={1}>Rarity</Th>
                                            {/* Minimal space for Action */}
                                            <Th color="gray.400" width="15%" textAlign="right" px={2}>Action</Th>
                                         </Tr>
                                    </Thead>
                                     <Tbody>
                                        {filteredCatalogItems.map(item => (
                                            <Tr key={item.id} _hover={{ bg: 'gray.750' }}>
                                                 <Td px={2} py={1.5} whiteSpace="normal" overflow="hidden" textOverflow="ellipsis"> {/* Allow wrapping */}
                                                    <Text color="gray.200" fontWeight="medium" fontSize="xs" lineHeight="short">{item.name}</Text> {/* Smaller font, shorter line height */}
                                                    {/* Show badges below on mobile */}
                                                    <HStack display={{base: 'flex', md: 'none'}} mt={1} spacing={1}><Badge variant="outline" fontSize="xs">{item.itemType}</Badge><Badge colorScheme={getRarityColor(item.rarity)} fontSize="xs">{item.rarity}</Badge></HStack>
                                                 </Td>
                                                  <Td display={{base: 'none', md: 'table-cell'}} px={1} py={1.5}><Badge variant="outline" fontSize="xs">{item.itemType}</Badge></Td>
                                                 <Td display={{base: 'none', md: 'table-cell'}} px={1} py={1.5}><Badge colorScheme={getRarityColor(item.rarity)} fontSize="xs">{item.rarity}</Badge></Td>
                                                 <Td textAlign="right" px={2} py={1.5}>
                                                    <IconButton aria-label="Add item" icon={<Plus size={14} />} size="xs" colorScheme="green" variant="ghost" onClick={() => handleAddItemToShop(item)}/>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                 </Table>
                             </TableContainer>
                             }
                         </ScrollArea>
                    </ModalBody>
                    <ModalFooter borderTopWidth="1px" borderColor="gray.700">
                        <Button variant="ghost" onClick={onCloseItemModal}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

             {/* Manage Player Access Modal */}
             <Modal isOpen={isAccessModalOpen} onClose={onCloseAccessModal} size={{base: "full", md: "lg"}} scrollBehavior="inside"> {/* Responsive size */}
                 <ModalOverlay />
                 <ModalContent bg="gray.800" color="gray.100">
                     <ModalHeader borderBottomWidth="1px" borderColor="gray.700">Manage Access for {selectedShop?.name}</ModalHeader>
                     <ModalCloseButton />
                     <ModalBody py={4}>
                         <Text fontSize="sm" color="gray.400" mb={3}>Select players who can access this shop:</Text>
                          <ScrollArea className="h-[50vh]"> {/* Adjusted height */}
                             <CheckboxGroup colorScheme="brand" value={selectedPlayerIdsForAccess} onChange={(values) => setSelectedPlayerIdsForAccess(values as string[])}>
                                 <VStack align="stretch" spacing={2}>
                                     {players.map(player => (
                                        <Checkbox key={player.id} value={player.id} p={2} bg="gray.750" borderRadius="md" _hover={{bg: "gray.700"}}>
                                            {player.displayName}
                                        </Checkbox>
                                    ))}
                                     {players.length === 0 && <Text color="gray.500">No players found.</Text>}
                                 </VStack>
                             </CheckboxGroup>
                         </ScrollArea>
                     </ModalBody>
                     <ModalFooter borderTopWidth="1px" borderColor="gray.700">
                         <Button variant="ghost" mr={3} onClick={onCloseAccessModal}>Cancel</Button>
                         <Button colorScheme="brand" onClick={handleSaveAccessChanges} isLoading={isSaving} leftIcon={<Save size={16}/>}>Save Access List</Button>
                     </ModalFooter>
                 </ModalContent>
             </Modal>

             {/* Delete Shop Confirmation */}
             <AlertDialog
                isOpen={isDeleteModalOpen}
                leastDestructiveRef={cancelRef}
                onClose={onCloseDeleteModal}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent bg="gray.800" color="gray.100">
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">Delete Shop</AlertDialogHeader>
                        <AlertDialogBody>Are you sure you want to delete this shop? This action cannot be undone.</AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onCloseDeleteModal} variant="ghost">
                                Cancel
                            </Button>
                             <Button colorScheme="red" onClick={handleDeleteShop} ml={3} isLoading={isSaving}> {/* Use isSaving for delete */}
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

        </Box>
    );
};

// Helper for Rarity Color (reused from catalog)
const getRarityColor = (rarity?: string): string => {
    switch (rarity?.toLowerCase()) {
        case 'common': return 'gray'; case 'uncommon': return 'green';
        case 'rare': return 'blue'; case 'very rare': return 'cyan';
        case 'epic': return 'purple'; case 'legendary': return 'orange';
        case 'unique': return 'yellow'; case 'artifact': return 'red';
        case 'exceedingly rare': return 'pink';
        default: return 'gray';
    }
};

export default DMShopManager;