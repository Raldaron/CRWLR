import React from 'react'; // Remove useState, useEffect
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  VStack,
  Badge,
  Box,
  // Remove Spinner,
  Divider,
  SimpleGrid,
  HStack,
  // Remove Button,
} from '@chakra-ui/react';
import { Star, Clock, Zap } from 'lucide-react';

// Use the detailed AbilityData interface
interface AbilityData {
    id?: string;
    name: string;
    description: string;
    effect: string;
    range: string;
    damage: string;
    damageType: string;
    scaling: { [key: string]: string };
    abilitypointcost: number;
    cooldown: string;
    specialrules?: Record<string, string>;
}

// --- FIX: Change prop name and type ---
interface AbilityDetailModalProps {
  ability: AbilityData | null; // Expect the full object or null
  isOpen: boolean;
  onClose: () => void;
}
// ------------------------------------

const AbilityDetailModal: React.FC<AbilityDetailModalProps> = ({
  ability, // Use the ability prop
  isOpen,
  onClose
}) => {

  // --- FIX: Remove internal fetching state and useEffect ---
  // const [ability, setAbility] = useState<Ability | null>(null);
  // const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  // useEffect(() => { /* ... remove this ... */ }, [abilityName, isOpen]);
  // -----------------------------------------------------

  // Fix: Replace /n/n with actual line breaks and apply white-space: pre-wrap
  const formatDescription = (text: string | undefined) => {
    // Replace "/n/n" with actual line breaks if present
    if (!text) return '';
    return text.replace(/\/n\/n/g, '\n\n');
  };

  // Check if the passed ability prop is null
  if (!ability) {
    // Optionally render nothing or a placeholder if the modal is open but ability is null
     if (isOpen) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} size="lg">
                <ModalOverlay />
                <ModalContent bg="gray.800" borderColor="gray.700">
                    <ModalHeader color="gray.100">Ability Details</ModalHeader>
                    <ModalCloseButton color="gray.400"/>
                    <ModalBody pb={6}><Text color="gray.400">No ability data provided.</Text></ModalBody>
                </ModalContent>
            </Modal>
        );
     }
     return null; // Don't render if not open
  }


  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="gray.800" borderColor="gray.700">
        <ModalHeader>
           {/* Use the ability prop directly */}
           <VStack align="start" spacing={2}>
             <Box display="flex" alignItems="center" gap={2}>
               <Star size={18} className="text-purple-400" /> {/* Adjusted color */}
               <Text color="gray.100">{ability.name}</Text>
             </Box>
             <Badge colorScheme="purple">Ability</Badge>
           </VStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400"/>
        <ModalBody pb={6}>
           {/* Use the ability prop directly */}
           <VStack align="start" spacing={4}>
             <Box>
               <Text fontWeight="semibold" mb={1} color="gray.300">Description</Text>
               <Text whiteSpace="pre-wrap" color="gray.400">
                 {formatDescription(ability.description)}
               </Text>
             </Box>

             {ability.effect && ability.effect !== '-' && ability.effect !== 'N/A' && ( // Check effect
                <>
                <Divider borderColor="gray.600"/>
                <Box>
                    <Text fontWeight="semibold" mb={1} color="gray.300">Effect</Text>
                    <Text whiteSpace="pre-wrap" color="gray.400">{formatDescription(ability.effect)}</Text>
                </Box>
                </>
             )}

             <SimpleGrid columns={2} spacing={4} width="100%">
               {ability.range && ability.range !== '-' && ability.range !== 'N/A' && (
                 <Box>
                   <Text fontWeight="semibold" color="gray.300">Range</Text>
                   <Text color="gray.400">{ability.range}</Text>
                 </Box>
               )}
               {ability.damage && ability.damage !== "N/A" && (
                 <Box>
                   <Text fontWeight="semibold" color="gray.300">Damage</Text>
                   <Text color="gray.400">{ability.damage} {ability.damageType}</Text>
                 </Box>
               )}
                {/* Display cost and cooldown */}
                 <Box>
                   <Text fontWeight="semibold" color="gray.300">AP Cost</Text>
                   <Text color="gray.400">{ability.abilitypointcost}</Text>
                 </Box>
                 <Box>
                   <Text fontWeight="semibold" color="gray.300">Cooldown</Text>
                   <Text color="gray.400">{ability.cooldown}</Text>
                 </Box>
             </SimpleGrid>


             {/* Special Rules Section (if present in the ability data) */}
             {ability.specialrules && Object.keys(ability.specialrules).length > 0 && (
               <>
                 <Divider borderColor="gray.600"/>
                 <Box width="100%">
                   <Text fontWeight="semibold" mb={2} color="gray.300">Special Rules</Text>
                   <VStack align="start" spacing={1}>
                     {Object.entries(ability.specialrules).map(([key, rule]) => (
                       <Text key={key} fontSize="sm" color="gray.400">{key}. {rule}</Text>
                     ))}
                   </VStack>
                 </Box>
               </>
             )}
           </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AbilityDetailModal;