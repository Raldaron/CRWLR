// components/inventory/InventoryTable.tsx
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

  // Filter items based on search term
  const filteredItems = items.filter(inventoryItem => {
    const item = inventoryItem.item;
    return (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Sort items based on sort column and direction
  const sortedItems = [...filteredItems].sort((a, b) => {
    const aValue = getColumnValue(a.item, sortColumn) as string;
    const bValue = getColumnValue(b.item, sortColumn) as string;
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
                <Tr key={item.id} _hover={{ bg: 'gray.50' }}>
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
                        onClick={() => onViewDetails(item)}
                      />
                      {onRemoveItem && (
                        <IconButton
                          aria-label="Remove item"
                          icon={<Trash size={16} />}
                          size="xs"
                          colorScheme="red"
                          onClick={() => onRemoveItem(item.id)}
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
