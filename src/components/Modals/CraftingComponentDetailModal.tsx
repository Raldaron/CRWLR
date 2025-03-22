import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  Badge,
  Divider,
  Box,
} from '@chakra-ui/react';
import type { CraftingComponentItem } from '@/types/craftingcomponent';

interface CraftingComponentDetailModalProps {
  component: CraftingComponentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const CraftingComponentDetailModal = ({ 
  component, 
  isOpen, 
  onClose 
}: CraftingComponentDetailModalProps) => {
  if (!component) return null;

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
            <Text fontSize="2xl">{component.name}</Text>
            <Badge colorScheme={getRarityColor(component.rarity)}>
              {component.rarity}
            </Badge>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="start" spacing={4} width="100%">
            <Text color="gray.600">{component.description}</Text>
            
            <Divider />
            
            <Box width="100%">
              <Text fontWeight="semibold" mb={2}>Effect</Text>
              <Text>{component.effect}</Text>
            </Box>

            <Divider />

            <Box width="100%">
              <Text fontWeight="semibold" mb={2}>Properties</Text>
              <VStack align="start" spacing={2}>
                <Text>
                  <strong>Duration:</strong> {component.duration}
                </Text>
                {component.range !== 'N/A' && (
                  <Text>
                    <strong>Range:</strong> {component.range}
                  </Text>
                )}
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CraftingComponentDetailModal;