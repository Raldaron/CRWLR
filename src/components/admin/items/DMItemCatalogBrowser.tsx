// components/admin/items/DMItemCatalogBrowser.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Input,
    InputGroup,
    InputLeftElement,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Spinner,
    Text,
    VStack,
    HStack,
    IconButton,
    Select,
    useToast,
    TableContainer,
    Center // Added Center
} from '@chakra-ui/react';
import { Search, Edit, Trash } from 'lucide-react'; // Removed Eye for now
import { collection, getDocs, query, limit, deleteDoc, doc } from 'firebase/firestore'; // Adjusted imports
import { db } from '@/firebase/firebaseConfig';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { InventoryItem } from '@/types/inventory';

// Define Item explicitly for clarity within this component
interface CatalogItem extends InventoryItem {
    id: string; // Ensure ID is always present
    collectionName: string; // Added collectionName
}

interface DMItemCatalogBrowserProps {
    onSelectItemForEdit: (item: InventoryItem) => void;
    onViewItemDetails: (item: InventoryItem) => void;
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
        case 'explosives': return 'Explosive'; // Base type, editor might distinguish Throwable
        case 'miscellaneous_items': return 'Miscellaneous';
        default: return 'Unknown';
    }
};

const DMItemCatalogBrowser: React.FC<DMItemCatalogBrowserProps> = ({ onSelectItemForEdit }) => {
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterRarity, setFilterRarity] = useState('');
    const toast = useToast();

    const itemCollections = [
        'weapons', 'armor', 'ammunition', 'potions',
        'scrolls', 'crafting_components', 'traps', 'explosives',
        'miscellaneous_items' // Ensure fallback is included
    ];

    const loadItems = async () => {
        setIsLoading(true);
        setItems([]);

        try {
            let allFetchedItems: CatalogItem[] = [];

            for (const collectionName of itemCollections) {
                const itemsRef = collection(db, collectionName);
                // Load a significant number, consider pagination for > 500 items
                const q = query(itemsRef, limit(500));

                const querySnapshot = await getDocs(q);
                const fetchedItems = querySnapshot.docs.map(docSnap => {
                    const data = docSnap.data() as Omit<InventoryItem, 'id'>;
                    // Infer itemType if not present in data
                    const itemType = data.itemType || getItemTypeFromCollectionName(collectionName);
                    return {
                        id: docSnap.id,
                        collectionName: collectionName,
                        ...data,
                        itemType: itemType, // Ensure itemType is set
                    } as CatalogItem; // Assert the final type
                });

                allFetchedItems = [...allFetchedItems, ...fetchedItems];
            }

            // Remove duplicates (unlikely but safe)
            const uniqueItems = Array.from(new Map(allFetchedItems.map(item => [item.id, item])).values());

            // Sort items initially by name
            uniqueItems.sort((a, b) => (a.name || 'Unnamed').localeCompare(b.name || 'Unnamed'));

            setItems(uniqueItems);

        } catch (error) {
            console.error("Error loading items:", error);
            toast({
                title: 'Error Loading Items',
                description: 'Could not fetch the item catalog.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Load initial items only once

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const searchMatch = !searchTerm ||
                (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            const typeMatch = !filterType || item.itemType === filterType;
            const rarityMatch = !filterRarity || item.rarity === filterRarity;
            return searchMatch && typeMatch && rarityMatch;
        });
    }, [items, searchTerm, filterType, filterRarity]);

    const itemTypes = useMemo(() => Array.from(new Set(items.map(item => item.itemType).filter(Boolean))).sort(), [items]);
    const rarities = useMemo(() => Array.from(new Set(items.map(item => item.rarity).filter(Boolean))).sort(), [items]);

    const handleDeleteItem = async (item: CatalogItem) => {
        if (!item.collectionName || !item.id) {
            toast({ title: 'Error', description: 'Cannot delete item: Missing collection or ID info.', status: 'error' });
            console.error("Missing collectionName or id for item:", item);
            return;
        }
        if (!window.confirm(`Are you sure you want to delete "${item.name}"? This cannot be undone.`)) {
            return;
        }
        try {
            const itemRef = doc(db, item.collectionName, item.id);
            await deleteDoc(itemRef);
            setItems(prevItems => prevItems.filter(i => i.id !== item.id));
            toast({ title: 'Item Deleted', description: `${item.name} has been removed.`, status: 'success' });
        } catch (error) {
            console.error("Error deleting item:", error);
            toast({ title: 'Error Deleting Item', description: 'Could not delete item.', status: 'error' });
        }
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
            case 'exceedingly rare': return 'pink';
            default: return 'gray';
        }
    };

    return (
        <VStack spacing={4} align="stretch">
            <HStack spacing={4}>
                <InputGroup flex="1">
                    <InputLeftElement pointerEvents="none">
                        <Search size={18} color="gray.400" />
                    </InputLeftElement>
                    <Input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        bg="gray.700" borderColor="gray.600" color="gray.200" pl={10}
                    />
                </InputGroup>
                <Select
                    placeholder="Filter by Type"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    bg="gray.700" borderColor="gray.600" maxWidth="200px" color="gray.200" iconColor="gray.400"
                >
                    {itemTypes.map(type => <option key={type} value={type} style={{ backgroundColor: "#2D3748", color: "#E2E8F0"}}>{type}</option>)}
                </Select>
                <Select
                    placeholder="Filter by Rarity"
                    value={filterRarity}
                    onChange={(e) => setFilterRarity(e.target.value)}
                    bg="gray.700" borderColor="gray.600" maxWidth="200px" color="gray.200" iconColor="gray.400"
                >
                     {rarities.map(rarity => <option key={rarity} value={rarity} style={{ backgroundColor: "#2D3748", color: "#E2E8F0"}}>{rarity}</option>)}
                </Select>
            </HStack>

            {isLoading ? (
                <Center py={10}>
                    <Spinner size="xl" color="brand.400" />
                    <Text mt={4} color="gray.400">Loading Item Catalog...</Text>
                </Center>
            ) : (
                <ScrollArea className="h-[600px] border border-gray-700 rounded-md">
                     <TableContainer>
                        <Table variant="simple" size="sm">
                            <Thead position="sticky" top={0} bg="gray.800" zIndex={1}>
                                <Tr>
                                    <Th color="gray.400" borderColor="gray.700">Name</Th>
                                    <Th color="gray.400" borderColor="gray.700">Type</Th>
                                    <Th color="gray.400" borderColor="gray.700">Rarity</Th>
                                    <Th color="gray.400" borderColor="gray.700">Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {filteredItems.length === 0 ? (
                                    <Tr>
                                        <Td colSpan={4} textAlign="center" color="gray.500" py={8} borderColor="gray.700">
                                            No items found matching your criteria.
                                        </Td>
                                    </Tr>
                                ) : (
                                    filteredItems.map(item => (
                                        <Tr key={item.id} _hover={{ bg: 'gray.750' }} borderColor="gray.700">
                                            <Td color="gray.200" borderColor="gray.700" fontWeight="medium">{item.name || 'Unnamed Item'}</Td>
                                            <Td borderColor="gray.700"><Badge variant="outline" colorScheme="gray">{item.itemType || 'N/A'}</Badge></Td>
                                            <Td borderColor="gray.700">
                                                <Badge colorScheme={getRarityColor(item.rarity)}>
                                                    {item.rarity || 'Common'}
                                                </Badge>
                                            </Td>
                                            <Td borderColor="gray.700">
                                                <HStack spacing={1}>
                                                    {/* <IconButton
                                                        aria-label="View Details"
                                                        icon={<Eye size={16} />}
                                                        size="xs"
                                                        variant="ghost"
                                                        onClick={() => onViewItemDetails(item)} // Assuming you add this prop/modal
                                                        colorScheme="blue"
                                                    /> */}
                                                    <IconButton
                                                        aria-label="Edit Item"
                                                        icon={<Edit size={16} />}
                                                        size="xs"
                                                        variant="ghost"
                                                        onClick={() => onSelectItemForEdit(item)}
                                                        colorScheme="yellow"
                                                    />
                                                    <IconButton
                                                        aria-label="Delete Item"
                                                        icon={<Trash size={16} />}
                                                        size="xs"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteItem(item)}
                                                        colorScheme="red"
                                                    />
                                                </HStack>
                                            </Td>
                                        </Tr>
                                    ))
                                )}
                            </Tbody>
                        </Table>
                    </TableContainer>
                </ScrollArea>
            )}
        </VStack>
    );
};

export default DMItemCatalogBrowser;