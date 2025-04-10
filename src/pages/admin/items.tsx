import React, { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  Text,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  HStack
} from '@chakra-ui/react';
import { Plus, Home, ChevronRight, Package } from 'lucide-react';
import DMItemCatalogBrowser from '@/components/admin/items/DMItemCatalogBrowser';
import DMItemEditor from '@/components/admin/items/DMItemEditor';
// Import the ItemDetailModal component
import ItemDetailModal from '@/components/inventory/ItemDetailModal';
import { useAuth } from '@/context/AuthContext';
import { useDM } from '@/context/DMContext';
import Link from 'next/link';
import type { InventoryItem } from '@/types/inventory';

// Extend InventoryItem to include potential collectionName for the editor
interface EditableItem extends InventoryItem {
  collectionName?: string;
}

const DMItemManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { isDM, isLoading: isDMLoading } = useDM();
  const {
    isOpen: isEditorOpen,
    onOpen: onEditorOpen,
    onClose: onEditorClose
  } = useDisclosure();
  // New state and disclosure for item details modal
  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose
  } = useDisclosure();
  const [editingItem, setEditingItem] = useState<EditableItem | null>(null);
  const [viewItem, setViewItem] = useState<EditableItem | null>(null);

  const handleAddNewItem = () => {
    setEditingItem(null); // Clear editing item to signal creation mode
    onEditorOpen();
  };

  const handleEditItem = (item: EditableItem) => {
    setEditingItem(item);
    onEditorOpen();
  };

  // New function to view item details
  const handleViewItemDetails = (item: EditableItem) => {
    setViewItem(item);
    onDetailOpen();
  };

  const handleSaveComplete = () => {
    onEditorClose();
    setEditingItem(null);
    // Optionally, trigger a refresh of the browser component if needed
  };

  if (isDMLoading) {
    return (
      <Box p={8} textAlign="center">
        <Text color="gray.300">Loading...</Text>
      </Box>
    );
  }

  if (!currentUser || !isDM) {
    return (
      <Box p={8} textAlign="center">
        <Text color="gray.400">
          Access Denied. You must be logged in as a DM.
        </Text>
        <Button as={Link} href="/" colorScheme="brand" mt={4}>
          Go Home
        </Button>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.900" p={{ base: 4, md: 8 }}>
      <VStack spacing={6} align="stretch" maxW="7xl" mx="auto">
        {/* Breadcrumb */}
        <Breadcrumb separator={<ChevronRight size={14} />} color="gray.400">
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href="/" _hover={{ color: 'brand.400' }}>
              <Home size={16} className="inline mr-1" /> Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          {/* Add other breadcrumb items if needed, e.g., link to DM Dashboard */}
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink color="brand.400">
              <Package size={16} className="inline mr-1" /> Item Catalog Management
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <HStack justifyContent="space-between">
          <Heading size="lg" color="gray.100">
            Item Catalog Management
          </Heading>
          <Button leftIcon={<Plus />} colorScheme="brand" onClick={handleAddNewItem}>
            Add New Item
          </Button>
        </HStack>

        <Box bg="gray.800" p={6} borderRadius="lg" borderWidth="1px" borderColor="gray.700">
          <DMItemCatalogBrowser
            onSelectItemForEdit={handleEditItem}
            onViewItemDetails={handleViewItemDetails} // Updated callback
          />
        </Box>

        {/* Modal for Item Editor */}
        <Modal isOpen={isEditorOpen} onClose={onEditorClose} size="xl" closeOnOverlayClick={false}>
          <ModalOverlay />
          <ModalContent bg="gray.800">
            {/* Header removed as DMItemEditor has its own */}
            <ModalCloseButton color="gray.400" />
            <ModalBody p={0}>
              {/* Render editor inside modal body */}
              <DMItemEditor
                itemToEdit={editingItem}
                onSaveComplete={handleSaveComplete}
                onCancel={onEditorClose}
              />
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Modal for Item Details */}
        <Modal
          isOpen={isDetailOpen}
          onClose={() => {
            onDetailClose();
            setViewItem(null);
          }}
          size="xl"
        >
          <ModalOverlay />
          <ModalContent bg="gray.800">
            <ModalCloseButton color="gray.400" />
            <ModalBody p={0}>
              {viewItem && (
                <ItemDetailModal 
                  item={viewItem} 
                  isOpen={isDetailOpen}
                  onClose={() => {
                    onDetailClose();
                    setViewItem(null);
                  }}
                />
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default DMItemManagementPage;