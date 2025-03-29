// Components/notes/Notes.tsx - with updated dark theme
'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  Button,
  IconButton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Tooltip,
  Badge,
  useToast,
  Divider,
  Flex,
  Spacer,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  InputGroup,
  InputLeftAddon,
} from '@chakra-ui/react';
import { useCharacter } from '@/context/CharacterContext';
import { 
  Edit, 
  Trash, 
  Save, 
  Plus, 
  FolderPlus, 
  MoreVertical, 
  Book, 
  FileText,
  Clock,
  ChevronRight,
  Search
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import DarkThemedCard from '@/components/ui/DarkThemedCard';

// Define types for our notes data structure
interface Note {
  id: string;
  title: string;
  content: string;
  lastEdited: number; // timestamp
}

interface NoteCategory {
  id: string;
  name: string;
  notes: Note[];
}

type NotesState = NoteCategory[];

const Notes: React.FC = () => {
  // If we need to access character context
  const { 
    characterName,
    saveCharacterManually,
    isDirty,
    isSaving,
    notes,
    updateNotes,
    addNoteCategory,
    updateNoteCategory,
    deleteNoteCategory,
    addNote,
    updateNote,
    deleteNote: deleteNoteFromContext
  } = useCharacter();
  
  // State for UI management
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  
  // State for editing a note
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  
  // State for creating/editing a category
  const { isOpen: isCategoryModalOpen, onOpen: openCategoryModal, onClose: closeCategoryModal } = useDisclosure();
  const [categoryName, setCategoryName] = useState('');
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  
  // Reference for alert dialog
  const cancelRef = React.useRef<HTMLButtonElement>(null!);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'note' | 'category', id: string}>({type: 'note', id: ''});
  
  const toast = useToast();

  // Initialize active note when component mounts or notes change
  useEffect(() => {
    // If there are notes but no active note, set the first note as active
    if (notes.length > 0 && !activeNoteId) {
      const firstCategory = notes[0];
      if (firstCategory && firstCategory.notes.length > 0) {
        setActiveNoteId(firstCategory.notes[0].id);
      }
    }
    
    // If active tab is out of bounds, reset it
    if (activeTabIndex >= notes.length && notes.length > 0) {
      setActiveTabIndex(0);
    }
  }, [notes, activeNoteId, activeTabIndex]);
  
  // Trigger save after any changes to notes
  useEffect(() => {
    if (notes.length > 0 && saveCharacterManually) {
      const debounceTimer = setTimeout(() => {
        saveCharacterManually();
      }, 3000); // Save 3 seconds after changes
      
      return () => clearTimeout(debounceTimer);
    }
  }, [notes, saveCharacterManually]);

  // Get the currently active category
  const getActiveCategory = (): NoteCategory | undefined => {
    if (notes.length === 0) return undefined;
    return notes[activeTabIndex];
  };

  // Get the currently active note
  const getActiveNote = (): Note | undefined => {
    const category = getActiveCategory();
    if (!category) return undefined;
    
    return category.notes.find(note => note.id === activeNoteId);
  };

  // Create a new note in the current category
  const handleCreateNote = () => {
    const category = getActiveCategory();
    if (!category) return;
    
    const newNote: Note = {
      id: 'note-' + Date.now(),
      title: 'New Note',
      content: '',
      lastEdited: Date.now()
    };
    
    // Add note using context method
    addNote(category.id, newNote);
    
    // Update UI state
    setActiveNoteId(newNote.id);
    setEditMode(true);
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
    
    toast({
      title: "New note created",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  // Start editing a note
  const handleEditNote = () => {
    const note = getActiveNote();
    if (!note) return;
    
    setEditMode(true);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  // Save edited note
  const handleSaveNote = () => {
    const category = getActiveCategory();
    if (!category || !activeNoteId) return;
    
    // Update the note using context method
    updateNote(category.id, activeNoteId, {
      title: editTitle,
      content: editContent,
      lastEdited: Date.now()
    });
    
    // Exit edit mode
    setEditMode(false);
    
    toast({
      title: "Note saved",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  // Cancel note editing
  const handleCancelEdit = () => {
    setEditMode(false);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (type: 'note' | 'category', id: string) => {
    setItemToDelete({ type, id });
    setIsDeleteDialogOpen(true);
  };

  // Handle deletion after confirmation
  const handleDelete = () => {
    const { type, id } = itemToDelete;
    
    if (type === 'note') {
      deleteNote(id);
    } else if (type === 'category') {
      deleteCategory(id);
    }
    
    setIsDeleteDialogOpen(false);
  };

  // Delete a note
  const deleteNote = (noteId: string) => {
    const category = getActiveCategory();
    if (!category) return;
    
    // Delete the note using context method
    deleteNoteFromContext(category.id, noteId);
    
    // If the deleted note was active, set a new active note
    if (activeNoteId === noteId) {
      // Find the updated category (after deletion)
      const updatedCategory = notes.find(cat => cat.id === category.id);
      if (updatedCategory && updatedCategory.notes.length > 0) {
        setActiveNoteId(updatedCategory.notes[0].id);
      } else {
        setActiveNoteId(null);
      }
    }
    
    toast({
      title: "Note deleted",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  // Create a new category
  const handleCreateCategory = () => {
    setCategoryName('');
    setIsEditingCategory(false);
    openCategoryModal();
  };

  // Edit existing category
  const handleEditCategory = (categoryId: string) => {
    const category = notes.find(cat => cat.id === categoryId);
    if (!category) return;
    
    setCategoryName(category.name);
    setIsEditingCategory(true);
    setItemToDelete({ type: 'category', id: categoryId });
    openCategoryModal();
  };

  // Save category changes
  const handleSaveCategory = () => {
    if (!categoryName.trim()) {
      toast({
        title: "Category name cannot be empty",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    if (isEditingCategory) {
      // Update existing category using context method
      updateNoteCategory(itemToDelete.id, { name: categoryName });
      
      toast({
        title: "Category updated",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } else {
      // Create new category using context method
      const newCategory: NoteCategory = {
        id: 'category-' + Date.now(),
        name: categoryName,
        notes: []
      };
      
      addNoteCategory(newCategory);
      setActiveTabIndex(notes.length); // Point to the new category
      
      toast({
        title: "New category created",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
    
    closeCategoryModal();
  };

  // Delete a category
  const deleteCategory = (categoryId: string) => {
    // Don't allow deleting the last category
    if (notes.length <= 1) {
      toast({
        title: "Cannot delete the last category",
        description: "At least one category must exist",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    const categoryIndex = notes.findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) return;
    
    // Delete the category using context method
    deleteNoteCategory(categoryId);
    
    // If the deleted category was active, set a new active category
    if (activeTabIndex === categoryIndex) {
      const newIndex = Math.min(categoryIndex, notes.length - 2); // -2 because we're deleting one
      setActiveTabIndex(newIndex);
      
      // Set an active note from the new category if available
      const nextCategory = notes[newIndex === categoryIndex ? newIndex - 1 : newIndex];
      if (nextCategory?.notes.length > 0) {
        setActiveNoteId(nextCategory.notes[0].id);
      } else {
        setActiveNoteId(null);
      }
    }
    
    toast({
      title: "Category deleted",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  // Filter notes based on search term
  const getFilteredNotes = (): Note[] => {
    const category = getActiveCategory();
    if (!category) return [];
    
    if (!searchTerm) return category.notes;
    
    const term = searchTerm.toLowerCase();
    return category.notes.filter(note => 
      note.title.toLowerCase().includes(term) || 
      note.content.toLowerCase().includes(term)
    );
  };

  // Format date for display
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // JSX for the notes view (right panel)
  const renderNoteView = () => {
    const note = getActiveNote();
    
    if (!note) {
      return (
        <VStack spacing={4} justify="center" height="100%" p={4}>
          <Text color="gray.500" fontSize="lg">Select a note or create a new one</Text>
          <Button 
            leftIcon={<Plus />} 
            colorScheme="brand" 
            onClick={handleCreateNote}
          >
            Create Note
          </Button>
        </VStack>
      );
    }
    
    if (editMode) {
      return (
        <VStack spacing={4} align="stretch" p={4} height="100%">
          <Input
            placeholder="Note Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            size="lg"
            fontWeight="bold"
            bg="gray.800"
            borderColor="gray.700"
            _hover={{ borderColor: "gray.600" }}
            _focus={{ borderColor: "brand.500" }}
            color="gray.200"
          />
          
          <Textarea
            placeholder="Write your note here..."
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            flex="1"
            minHeight="300px"
            resize="vertical"
            bg="gray.800"
            borderColor="gray.700"
            _hover={{ borderColor: "gray.600" }}
            _focus={{ borderColor: "brand.500" }}
            color="gray.300"
          />
          
          <HStack spacing={4} justifyContent="flex-end">
            <Button 
              onClick={handleCancelEdit} 
              variant="ghost" 
              color="gray.400"
              _hover={{ bg: "gray.700" }}
            >
              Cancel
            </Button>
            <Button 
              leftIcon={<Save />} 
              colorScheme="brand" 
              onClick={handleSaveNote}
            >
              Save
            </Button>
          </HStack>
        </VStack>
      );
    }
    
    return (
      <VStack spacing={4} align="stretch" p={4} height="100%">
        <HStack justifyContent="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="2xl" fontWeight="bold" color="gray.200">{note.title}</Text>
            <HStack spacing={1}>
              <Clock size={14} className="text-gray-500" />
              <Text fontSize="xs" color="gray.500">
                Last edited: {formatDate(note.lastEdited)}
              </Text>
            </HStack>
          </VStack>
          
          <HStack>
            <Tooltip label="Edit Note">
              <IconButton
                aria-label="Edit Note"
                icon={<Edit />}
                size="sm"
                colorScheme="brand"
                variant="ghost"
                onClick={handleEditNote}
              />
            </Tooltip>
            <Tooltip label="Delete Note">
              <IconButton
                aria-label="Delete Note"
                icon={<Trash />}
                size="sm"
                colorScheme="accent"
                variant="ghost"
                onClick={() => openDeleteDialog('note', note.id)}
              />
            </Tooltip>
          </HStack>
        </HStack>
        
        <Divider borderColor="gray.700" />
        
        <Box flex="1" overflowY="auto" whiteSpace="pre-wrap" color="gray.300">
          {note.content || <Text color="gray.500" fontStyle="italic">No content</Text>}
        </Box>
      </VStack>
    );
  };

  return (
    <Box p={4} height="600px">
      <Flex direction="column" height="100%">
        {/* Top Action Bar */}
        <HStack spacing={4} mb={4}>
          <InputGroup maxWidth="300px">
            <InputLeftAddon bg="gray.700" borderColor="gray.600">
              <Search size={18} className="text-gray-400" />
            </InputLeftAddon>
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="gray.800" 
              borderColor="gray.700"
              _hover={{ borderColor: "gray.600" }}
              _focus={{ borderColor: "brand.500" }}
              color="gray.300"
            />
          </InputGroup>
          <Spacer />
          <Button 
            leftIcon={<Plus />}
            colorScheme="brand"
            onClick={handleCreateNote}
          >
            New Note
          </Button>
          <Button 
            leftIcon={<FolderPlus />}
            variant="outline"
            colorScheme="brand"
            onClick={handleCreateCategory}
          >
            New Category
          </Button>
        </HStack>
        
        {/* Main Content Area */}
        <Flex height="100%" gap={4} overflow="hidden">
          {/* Categories and Notes List (Left Side) */}
          <Box width="300px" borderWidth="1px" borderRadius="md" height="100%" borderColor="gray.700" bg="gray.800">
            <Tabs 
              orientation="vertical" 
              index={activeTabIndex} 
              onChange={setActiveTabIndex} 
              height="100%"
              colorScheme="brand"
              display="flex"
            >
              <TabList borderRight="1px solid" borderColor="gray.700" minWidth="150px">
                {notes.map((category, index) => (
                  <Tab 
                    key={category.id} 
                    justifyContent="space-between" 
                    position="relative"
                    _selected={{ color: 'brand.400', bg: 'gray.750', fontWeight: 'semibold' }}
                    _hover={{ bg: 'gray.750' }}
                    color="gray.400"
                  >
                    <Text isTruncated>{category.name}</Text>
                    <Badge ml={2} colorScheme="brand" borderRadius="full">
                      {category.notes.length}
                    </Badge>
                    
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<MoreVertical size={14} />}
                        variant="ghost"
                        size="xs"
                        position="absolute"
                        right="2"
                        top="50%"
                        transform="translateY(-50%)"
                        onClick={(e) => e.stopPropagation()}
                        display="none"
                        _groupHover={{ display: 'flex' }}
                        color="gray.400"
                        _hover={{ bg: "gray.700" }}
                      />
                      <MenuList bg="gray.800" borderColor="gray.700">
                        <MenuItem 
                          icon={<Edit size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCategory(category.id);
                          }}
                          bg="gray.800"
                          _hover={{ bg: 'gray.700' }}
                          color="gray.300"
                        >
                          Rename
                        </MenuItem>
                        <MenuItem 
                          icon={<Trash size={14} />}
                          color="accent.400"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog('category', category.id);
                          }}
                          bg="gray.800"
                          _hover={{ bg: 'gray.700' }}
                        >
                          Delete
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Tab>
                ))}
              </TabList>
              
              <TabPanels flex="1" overflowY="auto">
                {notes.map((category) => (
                  <TabPanel key={category.id} p={0} height="100%">
                    {getFilteredNotes().length === 0 ? (
                      <VStack justify="center" height="100%" spacing={4} p={4}>
                        <Text color="gray.500">No notes in this category</Text>
                        <Button 
                          leftIcon={<Plus />}
                          colorScheme="brand" 
                          size="sm"
                          onClick={handleCreateNote}
                        >
                          Create Note
                        </Button>
                      </VStack>
                    ) : (
                      <ScrollArea className="h-full">
                        <VStack spacing={0} align="stretch">
                          {getFilteredNotes().map((note) => (
                            <Box
                              key={note.id}
                              p={3}
                              borderBottomWidth="1px"
                              borderColor="gray.700"
                              cursor="pointer"
                              bg={activeNoteId === note.id ? 'gray.750' : 'transparent'}
                              _hover={{ bg: 'gray.750' }}
                              onClick={() => setActiveNoteId(note.id)}
                              role="group"
                            >
                              <HStack justify="space-between">
                                <VStack spacing={0} align="start">
                                  <HStack>
                                    <FileText size={14} className="text-gray-400" />
                                    <Text fontWeight="medium" isTruncated color="gray.300">
                                      {note.title}
                                    </Text>
                                  </HStack>
                                  <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                    {formatDate(note.lastEdited)}
                                  </Text>
                                </VStack>
                                <IconButton
                                  aria-label="Delete note"
                                  icon={<Trash size={14} />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="accent"
                                  opacity={0}
                                  _groupHover={{ opacity: 1 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteDialog('note', note.id);
                                  }}
                                />
                              </HStack>
                            </Box>
                          ))}
                        </VStack>
                      </ScrollArea>
                    )}
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          </Box>
          
          {/* Note Content (Right Side) */}
          <Box 
            flex="1" 
            borderWidth="1px" 
            borderRadius="md" 
            height="100%" 
            overflow="hidden"
            borderColor="gray.700"
            bg="gray.800"
          >
            {renderNoteView()}
          </Box>
        </Flex>
      </Flex>
      
      {/* Category Edit/Create Modal */}
      <Modal isOpen={isCategoryModalOpen} onClose={closeCategoryModal}>
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.700">
          <ModalHeader color="gray.200">
            {isEditingCategory ? 'Edit Category' : 'New Category'}
          </ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <Input
              placeholder="Category Name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              bg="gray.700"
              borderColor="gray.600"
              _hover={{ borderColor: "brand.400" }}
              _focus={{ borderColor: "brand.500" }}
              color="gray.200"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeCategoryModal} color="gray.400" _hover={{ bg: "gray.700" }}>
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={handleSaveCategory}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800" borderColor="gray.700">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="gray.200">
              Delete {itemToDelete.type === 'note' ? 'Note' : 'Category'}
            </AlertDialogHeader>

            <AlertDialogBody color="gray.300">
              Are you sure? This action cannot be undone.
              {itemToDelete.type === 'category' && (
                <Text color="accent.400" mt={2}>
                  All notes in this category will be deleted!
                </Text>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button 
                ref={cancelRef} 
                onClick={() => setIsDeleteDialogOpen(false)}
                variant="ghost"
                color="gray.400"
                _hover={{ bg: "gray.700" }}
              >
                Cancel
              </Button>
              <Button colorScheme="accent" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default Notes;