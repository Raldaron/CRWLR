// src/components/Layout/CharacterHeader.tsx

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
  ModalCloseButton,
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
  HStack,
  Tooltip
} from '@chakra-ui/react';
import { Flame, Coins, ShieldCheck, Zap, Star, Shield } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';
import SaveIndicator from '../common/SaveIndicator';
import type { WeaponItem } from '@/types/weapon';
import type { ArmorItem } from '@/types/armor';

// Type guard function to check if an item is an ArmorItem
function isArmorItem(item: WeaponItem | ArmorItem | null): item is ArmorItem {
  return item !== null && typeof item === 'object' && 'armorRating' in item;
}

function hasTankModifier(item: WeaponItem | ArmorItem | null): item is (WeaponItem | ArmorItem) & { tankModifier: number } {
  return item !== null && typeof item === 'object' && 'tankModifier' in item;
}

// Unified compact stat card component
const CompactStatCard = ({
  label,
  current,
  max,
  color,
  onClick,
  tooltipLabel,
  icon: IconComponent
}: {
  label: string;
  current: number;
  max?: number;
  color: string;
  onClick?: () => void;
  tooltipLabel?: string;
  icon: React.ElementType;
}) => (
  <Tooltip label={tooltipLabel} placement="bottom" isDisabled={!tooltipLabel} hasArrow bg="gray.700" color="white">
    <Box
      onClick={onClick}
      cursor={onClick ? "pointer" : "default"}
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
      _hover={onClick ? { shadow: 'md', borderColor: color } : {}}
    >
      <HStack justify="center" spacing={1} mb={1}>
        <IconComponent size={12} color={color} />
        <Text fontSize="sm" fontWeight="semibold" color="gray.400" whiteSpace="nowrap">
          {label}
        </Text>
      </HStack>
      <Text fontSize="md" fontWeight="bold" color={color}>
        {current}
        {max && max > 0 && <Text as="span" color="gray.500" fontSize="sm">/{max}</Text>}
      </Text>
    </Box>
  </Tooltip>
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
    setCurrentAp,
    gold
  } = useCharacter();

  const toast = useToast();
  const [editingStat, setEditingStat] = useState<'hp' | 'mp' | 'ap' | null>(null);
  const [tempValue, setTempValue] = useState<number>(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isRestAlertOpen, setIsRestAlertOpen] = useState(false);
  const cancelRestRef = useRef<HTMLButtonElement>(null!);

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
  };

  const onRestClick = () => {
    setIsRestAlertOpen(true);
  };

  const calculateTotalAR = () => {
    const raceAR = selectedRace?.armorrating || 0;
    const classAR = selectedClass?.armorrating || 0;
    const equippedAR = Object.values(equippedItems)
      .filter(isArmorItem)
      .reduce((total, item) => total + item.armorRating, 0);
    return raceAR + classAR + equippedAR;
  };

  const calculateTotalTank = () => {
    return Object.values(equippedItems)
      .filter(hasTankModifier)
      .reduce((total, item) => total + item.tankModifier, 0);
  };

  const totalAR = calculateTotalAR();
  const totalTank = calculateTotalTank();
  const maxHp = getMaxHp();
  const maxMp = getMaxMp();
  const maxAp = getMaxAp();

  const openStatEditor = (stat: 'hp' | 'mp' | 'ap') => {
    setEditingStat(stat);
    if (stat === 'hp') setTempValue(currentHp);
    else if (stat === 'mp') setTempValue(currentMp);
    else if (stat === 'ap') setTempValue(currentAp);
    onOpen();
  };

  const saveStatValue = () => {
    if (editingStat === 'hp') setCurrentHp(tempValue);
    else if (editingStat === 'mp') setCurrentMp(tempValue);
    else if (editingStat === 'ap') setCurrentAp(tempValue);
    onClose();
  };

  const getModalTitle = () => {
    switch(editingStat) {
      case 'hp': return 'Adjust Current HP';
      case 'mp': return 'Adjust Current MP';
      case 'ap': return 'Adjust Current AP';
      default: return 'Adjust Value';
    }
  };

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
      <Flex alignItems="center" mb={3}>
        <Editable
          value={characterName}
          onChange={setCharacterName}
          fontSize="xl"
          fontWeight="bold"
          placeholder="Click to add character name"
          flex="1"
          color="brand.300"
          mr={4}
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

        <SaveIndicator />

        <Tooltip label="Rest (Restore HP/MP/AP)" placement="bottom">
            <IconButton
                aria-label="Rest and restore"
                icon={<Flame />}
                colorScheme="accent"
                size="sm"
                onClick={onRestClick}
                ml={2}
            />
        </Tooltip>
      </Flex>

      <SimpleGrid columns={{ base: 3, md: 6 }} spacing={2} justifyContent="center">
        <CompactStatCard
          label="HP"
          current={currentHp}
          max={maxHp}
          color="accent.400"
          onClick={() => openStatEditor('hp')}
          icon={ShieldCheck}
          tooltipLabel="Hit Points"
        />
        <CompactStatCard
          label="MP"
          current={currentMp}
          max={maxMp}
          color="brand.400"
          onClick={() => openStatEditor('mp')}
          icon={Zap}
          tooltipLabel="Mana Points"
        />
        <CompactStatCard
          label="AP"
          current={currentAp}
          max={maxAp}
          color="purple.400"
          onClick={() => openStatEditor('ap')}
          icon={Star}
          tooltipLabel="Action Points"
        />
        <CompactStatCard
          label="Gold"
          current={gold || 0}
          color="yellow.400"
          icon={Coins}
          tooltipLabel="Your current gold amount"
        />
        <CompactStatCard
          label="AR"
          current={totalAR}
          color="teal.400"
          icon={Shield}
          tooltipLabel="Armor Rating"
        />
        <CompactStatCard
          label="Tank"
          current={totalTank}
          color="orange.400"
          icon={Shield}
          tooltipLabel="Tank Modifier"
        />
      </SimpleGrid>

      <Modal isOpen={isOpen} onClose={onClose} size="xs">
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.700">
          <ModalHeader color="gray.100">{getModalTitle()}</ModalHeader>
           <ModalCloseButton color="gray.400" />
          <ModalBody>
            <Text mb={4} color="gray.300">
              Adjust current value (Max: {getCurrentMax()})
            </Text>
            <NumberInput
              value={tempValue}
              onChange={(_, value) => setTempValue(value)}
              max={getCurrentMax()}
              min={0}
              keepWithinRange={true}
              borderColor="gray.600"
            >
              <NumberInputField bg="gray.700" _hover={{ borderColor: "brand.400" }} color="gray.100" />
              <NumberInputStepper>
                <NumberIncrementStepper borderColor="gray.600" color="gray.400" _hover={{bg: "gray.600"}}/>
                <NumberDecrementStepper borderColor="gray.600" color="gray.400" _hover={{bg: "gray.600"}}/>
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

      <AlertDialog
        isOpen={isRestAlertOpen}
        leastDestructiveRef={cancelRestRef}
        onClose={() => setIsRestAlertOpen(false)}
         isCentered
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
                 _hover={{ bg: "gray.700" }}
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