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
import { Bomb, Clock, Crosshair, AlertTriangle, Zap } from 'lucide-react';
import type { ExplosiveItem, AdditionalEffect } from '@/types/explosives';
// Import the new component
import TruncatedTextWithModal from '../ui/TruncatedTextWithModal'; // Adjust path if needed

interface ExplosivesDetailModalProps {
  explosive: ExplosiveItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const ExplosivesDetailModal = ({ explosive, isOpen, onClose }: ExplosivesDetailModalProps) => {
  if (!explosive) return null;

  // Function to safely parse additionaleffects JSON string
  const parseAdditionalEffects = (effectsString?: string): AdditionalEffect[] => {
    if (!effectsString || effectsString.trim() === '{}' || effectsString.trim() === '') return [];
    try {
      const parsed = JSON.parse(effectsString);
      if (Array.isArray(parsed) && parsed.every(eff => typeof eff === 'object' && eff !== null && 'name' in eff && 'description' in eff)) {
        return parsed as AdditionalEffect[];
      }
      console.warn("Parsed additionaleffects is not in the expected array format:", parsed);
      return [];
    } catch (error) {
      console.error("Failed to parse additionaleffects JSON:", error, "String was:", effectsString);
      return [];
    }
  };

  const additionalEffects = parseAdditionalEffects(explosive.additionalEffects);

  const getRarityColor = (rarity: string) => {
    switch(rarity?.toLowerCase()) {
      case 'common': return 'gray'; case 'uncommon': return 'green';
      case 'rare': return 'blue'; case 'epic': return 'purple';
      case 'legendary': return 'orange'; case 'very rare': return 'red';
      default: return 'gray';
    }
  };

   const getDamageTypeColor = (type?: string) => {
    switch(type?.toLowerCase()) {
      case 'fire': return 'red'; case 'force': return 'purple';
      case 'thunder': return 'yellow'; default: return 'gray';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <HStack spacing={2}>
              <Bomb className="text-red-500" />
              <Text fontSize="2xl">{explosive.name}</Text>
            </HStack>
            <HStack spacing={2}>
              <Badge colorScheme={getRarityColor(explosive.rarity)}>
                {explosive.rarity}
              </Badge>
              <Badge variant="outline" colorScheme="red">
                {explosive.itemType}
              </Badge>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="start" spacing={4} width="100%">
            {/* Use TruncatedTextWithModal for description */}
            <TruncatedTextWithModal
              text={explosive.description}
              modalTitle={`${explosive.name} - Description`}
              charLimit={200}
            />

            <Divider />

            <SimpleGrid columns={2} spacing={4} width="100%">
              <HStack><Text fontWeight="semibold">Blast Radius:</Text><Text>{explosive.blastRadius || 'N/A'}</Text></HStack>
              {explosive.duration && <HStack><Icon as={Clock} size={16}/><Text fontWeight="semibold">Duration:</Text><Text>{explosive.duration}</Text></HStack>}
              {explosive.range && <HStack><Icon as={Crosshair} size={16}/><Text fontWeight="semibold">Range:</Text><Text>{explosive.range}</Text></HStack>}
              {explosive.triggerMechanism && <HStack><Icon as={Zap} size={16}/><Text fontWeight="semibold">Trigger:</Text><Text>{explosive.triggerMechanism}</Text></HStack>}
            </SimpleGrid>

            <Divider />

             {explosive.damage && explosive.damage !== 'N/A' && (
                <Box width="100%">
                  <Text fontWeight="semibold" mb={2}>Damage</Text>
                  <HStack>
                     <Icon as={AlertTriangle} color="red.400" />
                    <Text fontSize="lg" fontWeight="bold">{explosive.damage}</Text>
                    {explosive.damageType && (
                      <Badge colorScheme={getDamageTypeColor(explosive.damageType)}>
                        {explosive.damageType}
                      </Badge>
                    )}
                  </HStack>
                </Box>
             )}

            {(explosive.damage && explosive.damage !== 'N/A') && <Divider />}

            {/* Use TruncatedTextWithModal for effect */}
             <Box width="100%">
                 <TruncatedTextWithModal
                    label="Effect"
                    text={explosive.effect}
                    modalTitle={`${explosive.name} - Effect`}
                    charLimit={180}
                 />
             </Box>

             {additionalEffects.length > 0 && (
                <>
                <Divider />
                <Box width="100%">
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
                </>
             )}

             {(explosive.sellValue !== undefined || explosive.buyValue !== undefined) && (
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

export default ExplosivesDetailModal;