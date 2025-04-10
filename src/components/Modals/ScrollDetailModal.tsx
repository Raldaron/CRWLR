import React from 'react';
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
  SimpleGrid,
  Box,
  Icon, // Added Icon
} from '@chakra-ui/react';
import { Clock, Crosshair, Zap, Sun, Info } from 'lucide-react'; // Added Zap, Sun, Info
import type { ScrollItem } from '../../types/scroll'; // Ensure path is correct
// Import the new component
import TruncatedTextWithModal from '../ui/TruncatedTextWithModal'; // Adjust path if needed

interface ScrollDetailModalProps {
  scroll: ScrollItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const ScrollDetailModal = ({ scroll, isOpen, onClose }: ScrollDetailModalProps) => {
  if (!scroll) return null;

  const getRarityColor = (rarity: string) => {
    switch(rarity?.toLowerCase()) { // Safety check
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      default: return 'gray';
    }
  };

   const getDamageTypeColor = (type?: string) => { // Safety check
    switch(type?.toLowerCase()) {
      case 'fire': return 'red'; case 'cold': return 'blue';
      case 'lightning': return 'yellow'; case 'acid': return 'green';
      case 'force': return 'purple'; case 'piercing': return 'orange';
      case 'bludgeoning': return 'gray'; case 'radiant': return 'yellow';
      case 'necrotic': return 'purple'; // Add more as needed
      default: return 'gray';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Text fontSize="2xl">{scroll.name}</Text>
            <HStack spacing={2}>
              <Badge colorScheme={getRarityColor(scroll.rarity)}>
                {scroll.rarity}
              </Badge>
               <Badge variant="outline">Scroll</Badge>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="start" spacing={4} width="100%">
             {/* Use TruncatedTextWithModal for description */}
             <TruncatedTextWithModal
                 text={scroll.description}
                 modalTitle={`${scroll.name} - Description`}
                 charLimit={200}
             />

            <Divider />

            <SimpleGrid columns={2} spacing={4} width="100%">
              {scroll.castingTime && scroll.castingTime !== 'N/A' && (
                <HStack><Icon as={Clock} size={16}/><Text fontWeight="semibold">Cast Time:</Text><Text>{scroll.castingTime}</Text></HStack>
              )}
              {scroll.manaPointCost && scroll.manaPointCost !== 'N/A' && (
                <HStack><Icon as={Zap} size={16} color="blue.400"/><Text fontWeight="semibold">Mana Cost:</Text><Text>{scroll.manaPointCost}</Text></HStack>
              )}
              {scroll.cooldown && scroll.cooldown !== 'N/A' && (
                <HStack><Icon as={Clock} size={16}/><Text fontWeight="semibold">Cooldown:</Text><Text>{scroll.cooldown}</Text></HStack>
              )}
              {scroll.range && scroll.range !== 'N/A' && (
                <HStack><Icon as={Crosshair} size={16}/><Text fontWeight="semibold">Range:</Text><Text>{scroll.range}</Text></HStack>
              )}
               {scroll.spellCastingModifier && scroll.spellCastingModifier !== 'N/A' && (
                <HStack><Icon as={Sun} size={16} color="yellow.400"/><Text fontWeight="semibold">Modifier:</Text><Text>{scroll.spellCastingModifier}</Text></HStack>
              )}
            </SimpleGrid>

             <Divider />

            {/* Use TruncatedTextWithModal for effect */}
            {scroll.effect && (
                 <Box width="100%">
                     <TruncatedTextWithModal
                        label="Effect"
                        text={scroll.effect}
                        modalTitle={`${scroll.name} - Effect`}
                        charLimit={180}
                     />
                 </Box>
             )}

             {/* Display Damage if present */}
             {scroll.damageAmount && scroll.damageAmount !== 'N/A' && (
                 <>
                 <Divider />
                 <Box width="100%" mt={4}>
                     <Text fontWeight="semibold" mb={1}>Damage</Text>
                     <HStack>
                         <Text fontSize="lg" fontWeight="bold">{scroll.damageAmount}</Text>
                         {scroll.damageType && scroll.damageType !== 'N/A' && (
                             <Badge colorScheme={getDamageTypeColor(scroll.damageType)}>
                                 {scroll.damageType}
                             </Badge>
                         )}
                     </HStack>
                 </Box>
                 </>
             )}

            {/* Display Scaling if present */}
            {scroll.scaling && Object.keys(scroll.scaling).length > 0 && (
              <>
                <Divider />
                <Box width="100%" mt={4}>
                  <Text fontWeight="semibold" mb={2}>Scaling</Text>
                  <VStack align="start" spacing={1}>
                    {Object.entries(scroll.scaling).map(([level, effect]) => (
                      <Text key={level} fontSize="sm"><Badge mr={2}>{level}</Badge>{effect}</Text>
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

export default ScrollDetailModal;