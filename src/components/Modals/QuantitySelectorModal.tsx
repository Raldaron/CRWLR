import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Badge,
  Box,
  Divider,
  useToast
} from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import type { InventoryItem } from '@/types/inventory';

interface QuantitySelectorModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToInventory: (item: InventoryItem, quantity: number) => void;
}

const QuantitySelectorModal: React.FC<QuantitySelectorModalProps> = ({
  item,
  isOpen,
  onClose,
  onAddToInventory
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  // Reset quantity when modal opens with a new item
  useEffect(() => {
    if (isOpen && item) {
      setQuantity(1);
      setIsProcessing(false);
    }
  }, [isOpen, item]);

  if (!item) return null;

  const handleAdd = () => {
    try {
      // Prevent multiple clicks
      if (isProcessing) return;
      
      setIsProcessing(true);
      
      // Validate quantity
      const validQuantity = Math.max(1, Math.min(99, quantity));
      
      // Call the parent component's function to add the item
      onAddToInventory(item, validQuantity);

    } catch (error) {
      console.error('Error in handleAdd:', error);
      toast({
        title: "Error",
        description: "Failed to add items to inventory",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setIsProcessing(false);
    }
  };

  // Get rarity color for badges
  const getRarityColor = (rarity: string = 'common') => {
    switch(rarity.toLowerCase()) {
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      case 'unique': return 'yellow';
      case 'exceedingly rare': return 'pink';
      case 'very rare': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="md"
      closeOnOverlayClick={!isProcessing}
      closeOnEsc={!isProcessing}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{item.name}</ModalHeader>
        <ModalCloseButton isDisabled={isProcessing} />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <HStack>
              <Badge colorScheme={getRarityColor(item.rarity as string)}>
                {item.rarity}
              </Badge>
              <Badge colorScheme="blue">
                {item.itemType}
              </Badge>
            </HStack>

            <Text color="gray.600" fontSize="sm">{item.description}</Text>
            
            <Divider />
            
            <Box>
              <Text fontWeight="semibold" mb={2}>Select Quantity:</Text>
              <NumberInput
                value={quantity}
                onChange={(_, value) => setQuantity(value)}
                min={1}
                max={99}
                defaultValue={1}
                clampValueOnBlur={true}
                isDisabled={isProcessing}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={onClose}
            isDisabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            colorScheme="green" 
            leftIcon={<Plus size={16} />}
            onClick={handleAdd}
            isLoading={isProcessing}
            loadingText="Adding..."
          >
            Add to Inventory
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default QuantitySelectorModal;