import React, { useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  Input,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Tooltip,
  useToast
} from '@chakra-ui/react';
import { 
  Coins, 
  Plus, 
  Minus, 
  Edit, 
  ArrowUp, 
  ArrowDown, 
  Clock 
} from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';
import { useDM } from '@/context/DMContext';
import { ScrollArea } from '@/components/ui/scroll-area';

const GoldManagement: React.FC = () => {
  const { 
    gold, 
    addGold, 
    subtractGold, 
    setGold,
    goldTransactionHistory 
  } = useCharacter();
  const { isDM } = useDM();
  const toast = useToast();

  // State for modals
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const { 
    isOpen: isAddOpen, 
    onOpen: onAddOpen, 
    onClose: onAddClose 
  } = useDisclosure();
  const { 
    isOpen: isSubtractOpen, 
    onOpen: onSubtractOpen, 
    onClose: onSubtractClose 
  } = useDisclosure();
  const { 
    isOpen: isSetOpen, 
    onOpen: onSetOpen, 
    onClose: onSetClose 
  } = useDisclosure();

  // Validation and action handlers
  const validateAndExecute = (
    action: 'add' | 'subtract' | 'set', 
    executeAction: () => void
  ) => {
    const goldAmount = parseFloat(amount);
    
    // Validate amount
    if (isNaN(goldAmount)) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid number.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate reason
    if (!reason.trim()) {
      toast({
        title: 'Missing Reason',
        description: 'Please provide a reason for the transaction.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Execute the action
    executeAction();

    // Reset modal state
    setAmount('');
    setReason('');
    
    // Close the appropriate modal
    switch(action) {
      case 'add':
        onAddClose();
        break;
      case 'subtract':
        onSubtractClose();
        break;
      case 'set':
        onSetClose();
        break;
    }
  };

  // Authorization check
  if (!isDM) {
    return (
      <Box p={4} textAlign="center" bg="gray.800" borderRadius="md">
        <Text color="gray.400">
          Gold management is restricted to Dungeon Masters.
        </Text>
      </Box>
    );
  }

  // Date formatting utility
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box p={4} bg="gray.800" borderRadius="md" boxShadow="md">
      {/* Gold Summary */}
      <HStack 
        justify="space-between" 
        align="center" 
        mb={4} 
        bg="gray.750" 
        p={3} 
        borderRadius="md"
      >
        <HStack spacing={3}>
          <Coins className="text-yellow-400" size={24} />
          <Text fontSize="2xl" fontWeight="bold" color="gray.200">
            {gold} Gold
          </Text>
        </HStack>
        
        <HStack spacing={2}>
          <Tooltip label="Add Gold">
            <Button 
              size="sm" 
              colorScheme="green" 
              onClick={onAddOpen}
              leftIcon={<Plus size={16} />}
            >
              Add
            </Button>
          </Tooltip>
          <Tooltip label="Subtract Gold">
            <Button 
              size="sm" 
              colorScheme="red" 
              onClick={onSubtractOpen}
              leftIcon={<Minus size={16} />}
            >
              Subtract
            </Button>
          </Tooltip>
          <Tooltip label="Set Gold Amount">
            <Button 
              size="sm" 
              colorScheme="brand" 
              onClick={onSetOpen}
              leftIcon={<Edit size={16} />}
            >
              Set
            </Button>
          </Tooltip>
        </HStack>
      </HStack>

      {/* Transaction History */}
      <Box 
        bg="gray.750" 
        borderRadius="md" 
        p={3}
      >
        <Text 
          fontSize="md" 
          fontWeight="bold" 
          color="gray.300" 
          mb={2}
          display="flex" 
          alignItems="center"
        >
          <Clock className="mr-2" size={16} /> Transaction History
        </Text>
        <ScrollArea className="h-[300px]">
          <Table variant="simple" size="sm">
            <Thead bg="gray.700" position="sticky" top={0}>
              <Tr>
                <Th color="gray.300" w="20%">Amount</Th>
                <Th color="gray.300" w="40%">Reason</Th>
                <Th color="gray.300" w="40%">Details</Th>
              </Tr>
            </Thead>
            <Tbody>
              {goldTransactionHistory.slice().reverse().map((transaction, index) => (
                <Tr 
                  key={index} 
                  bg={transaction.amount > 0 ? 'green.900' : 'red.900'}
                  color="white"
                >
                  <Td>
                    <HStack>
                      {transaction.amount > 0 ? <ArrowUp color="green" size={16} /> : <ArrowDown color="red" size={16} />}
                      <Badge 
                        colorScheme={transaction.amount > 0 ? 'green' : 'red'}
                      >
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </Badge>
                    </HStack>
                  </Td>
                  <Td>{transaction.reason}</Td>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs">{formatDate(transaction.timestamp)}</Text>
                      <Text fontSize="2xs" color="gray.400">By: {transaction.by}</Text>
                    </VStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </ScrollArea>
      </Box>

      {/* Add Gold Modal */}
      <Modal isOpen={isAddOpen} onClose={onAddClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader color="gray.200">Add Gold</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Input 
                placeholder="Amount of Gold" 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                bg="gray.700"
                borderColor="gray.600"
              />
              <Input 
                placeholder="Reason for Gold Addition" 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                bg="gray.700"
                borderColor="gray.600"
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="green" 
              onClick={() => validateAndExecute('add', () => addGold(parseFloat(amount), reason.trim()))}
            >
              Add Gold
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Subtract Gold Modal */}
      <Modal isOpen={isSubtractOpen} onClose={onSubtractClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader color="gray.200">Subtract Gold</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Input 
                placeholder="Amount of Gold" 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                bg="gray.700"
                borderColor="gray.600"
              />
              <Input 
                placeholder="Reason for Gold Subtraction" 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                bg="gray.700"
                borderColor="gray.600"
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="red" 
              onClick={() => validateAndExecute('subtract', () => subtractGold(parseFloat(amount), reason.trim()))}
            >
              Subtract Gold
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Set Gold Modal */}
      <Modal isOpen={isSetOpen} onClose={onSetClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader color="gray.200">Set Gold</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Input 
                placeholder="Set Gold Amount" 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                bg="gray.700"
                borderColor="gray.600"
              />
              <Input 
                placeholder="Reason for Gold Change" 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                bg="gray.700"
                borderColor="gray.600"
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="brand" 
              onClick={() => validateAndExecute('set', () => setGold(parseFloat(amount), reason.trim()))}
            >
              Set Gold
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default GoldManagement;