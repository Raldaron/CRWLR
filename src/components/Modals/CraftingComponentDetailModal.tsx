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
  HStack
} from '@chakra-ui/react';
import type { CraftingComponentItem } from '@/types/craftingcomponent';
// Import the new component
import TruncatedTextWithModal from '../ui/TruncatedTextWithModal'; // Adjust path if needed

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
    switch(rarity?.toLowerCase()) {
      case 'common': return 'gray'; case 'uncommon': return 'green';
      case 'rare': return 'blue'; case 'epic': return 'purple';
      case 'legendary': return 'orange'; case 'very rare': return 'red';
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
            <HStack spacing={2}>
                <Badge colorScheme={getRarityColor(component.rarity)}>
                {component.rarity}
                </Badge>
                 <Badge variant="outline">{component.itemType}</Badge>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="start" spacing={4} width="100%">
            {/* Use TruncatedTextWithModal for description */}
            <TruncatedTextWithModal
              text={component.description}
              modalTitle={`${component.name} - Description`}
              charLimit={200}
            />

            <Divider />

            {/* Use TruncatedTextWithModal for effect */}
             <Box width="100%">
                 <TruncatedTextWithModal
                    label="Effect"
                    text={component.effect}
                    modalTitle={`${component.name} - Effect`}
                    charLimit={180}
                 />
             </Box>

            {(component.sellValue !== undefined || component.buyValue !== undefined) && (
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

export default CraftingComponentDetailModal;