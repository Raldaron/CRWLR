// components/inventory/InventoryMain.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box, Select, HStack, Text, InputGroup, InputLeftElement, Input, Spinner, Center, useToast, Badge
} from '@chakra-ui/react';
import { Package, Sword, Shield, Crosshair, Beaker, ScrollText, Wrench, Key, Bomb, Search, BookOpen } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';
import InventoryTable from './InventoryTable';
import { ITEM_TYPE_COLUMNS, DEFAULT_COLUMNS } from '../../types/inventory';
import { getColumnValue } from './InventoryHelpers';
import EmptyInventory from './EmptyInventory';
import type { InventoryItem } from '@/types/inventory';
// Import specific item types
import type { WeaponItem } from '@/types/weapon';
import type { ArmorItem } from '@/types/armor';
import type { AmmunitionItem } from '@/types/ammunition';
import type { PotionItem } from '@/types/potion';
import type { ScrollItem } from '@/types/scroll';
import type { TrapItem } from '@/types/trap';
import type { CraftingComponentItem } from '@/types/craftingcomponent';
import type { ExplosiveItem } from '@/types/explosives';
// --- Specific Modal Imports ---
import WeaponDetailModal from '../Modals/WeaponDetailModal';
import ArmorDetailModal from '../Modals/ArmorDetailModal';
import AmmunitionDetailModal from '../Modals/AmmunitionDetailModal';
import PotionDetailModal from '../Modals/PotionDetailModal';
import ImprovedScrollDetailModal from '../Modals/ImprovedScrollDetailModal'; // Import the new modal
import FirestoreScrollDetailModal from '../Modals/FirestoreScrollDetailModal';
import TrapDetailModal from '../Modals/TrapDetailModal';
import CraftingComponentDetailModal from '../Modals/CraftingComponentDetailModal';
import ExplosivesDetailModal from '../Modals/ExplosivesDetailModal';
import RecipeDetailModal from '../Modals/RecipeDetailModal';
// --- End Modal Imports ---
// Firestore imports
import { collection, getDocs, query, limit, doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

// --- Interfaces ---
interface CatalogItem extends InventoryItem { id: string; collectionName?: string; }
interface RecipeComponentRequirement { id: string; quantity: number; }
interface RecipeDefinition {
    id: string; name: string; itemType: 'Recipe'; rarity?: string;
    craftedItemId: string; requiredComponents: RecipeComponentRequirement[];
    craftedItemName?: string; craftedItemRarity?: string;
}
interface CategoryOption { label: string; itemType: string; icon: React.ElementType; }
// --- End Interfaces ---

// --- Helper Function: findCraftedItemInfo ---
async function findCraftedItemInfo(itemId: string): Promise<{ name: string; rarity: string; } | null> {
    if (!itemId || typeof itemId !== 'string') { console.warn("findCraftedItemInfo invalid itemId:", itemId); return null; }
    const possibleCollections = ['weapons', 'armor', 'ammunition', 'potions', 'scrolls', 'crafting_components', 'traps', 'explosives', 'miscellaneous_items', 'pharmaceuticals'];
    for (const collectionName of possibleCollections) { try { const itemRef = doc(db, collectionName, itemId); const itemSnap = await getDoc(itemRef); if (itemSnap.exists()) { const data = itemSnap.data() as DocumentData; return { name: data?.name || 'Unknown Item', rarity: data?.rarity || 'Common' }; } } catch (error) { /* log errors */ } }
    console.warn(`Crafted item ID ${itemId} not found`); return null;
}
// --- End Helper ---

// --- Helper Function: getItemTypeFromCollectionName ---
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

const InventoryMain: React.FC = () => {
    const { inventory, removeFromInventory, getInventoryByType, getItemQuantity } = useCharacter();
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const toast = useToast();

    // --- Single Modal State ---
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    // Data states (Recipe Definitions and Catalog)
    const [allRecipeDefinitions, setAllRecipeDefinitions] = useState<RecipeDefinition[]>([]);
    const [itemCatalog, setItemCatalog] = useState<CatalogItem[]>([]);
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
    const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);

    const isLoading = isLoadingCatalog || isLoadingRecipes;

    // --- Load Catalog and Recipes ---
    const loadCatalog = useCallback(async () => {
        setIsLoadingCatalog(true);
        const itemCollections = ['weapons', 'armor', 'ammunition', 'potions', 'scrolls', 'crafting_components', 'traps', 'explosives', 'miscellaneous_items', 'pharmaceuticals'];
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
            toast({ title: 'Error Loading Catalog', status: 'error' });
        } finally {
            setIsLoadingCatalog(false);
        }
    }, [toast]);

    const loadRecipes = useCallback(async () => {
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
                        const requiredComponents: RecipeComponentRequirement[] = [];
                        for (let i = 1; i <= 6; i++) {
                            if (data[`component${i}Id`]) {
                                requiredComponents.push({
                                    id: data[`component${i}Id`],
                                    quantity: parseInt(String(data[`component${i}Quantity`] || '1'), 10) || 1
                                });
                            }
                        }
                        const craftedInfo = await findCraftedItemInfo(data.craftedItemId);
                        return {
                            id: docId,
                            name: data.name,
                            itemType: 'Recipe',
                            rarity: data.rarity || 'Common',
                            craftedItemId: data.craftedItemId,
                            requiredComponents,
                            craftedItemName: craftedInfo?.name || 'Unknown',
                            craftedItemRarity: craftedInfo?.rarity || 'Common'
                        };
                    } else {
                        console.warn(`Doc ${docId} invalid`);
                        return null;
                    }
                })();

                recipesListPromises.push(recipePromise);
            });

            const resolvedRecipes = await Promise.all(recipesListPromises);
            const validRecipes = resolvedRecipes.filter((r): r is RecipeDefinition => r !== null);
            validRecipes.sort((a, b) => a.name.localeCompare(b.name));
            setAllRecipeDefinitions(validRecipes);
        } catch (error) {
            toast({ title: 'Error Loading Recipes', status: 'error' });
        } finally {
            setIsLoadingRecipes(false);
        }
    }, [toast]);

    useEffect(() => {
        loadCatalog();
        loadRecipes();
    }, [loadCatalog, loadRecipes]);
    // --- End Data Loading ---

    // --- Modal Handlers ---
    const handleViewDetails = useCallback((item: InventoryItem | null) => {
        if (!item || !item.itemType) {
            console.warn("handleViewDetails called with invalid item:", item);
            setSelectedItem(null);
            setIsDetailModalOpen(false);
            return;
        }
        console.log(`Viewing details for: ${item.name} (Type: ${item.itemType})`);
        setSelectedItem(item);
        setIsDetailModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsDetailModalOpen(false);
        setTimeout(() => setSelectedItem(null), 200);
    }, []);

    // --- Filtering and Category Logic ---
    const categoryOptions: CategoryOption[] = useMemo(() => [
        { label: 'All', itemType: 'all', icon: Package },
        { label: 'Weapons', itemType: 'Weapon', icon: Sword },
        { label: 'Armor', itemType: 'Armor', icon: Shield },
        { label: 'Ammunition', itemType: 'Ammunition', icon: Crosshair },
        { label: 'Potions/Pharma', itemType: 'Potion', icon: Beaker },
        { label: 'Scrolls', itemType: 'Scroll', icon: ScrollText },
        { label: 'Crafting', itemType: 'Crafting Component', icon: Wrench },
        { label: 'Recipes', itemType: 'Recipe', icon: BookOpen },
        { label: 'Traps', itemType: 'Trap', icon: Key },
        { label: 'Explosives/Throw', itemType: 'Explosive', icon: Bomb },
        { label: 'Misc', itemType: 'Miscellaneous', icon: Package },
    ], []);

    const getCategoryQuantity = useCallback((itemType: string): number => {
        let itemsInCategory;
        if (itemType === 'all') itemsInCategory = inventory;
        else if (itemType === 'Potion') itemsInCategory = inventory.filter(invItem => invItem.item.itemType === 'Potion' || invItem.item.itemType === 'Pharmaceutical');
        else if (itemType === 'Explosive') itemsInCategory = inventory.filter(invItem => invItem.item.itemType === 'Explosive' || invItem.item.itemType === 'Throwable');
        else itemsInCategory = getInventoryByType(itemType);
        return itemsInCategory.reduce((total, item) => total + item.quantity, 0);
    }, [inventory, getInventoryByType]);

    const displayedItems = useMemo(() => {
        let itemsToFilter = inventory;
        if (activeCategory !== 'all') {
            if (activeCategory === 'Potion') itemsToFilter = inventory.filter(invItem => invItem.item.itemType === 'Potion' || invItem.item.itemType === 'Pharmaceutical');
            else if (activeCategory === 'Explosive') itemsToFilter = inventory.filter(invItem => invItem.item.itemType === 'Explosive' || invItem.item.itemType === 'Throwable');
            else itemsToFilter = getInventoryByType(activeCategory);
        }
        if (searchTerm.trim() !== '') {
            const lowerSearch = searchTerm.toLowerCase();
            itemsToFilter = itemsToFilter.filter(invItem => invItem.item.name.toLowerCase().includes(lowerSearch) || invItem.item.description?.toLowerCase().includes(lowerSearch));
        }
        return itemsToFilter;
    }, [inventory, activeCategory, getInventoryByType, searchTerm]);

    const columns = useMemo(() => {
        if (activeCategory === 'all') return DEFAULT_COLUMNS;
        const categoryKey = activeCategory === 'Pharmaceutical' ? 'Potion' : activeCategory === 'Throwable' ? 'Explosive' : activeCategory;
        return ITEM_TYPE_COLUMNS[categoryKey] || DEFAULT_COLUMNS;
    }, [activeCategory]);
    // --- End Filtering and Category Logic ---

    if (inventory.length === 0 && !isLoading) {
        return (<EmptyInventory title="Your inventory is empty" message="Visit shops or claim loot to get items!" icon={Package} />);
    }

    return (
        <Box width="100%">
            <HStack mb={4} spacing={4}>
                <Select
                    placeholder="Filter by Category"
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    bg="gray.700" borderColor="gray.600" flexShrink={0}
                    width={{ base: '100%', md: '250px' }} size="sm"
                    iconColor="gray.400"
                >
                    {categoryOptions.map((option) => (
                        <option key={option.itemType} value={option.itemType} style={{ backgroundColor: '#2D3748' }}>
                            {option.label} ({getCategoryQuantity(option.itemType)})
                        </option>
                    ))}
                </Select>
                <InputGroup flex={1} size="sm">
                    <InputLeftElement pointerEvents="none" height="32px"><Search className="h-4 w-4 text-gray-400" /></InputLeftElement>
                    <Input placeholder="Search current category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} bg="gray.700" borderColor="gray.600" pl={8} />
                </InputGroup>
            </HStack>

            {isLoading ? (
                <Center h="400px"><Spinner size="xl" color="brand.400" /></Center>
            ) : (
                <InventoryTable
                    items={displayedItems}
                    columns={columns}
                    getColumnValue={(item, column) => getColumnValue(item, column)}
                    onViewDetails={handleViewDetails}
                    onRemoveItem={removeFromInventory}
                />
            )}

            {/* --- Conditional Modal Rendering --- */}
            {isDetailModalOpen && selectedItem && (
                <>
                    {selectedItem.itemType === 'Weapon' && (
                        <WeaponDetailModal
                            weapon={selectedItem as WeaponItem}
                            isOpen={isDetailModalOpen}
                            onClose={handleCloseModal}
                        />
                    )}
                    {selectedItem.itemType === 'Armor' && (
                        <ArmorDetailModal
                            armor={selectedItem as ArmorItem}
                            isOpen={isDetailModalOpen}
                            onClose={handleCloseModal}
                        />
                    )}
                    {selectedItem.itemType === 'Ammunition' && (
                        <AmmunitionDetailModal
                            ammunition={selectedItem as AmmunitionItem}
                            isOpen={isDetailModalOpen}
                            onClose={handleCloseModal}
                        />
                    )}
                    {(selectedItem.itemType === 'Potion' || selectedItem.itemType === 'Pharmaceutical') && (
                        <PotionDetailModal
                            potion={selectedItem as PotionItem}
                            isOpen={isDetailModalOpen}
                            onClose={handleCloseModal}
                        />
                    )}
                    {selectedItem.itemType === 'Scroll' && (
                        <FirestoreScrollDetailModal
                            scroll={selectedItem as ScrollItem}
                            isOpen={isDetailModalOpen}
                            onClose={handleCloseModal}
                        />
                    )}
                    {selectedItem.itemType === 'Trap' && (
                        <TrapDetailModal
                            trap={selectedItem as TrapItem}
                            isOpen={isDetailModalOpen}
                            onClose={handleCloseModal}
                        />
                    )}
                    {selectedItem.itemType === 'Crafting Component' && (
                        <CraftingComponentDetailModal
                            component={selectedItem as CraftingComponentItem}
                            isOpen={isDetailModalOpen}
                            onClose={handleCloseModal}
                        />
                    )}
                    {(selectedItem.itemType === 'Explosive' || selectedItem.itemType === 'Throwable') && (
                        <ExplosivesDetailModal
                            explosive={selectedItem as ExplosiveItem}
                            isOpen={isDetailModalOpen}
                            onClose={handleCloseModal}
                        />
                    )}
                    {selectedItem.itemType === 'Recipe' && (
                        <RecipeDetailModal
                            recipeItem={selectedItem}
                            isOpen={isDetailModalOpen}
                            onClose={handleCloseModal}
                            allRecipeDefinitions={allRecipeDefinitions}
                            itemCatalog={itemCatalog}
                            getItemQuantity={getItemQuantity}
                        />
                    )}
                </>
            )}
        </Box>
    );
};

export default InventoryMain;