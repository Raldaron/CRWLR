// src/components/Modals/RecipeDetailModal.tsx
import React, { useMemo } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    VStack,
    HStack,
    Text,
    Badge,
    Divider,
    Box,
    Icon,
    List,
    ListItem,
    Spinner,
    Center,
} from '@chakra-ui/react';
import { BookOpen, CheckCircle, XCircle, Wrench } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming you have this

// Re-use interfaces from Crafting.tsx or define locally
interface RecipeComponentRequirement {
    id: string;
    quantity: number;
    name?: string; // Added for display
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

interface RecipeDetailModalProps {
  recipeItem: InventoryItem | null; // The recipe item from player inventory
  isOpen: boolean;
  onClose: () => void;
  allRecipeDefinitions: RecipeDefinition[]; // Full list of recipes from Firestore/recipeComponents
  itemCatalog: CatalogItem[]; // Full item catalog
  getItemQuantity: (itemId: string) => number; // Function from CharacterContext
}

// Helper function for rarity color
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

// Helper function to find item details in the catalog
const findItemInCatalog = (catalog: CatalogItem[], itemId: string): CatalogItem | undefined => {
    return catalog.find(item => item.id === itemId);
};

const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipeItem,
  isOpen,
  onClose,
  allRecipeDefinitions,
  itemCatalog,
  getItemQuantity,
}) => {

  // Find the full RecipeDefinition using the recipeItem's ID
  const recipeDefinition = useMemo(() => {
    if (!recipeItem) return null;
    return allRecipeDefinitions.find(def => def.id === recipeItem.id);
  }, [recipeItem, allRecipeDefinitions]);

  // Find the details of the item this recipe crafts
  const craftedItemDetails = useMemo(() => {
    if (!recipeDefinition) return null;
    return findItemInCatalog(itemCatalog, recipeDefinition.craftedItemId);
  }, [recipeDefinition, itemCatalog]);

  // Prepare the list of required components with names and available quantities
  const processedComponents = useMemo(() => {
    if (!recipeDefinition) return [];
    return recipeDefinition.requiredComponents.map(reqComp => {
      const details = findItemInCatalog(itemCatalog, reqComp.id);
      const available = getItemQuantity(reqComp.id);
      const hasEnough = available >= reqComp.quantity;
      return {
        ...reqComp,
        name: details?.name || reqComp.id, // Use fetched name or fallback to ID
        available,
        hasEnough,
      };
    });
  }, [recipeDefinition, itemCatalog, getItemQuantity]);

  // Handle loading states or missing data
  if (!isOpen) return null; // Don't render if closed

  if (!recipeItem) {
      // This case might occur briefly if the modal opens before the item prop updates
      return (
           <Modal isOpen={isOpen} onClose={onClose} size="lg">
             <ModalOverlay />
             <ModalContent bg="gray.800"><ModalBody><Center h="200px"><Spinner /></Center></ModalBody></ModalContent>
           </Modal>
      );
  }

  if (!recipeDefinition) {
      return (
           <Modal isOpen={isOpen} onClose={onClose} size="lg">
             <ModalOverlay />
             <ModalContent bg="gray.800" color="gray.100">
               <ModalHeader>Recipe Error</ModalHeader>
               <ModalCloseButton />
               <ModalBody pb={6}>
                 <Text color="red.400">Could not find the definition for this recipe ({recipeItem.name} - ID: {recipeItem.id}). It might be corrupted or removed.</Text>
               </ModalBody>
             </ModalContent>
           </Modal>
      );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)"/>
      <ModalContent bg="gray.800" color="gray.100">
        <ModalHeader borderBottomWidth="1px" borderColor="gray.700">
          <VStack align="start" spacing={1}>
             <HStack><Icon as={BookOpen} color="brand.300"/><Text>{recipeItem.name}</Text></HStack>
             <Badge colorScheme={getRarityColor(recipeItem.rarity)}>{recipeItem.rarity || 'Common'}</Badge>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6} pt={4}>
          <VStack align="stretch" spacing={4}>

            {/* Recipe Description (from the recipe item itself) */}
            {recipeItem.description && (
                <Box>
                     <Text fontWeight="medium" color="gray.300" mb={1}>Description:</Text>
                    <Text fontSize="sm" color="gray.400">{recipeItem.description}</Text>
                </Box>
            )}

            <Divider borderColor="gray.600"/>

            {/* Crafted Item Details */}
            <Box>
              <Text fontWeight="semibold" color="gray.200" mb={2}>Crafts:</Text>
              {craftedItemDetails ? (
                <Box p={3} bg="gray.750" borderRadius="md">
                    <HStack justify="space-between" mb={1}>
                        <Text fontWeight="medium" color="gray.100">{craftedItemDetails.name}</Text>
                        <Badge colorScheme={getRarityColor(craftedItemDetails.rarity)}>{craftedItemDetails.rarity}</Badge>
                    </HStack>
                     <Text fontSize="xs" color="gray.400">{craftedItemDetails.description}</Text>
                    {/* Optionally add more crafted item stats here if needed */}
                 </Box>
              ) : (
                 <Text color="red.400" fontSize="sm">Error: Could not find details for crafted item (ID: {recipeDefinition.craftedItemId}).</Text>
              )}
            </Box>

            <Divider borderColor="gray.600"/>

            {/* Required Components */}
            <Box>
              <Text fontWeight="semibold" color="gray.200" mb={2}>Required Components:</Text>
              {processedComponents.length === 0 ? (
                    <Text fontSize="sm" color="gray.500">No components listed for this recipe.</Text>
                ) : (
                  <ScrollArea className="max-h-[250px] pr-2">
                    <List spacing={2}>
                        {processedComponents.map(comp => (
                        <ListItem key={comp.id} display="flex" justifyContent="space-between" alignItems="center" bg="gray.750" p={2} borderRadius="md">
                            <HStack>
                                <Icon as={comp.hasEnough ? CheckCircle : XCircle} color={comp.hasEnough ? "green.400" : "red.400"} boxSize={4} />
                                <Text color="gray.200">{comp.name}</Text>
                            </HStack>
                            <Text color={comp.hasEnough ? "gray.200" : "red.300"} fontSize="sm">
                                ({comp.available} / {comp.quantity})
                            </Text>
                        </ListItem>
                        ))}
                    </List>
                  </ScrollArea>
                )}
            </Box>

             {/* Footer Note */}
             <Text fontSize="xs" color="gray.500" textAlign="center" pt={2}>
                Go to the Crafting tab to create this item.
             </Text>

          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default RecipeDetailModal;