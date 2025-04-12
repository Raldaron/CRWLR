'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    SimpleGrid,
    Spinner,
    useToast,
    Heading,
    Badge,
    Divider,
    Center,
    Alert,
    AlertIcon,
    Icon,
    Tooltip,
    List,
    ListItem,
} from '@chakra-ui/react';
import { Search, CheckCircle, XCircle, Wrench, HelpCircle } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import DarkThemedCard from '@/components/ui/DarkThemedCard';
import type { InventoryItem } from '@/types/inventory';
import { collection, getDocs, query, limit, doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext'; // Import auth context

// Interfaces
interface RecipeComponentRequirement { 
    id: string; 
    quantity: number; 
    name?: string; 
}

interface RecipeDefinition {
    id: string; 
    name: string; 
    itemType: 'Recipe'; 
    rarity?: string;
    craftedItemId: string; 
    requiredComponents: RecipeComponentRequirement[];
    craftedItemName?: string; 
    craftedItemRarity?: string;
}

interface CatalogItem extends InventoryItem { 
    id: string; 
    collectionName?: string; 
}

interface CraftableRecipe {
    recipeDefinition: RecipeDefinition; 
    isKnown: boolean; 
    canCraft: boolean;
    missingComponents: RecipeComponentRequirement[];
    craftedItemDetails: CatalogItem | null;
}

// Helper Functions
const getRarityColor = (rarity?: string): string => {
    switch (rarity?.toLowerCase()) { 
        case 'common': return 'gray'; 
        case 'uncommon': return 'green'; 
        case 'rare': return 'blue'; 
        case 'epic': return 'purple'; 
        case 'legendary': return 'orange'; 
        case 'celestial': return 'pink'; 
        default: return 'gray'; 
    }
};

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

async function findCraftedItemInfo(itemId: string): Promise<{ name: string; rarity: string; } | null> {
    if (!itemId || typeof itemId !== 'string') { 
        return null; 
    }
    
    try {
        const possibleCollections = [
            'weapons', 'armor', 'ammunition', 'potions', 'scrolls', 
            'crafting_components', 'traps', 'explosives', 
            'miscellaneous_items', 'pharmaceuticals'
        ];
        
        for (const collectionName of possibleCollections) { 
            try { 
                const itemRef = doc(db, collectionName, itemId); 
                const itemSnap = await getDoc(itemRef); 
                
                if (itemSnap.exists()) { 
                    const data = itemSnap.data() as DocumentData; 
                    return { 
                        name: data?.name || 'Unknown', 
                        rarity: data?.rarity || 'Common' 
                    }; 
                } 
            } catch (error) { 
                // Continue to next collection
            } 
        }
    } catch (error) {
        console.error("Error finding crafted item:", error);
    }
    
    console.warn(`Crafted item ID ${itemId} not found`); 
    return null;
}

const Crafting: React.FC = () => {
    const {
        inventory,
    addItemsWithQuantity,
    removeItems,
    getItemQuantity,
    craftItem, // Make sure this is here!
    saveCharacterManually
  } = useCharacter();
    
    const { currentUser } = useAuth(); // Get current user
    const toast = useToast();

    // State
    const [allRecipeDefinitions, setAllRecipeDefinitions] = useState<RecipeDefinition[]>([]);
    const [itemCatalog, setItemCatalog] = useState<CatalogItem[]>([]);
    const [craftableRecipes, setCraftableRecipes] = useState<CraftableRecipe[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<CraftableRecipe | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'known' | 'craftable'>('known');
    const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
    const [isCrafting, setIsCrafting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isLoading = isLoadingRecipes || isLoadingCatalog;

    // Load Catalog Items
    const loadCatalog = useCallback(async () => {
        if (!currentUser) {
            setError("You must be logged in to access the crafting system");
            setIsLoadingCatalog(false);
            return;
        }
        
        setIsLoadingCatalog(true);
        setError(null);
        
        const itemCollections = [
            'weapons', 'armor', 'ammunition', 'potions', 'scrolls', 
            'crafting_components', 'traps', 'explosives', 
            'miscellaneous_items', 'pharmaceuticals'
        ];
        
        let allFetchedItems: CatalogItem[] = []; 
        
        try { 
            for (const c of itemCollections) { 
                try {
                    const ref = collection(db, c); 
                    const q = query(ref, limit(1000)); 
                    const snap = await getDocs(q); 
                    
                    const items = snap.docs.map(d => ({ 
                        id: d.id, 
                        collectionName: c, 
                        ...d.data(), 
                        itemType: d.data().itemType || getItemTypeFromCollectionName(c), 
                        rarity: d.data().rarity || 'Common' 
                    } as CatalogItem)); 
                    
                    allFetchedItems.push(...items); 
                } catch (collectionError) {
                    // Log the error but continue with other collections
                    console.warn(`Error fetching collection ${c}:`, collectionError);
                }
            } 
            
            const unique = Array.from(new Map(allFetchedItems.map(i => [i.id, i])).values()); 
            unique.sort((a, b) => (a.name || '').localeCompare(b.name || '')); 
            
            setItemCatalog(unique); 
        } catch (e) { 
            console.error("Error loading item catalog:", e);
            setError("Failed to load item catalog. Please try again later.");
            toast({
                title: 'Error Loading Items', 
                description: 'Check your network connection and try again.', 
                status: 'error',
                duration: 5000
            }); 
        } finally { 
            setIsLoadingCatalog(false); 
        }
    }, [currentUser, toast]);

    // Load Recipes
    const loadRecipes = useCallback(async () => {
        if (!currentUser) {
            setError("You must be logged in to access the crafting system");
            setIsLoadingRecipes(false);
            return;
        }
        
        setIsLoadingRecipes(true);
        setError(null);
        
        try {
            const ref = collection(db, 'recipeComponents');
            const snap = await getDocs(ref);
            const promises: Promise<RecipeDefinition|null>[] = [];
            
            snap.forEach(d => {
                const data = d.data() as DocumentData;
                const id = d.id;
                promises.push((async(): Promise<RecipeDefinition|null> => {
                    try {
                        if (data.name && data.itemType?.toLowerCase()==='recipe' && data.craftedItemId) {
                            const comps: RecipeComponentRequirement[] = [];
                            for (let i=1; i<=6; i++) {
                                if (data[`component${i}Id`]) {
                                    // Convert quantity to number safely
                                    const quantity = data[`component${i}Quantity`] ? 
                                        parseInt(String(data[`component${i}Quantity`]), 10) || 1 : 1;
                                    
                                    comps.push({
                                        id: data[`component${i}Id`],
                                        quantity: quantity
                                    });
                                }
                            }
                            
                            const info = await findCraftedItemInfo(data.craftedItemId);
                            
                            return {
                                id, 
                                name: data.name, 
                                itemType: 'Recipe', 
                                rarity: data.rarity || 'Common',
                                craftedItemId: data.craftedItemId,
                                requiredComponents: comps,
                                craftedItemName: info?.name || 'Unknown',
                                craftedItemRarity: info?.rarity || 'Common'
                            };
                        } else {
                            return null;
                        }
                    } catch (recipeError) {
                        console.warn(`Error processing recipe ${id}:`, recipeError);
                        return null;
                    }
                })());
            });
            
            const resolved = await Promise.all(promises);
            const valid = resolved.filter((r): r is RecipeDefinition => r !== null);
            valid.sort((a,b) => a.name.localeCompare(b.name));
            
            setAllRecipeDefinitions(valid);
            setError(null);
        } catch (e) {
            console.error("Error loading recipes:", e);
            setError("Failed to load recipes. Please try again later.");
            toast({
                title: 'Recipe Loading Error', 
                description: 'Unable to load recipes. Please try again.',
                status: 'error',
                duration: 5000
            });
        } finally {
            setIsLoadingRecipes(false);
        }
    }, [currentUser, toast]);

    // Effect to load data
    useEffect(() => { 
        if (currentUser) {
            loadRecipes(); 
            loadCatalog(); 
        } else {
            setError("You must be logged in to access the crafting system");
            setIsLoadingRecipes(false);
            setIsLoadingCatalog(false);
        }
    }, [loadRecipes, loadCatalog, currentUser]);

    // Get Item Details
    const getItemDetails = useCallback((itemIdOrName: string): CatalogItem | undefined => {
        const term = itemIdOrName?.toLowerCase(); 
        if (!term) return undefined; 
        
        return itemCatalog.find(item => item.id === itemIdOrName) || 
               itemCatalog.find(item => item.name?.toLowerCase() === term);
    }, [itemCatalog]);

    // Calculate Craftable Recipes
    useEffect(() => {
        if (isLoadingRecipes || isLoadingCatalog || !inventory || itemCatalog.length === 0) { 
            return; 
        }
        
        try {
            const playerRecipeIds = new Set(
                inventory
                    .filter(inv => inv.item.itemType?.toLowerCase() === 'recipe')
                    .map(inv => inv.item.id)
            );
            
            const calculated: CraftableRecipe[] = allRecipeDefinitions.map(recipeDef => { 
                const isKnown = playerRecipeIds.has(recipeDef.id); 
                let canCraft = isKnown; 
                const missingComponents: RecipeComponentRequirement[] = []; 
                let craftedItemDetails: CatalogItem | null = getItemDetails(recipeDef.craftedItemId) || null; 
                
                if (isKnown && !craftedItemDetails) { 
                    console.warn(`Details missing for ${recipeDef.craftedItemId}`); 
                    canCraft = false; 
                } else if (isKnown && craftedItemDetails) { 
                    for (const reqComp of recipeDef.requiredComponents) { 
                        const available = getItemQuantity(reqComp.id); 
                        const compDetails = getItemDetails(reqComp.id); 
                        
                        if (available < reqComp.quantity) { 
                            canCraft = false; 
                            missingComponents.push({ 
                                ...reqComp, 
                                name: compDetails?.name || reqComp.id, 
                                quantity: reqComp.quantity - available 
                            }); 
                        } 
                    } 
                } else { 
                    canCraft = false; 
                }
                
                return { 
                    recipeDefinition: recipeDef, 
                    isKnown, 
                    canCraft, 
                    missingComponents, 
                    craftedItemDetails 
                }; 
            });
            
            setCraftableRecipes(calculated);
            
            // Maintain selection if possible
            let currentSelectionStillValid = false; 
            if (selectedRecipe) { 
                currentSelectionStillValid = calculated.some(
                    cr => cr.recipeDefinition?.id === selectedRecipe.recipeDefinition?.id
                ); 
            } 
            
            if (!currentSelectionStillValid && calculated.length > 0) { 
                const first = calculated.find(cr => cr.canCraft) || 
                             calculated.find(cr => cr.isKnown) || 
                             calculated[0]; 
                             
                if (first) setSelectedRecipe(first); 
            }
        } catch (error) {
            console.error("Error calculating craftable recipes:", error);
            setError("Failed to process recipe data. Please try refreshing the page.");
        }
    }, [allRecipeDefinitions, inventory, isLoadingRecipes, isLoadingCatalog, itemCatalog.length, getItemQuantity, getItemDetails, selectedRecipe]);

    // Filter and sort recipes
    const filteredAndSortedRecipes = useMemo(() => {
        if (!craftableRecipes.length) return [];
        
        try {
            return craftableRecipes
                .filter(cr => {
                    if (!cr.recipeDefinition) return false;
                    
                    // Filter by status
                    if (filterStatus === 'known' && !cr.isKnown) return false;
                    if (filterStatus === 'craftable' && (!cr.isKnown || !cr.canCraft)) return false;
                    
                    // Filter by search term
                    if (searchTerm) {
                        const term = searchTerm.toLowerCase();
                        const matchesCraftedName = cr.craftedItemDetails?.name?.toLowerCase().includes(term);
                        const matchesRecipeName = cr.recipeDefinition.name?.toLowerCase().includes(term);
                        
                        if (!matchesCraftedName && !matchesRecipeName) {
                            // Check components
                            const hasMatchingComponent = cr.recipeDefinition.requiredComponents.some(comp => 
                                (getItemDetails(comp.id)?.name || '').toLowerCase().includes(term)
                            );
                            
                            if (!hasMatchingComponent) return false;
                        }
                    }
                    
                    return true;
                })
                .sort((a, b) => {
                    // First compare if they can be crafted
                    if (a.canCraft !== b.canCraft) {
                        return a.canCraft ? -1 : 1; // Craftable recipes come first
                    }
                    
                    // Then compare if they are known
                    if (a.isKnown !== b.isKnown) {
                        return a.isKnown ? -1 : 1; // Known recipes come before unknown ones
                    }

                    // Finally sort alphabetically
                    if (!a.recipeDefinition || !b.recipeDefinition) return 0;
                    
                    const nameA = a.craftedItemDetails?.name || a.recipeDefinition.name || '';
                    const nameB = b.craftedItemDetails?.name || b.recipeDefinition.name || '';
                    
                    return nameA.localeCompare(nameB);
                });
        } catch (error) {
            console.error("Error filtering recipes:", error);
            return [];
        }
    }, [craftableRecipes, filterStatus, searchTerm, getItemDetails]);

    // Handle crafting
    const handleCraftItem = async () => {
        if (!craftItem) {
          toast({ 
            title: 'Error', 
            description: 'Crafting function unavailable.', 
            status: 'error' 
          }); 
          return; 
        }
        
        if (!selectedRecipe || !selectedRecipe.canCraft || isCrafting || !selectedRecipe.craftedItemDetails) { 
          toast({ title: "Cannot Craft", status: "warning" }); 
          return; 
        }
      
        setIsCrafting(true);
        try {
          const itemsToRemove = selectedRecipe.recipeDefinition.requiredComponents.map(comp => ({
            itemId: comp.id,
            quantity: comp.quantity,
          }));
      
          const craftedItemData: InventoryItem = {
            ...selectedRecipe.craftedItemDetails,
            id: selectedRecipe.craftedItemDetails.id,
            quantity: undefined,
            collectionName: undefined,
          };
      
          // Use the new direct crafting function
          const success = await craftItem(itemsToRemove, craftedItemData);
      
          if (success) {
            toast({
              title: 'Item Crafted!',
              description: `Successfully crafted 1 x ${selectedRecipe.craftedItemDetails.name}.`,
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
      
            setSelectedRecipe(null);
          }
        } catch (error) {
          console.error("Crafting failed:", error);
          toast({ 
            title: 'Crafting Failed', 
            description: error instanceof Error ? error.message : 'Could not craft item.', 
            status: 'error', 
            duration: 5000 
          });
        } finally {
          setIsCrafting(false);
        }
      };

    // Render the recipe list
    const renderRecipeList = () => (
        <VStack spacing={3} align="stretch">
            {filteredAndSortedRecipes.length === 0 ? (
                <Center h="200px" bg="gray.750" borderRadius="md">
                    <Text color="gray.400">No matching recipes found.</Text>
                </Center>
            ) : (
                filteredAndSortedRecipes.map(cr => (
                    <Box key={cr.recipeDefinition.id} opacity={!cr.isKnown ? 0.5 : 1}>
                        <DarkThemedCard 
                            onClick={() => setSelectedRecipe(cr)} 
                            isSelected={selectedRecipe?.recipeDefinition.id === cr.recipeDefinition.id} 
                            isHoverable={true} 
                            borderColor={
                                selectedRecipe?.recipeDefinition.id === cr.recipeDefinition.id 
                                    ? 'brand.400' 
                                    : !cr.isKnown 
                                        ? 'gray.700' 
                                        : cr.canCraft 
                                            ? 'green.600' 
                                            : 'yellow.600'
                            } 
                            p={3}
                        >
                            <HStack justify="space-between">
                                <VStack align="start" spacing={1}>
                                    <Text 
                                        fontWeight="bold" 
                                        color={cr.isKnown ? "gray.100" : "gray.500"} 
                                        fontSize="sm"
                                    >
                                        {cr.craftedItemDetails?.name || cr.recipeDefinition.name || 'Unknown'}
                                    </Text>
                                    <Badge 
                                        colorScheme={getRarityColor(cr.craftedItemDetails?.rarity)} 
                                        fontSize="xs"
                                    >
                                        {cr.craftedItemDetails?.rarity || 'Unknown'}
                                    </Badge>
                                </VStack>
                                <HStack spacing={1}>
                                    {!cr.isKnown && (
                                        <Tooltip label="Recipe Not Known">
                                            <Icon as={HelpCircle} color="gray.500" boxSize={4} />
                                        </Tooltip>
                                    )}
                                    {cr.isKnown && cr.canCraft && (
                                        <Tooltip label="Ready to Craft">
                                            <Icon as={CheckCircle} color="green.400" boxSize={4} />
                                        </Tooltip>
                                    )}
                                    {cr.isKnown && !cr.canCraft && (
                                        <Tooltip label="Missing Components">
                                            <Icon as={XCircle} color="yellow.400" boxSize={4} />
                                        </Tooltip>
                                    )}
                                </HStack>
                            </HStack>
                        </DarkThemedCard>
                    </Box>
                ))
            )}
        </VStack>
    );

    // Render selected recipe details
    const renderRecipeDetails = () => {
        if (!selectedRecipe) { 
            return (
                <Center h="full" bg="gray.750" borderRadius="md">
                    <VStack color="gray.400">
                        <Wrench size={32} />
                        <Text>Select a recipe</Text>
                    </VStack>
                </Center>
            );
        }
        
        if (!selectedRecipe.craftedItemDetails) { 
            return (
                <Center h="full" bg="gray.750" borderRadius="md">
                    <VStack color="red.400">
                        <HelpCircle size={32} />
                        <Text>Error: Crafted item details missing.</Text>
                    </VStack>
                </Center>
            );
        }
        
        return (
            <VStack spacing={4} align="stretch" h="full">
                <HStack justifyContent="space-between" alignItems="center">
                    <VStack spacing={1} align="start">
                        <Heading size="md" color="gray.100">
                            {selectedRecipe.craftedItemDetails.name}
                        </Heading>
                        <Badge 
                            colorScheme={getRarityColor(selectedRecipe.craftedItemDetails.rarity)} 
                            alignSelf="flex-start"
                        >
                            {selectedRecipe.craftedItemDetails.rarity}
                        </Badge>
                    </VStack>
                    <Button 
                        colorScheme="green" 
                        leftIcon={<Wrench />} 
                        isDisabled={!selectedRecipe.isKnown || !selectedRecipe.canCraft || isCrafting} 
                        isLoading={isCrafting} 
                        onClick={handleCraftItem}
                    > 
                        Craft Item 
                    </Button>
                </HStack>
                
                {selectedRecipe.craftedItemDetails.description && (
                    <Text fontSize="sm" color="gray.300">
                        {selectedRecipe.craftedItemDetails.description}
                    </Text>
                )}
                
                <Divider borderColor="gray.600" />
                
                <Text fontWeight="semibold" color="gray.300">Required Components:</Text>
                
                <ScrollArea className="max-h-[200px] pr-2">
                    <List spacing={2}>
                        {selectedRecipe.recipeDefinition.requiredComponents.map(reqComp => { 
                            const available = getItemQuantity(reqComp.id); 
                            const hasEnough = available >= reqComp.quantity; 
                            const compDetails = getItemDetails(reqComp.id); 
                            
                            return (
                                <ListItem 
                                    key={reqComp.id} 
                                    display="flex" 
                                    justifyContent="space-between" 
                                    alignItems="center"
                                >
                                    <HStack>
                                        <Icon 
                                            as={hasEnough ? CheckCircle : XCircle} 
                                            color={hasEnough ? "green.400" : "red.400"} 
                                            boxSize={4} 
                                        />
                                        <Text color={hasEnough ? "gray.200" : "red.300"}>
                                            {compDetails?.name || reqComp.id}
                                        </Text>
                                    </HStack>
                                    <Text 
                                        color={hasEnough ? "gray.200" : "red.300"} 
                                        fontSize="sm"
                                    >
                                        ({available} / {reqComp.quantity})
                                    </Text>
                                </ListItem>
                            );
                        })}
                    </List>
                </ScrollArea>
                
                { !selectedRecipe.isKnown && (
                    <Alert 
                        status="warning" 
                        borderRadius="md" 
                        bg="yellow.900" 
                        color="yellow.200"
                    >
                        <AlertIcon color="yellow.400" /> 
                        Recipe Not Known - Find "{selectedRecipe.recipeDefinition.name}"!
                    </Alert>
                )}
                
                { selectedRecipe.isKnown && !selectedRecipe.canCraft && (
                    <Alert 
                        status="info" 
                        borderRadius="md" 
                        bg="blue.900" 
                        color="blue.200" 
                        variant="subtle"
                    >
                        <AlertIcon color="blue.400" /> 
                        Missing Components
                        <List ml={6} fontSize="sm">
                            {selectedRecipe.missingComponents.map(mc => (
                                <ListItem key={mc.id}>
                                    - {mc.quantity} × {mc.name || mc.id}
                                </ListItem>
                            ))}
                        </List>
                    </Alert>
                )}
            </VStack>
        );
    };

    // --- Main Render ---
    return (
        <Box p={4}>
            <Heading size="lg" mb={4} color="gray.100">Crafting Station</Heading>
            {isLoading ? (<Center h="400px"><Spinner size="xl" color="brand.400" /></Center>)
             : (
                <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} height={{ base: 'auto', lg: "calc(100vh - 200px)" }}>
                     <Box bg="gray.800" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.700" display="flex" flexDirection="column">
                         <VStack spacing={4} align="stretch" mb={4}>
                             <InputGroup size="sm">
                                <InputLeftElement pointerEvents="none"><Search size={16} color="gray.400" /></InputLeftElement>
                                <Input placeholder="Search recipes/components..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} bg="gray.700" borderColor="gray.600" pl={8}/>
                             </InputGroup>
                             {/* --- FIX: Updated Select options --- */}
                             <Select size="sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'known' | 'craftable')} bg="gray.700" borderColor="gray.600" iconColor="gray.400">
                                <option value="known" style={{backgroundColor: "#2D3748"}}>Known Recipes</option>
                                <option value="craftable" style={{backgroundColor: "#2D3748"}}>Ready to Craft</option>
                             </Select>
                             {/* --- END FIX --- */}
                         </VStack>
                         <Divider borderColor="gray.600" mb={4}/>
                          <Box flexGrow={1} overflow="hidden"><ScrollArea className="h-full pr-2">{renderRecipeList()}</ScrollArea></Box>
                     </Box>
                     <Box gridColumn={{ base: 1, lg: "span 2 / span 2" }} bg="gray.800" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.700">{renderRecipeDetails()}</Box>
                 </SimpleGrid>
              )}
        </Box>
    );
};

export default Crafting;