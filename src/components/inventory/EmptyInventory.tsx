// components/inventory/EmptyInventory.tsx
import React from 'react';
import { Box, VStack, Text, Icon } from '@chakra-ui/react';
import { Package } from 'lucide-react';

interface EmptyInventoryProps {
  title?: string;
  message?: string;
  icon?: React.ElementType;
}

const EmptyInventory: React.FC<EmptyInventoryProps> = ({
  title = 'No items found',
  message = 'Your inventory is empty for this category',
  icon = Package,
}) => {
  return (
    <Box p={8} textAlign="center">
      <VStack spacing={4}>
        <Icon as={icon} boxSize={12} color="gray.400" />
        <Text fontSize="xl" fontWeight="medium" color="gray.500">
          {title}
        </Text>
        <Text color="gray.400">{message}</Text>
      </VStack>
    </Box>
  );
};

export default EmptyInventory;
