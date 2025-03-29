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
import type { AmmunitionItem } from '@/types/ammunition';

interface AmmunitionDetailModalProps {
  ammunition: AmmunitionItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const AmmunitionDetailModal = ({ ammunition, isOpen, onClose }: AmmunitionDetailModalProps) => {
  if (!ammunition) return null;

  const getRarityColor = (rarity: string) => {
    switch(rarity.toLowerCase()) {
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      default: return 'gray';
    }
  };

  const getDamageTypeColor = (type: string) => {
    switch(type.toLowerCase()) {
      case 'fire': return 'red';
      case 'cold': return 'blue';
      case 'lightning': return 'yellow';
      case 'acid': return 'green';
      case 'force': return 'purple';
      case 'piercing': return 'orange';
      case 'bludgeoning': return 'gray';
      default: return 'gray';
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
            <Text color="gray.600">{ammunition.description}</Text>
            
            <Divider />
            
            <SimpleGrid columns={2} spacing={4} width="100%">
              <Box>
                <Text fontWeight="semibold">Range</Text>
                <Text>{ammunition.range} ft</Text>
              </Box>
              {ammunition.radius && (
                <Box>
                  <Text fontWeight="semibold">Blast Radius</Text>
                  <Text>{ammunition.radius} ft</Text>
                </Box>
              )}
            </SimpleGrid>

            <Box width="100%">
              <Text fontWeight="semibold" mb={2}>Damage</Text>
              <HStack>
                <Text fontSize="lg" fontWeight="bold">{ammunition.damageAmount}</Text>
                <Badge colorScheme={getDamageTypeColor(ammunition.damageType)}>
                  {ammunition.damageType}
                </Badge>
              </HStack>
            </Box>

            <Box width="100%">
              <Text fontWeight="semibold" mb={2}>Effect</Text>
              <Text>{ammunition.effect}</Text>
            </Box>

            {ammunition.additionaleffects && ammunition.additionaleffects.length > 0 && (
              <Box width="100%">
                <Text fontWeight="semibold" mb={2}>Additional Effects</Text>
                <VStack align="start" spacing={2}>
                  {ammunition.additionaleffects.map((effect, index) => (
                    <Box key={index} p={3} bg="gray.50" borderRadius="md">
                      <Text fontWeight="semibold">{effect.name}</Text>
                      <Text fontSize="sm">{effect.description}</Text>
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}

            {ammunition.triggerMechanism && (
              <Box width="100%">
                <Text fontWeight="semibold" mb={2}>Trigger Mechanism</Text>
                <Text>{ammunition.triggerMechanism}</Text>
              </Box>
            )}

            {ammunition.abilities.length > 0 && (
              <>
                <Divider />
                <Box width="100%">
                  <Text fontWeight="semibold" mb={2}>Abilities</Text>
                  <VStack align="start">
                    {ammunition.abilities.map((ability, index) => (
                      <Text key={index}>{ability}</Text>
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

export default AmmunitionDetailModal;