import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,        // Keep VStack
  HStack,        // Keep HStack
  Text as ChakraText, // <-- Import Text with an alias
  Badge,         // Keep Badge
  Divider,       // Keep Divider
  SimpleGrid,    // Keep SimpleGrid
  Box,           // Keep Box
  Icon,          // Keep Icon
} from '@chakra-ui/react'; // <-- Make sure Text is imported from here
import { Star, Clock, Zap, Target } from 'lucide-react'; // Icons remain the same

// Use the detailed AbilityData interface
interface AbilityData {
    id?: string;
    name: string;
    description: string;
    effect: string;
    range: string;
    damage: string;
    damageType: string; // Ensure this is camelCase
    scaling: { [key: string]: string };
    abilitypointcost: number;
    cooldown: string;
    specialrules?: Record<string, string>;
}

interface AbilityDetailModalProps {
  ability: AbilityData | null;
  isOpen: boolean;
  onClose: () => void;
}

const AbilityDetailModal: React.FC<AbilityDetailModalProps> = ({
  ability,
  isOpen,
  onClose
}) => {

  const formatDescription = (text: string | undefined) => {
    if (!text) return '';
    return text.replace(/\/n\/n/g, '\n\n');
  };

  if (!ability) {
     if (isOpen) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} size="lg">
                <ModalOverlay />
                <ModalContent bg="gray.800" borderColor="gray.700">
                    <ModalHeader color="gray.100">Ability Details</ModalHeader>
                    <ModalCloseButton color="gray.400"/>
                    {/* Use the aliased ChakraText */}
                    <ModalBody pb={6}><ChakraText color="gray.400">No ability data provided.</ChakraText></ModalBody>
                </ModalContent>
            </Modal>
        );
     }
     return null;
  }


  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="gray.800" borderColor="gray.700">
        <ModalHeader>
           <VStack align="start" spacing={2}>
             <Box display="flex" alignItems="center" gap={2}>
               <Star size={18} className="text-purple-400" />
               {/* Use the aliased ChakraText */}
               <ChakraText color="gray.100">{ability.name}</ChakraText>
             </Box>
             <Badge colorScheme="purple">Ability</Badge>
           </VStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400"/>
        <ModalBody pb={6}>
           <VStack align="start" spacing={4}>
             <Box>
               {/* Use the aliased ChakraText */}
               <ChakraText fontWeight="semibold" mb={1} color="gray.300">Description</ChakraText>
               <ChakraText whiteSpace="pre-wrap" color="gray.400">
                 {formatDescription(ability.description)}
               </ChakraText>
             </Box>

             {ability.effect && ability.effect !== '-' && ability.effect !== 'N/A' && (
                <>
                <Divider borderColor="gray.600"/>
                <Box>
                    {/* Use the aliased ChakraText */}
                    <ChakraText fontWeight="semibold" mb={1} color="gray.300">Effect</ChakraText>
                    <ChakraText whiteSpace="pre-wrap" color="gray.400">{formatDescription(ability.effect)}</ChakraText>
                </Box>
                </>
             )}

             <SimpleGrid columns={2} spacing={4} width="100%">
               {ability.range && ability.range !== '-' && ability.range !== 'N/A' && (
                 <Box>
                   {/* Use the aliased ChakraText */}
                   <ChakraText fontWeight="semibold" color="gray.300">Range</ChakraText>
                   <ChakraText color="gray.400">{ability.range}</ChakraText>
                 </Box>
               )}
               {ability.damage && ability.damage !== "N/A" && (
                 <Box>
                   {/* Use the aliased ChakraText */}
                   <ChakraText fontWeight="semibold" color="gray.300">Damage</ChakraText>
                   <ChakraText color="gray.400">{ability.damage} {ability.damageType}</ChakraText>
                 </Box>
               )}
                 <Box>
                   {/* Use the aliased ChakraText */}
                   <ChakraText fontWeight="semibold" color="gray.300">AP Cost</ChakraText>
                   <ChakraText color="gray.400">{ability.abilitypointcost}</ChakraText>
                 </Box>
                 <Box>
                   {/* Use the aliased ChakraText */}
                   <ChakraText fontWeight="semibold" color="gray.300">Cooldown</ChakraText>
                   <ChakraText color="gray.400">{ability.cooldown}</ChakraText>
                 </Box>
             </SimpleGrid>


             {ability.specialrules && Object.keys(ability.specialrules).length > 0 && (
               <>
                 <Divider borderColor="gray.600"/>
                 <Box width="100%">
                   {/* Use the aliased ChakraText */}
                   <ChakraText fontWeight="semibold" mb={2} color="gray.300">Special Rules</ChakraText>
                   <VStack align="start" spacing={1}>
                     {Object.entries(ability.specialrules).map(([key, rule]) => (
                       // Use the aliased ChakraText
                       <ChakraText key={key} fontSize="sm" color="gray.400">{key}. {rule}</ChakraText>
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