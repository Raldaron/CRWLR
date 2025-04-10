// components/inventory/CatalogTable.tsx
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
} from '@chakra-ui/react';
import { Search, Eye, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Helper function to safely convert any value to a React-friendly display format
const convertToReactNode = (value: any): React.ReactNode => {
  if (value === undefined || value === null || value === '') {
    return <Text color="gray.400">-</Text>;
  }
  
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
    return value.toString();
  }
  
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  if (typeof value === 'object') {
    // Convert objects to string representation
    try {
      return JSON.stringify(value);
    } catch (e) {
      return '[Complex Object]';
    }
  }
  
  // Fallback for any other type
  return String(value);
};

// Helper function to get column value
const getColumnValue = (item: any, column: string): React.ReactNode => {
  if (!item) return "-";

  // Try direct property access first
  if (column in item && item[column] !== undefined) {
    return convertToReactNode(item[column]);
  }
  
  // Handle specific known columns that might have different names
  switch (column) {
    case 'name':
      return convertToReactNode(item.name || '');
    case 'description':
      return convertToReactNode(item.description || '');
    case 'rarity':
      return convertToReactNode(item.rarity || '');
    case 'itemType':
      return convertToReactNode(item.itemType || '');
    default:
      // If we can't find a matching property, return an empty string
      return "-";
  }
};

// Create a unique key for each item row
const createUniqueRowKey = (item: any, index: number): string => {
  // If the item has an id, use that
  if (item.id) {
    return `catalog-item-${item.id}`;
  }
  
  // If item has a name, use that with index
  if (item.name) {
    const normalizedName = item.name.replace(/\s+/g, '-').toLowerCase();
    return `catalog-item-${normalizedName}-${index}`;
  }
  
  // Fallback to a generic row key with a random component
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  return `catalog-row-${index}-${randomSuffix}`;
};

// Define a type that is compatible with InventoryItem but only requires the fields we need
interface CatalogItem {
  id: string;
  name: string;
  description: string;
  itemType: string;
  rarity: string;
  [key: string]: any;  // This allows for any additional properties
}

interface CatalogTableProps {
  items: CatalogItem[];
  columns: string[];
  onViewDetails: (item: CatalogItem) => void;
  onAddToInventory: (item: CatalogItem) => void;
}

const CatalogTable: React.FC<CatalogTableProps> = ({
  items,
  columns,
  onViewDetails,
  onAddToInventory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter items based on search term
  const filteredItems = items.filter(item => {
    return (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Sort items based on sort column and direction
  const sortedItems = [...filteredItems].sort((a, b) => {
    const aValue = getColumnValue(a, sortColumn);
    const bValue = getColumnValue(b, sortColumn);
    
    const aStr = String(aValue);
    const bStr = String(bValue);
    
    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  // Handle column sort click
  const handleSortClick = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Get sort indicator
  const getSortIndicator = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
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
    <Box width="100%">
      <InputGroup mb={4}>
        <InputLeftElement pointerEvents="none">
          <Search className="h-4 w-4 text-gray-400" />
        </InputLeftElement>
        <Input
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          bg="gray.700"
          borderColor="gray.600"
          color="gray.200"
          _hover={{ borderColor: "brand.400" }}
          _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)" }}
        />
      </InputGroup>

      <ScrollArea className="h-[600px]">
        <Table variant="simple" size="sm">
          <Thead position="sticky" top={0} bg="gray.800" zIndex={1}>
            <Tr>
              {columns.map((column) => (
                <Th 
                  key={`header-${column}`} 
                  cursor="pointer" 
                  onClick={() => handleSortClick(column)}
                  color="gray.400"
                  borderColor="gray.700"
                >
                  {column.charAt(0).toUpperCase() + column.slice(1)}
                  {getSortIndicator(column)}
                </Th>
              ))}
              <Th width="120px" color="gray.400" borderColor="gray.700">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedItems.length === 0 ? (
              <Tr>
                <Td colSpan={columns.length + 1} textAlign="center" py={8} borderColor="gray.700">
                  <Box py={8}>
                    <Text color="gray.400">No items found</Text>
                    <Text fontSize="sm" color="gray.500" mt={2}>
                      Try adjusting your search criteria
                    </Text>
                  </Box>
                </Td>
              </Tr>
            ) : (
              sortedItems.map((item, index) => (
                <Tr 
                  key={createUniqueRowKey(item, index)} 
                  _hover={{ bg: "gray.750" }}
                  borderColor="gray.700"
                >
                  {columns.map((column) => (
                    <Td key={`${createUniqueRowKey(item, index)}-${column}`} borderColor="gray.700">
                      {column === 'name' ? (
                        <Text fontWeight="medium" color="gray.300">{item.name}</Text>
                      ) : column === 'rarity' ? (
                        <Badge colorScheme={getRarityColor(item.rarity as string)}>
                          {item.rarity}
                        </Badge>
                      ) : (
                        <Text color="gray.400">{getColumnValue(item, column)}</Text>
                      )}
                    </Td>
                  ))}
                  <Td borderColor="gray.700">
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="View details"
                        icon={<Eye size={16} />}
                        size="xs"
                        colorScheme="blue"
                        onClick={() => onViewDetails(item)}
                      />
                      <IconButton
                        aria-label="Add to inventory"
                        icon={<Plus size={16} />}
                        size="xs"
                        colorScheme="green"
                        onClick={() => onAddToInventory(item)}
                        title="Add to inventory"
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </ScrollArea>
    </Box>
  );
};

export default CatalogTable;