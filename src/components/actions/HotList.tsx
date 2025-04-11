'use client';

import React, { useState } from 'react';
import {
    Box,
    SimpleGrid,
    Text,
    VStack,
    // Removed unused imports: Badge, useToast
    Center,
    Badge, // Keep Badge for fallback display if needed
} from '@chakra-ui/react';
import { useCharacter } from '@/context/CharacterContext'; // Import context

// Import ONLY Utility Item Card components
import PotionCard from '@/components/ItemCards/PotionCard';
import ScrollCard from '@/components/ItemCards/ScrollCard';
import ExplosivesCard from '@/components/ItemCards/ExplosivesCard';
import AmmunitionCard from '@/components/ItemCards/AmmunitionCard';
import TrapCard from '@/components/ItemCards/TrapCard';

// Import ONLY Utility Detail Modals
import PotionDetailModal from '@/components/Modals/PotionDetailModal';
import ScrollDetailModal from '@/components/Modals/ScrollDetailModal';
import ExplosivesDetailModal from '@/components/Modals/ExplosivesDetailModal';
import AmmunitionDetailModal from '@/components/Modals/AmmunitionDetailModal';
import TrapDetailModal from '@/components/Modals/TrapDetailModal';

// Import ONLY Utility Item Types and Base InventoryItem
import type { InventoryItem } from '@/types/inventory';
import type { PotionItem } from '@/types/potion';
import type { ScrollItem } from '@/types/scroll';
import type { ExplosiveItem } from '@/types/explosives';
import type { AmmunitionItem } from '@/types/ammunition';
import type { TrapItem } from '@/types/trap';
import DarkThemedCard from '../ui/DarkThemedCard';

const Hotlist: React.FC = () => {
    const {
        utilitySlots, // Get utility slots
    } = useCharacter();
    // Removed unused toast hook

    // --- State ONLY for Utility Item Modal ---
    const [selectedUtilityItem, setSelectedUtilityItem] = useState<InventoryItem | null>(null);
    const [isUtilityModalOpen, setIsUtilityModalOpen] = useState(false);

    // --- Process Utility Slots ---
    const utilityItems = utilitySlots
        .filter(slot => slot.stack !== null)
        .map(slot => ({
            item: slot.stack!.item,
            slotId: slot.id
        }));

    // --- Modal Handlers ONLY for Utility Items ---
    const handleOpenUtilityModal = (item: InventoryItem) => {
        setSelectedUtilityItem(item);
        setIsUtilityModalOpen(true);
    };

    const handleCloseUtilityModal = () => {
        setIsUtilityModalOpen(false);
        // Reset selected items after a short delay
        setTimeout(() => {
            setSelectedUtilityItem(null);
        }, 200);
    };

    // --- Card Rendering Logic for Utility Items ---
    const getUtilityItemCard = (utilityItem: { item: InventoryItem; slotId: string; }) => {
        const { item } = utilityItem;
        // Card click opens details modal
        const handleCardClick = () => handleOpenUtilityModal(item);

        const commonCardProps = {
            item: item as any,
            onClick: handleCardClick, // Main click action is to view details
        };

        switch (item.itemType?.toLowerCase()) {
            case 'potion':
            case 'pharmaceutical':
                return <PotionCard {...commonCardProps} item={item as PotionItem} />;
            case 'scroll':
                return <ScrollCard {...commonCardProps} item={item as ScrollItem} />;
            case 'explosive':
            case 'throwable':
                return <ExplosivesCard {...commonCardProps} item={item as ExplosiveItem} />;
            case 'ammunition':
                return <AmmunitionCard {...commonCardProps} item={item as AmmunitionItem} />;
            case 'trap':
                return <TrapCard {...commonCardProps} item={item as TrapItem} />;
            default:
                console.warn(`Hotlist: No specific card defined for utility itemType "${item.itemType}"`);
                // Fallback display card that opens details
                return (
                    <DarkThemedCard onClick={handleCardClick}>
                         <VStack align="start">
                            <Text fontWeight="bold">{item.name || "Unknown Item"}</Text>
                            <Badge>{item.itemType}</Badge>
                            <Text fontSize="xs" color="gray.400">Click to view details</Text>
                        </VStack>
                    </DarkThemedCard>
                );
        }
    };

    return (
        <Box p={4}> {/* Added padding to the main Box */}
             {/* Utility Items Section */}
             {utilityItems.length > 0 ? (
                 <Box> {/* Removed mb={6} as it's the only section */}
                     <Text fontSize="xl" fontWeight="semibold" mb={4} color="gray.200"> {/* Increased title size and margin */}
                         Utility Belt Items
                     </Text>
                     <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} spacing={4}> {/* Adjusted columns and spacing */}
                         {utilityItems.map((utilItem) => (
                             <Box key={utilItem.item.id + '-' + utilItem.slotId}>
                                 {getUtilityItemCard(utilItem)}
                             </Box>
                         ))}
                     </SimpleGrid>
                 </Box>
             ) : (
                 /* Empty State ONLY for Utility Items */
                 <Center h="200px" bg="gray.800" borderRadius="md" p={6}>
                     <VStack>
                         <Text color="gray.400" fontSize="lg">Utility Belt is Empty</Text>
                         <Text fontSize="sm" color="gray.500">Equip items like potions or scrolls to utility slots.</Text>
                     </VStack>
                 </Center>
             )}

            {/* Utility Item Detail Modals (No changes needed here) */}
             {selectedUtilityItem?.itemType?.toLowerCase() === 'potion' || selectedUtilityItem?.itemType?.toLowerCase() === 'pharmaceutical' ? (
                <PotionDetailModal
                    potion={selectedUtilityItem as PotionItem}
                    isOpen={isUtilityModalOpen}
                    onClose={handleCloseUtilityModal}
                />
            ) : selectedUtilityItem?.itemType?.toLowerCase() === 'scroll' ? (
                <ScrollDetailModal
                    scroll={selectedUtilityItem as ScrollItem}
                    isOpen={isUtilityModalOpen}
                    onClose={handleCloseUtilityModal}
                />
            ) : selectedUtilityItem?.itemType?.toLowerCase() === 'explosive' || selectedUtilityItem?.itemType?.toLowerCase() === 'throwable' ? (
                <ExplosivesDetailModal
                    explosive={selectedUtilityItem as ExplosiveItem}
                    isOpen={isUtilityModalOpen}
                    onClose={handleCloseUtilityModal}
                />
            ) : selectedUtilityItem?.itemType?.toLowerCase() === 'ammunition' ? (
                <AmmunitionDetailModal
                    ammunition={selectedUtilityItem as AmmunitionItem}
                    isOpen={isUtilityModalOpen}
                    onClose={handleCloseUtilityModal}
                />
             ) : selectedUtilityItem?.itemType?.toLowerCase() === 'trap' ? (
                 <TrapDetailModal
                     trap={selectedUtilityItem as TrapItem}
                     isOpen={isUtilityModalOpen}
                     onClose={handleCloseUtilityModal}
                 />
             ) : null}

        </Box>
    );
};

export default Hotlist;