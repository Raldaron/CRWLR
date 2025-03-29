import React, { useState, useRef } from 'react';
import {
  Box,
  Flex,
  SimpleGrid,
  Text,
  IconButton,
  Editable,
  EditableInput,
  EditablePreview,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
  Spacer,
} from '@chakra-ui/react';
import { Flame } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';
import SaveIndicator from '../common/SaveIndicator';

// Unified compact stat card component
const CompactStatCard = ({ 
  label, 
  current, 
  max, 
  color, 
  onClick 
}: { 
  label: string; 
  current: number; 
  max: number; 
  color: string;
  onClick: () => void;
}) => (
  <Box 
    onClick={onClick} 
    cursor="pointer"
    bg="gray.800"
    borderRadius="md"
    boxShadow="sm"
    p={2}
    textAlign="center"
    height="70px"
    display="flex"
    flexDirection="column"
    justifyContent="center"
    border="1px solid"
    borderColor="gray.700"
    transition="all 0.2s"
    _hover={{ shadow: 'md', borderColor: color }}
  >
    <Text fontSize="sm" fontWeight="semibold" color="gray.400">
      {label}
    </Text>
    <Text fontSize="md" fontWeight="bold">
      <Text as="span" color={color}>{current}</Text>
      {max > 0 && <Text as="span" color="gray.500">/{max}</Text>}
    </Text>
  </Box>
);

const CharacterHeader = () => {
  const { 
    currentStats, 
    equippedItems, 
    selectedRace, 
    selectedClass, 
    characterLevel,
    getMaxHp,
    getMaxMp,
    getMaxAp,
    characterName,
    setCharacterName,
    currentHp,
    setCurrentHp,
    currentMp,
    setCurrentMp,
    currentAp,
    setCurrentAp
  } = useCharacter();
  
  // Toast for feedback messages
  const toast = useToast();
  
  // State for the stat being edited in the modal
  const [editingStat, setEditingStat] = useState<'hp' | 'mp' | 'ap' | null>(null);
  const [tempValue, setTempValue] = useState<number>(0);
  
  // Modal controls
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Rest confirmation dialog controls
  const [isRestAlertOpen, setIsRestAlertOpen] = useState(false);
  const cancelRestRef = useRef<HTMLButtonElement>(null!);
  
  // Function to handle resting - restore HP, MP, and AP to max
  const handleRest = () => {
    setCurrentHp(getMaxHp());
    setCurrentMp(getMaxMp());
    setCurrentAp(getMaxAp());
    
    toast({
      title: "Fully Rested",
      description: "Your HP, MP, and AP have been restored to maximum.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  }

  // Open the rest confirmation dialog
  const onRestClick = () => {
    setIsRestAlertOpen(true);
  };
  
  // Calculate total AR from all equipped armor pieces
  const calculateTotalAR = () => {
    // Get base AR from race and class
    const raceAR = selectedRace?.armorrating || 0;
    const classAR = selectedClass?.armorrating || 0;
    
    // Calculate AR from equipped armor pieces
    const equippedAR = Object.values(equippedItems)
      .filter(item => item && 'armorRating' in item)
      .reduce((total, item) => total + (item?.armorRating || 0), 0);

    return raceAR + classAR + equippedAR;
  };

  // Calculate total Tank Modifier from equipped armor
  const calculateTotalTank = () => {
    return Object.values(equippedItems)
      .filter(item => item && 'tankModifier' in item)
      .reduce((total, item) => total + (item?.tankModifier || 0), 0);
  };

  const totalAR = calculateTotalAR();
  const totalTank = calculateTotalTank();
  
  // Calculate maximum values
  const maxHp = getMaxHp();
  const maxMp = getMaxMp();
  const maxAp = getMaxAp();
  
  // Function to open the edit modal for a specific stat
  const openStatEditor = (stat: 'hp' | 'mp' | 'ap') => {
    setEditingStat(stat);
    
    // Set the temp value based on which stat we're editing
    if (stat === 'hp') setTempValue(currentHp);
    else if (stat === 'mp') setTempValue(currentMp);
    else if (stat === 'ap') setTempValue(currentAp);
    
    onOpen();
  };
  
  // Function to save the edited stat value
  const saveStatValue = () => {
    if (editingStat === 'hp') setCurrentHp(tempValue);
    else if (editingStat === 'mp') setCurrentMp(tempValue);
    else if (editingStat === 'ap') setCurrentAp(tempValue);
    
    onClose();
  };
  
  // Get the modal title based on which stat is being edited
  const getModalTitle = () => {
    switch(editingStat) {
      case 'hp': return 'Adjust Current HP';
      case 'mp': return 'Adjust Current MP';
      case 'ap': return 'Adjust Current AP';
      default: return 'Adjust Value';
    }
  };
  
  // Get the maximum value for the current stat being edited
  const getCurrentMax = () => {
    switch(editingStat) {
      case 'hp': return maxHp;
      case 'mp': return maxMp;
      case 'ap': return maxAp;
      default: return 100;
    }
  };

  return (
    <Box mb={3}>
      {/* Character Name and Controls */}
      <Flex alignItems="center" mb={3}>
        <Editable
          value={characterName}
          onChange={setCharacterName}
          fontSize="xl"
          fontWeight="bold"
          placeholder="Click to add character name"
          flex="1"
          color="brand.300"
        >
          <EditablePreview
            _hover={{ bg: "gray.700" }}
            px={2}
            display="inline-block"
          />
          <EditableInput
            textAlign="left"
            bg="gray.700"
            borderColor="gray.600"
            _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px brand.500" }}
          />
        </Editable>
        
        <Spacer />
        
        {/* Add the Save Indicator */}
        <SaveIndicator />
        
        {/* Rest Button (Flame icon) */}
        <IconButton
          aria-label="Rest and restore"
          icon={<Flame />}
          colorScheme="accent"
          size="sm"
          onClick={onRestClick}
          title="Rest and restore all stats"
          ml={2}
        />
      </Flex>

      {/* Stat Cards */}
      <SimpleGrid columns={5} spacing={2} justifyContent="center">
        <CompactStatCard
          label="HP"
          current={currentHp}
          max={maxHp}
          color="accent.400"
          onClick={() => openStatEditor('hp')}
        />
        <CompactStatCard
          label="MP"
          current={currentMp}
          max={maxMp}
          color="brand.400"
          onClick={() => openStatEditor('mp')}
        />
        <CompactStatCard
          label="AP"
          current={currentAp}
          max={maxAp}
          color="purple.400"
          onClick={() => openStatEditor('ap')}
        />
        <CompactStatCard
          label="AR"
          current={totalAR}
          max={0}
          color="teal.400"
          onClick={() => {}}
        />
        <CompactStatCard
          label="Tank"
          current={totalTank}
          max={0}
          color="purple.300"
          onClick={() => {}}
        />
      </SimpleGrid>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xs">
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.700">
          <ModalHeader color="gray.100">{getModalTitle()}</ModalHeader>
          <ModalBody>
            <Text mb={4} color="gray.300">
              Adjust your current value (maximum: {getCurrentMax()})
            </Text>
            <NumberInput
              value={tempValue}
              onChange={(_, value) => setTempValue(value)}
              max={getCurrentMax()}
              min={0}
              keepWithinRange={true}
              borderColor="gray.600"
            >
              <NumberInputField bg="gray.700" _hover={{ borderColor: "brand.400" }} />
              <NumberInputStepper>
                <NumberIncrementStepper borderColor="gray.600" />
                <NumberDecrementStepper borderColor="gray.600" />
              </NumberInputStepper>
            </NumberInput>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} color="gray.300">
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={saveStatValue}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Rest Confirmation Dialog */}
      <AlertDialog
        isOpen={isRestAlertOpen}
        leastDestructiveRef={cancelRestRef}
        onClose={() => setIsRestAlertOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800" borderColor="gray.700">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="gray.100">
              End Day and Rest
            </AlertDialogHeader>

            <AlertDialogBody color="gray.300">
              Are you ready to end the day and rest? This will restore your HP, MP, and AP to maximum.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button 
                ref={cancelRestRef} 
                onClick={() => setIsRestAlertOpen(false)}
                variant="ghost"
                color="gray.300"
              >
                Cancel
              </Button>
              <Button 
                colorScheme="accent" 
                onClick={() => {
                  handleRest();
                  setIsRestAlertOpen(false);
                }} 
                ml={3}
              >
                Rest
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default CharacterHeader;