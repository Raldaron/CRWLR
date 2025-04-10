import React, { useState, useEffect } from 'react';
import {
  Box,
  SimpleGrid,
  VStack,
  Text,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Center
} from '@chakra-ui/react';
import { Sword } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';
import { WeaponCard } from '@/components/ItemCards/WeaponCard';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import type { WeaponItem } from '@/types/weapon';
import DarkThemedCard from '@/components/ui/DarkThemedCard';

// This represents a single weapon slot card
const WeaponSlot = ({ 
  title, 
  weapon, 
  onSelect,
  onUnequip
}: { 
  title: string;
  weapon: WeaponItem | null;
  onSelect: () => void;
  onUnequip?: () => void;
}) => (
  <DarkThemedCard
    onClick={onSelect}
    isSelected={weapon !== null}
    borderColor={weapon ? "brand.600" : "gray.700"}
    height="200px"
  >
    <VStack spacing={4} align="center" justify="center" h="full" position="relative">
      {weapon ? (
        // Show weapon info if equipped
        <>
          <Sword size={32} className="text-brand-400" />
          <Text fontWeight="bold" color="gray.200">{weapon.name}</Text>
          <Text fontSize="sm" color="gray.400">
            {weapon.damageAmount} {weapon.damageType} damage
          </Text>
          
          {/* Unequip button */}
          {onUnequip && (
            <Button
              size="xs"
              colorScheme="accent"
              position="absolute"
              top={2}
              right={2}
              onClick={(e) => {
                e.stopPropagation();
                onUnequip();
              }}
            >
              Unequip
            </Button>
          )}
        </>
      ) : (
        // Show empty slot message
        <>
          <Sword size={32} className="text-gray-500" />
          <Text color="gray.500">{title}</Text>
          <Button size="sm" colorScheme="brand">
            Equip Weapon
          </Button>
        </>
      )}
    </VStack>
  </DarkThemedCard>
);

// The main component
const WeaponsEquipment = () => {
  // Get inventory and equipment methods from context
  const { 
    getInventoryByType, 
    equippedItems,
    equipItem
  } = useCharacter();
  
  // State to track which slot we're equipping
  const [activeSlot, setActiveSlot] = useState<'primaryWeapon' | 'secondaryWeapon' | null>(null);
  
  // Loading state and weapons list
  const [isLoading, setIsLoading] = useState(false);
  const [weaponsList, setWeaponsList] = useState<WeaponItem[]>([]);
  
  // Modal control
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch weapons from Firestore when needed
  useEffect(() => {
    // Only fetch when modal is opened
    if (!isOpen) return;
    
    const fetchWeapons = async () => {
      setIsLoading(true);
      try {
        const weaponsCollection = collection(db, 'weapons');
        const weaponSnapshot = await getDocs(weaponsCollection);
        const weapons: WeaponItem[] = [];
        
        weaponSnapshot.forEach(doc => {
          const data = doc.data() as WeaponItem;
          weapons.push({
            ...data,
            id: doc.id, // Ensure we have the document ID
            itemType: 'Weapon' // Ensure we have the correct item type
          });
        });
        
        setWeaponsList(weapons);
      } catch (error) {
        console.error('Error fetching weapons:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWeapons();
  }, [isOpen]);

  // Get weapons from inventory
  const myWeapons = getInventoryByType('Weapon').filter(
    (item): item is { item: WeaponItem; quantity: number } => 
    item.item.itemType === 'Weapon'
  );

  // Handle opening the weapon selection modal
  const handleSlotClick = (slot: 'primaryWeapon' | 'secondaryWeapon') => {
    setActiveSlot(slot);
    onOpen();
  };

  // Handle equipping a weapon
  const handleWeaponSelect = (weapon: WeaponItem) => {
    if (activeSlot) {
      equipItem(activeSlot, weapon);
      onClose();
    }
  };

  // Handle unequipping a weapon
  const handleUnequip = (slot: 'primaryWeapon' | 'secondaryWeapon') => {
    equipItem(slot, null);
  };

  return (
    <Box p={4} bg="gray.900">
      {/* Weapon Slots */}
      <SimpleGrid columns={2} spacing={6}>
        <Box position="relative">
          <WeaponSlot
            title="Primary Weapon Slot"
            weapon={equippedItems.primaryWeapon}
            onSelect={() => handleSlotClick('primaryWeapon')}
            onUnequip={() => handleUnequip('primaryWeapon')}
          />
        </Box>
        <Box position="relative">
          <WeaponSlot
            title="Secondary Weapon Slot"
            weapon={equippedItems.secondaryWeapon}
            onSelect={() => handleSlotClick('secondaryWeapon')}
            onUnequip={() => handleUnequip('secondaryWeapon')}
          />
        </Box>
      </SimpleGrid>

      {/* Weapon Selection Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.700">
          <ModalHeader color="gray.200">
            Select {activeSlot === 'primaryWeapon' ? 'Primary' : 'Secondary'} Weapon
          </ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={6}>
            {isLoading ? (
              <Center py={6}>
                <Spinner size="xl" color="brand.400" />
              </Center>
            ) : (
              <SimpleGrid columns={[1, 2, 3]} spacing={4}>
                {myWeapons.length === 0 ? (
                  <Text color="gray.400" p={4}>No weapons available in inventory</Text>
                ) : (
                  myWeapons.map((inventoryItem) => (
                    <Box 
                      key={inventoryItem.item.id}
                      onClick={() => handleWeaponSelect(inventoryItem.item)}
                      cursor="pointer"
                    >
                      <WeaponCard
                        item={inventoryItem.item}
                        onClick={() => handleWeaponSelect(inventoryItem.item)}
                      />
                    </Box>
                  ))
                )}
              </SimpleGrid>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default WeaponsEquipment;