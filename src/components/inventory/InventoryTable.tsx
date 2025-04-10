// Modified version of InventoryTable.tsx to better handle item rendering

import React, { useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  Text,
  HStack,
  IconButton,
  TableContainer,
  useToast,
} from '@chakra-ui/react';
import { Search, Eye, Trash } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';

interface InventoryTableProps {
  items: { item: InventoryItem; quantity: number }[];
  columns: string[];
  getColumnValue: (item: InventoryItem, column: string) => React.ReactNode;
  onViewDetails: (item: InventoryItem) => void;
  onRemoveItem?: (itemId: string) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  columns,
  getColumnValue,
  onViewDetails,
  onRemoveItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const toast = useToast();

  // Debug message to help identify items that might not be showing up
  React.useEffect(() => {
    console.log(`InventoryTable received ${items.length} items`);
    // Log the item types to help with debugging
    const itemTypes = new Set(items.map(item => item.item.itemType));
    console.log(`Item types in inventory: ${Array.from(itemTypes).join(', ')}`);
  }, [items]);

  // Filter items based on search term
  const filteredItems = items.filter(inventoryItem => {
    const item = inventoryItem.item;
    if (!item) {
      console.warn("Found undefined item in inventory");
      return false;
    }
    return (
      (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );
  });

  // Safeguard against sorting errors
  const getSafeValue = (item: InventoryItem, column: string): string => {
    try {
      const value = getColumnValue(item, column);
      return value !== null && value !== undefined ? String(value) : '';
    } catch (error) {
      console.error(`Error getting value for column ${column}:`, error);
      return '';
    }
  };

  // Sort items based on sort column and direction
  const sortedItems = [...filteredItems].sort((a, b) => {
    const aValue = getSafeValue(a.item, sortColumn);
    const bValue = getSafeValue(b.item, sortColumn);
    return sortDirection === 'asc'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  const handleSortClick = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  const getRarityColor = (rarity: string = 'common') => {
    switch (rarity.toLowerCase()) {
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

  // Handle item removal with better error handling
  const handleRemoveItem = (itemId: string) => {
    try {
      if (onRemoveItem) {
        onRemoveItem(itemId);
        toast({
          title: "Item Removed",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast({
        title: "Error",
        description: "Could not remove item from inventory",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box width="100%">
      <InputGroup mb={4}>
        <InputLeftElement pointerEvents="none">
          <Search className="h-4 w-4 text-gray-400" />
        </InputLeftElement>
        <Input
          placeholder="Search inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>
      
      {/* Debug info - can be commented out in production */}
      <Text fontSize="sm" color="gray.500" mb={2}>
        Total items: {items.length} | Filtered: {filteredItems.length}
      </Text>
      
      {/* TableContainer provides horizontal scrolling */}
      <TableContainer overflowX="auto">
        <Table variant="simple" size="sm" width="100%" minWidth={['600px', '800px', '1000px']}>
          <Thead position="sticky" top={0} bg="white" zIndex={1}>
            <Tr>
              <Th width="80px">Qty</Th>
              {columns.map(column => (
                <Th key={column} cursor="pointer" onClick={() => handleSortClick(column)}>
                  {column.charAt(0).toUpperCase() + column.slice(1)}
                  {getSortIndicator(column)}
                </Th>
              ))}
              <Th width="120px">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedItems.length === 0 ? (
              <Tr>
                <Td colSpan={columns.length + 2} textAlign="center" py={8}>
                  <Box py={8}>
                    <Text color="gray.500">No items found</Text>
                    <Text fontSize="sm" color="gray.400" mt={2}>
                      Try adjusting your search or add items from the "Add Items" tab
                    </Text>
                  </Box>
                </Td>
              </Tr>
            ) : (
              sortedItems.map(({ item, quantity }) => (
                <Tr
                  key={item.id}
                  _hover={{ bg: 'gray.50' }}
                  cursor="pointer"
                  onClick={() => onViewDetails(item)}
                >
                  <Td>
                    <Badge colorScheme="blue" borderRadius="full">
                      {quantity}
                    </Badge>
                  </Td>
                  {columns.map(column => (
                    <Td key={`${item.id}-${column}`}>
                      {column === 'name' ? (
                        <Text fontWeight="medium">{item.name}</Text>
                      ) : column === 'rarity' ? (
                        <Badge colorScheme={getRarityColor(item.rarity)}>{item.rarity}</Badge>
                      ) : (
                        getColumnValue(item, column)
                      )}
                    </Td>
                  ))}
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="View details"
                        icon={<Eye size={16} />}
                        size="xs"
                        colorScheme="blue"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(item);
                        }}
                      />
                      {onRemoveItem && (
                        <IconButton
                          aria-label="Remove item"
                          icon={<Trash size={16} />}
                          size="xs"
                          colorScheme="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item.id);
                          }}
                        />
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default InventoryTable;