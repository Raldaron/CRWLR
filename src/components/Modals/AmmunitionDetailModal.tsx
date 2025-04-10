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
} from '@chakra-ui/react';
import type { AmmunitionItem, AdditionalEffect } from '@/types/ammunition';
// Import the new component
import TruncatedTextWithModal from '../ui/TruncatedTextWithModal'; // Adjust path if needed

interface AmmunitionDetailModalProps {
  ammunition: AmmunitionItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const AmmunitionDetailModal = ({ ammunition, isOpen, onClose }: AmmunitionDetailModalProps) => {
  if (!ammunition) return null;

  // Function to safely parse additionaleffects JSON string
  const parseAdditionalEffects = (effectsString?: string): AdditionalEffect[] => {
    if (!effectsString) return [];
    try {
      const parsed = JSON.parse(effectsString);
      if (Array.isArray(parsed) && parsed.every(eff => typeof eff === 'object' && eff !== null && 'name' in eff && 'description' in eff)) {
        return parsed as AdditionalEffect[];
      }
      console.warn("Parsed additionaleffects is not in the expected format:", parsed);
      return [];
    } catch (error) {
      console.error("Failed to parse additionaleffects JSON:", error, "String was:", effectsString);
      return [];
    }
  };

  const additionalEffects = parseAdditionalEffects(ammunition.additionaleffects);

  const getRarityColor = (rarity: string) => {
    switch(rarity?.toLowerCase()) {
      case 'ordinary': return 'gray'; case 'common': return 'gray';
      case 'uncommon': return 'green'; case 'rare': return 'blue';
      case 'epic': return 'purple'; case 'legendary': return 'orange';
      case 'very rare': return 'red'; default: return 'gray';
    }
  };

  const getDamageTypeColor = (type?: string) => {
    switch(type?.toLowerCase()) {
      case 'fire': return 'red'; case 'cold': return 'blue';
      case 'lightning': return 'yellow'; case 'acid': return 'green';
      case 'force': return 'purple'; case 'piercing': return 'orange';
      case 'bludgeoning': return 'gray'; default: return 'gray';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Text fontSize="2xl">{ammunition.name}</Text>
            <HStack spacing={2}>
              <Badge colorScheme={getRarityColor(ammunition.rarity)}>
                {ammunition.rarity}
              </Badge>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="start" spacing={4} width="100%">
            {/* Use TruncatedTextWithModal for description */}
            <TruncatedTextWithModal
                text={ammunition.description}
                modalTitle={`${ammunition.name} - Description`}
                charLimit={200} // Adjust limit as needed
            />

            <Divider />

            <SimpleGrid columns={2} spacing={4} width="100%">
              {ammunition.range && ( <Box> <Text fontWeight="semibold">Range</Text> <Text>{ammunition.range}</Text> </Box> )}
              {ammunition.blastRadius && ( <Box> <Text fontWeight="semibold">Blast Radius</Text> <Text>{ammunition.blastRadius}</Text> </Box> )}
              {ammunition.duration && ( <Box> <Text fontWeight="semibold">Duration</Text> <Text>{ammunition.duration}</Text> </Box> )}
            </SimpleGrid>

             {(ammunition.range || ammunition.blastRadius || ammunition.duration) && <Divider />}

            <Box width="100%">
              <Text fontWeight="semibold" mb={2}>Damage</Text>
              <HStack>
                <Text fontSize="lg" fontWeight="bold">{ammunition.damageAmount}</Text>
                {ammunition.damageType && ( <Badge colorScheme={getDamageTypeColor(ammunition.damageType)}> {ammunition.damageType} </Badge> )}
              </HStack>
            </Box>

            {/* Use TruncatedTextWithModal for effect */}
            {ammunition.effect && (
                <>
                 <Divider />
                 <Box width="100%">
                    <TruncatedTextWithModal
                        label="Effect"
                        text={ammunition.effect}
                        modalTitle={`${ammunition.name} - Effect`}
                        charLimit={180} // Adjust limit as needed
                    />
                </Box>
                </>
            )}


            {additionalEffects.length > 0 && (
              <Box width="100%">
                 <Divider />
                <Text fontWeight="semibold" mb={2} mt={4}>Additional Effects</Text>
                <VStack align="start" spacing={2}>
                  {additionalEffects.map((effect, index) => (
                    <Box key={index} p={3} bg="gray.50" borderRadius="md" w="full">
                      <Text fontWeight="semibold">{effect.name}</Text>
                      {/* Use TruncatedTextWithModal for effect description */}
                       <TruncatedTextWithModal
                            text={effect.description}
                            modalTitle={`${effect.name} - Description`}
                            charLimit={100} // Shorter limit for nested descriptions
                       />
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}

            {ammunition.triggerMechanism && (
                 <>
                 <Divider />
                 <Box width="100%" mt={4}>
                    <Text fontWeight="semibold" mb={2}>Trigger Mechanism</Text>
                    <Text>{ammunition.triggerMechanism}</Text>
                 </Box>
                </>
            )}

            {Array.isArray(ammunition.abilities) && ammunition.abilities.length > 0 && (
              <>
                <Divider />
                <Box width="100%" mt={4}>
                  <Text fontWeight="semibold" mb={2}>Abilities</Text>
                  <VStack align="start">
                    {ammunition.abilities.map((ability, index) => (
                      ability && <Text key={index}>{ability}</Text>
                    ))}
                  </VStack>
                </Box>
              </>
            )}


            {(ammunition.sellValue !== undefined || ammunition.buyValue !== undefined) && (
                <>
                 <Divider />              
                </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AmmunitionDetailModal;