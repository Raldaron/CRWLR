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

interface CatalogItem extends InventoryItem {
    id: string;
    collectionName: string;
}

interface ShopItem {
    itemId: string;
    itemCollection: string;
    name: string;
    itemType: string;
    rarity: string;
    quantity: number;
    maxQuantity?: number | null;
    restockRate?: 'none' | 'daily' | 'weekly' | 'monthly' | null;
}

interface Player {
    id: string;
    displayName: string;
}

interface Shop {
    id: string;
    name: string;
    description: string;
    shopType: 'general' | 'weapons' | 'armor' | 'magic' | 'alchemy' | 'blackmarket' | 'specialty' | 'trap' | 'explosives' | 'pharmaceutical';
    shopkeeperName: string;
    location: string;
    items: ShopItem[];
    accessiblePlayerIds: string[];
    isOpen: boolean;
    createdAt: Timestamp;
    lastUpdated?: Timestamp;
    userId?: string;
}

type ShopType = {
    value: Shop['shopType'];
    label: string;
    color: string;
};

const SHOP_TYPES: ShopType[] = [
    { value: 'general', label: 'General Store', color: 'gray' },
    { value: 'trap', label: 'Trap Shop', color: 'teal' },
    { value: 'explosives', label: 'Explosives Shop', color: 'yellow' },
    { value: 'pharmaceutical', label: 'Pharmaceutical Shop', color: 'pink' },
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

const getItemTypeFromCollectionName = (collectionName: string): string => {
    if (collectionName === 'crafting_components') return 'Crafting Component';
    if (collectionName === 'miscellaneous_items') return 'Miscellaneous';
    const singular = collectionName.replace(/s$/, '');
    return singular.charAt(0).toUpperCase() + singular.slice(1);
};

const sanitizeDataForFirestore = (data: any): any => {
    if (data === undefined) {
        return null;
    }
    if (data === null || typeof data !== 'object') {
        return data;
    }
    if (Array.isArray(data)) {
        return data.map(item => sanitizeDataForFirestore(item));
    }
    const sanitizedObject: { [key: string]: any } = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            sanitizedObject[key] = value !== undefined ? sanitizeDataForFirestore(value) : null;
        }
    }
    return sanitizedObject;
};

// --- Main Component ---
const DMShopManager: React.FC = () => {
    const { currentUser } = useAuth();
    const toast = useToast();

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

    const loadData = useCallback(async () => {
        if (!currentUser) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const shopsRef = collection(db, 'shops');
            const qShops = query(shopsRef, where("userId", "==", currentUser.uid));
            const shopsSnapshot = await getDocs(qShops);
            const shopsList = shopsSnapshot.docs
                .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Shop))
                .sort((a, b) => a.name.localeCompare(b.name));
            setShops(shopsList);

            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);
            const playersList = usersSnapshot.docs.map(docSnap => ({
                id: docSnap.id,
                displayName: docSnap.data().displayName || docSnap.data().email || 'Unknown',
            }));
            setPlayers(playersList);

            const itemCollections = ['weapons', 'armor', 'ammunition', 'potions', 'scrolls', 'crafting_components', 'traps', 'explosives', 'miscellaneous_items'];
            let allFetchedItems: CatalogItem[] = [];
            for (const collectionName of itemCollections) {
                const itemsRef = collection(db, collectionName);
                const q = query(itemsRef, limit(500));
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
    }, [loadData]);

    const filteredCatalogItems = useMemo(() => {
        return itemCatalog.filter(item =>
            item.name?.toLowerCase().includes(catalogSearchTerm.toLowerCase())
        );
    }, [itemCatalog, catalogSearchTerm]);

    const handleOpenShopModal = (shop: Shop | null = null) => {
        setIsEditingShop(!!shop);
        setCurrentShopData(shop
            ? { ...shop }
            : { name: '', description: '', shopType: 'general', shopkeeperName: '', location: '', items: [], accessiblePlayerIds: [], isOpen: true }
        );
        onOpenShopModal();
    };

    const handleSaveShop = async () => {
        if (!currentUser) return;
        if (!currentShopData.name?.trim()) {
            toast({ title: 'Name Required', status: 'warning' });
            return;
        }
        setIsSaving(true);
        const now = serverTimestamp();
        try {
            const shopDataToSave = sanitizeDataForFirestore({
                ...currentShopData,
                items: currentShopData.items || [],
                accessiblePlayerIds: currentShopData.accessiblePlayerIds || [],
                userId: currentUser.uid,
            });

            if (isEditingShop && shopDataToSave.id) {
                const { id, ...data } = shopDataToSave;
                await updateDoc(doc(db, 'shops', id), { ...data, lastUpdated: now });
                const updatedDocSnap = await getDoc(doc(db, 'shops', id));
                const updatedLocalShop = { ...updatedDocSnap.data(), id } as Shop;

                setShops(prev => prev.map(s => s.id === id ? updatedLocalShop : s));
                if (selectedShop?.id === id) setSelectedShop(updatedLocalShop);
                toast({ title: 'Shop Updated', status: 'success' });
            } else {
                const { id, ...data } = shopDataToSave;
                const docRef = await addDoc(collection(db, 'shops'), { ...data, createdAt: now, lastUpdated: now });
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
    const [itemToAdd, setItemToAdd] = useState<CatalogItem | null>(null);
    const [addQuantity, setAddQuantity] = useState(1);
    const { isOpen: isQuantityModalOpen, onOpen: onOpenQuantityModal, onClose: onCloseQuantityModal } = useDisclosure();

    const handleSelectItemToAdd = (catalogItem: CatalogItem) => {
        setItemToAdd(catalogItem);
        setAddQuantity(1);
        onCloseItemModal();
        onOpenQuantityModal();
    };

    const handleAddItemToShop = () => {
        if (!selectedShop || !itemToAdd) return;

        const existingItemIndex = selectedShop.items.findIndex(item => item.itemId === itemToAdd.id);
        if (existingItemIndex > -1) {
            toast({
                title: 'Item Exists',
                description: `${itemToAdd.name} is already in this shop. Edit stock directly.`,
                status: 'info'
            });
            onCloseQuantityModal();
            return;
        }

        const newShopItem: ShopItem = {
            itemId: itemToAdd.id,
            itemCollection: itemToAdd.collectionName,
            name: itemToAdd.name,
            itemType: itemToAdd.itemType,
            rarity: itemToAdd.rarity,
            quantity: addQuantity,
            maxQuantity: null,
            restockRate: null,
        };

        const updatedItems = [...selectedShop.items, newShopItem];
        handleUpdateShopItems(updatedItems);
        onCloseQuantityModal();
        setItemToAdd(null);
    };

    const handleRemoveItemFromShop = (itemIdToRemove: string) => {
        if (!selectedShop) return;
        const updatedItems = selectedShop.items.filter(item => item.itemId !== itemIdToRemove);
        handleUpdateShopItems(updatedItems);
    };

    const handleUpdateItemQuantity = async (itemId: string, newQuantity: number) => {
        if (!selectedShop) return;

        // Ensure quantity is a number and not negative
        const validQuantity = isNaN(newQuantity) ? 0 : Math.max(0, newQuantity);

        // Create a copy of the shop's items
        const updatedItems = selectedShop.items.map(item =>
            item.itemId === itemId
                ? { ...item, quantity: validQuantity }
                : item
        );

        // Update the shop with the new item quantities
        setIsSaving(true);
        try {
            const shopRef = doc(db, 'shops', selectedShop.id);
            // Sanitize data before saving to Firestore
            const sanitizedItems = sanitizeDataForFirestore(updatedItems);
            await updateDoc(shopRef, {
                items: sanitizedItems,
                lastUpdated: serverTimestamp()
            });

            // Fetch updated document for local state consistency
            const updatedDocSnap = await getDoc(shopRef);
            const updatedShop = { ...updatedDocSnap.data(), id: selectedShop.id } as Shop;

            // Update local state
            setShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
            setSelectedShop(updatedShop);

        } catch (error) {
            console.error("Error updating shop items:", error);
            toast({
                title: 'Error Updating Inventory',
                description: `${error instanceof Error ? error.message : 'Unknown error'}`,
                status: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateShopItems = async (updatedItems: ShopItem[]) => {
        if (!selectedShop) return;
        setIsSaving(true);
        try {
            const shopRef = doc(db, 'shops', selectedShop.id);
            const sanitizedItems = sanitizeDataForFirestore(updatedItems);
            await updateDoc(shopRef, { items: sanitizedItems, lastUpdated: serverTimestamp() });

            const updatedDocSnap = await getDoc(shopRef);
            const updatedShop = { ...updatedDocSnap.data(), id: selectedShop.id } as Shop;
            setShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
            setSelectedShop(updatedShop);
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

            const updatedDocSnap = await getDoc(shopRef);
            const updatedShop = { ...updatedDocSnap.data(), id: shop.id } as Shop;
            setShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
            if (selectedShop?.id === shop.id) setSelectedShop(updatedShop);
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
        <Box p={{ base: 2, md: 5 }} bg="gray.900" minH="80vh">
            {isLoading ? (
                <Center h="400px">
                    <Spinner size="xl" color="brand.400" />
                </Center>
            ) : (
                <Grid templateColumns={{ base: "1fr", lg: "300px 1fr" }} gap={{ base: 4, md: 6 }}>
                    {/* Left Panel: Shop List */}
                    <Box bg="gray.800" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.700">
                        <VStack align="stretch" spacing={4}>
                            <HStack justify="space-between" wrap="wrap" gap={2}>
                                <Heading size="md" color="gray.200">Shops</Heading>
                                <Button leftIcon={<Plus size={16} />} size="sm" colorScheme="brand" onClick={() => handleOpenShopModal()}>
                                    New Shop
                                </Button>
                            </HStack>
                            <ScrollArea className="h-[calc(100vh - 240px)] pr-2">
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
                                                <Tooltip label="Edit Shop">
                                                    <IconButton
                                                        icon={<Edit size={14} />}
                                                        aria-label="Edit Shop"
                                                        size="xs"
                                                        variant="ghost"
                                                        onClick={(e) => { e.stopPropagation(); handleOpenShopModal(shop); }}
                                                        colorScheme="yellow"
                                                    />
                                                </Tooltip>
                                                <Tooltip label="Manage Player Access">
                                                    <IconButton
                                                        icon={<Users size={14} />}
                                                        aria-label="Manage Access"
                                                        size="xs"
                                                        variant="ghost"
                                                        onClick={(e) => { e.stopPropagation(); handleOpenAccessModal(shop); }}
                                                        colorScheme="blue"
                                                    />
                                                </Tooltip>
                                                <Tooltip label="Delete Shop">
                                                    <IconButton
                                                        icon={<Trash size={14} />}
                                                        aria-label="Delete Shop"
                                                        size="xs"
                                                        variant="ghost"
                                                        onClick={(e) => { e.stopPropagation(); openDeleteConfirmation(shop.id); }}
                                                        colorScheme="red"
                                                    />
                                                </Tooltip>
                                            </HStack>
                                        </Box>
                                    ))}
                                    {shops.length === 0 && (
                                        <Text color="gray.500" textAlign="center">No shops created yet.</Text>
                                    )}
                                </VStack>
                            </ScrollArea>
                        </VStack>
                    </Box>

                    {/* Right Panel: Selected Shop Details */}
                    <Box bg="gray.800" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.700">
                        {selectedShop ? (
                            <VStack align="stretch" spacing={4}>
                                <HStack justify="space-between" wrap="wrap" gap={2}>
                                    <Heading size={{ base: "md", md: "lg" }} color="gray.100">{selectedShop.name}</Heading>
                                    <Button size="sm" colorScheme={selectedShop.isOpen ? "red" : "green"} onClick={() => handleToggleShopStatus(selectedShop)} isLoading={isSaving}>
                                        {selectedShop.isOpen ? "Close Shop" : "Open Shop"}
                                    </Button>
                                </HStack>
                                <Text color="gray.400">{selectedShop.description}</Text>
                                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">Type</Text>
                                        <Badge colorScheme={SHOP_TYPES.find(t => t.value === selectedShop.shopType)?.color || 'gray'}>
                                            {SHOP_TYPES.find(t => t.value === selectedShop.shopType)?.label || selectedShop.shopType}
                                        </Badge>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">Shopkeeper</Text>
                                        <Text color="gray.300">{selectedShop.shopkeeperName}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">Location</Text>
                                        <Text color="gray.300">{selectedShop.location}</Text>
                                    </Box>
                                </SimpleGrid>
                                <Divider borderColor="gray.700" />
                                <HStack justify="space-between">
                                    <Heading size="md" color="gray.200">Shop Inventory</Heading>
                                    <Button leftIcon={<Package size={16} />} size="sm" colorScheme="blue" onClick={onOpenItemModal}>
                                        Add Item
                                    </Button>
                                </HStack>
                                <ScrollArea className="h-[calc(100vh - 480px)] pr-2">
                                    <TableContainer overflowX="auto">
                                        <Table variant="simple" size="sm" width="100%">
                                            <Thead position="sticky" top={0} bg="gray.800" zIndex={1}>
                                                <Tr>
                                                    <Th color="gray.400" width="45%" px={2}>Name</Th>
                                                    <Th color="gray.400" width="20%" display={{ base: 'none', md: 'table-cell' }} px={1}>Type</Th>
                                                    <Th color="gray.400" width="20%" display={{ base: 'none', md: 'table-cell' }} px={1}>Rarity</Th>
                                                    <Th color="gray.400" width="15%" textAlign="right" px={2}>Action</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {selectedShop.items.length === 0 ? (
                                                    <Tr>
                                                        <Td colSpan={5} textAlign="center" color="gray.500">
                                                            Shop is empty. Add items.
                                                        </Td>
                                                    </Tr>
                                                ) : (
                                                    selectedShop.items.map(item => (
                                                        <Tr key={item.itemId} _hover={{ bg: 'gray.750' }}>
                                                            <Td color="gray.200" borderColor="gray.600">
                                                                {item.name}
                                                                <HStack display={{ base: 'flex', md: 'none' }} mt={1}>
                                                                    <Badge variant="outline" fontSize="xs">{item.itemType}</Badge>
                                                                    <Badge colorScheme={getRarityColor(item.rarity)} fontSize="xs">{item.rarity}</Badge>
                                                                </HStack>
                                                            </Td>
                                                            <Td borderColor="gray.600" display={{ base: 'none', md: 'table-cell' }}>
                                                                <Badge colorScheme={getRarityColor(item.rarity)}>{item.rarity}</Badge>
                                                            </Td>
                                                            <Td isNumeric borderColor="gray.600">
                                                                <NumberInput
                                                                    size="xs"
                                                                    value={item.quantity}
                                                                    onChange={(valueString, valueNumber) => {
                                                                        // Handle the value change correctly
                                                                        handleUpdateItemQuantity(item.itemId, valueNumber);
                                                                    }}
                                                                    min={0}
                                                                    maxW="70px"
                                                                    bg="gray.700"
                                                                    borderColor="gray.600"
                                                                    isDisabled={isSaving}
                                                                >
                                                                    <NumberInputField textAlign="center" />
                                                                    <NumberInputStepper>
                                                                        <NumberIncrementStepper borderColor="gray.600" />
                                                                        <NumberDecrementStepper borderColor="gray.600" />
                                                                    </NumberInputStepper>
                                                                </NumberInput>
                                                            </Td>
                                                            <Td borderColor="gray.600">
                                                                <IconButton aria-label="Remove Item" icon={<Trash size={14} />} size="xs" variant="ghost" colorScheme="red" onClick={() => handleRemoveItemFromShop(item.itemId)} isLoading={isSaving} />
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
                            <Center h="full">
                                <Text color="gray.500">Select a shop to view details and manage inventory.</Text>
                            </Center>
                        )}
                    </Box>
                </Grid>
            )}

            {/* --- Modals --- */}

            <Modal isOpen={isQuantityModalOpen} onClose={onCloseQuantityModal} size="sm">
                <ModalOverlay />
                <ModalContent bg="gray.800" color="gray.100">
                    <ModalHeader borderBottomWidth="1px" borderColor="gray.700">
                        Select Quantity
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4} align="center">
                            <Text>How many {itemToAdd?.name} to add?</Text>
                            <NumberInput
                                value={addQuantity}
                                onChange={(_, value) => setAddQuantity(isNaN(value) ? 1 : value)}
                                min={1}
                                max={999}
                                bg="gray.700"
                                borderColor="gray.600"
                                width="120px"
                            >
                                <NumberInputField textAlign="center" />
                                <NumberInputStepper>
                                    <NumberIncrementStepper borderColor="gray.600" color="gray.400" />
                                    <NumberDecrementStepper borderColor="gray.600" color="gray.400" />
                                </NumberInputStepper>
                            </NumberInput>
                        </VStack>
                    </ModalBody>
                    <ModalFooter borderTopWidth="1px" borderColor="gray.700">
                        <Button variant="ghost" mr={3} onClick={onCloseQuantityModal}>
                            Cancel
                        </Button>
                        <Button colorScheme="brand" onClick={handleAddItemToShop} isLoading={isSaving}>
                            Add to Shop
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Shop Modal - Updated for compact layout on small screens */}
            <Modal isOpen={isShopModalOpen} onClose={onCloseShopModal} size={{ base: "full", md: "xl" }}>
                <ModalOverlay />
                <ModalContent bg="gray.800" color="gray.100">
                    <ModalHeader borderBottomWidth="1px" borderColor="gray.700">
                        {isEditingShop ? 'Edit Shop' : 'Create New Shop'}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4} align="stretch">
                            <FormControl isRequired>
                                <FormLabel>Shop Name</FormLabel>
                                <Input name="name" value={currentShopData.name || ''} onChange={(e) => setCurrentShopData(prev => ({ ...prev, name: e.target.value }))} bg="gray.700" borderColor="gray.600" />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Description</FormLabel>
                                <Textarea name="description" value={currentShopData.description || ''} onChange={(e) => setCurrentShopData(prev => ({ ...prev, description: e.target.value }))} bg="gray.700" borderColor="gray.600" />
                            </FormControl>
                            {/* Use SimpleGrid to stack fields on small screens */}
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                <FormControl>
                                    <FormLabel>Shop Type</FormLabel>
                                    <Select name="shopType" value={currentShopData.shopType || 'general'} onChange={(e) => setCurrentShopData(prev => ({ ...prev, shopType: e.target.value as Shop['shopType'] }))} bg="gray.700" borderColor="gray.600">
                                        {SHOP_TYPES.map(t => (
                                            <option key={t.value} value={t.value} style={{ backgroundColor: "#2D3748" }}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Shopkeeper</FormLabel>
                                    <Input name="shopkeeperName" value={currentShopData.shopkeeperName || ''} onChange={(e) => setCurrentShopData(prev => ({ ...prev, shopkeeperName: e.target.value }))} bg="gray.700" borderColor="gray.600" />
                                </FormControl>
                            </SimpleGrid>
                            <FormControl>
                                <FormLabel>Location</FormLabel>
                                <Input name="location" value={currentShopData.location || ''} onChange={(e) => setCurrentShopData(prev => ({ ...prev, location: e.target.value }))} bg="gray.700" borderColor="gray.600" />
                            </FormControl>
                            <FormControl display="flex" alignItems="center">
                                <FormLabel htmlFor="shop-is-open" mb="0">Shop Open?</FormLabel>
                                <Switch id="shop-is-open" isChecked={currentShopData.isOpen} onChange={(e) => setCurrentShopData(prev => ({ ...prev, isOpen: e.target.checked }))} colorScheme="green" />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter borderTopWidth="1px" borderColor="gray.700">
                        <Button variant="ghost" mr={3} onClick={onCloseShopModal}>
                            Cancel
                        </Button>
                        <Button colorScheme="brand" onClick={handleSaveShop} isLoading={isSaving} leftIcon={<Save size={16} />}>
                            {isEditingShop ? 'Save Changes' : 'Create Shop'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal isOpen={isItemModalOpen} onClose={onCloseItemModal} size={{ base: "full", md: "3xl" }} scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent bg="gray.800" color="gray.100">
                    <ModalHeader borderBottomWidth="1px" borderColor="gray.700">Add Item to Shop</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody py={4}>
                        <InputGroup size="sm" mb={3}>
                            <InputLeftElement pointerEvents='none'>
                                <Search size={16} color='gray.400' />
                            </InputLeftElement>
                            <Input placeholder='Search catalog...' value={catalogSearchTerm} onChange={(e) => setCatalogSearchTerm(e.target.value)} bg="gray.700" borderColor="gray.600" pl={8} />
                        </InputGroup>
                        <ScrollArea className="h-[55vh]">
                            {isLoading ? (
                                <Center><Spinner /></Center>
                            ) : filteredCatalogItems.length === 0 ? (
                                <Center><Text color="gray.500">No items found.</Text></Center>
                            ) : (
                                <TableContainer overflowX="auto">
                                    <Table variant="simple" size="sm" width="100%" sx={{ tableLayout: 'fixed' }}>
                                        <Thead position="sticky" top={0} bg="gray.800" zIndex={1}>
                                            <Tr>
                                                <Th color="gray.400" width="45%" px={2}>Name</Th>
                                                <Th color="gray.400" width="20%" display={{ base: 'none', md: 'table-cell' }} px={1}>Type</Th>
                                                <Th color="gray.400" width="20%" display={{ base: 'none', md: 'table-cell' }} px={1}>Rarity</Th>
                                                <Th color="gray.400" width="15%" textAlign="right" px={2}>Action</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {filteredCatalogItems.map(catalogItem => (
                                                <Tr key={catalogItem.id} _hover={{ bg: 'gray.750' }}>
                                                    <Td color="gray.200" px={2} py={1.5}>
                                                        {catalogItem.name}
                                                        <HStack display={{ base: 'flex', md: 'none' }} mt={1} spacing={1}>
                                                            <Badge variant="outline" fontSize="xs">{catalogItem.itemType}</Badge>
                                                            <Badge colorScheme={getRarityColor(catalogItem.rarity)} fontSize="xs">{catalogItem.rarity}</Badge>
                                                        </HStack>
                                                    </Td>
                                                    <Td display={{ base: 'none', md: 'table-cell' }} px={1} py={1.5}>
                                                        <Badge variant="outline" fontSize="xs">{catalogItem.itemType}</Badge>
                                                    </Td>
                                                    <Td display={{ base: 'none', md: 'table-cell' }} px={1} py={1.5}>
                                                        <Badge colorScheme={getRarityColor(catalogItem.rarity)} fontSize="xs">{catalogItem.rarity}</Badge>
                                                    </Td>
                                                    <Td textAlign="right" px={2} py={1.5}>
                                                        <IconButton
                                                            aria-label="Add item"
                                                            icon={<Plus size={14} />}
                                                            size="xs"
                                                            colorScheme="green"
                                                            variant="ghost"
                                                            onClick={() => handleSelectItemToAdd(catalogItem)}
                                                        />
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </TableContainer>
                            )}
                        </ScrollArea>
                    </ModalBody>
                    <ModalFooter borderTopWidth="1px" borderColor="gray.700">
                        <Button variant="ghost" onClick={onCloseItemModal}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal isOpen={isAccessModalOpen} onClose={onCloseAccessModal} size={{ base: "full", md: "lg" }} scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent bg="gray.800" color="gray.100">
                    <ModalHeader borderBottomWidth="1px" borderColor="gray.700">Manage Access for {selectedShop?.name}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody py={4}>
                        <Text fontSize="sm" color="gray.400" mb={3}>Select players who can access this shop:</Text>
                        <ScrollArea className="h-[50vh]">
                            <CheckboxGroup colorScheme="brand" value={selectedPlayerIdsForAccess} onChange={(values) => setSelectedPlayerIdsForAccess(values as string[])}>
                                <VStack align="stretch" spacing={2}>
                                    {players.map(player => (
                                        <Checkbox key={player.id} value={player.id} p={2} bg="gray.750" borderRadius="md" _hover={{ bg: "gray.700" }}>
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
                        <Button colorScheme="brand" onClick={handleSaveAccessChanges} isLoading={isSaving} leftIcon={<Save size={16} />}>
                            Save Access List
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <AlertDialog isOpen={isDeleteModalOpen} leastDestructiveRef={cancelRef} onClose={onCloseDeleteModal}>
                <AlertDialogOverlay>
                    <AlertDialogContent bg="gray.800" color="gray.100">
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">Delete Shop</AlertDialogHeader>
                        <AlertDialogBody>
                            Are you sure you want to delete this shop? This action cannot be undone.
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onCloseDeleteModal} variant="ghost">
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={handleDeleteShop} ml={3} isLoading={isSaving}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
};

// Helper for Rarity Color
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

export default DMShopManager;
