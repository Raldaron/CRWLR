// components/Modals/ScrollDetailModal.tsx

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
import { Scroll, Clock, Zap, Target, Sparkles } from 'lucide-react';
import type { ScrollItem } from '@/types/scroll';

interface ScrollDetailModalProps {
  scroll: ScrollItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const ScrollDetailModal = ({ scroll, isOpen, onClose }: ScrollDetailModalProps) => {
  if (!scroll) return null;

  // Helper function to determine mana cost color
  const getManaCostColor = (cost: string) => {
    const manaValue = parseInt(cost);
    if (manaValue === 0) return 'gray';
    if (manaValue <= 2) return 'blue';
    if (manaValue <= 5) return 'purple';
    return 'red';
  };

  // Helper function to determine cooldown color
  const getCooldownColor = (cooldown: string) => {
    if (cooldown.includes('turn')) return 'green';
    if (cooldown.includes('minute')) return 'yellow';
    return 'orange';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <HStack spacing={2}>
              <Scroll className="text-purple-500" />
              <Text fontSize="2xl">{scroll.name}</Text>
            </HStack>
            <Badge colorScheme="purple" px={2} py={1}>
              Spell Scroll
            </Badge>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="start" spacing={4} width="100%">
            {/* Description */}
            <Text color="gray.600">{scroll.description}</Text>
            
            <Divider />
            
            {/* Basic Spell Information */}
            <SimpleGrid columns={2} spacing={4} width="100%">
              <Box>
                <HStack>
                  <Clock size={16} />
                  <Text fontWeight="semibold">Casting Time</Text>
                </HStack>
                <Text>{scroll.castingTime}</Text>
              </Box>
              <Box>
                <HStack>
                  <Target size={16} />
                  <Text fontWeight="semibold">Range</Text>
                </HStack>
                <Text>{scroll.range}</Text>
              </Box>
              <Box>
                <HStack>
                  <Zap size={16} />
                  <Text fontWeight="semibold">Mana Cost</Text>
                </HStack>
                <Badge colorScheme={getManaCostColor(scroll.manaPointCost)}>
                  {scroll.manaPointCost}
                </Badge>
              </Box>
              <Box>
                <HStack>
                  <Clock size={16} />
                  <Text fontWeight="semibold">Cooldown</Text>
                </HStack>
                <Badge colorScheme={getCooldownColor(scroll.cooldown)}>
                  {scroll.cooldown}
                </Badge>
              </Box>
            </SimpleGrid>

            <Divider />

            {/* Effect */}
            <Box width="100%">
              <HStack mb={2}>
                <Sparkles size={16} />
                <Text fontWeight="semibold">Effect</Text>
              </HStack>
              <Text>{scroll.effect}</Text>
            </Box>

            {/* Damage Information if applicable */}
            {scroll.damageAmount !== 'N/A' && (
              <>
                <Divider />
                <Box width="100%">
                  <Text fontWeight="semibold" mb={2}>Damage</Text>
                  <HStack>
                    <Text fontSize="lg" fontWeight="bold">{scroll.damageAmount}</Text>
                    <Badge colorScheme="red">
                      {scroll.damageType}
                    </Badge>
                  </HStack>
                </Box>
              </>
            )}

            {/* Spell Scaling */}
            <Divider />
            <Box width="100%">
              <Text fontWeight="semibold" mb={2}>Spell Scaling</Text>
              <VStack align="start" spacing={2}>
                {Object.entries(scroll.scaling).map(([level, effect]) => (
                  <Box 
                    key={level}
                    p={3}
                    bg="purple.50"
                    borderRadius="md"
                    width="100%"
                  >
                    <Text fontWeight="semibold" color="purple.700">
                      {level}
                    </Text>
                    <Text>{effect}</Text>
                  </Box>
                ))}
              </VStack>
            </Box>

            {/* Casting Modifier */}
            <Divider />
            <Box width="100%">
              <Text fontWeight="semibold" mb={2}>Spellcasting Modifier</Text>
              <Badge colorScheme="purple" fontSize="md">
                {scroll.spellCastingModifier}
              </Badge>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ScrollDetailModal;