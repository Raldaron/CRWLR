// src/components/debug/InventoryDebugger.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  Heading,
  useToast,
  Divider,
  Code,
  Alert,
  AlertIcon,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@chakra-ui/react';
import { Trash, RefreshCcw, AlertTriangle, Info } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';

const InventoryDebugger: React.FC = () => {
  const { 
    inventory, 
    utilitySlots,
    saveCharacterManually,
    getInventoryByType 
  } = useCharacter();
  
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [storageData, setStorageData] = useState<string>("");
  
  // Check localStorage for any inventory data
  const checkLocalStorage = () => {
    try {
      const data = localStorage.getItem('dcw-character-state');
      if (data) {
        const parsed = JSON.parse(data);
        // Format the data nicely
        setStorageData(JSON.stringify({
          inventory: parsed.inventory || [],
          utilitySlots: parsed.utilitySlots || []
        }, null, 2));
        onOpen();
      } else {
        toast({
          title: "No Local Storage Data",
          description: "No character data found in local storage",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        setStorageData("");
      }
    } catch (error) {
      console.error("Error checking localStorage:", error);
      toast({
        title: "Error",
        description: "Could not read local storage data",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Clear just localStorage
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem('dcw-character-state');
      toast({
        title: "Local Storage Cleared",
        description: "Local character data has been cleared. Refresh the page to see changes.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error clearing localStorage:", error);
      toast({
        title: "Error",
        description: "Could not clear local storage data",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Force a manual save
  const forceSave = async () => {
    await saveCharacterManually();
    toast({
      title: "Force Save Complete",
      description: "Character data has been forcibly saved to Firebase",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const debugActions = [
    {
      label: 'Log Current Inventory',
      action: () => {
        console.log('Current Inventory:', inventory);
      }
    },
    {
      label: 'Test Type Filtering',
      action: () => {
        const types = ['Weapon', 'Armor', 'Potion', 'Scroll', 'Crafting Component'];
        types.forEach(type => {
          const items = getInventoryByType(type);
          console.log(`Items of type ${type}:`, items);
        });
      }
    },
  ];
  
  return (
    <Box p={4} bg="gray.900" borderRadius="md" borderWidth="1px" borderColor="red.700">
      <VStack spacing={4} align="stretch">
        <HStack>
          <AlertTriangle color="red" />
          <Heading size="md" color="red.400">Inventory Debugger</Heading>
        </HStack>
        
        <Alert status="warning">
          <AlertIcon />
          <AlertDescription>
            These are advanced debugging tools. Use with caution!
          </AlertDescription>
        </Alert>
        
        <Box>
          <Heading size="sm" mb={2} color="gray.300">Current Inventory State</Heading>
          <HStack>
            <Badge colorScheme="blue">{inventory.length} Items</Badge>
            <Badge colorScheme="green">
              {utilitySlots.filter(slot => slot.stack !== null).length} Utility Items
            </Badge>
          </HStack>
        </Box>
        
        <Divider borderColor="gray.700" />
        
        <VStack align="stretch" spacing={2}>
          <Button 
            leftIcon={<Info />}
            colorScheme="blue"
            size="sm"
            onClick={checkLocalStorage}
          >
            Check Local Storage
          </Button>
          
          <Button 
            leftIcon={<Trash />}
            colorScheme="orange"
            size="sm"
            onClick={clearLocalStorage}
          >
            Clear Local Storage Only
          </Button>
          
          <Button 
            leftIcon={<RefreshCcw />}
            colorScheme="green"
            size="sm"
            onClick={forceSave}
          >
            Force Save to Firebase
          </Button>
        </VStack>
        
        <Text fontSize="xs" color="gray.500" mt={2}>
          Note: After using these tools, you may need to refresh the page to see changes.
        </Text>

        <Box>
          <Text mb={2}>Current Item Count: {inventory.length}</Text>
          <Text mb={2}>Item Types Present:</Text>
          <Code p={2} display="block" whiteSpace="pre">
            {Array.from(new Set(inventory.map(item => item.item.itemType))).join('\n')}
          </Code>
        </Box>

        <VStack spacing={2}>
          {debugActions.map(({ label, action }) => (
            <Button 
              key={label}
              onClick={action}
              size="sm"
              colorScheme="purple"
              variant="outline"
            >
              {label}
            </Button>
          ))}
        </VStack>
      </VStack>
      
      {/* Modal for showing localStorage data */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader color="gray.200">Local Storage Data</ModalHeader>
          <ModalBody>
            <Box maxHeight="500px" overflowY="auto" p={2} bg="gray.900" borderRadius="md">
              <Code display="block" whiteSpace="pre" children={storageData} bg="transparent" color="gray.300" />
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button colorScheme="red" onClick={clearLocalStorage}>
              Clear Data
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default InventoryDebugger;