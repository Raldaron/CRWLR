// src/components/ItemCards/AbilityCard.tsx
import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    Icon,
} from '@chakra-ui/react';
import { Star } from 'lucide-react'; // Using Star as a generic ability icon
import DarkThemedCard from '@/components/ui/DarkThemedCard'; // Assuming path is correct

interface AbilityCardProps {
    abilityName: string; // Currently passing only the name from Hotlist
    // We might add full AbilityData later if Hotlist fetches it
    // abilityData?: AbilityData;
    onClick: () => void; // Function to call when card is clicked
    isSelected?: boolean; // Optional: for styling if needed
}

export const AbilityCard: React.FC<AbilityCardProps> = ({
    abilityName,
    onClick,
    isSelected = false,
}) => {
    return (
        <DarkThemedCard
            onClick={onClick}
            isSelected={isSelected}
            borderColor={isSelected ? "brand.400" : "purple.800"} // Use purple theme for abilities
            _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
                borderColor: "purple.600"
            }}
            height="120px" // Consistent height with other cards if desired
        >
            <VStack spacing={2} align="start" justify="space-between" h="full">
                <HStack width="full" justify="space-between">
                    <HStack spacing={2}>
                        <Icon as={Star} color="purple.400" boxSize={4}/>
                        <Text fontWeight="bold" color="gray.200" noOfLines={1}>
                            {abilityName}
                        </Text>
                    </HStack>
                    {/* Optional: Add an icon or indicator */}
                </HStack>

                {/* Placeholder for a short description or effect if available */}
                {/* <Text fontSize="xs" color="gray.400" noOfLines={2}>
                    Click to view details...
                </Text> */}

                <Badge colorScheme="purple" variant="subtle" alignSelf="flex-start">
                    Ability
                </Badge>
            </VStack>
        </DarkThemedCard>
    );
};

export default AbilityCard;