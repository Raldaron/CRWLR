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
import { Bomb } from 'lucide-react';
import type { ExplosiveItem } from '@/types/explosives';

interface ExplosivesDetailModalProps {
  explosive: ExplosiveItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const ExplosivesDetailModal = ({ explosive, isOpen, onClose }: ExplosivesDetailModalProps) => {
  if (!explosive) return null;

  const getRarityColor = (rarity: string) => {
    switch(rarity.toLowerCase()) {
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      case 'very rare': return 'red';
      default: return 'gray';
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
            <Text color="gray.600">{explosive.description}</Text>
            
            <Divider />
            
            <SimpleGrid columns={2} spacing={4} width="100%">
              <Box>
                <Text fontWeight="semibold">Blast Radius</Text>
                <Text>{explosive.blastRadius}</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold">Duration</Text>
                <Text>{explosive.duration}</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold">Trigger Mechanism</Text>
                <Text>{explosive.triggerMechanism}</Text>
              </Box>
            </SimpleGrid>

            <Divider />

            <Box width="100%">
              <Text fontWeight="semibold" mb={2}>Damage</Text>
              <HStack>
                <Text fontSize="lg" fontWeight="bold">{explosive.damage}</Text>
                <Badge colorScheme="red">
                  {explosive.damageType}
                </Badge>
              </HStack>
            </Box>

            <Divider />

            <Box width="100%">
              <Text fontWeight="semibold" mb={2}>Effect</Text>
              <Text>{explosive.effect}</Text>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ExplosivesDetailModal;