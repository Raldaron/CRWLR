// src/components/actions/AttackManager.tsx
import React, { useEffect, useState } from 'react';
import { Box, SimpleGrid, Text, VStack, Center, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useCharacter } from '@/context/CharacterContext';
import AttackCard from '@/components/ItemCards/AttackCard';
import AttackDetailModal from '@/components/Modals/AttackDetailModal';
import type { Attack } from '@/types/attack';
import type { WeaponItem } from '@/types/weapon';
import { ScrollArea } from '@/components/ui/scroll-area';

const AttackManager: React.FC = () => {
  const { equippedItems } = useCharacter();
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAttack, setSelectedAttack] = useState<Attack | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to create an attack from a weapon with complete data
  const createAttackFromWeapon = (weapon: WeaponItem, slotName: string): Attack => {
    console.log(`Creating attack from weapon:`, weapon);
    
    // Set reasonable defaults for any missing properties
    const weaponType = weapon.weaponType || 'Unknown';
    const damageType = weapon.damageType || 'Physical';
    const meleeRanged = weapon.meleeRanged || 'Melee';
    const handsRequired = weapon.handsRequired || 'One-handed';
    const magicNonMagical = weapon.magicNonMagical || 'Non-Magical';
    
    // For ranged weapons, set a default range based on weapon type
    const range = meleeRanged === 'Ranged' 
      ? (weaponType.toLowerCase().includes('bow') ? '60 ft' : 
         weaponType.toLowerCase().includes('gun') ? '90 ft' : '30 ft') 
      : 'Melee';
    
    // Map weapon slot to attack slot
    const slot = slotName === 'Primary' ? 'primaryWeapon' : 'secondaryWeapon';
    
    return {
      id: `${weapon.id}-${slot}-attack`,
      weaponId: weapon.id,
      name: `${weapon.name}${slotName ? ` (${slotName})` : ''}`,
      description: weapon.description || `Attack with your ${weapon.name}`,
      damageAmount: weapon.damageAmount || '1d6',
      damageType: damageType,
      meleeRanged: meleeRanged as 'Melee' | 'Ranged',
      weaponType: weaponType,
      handsRequired: handsRequired,
      slot: slot as 'primaryWeapon' | 'secondaryWeapon',
      range: range,
      magicNonMagical: magicNonMagical as 'Magical' | 'Non-Magical',
      abilities: weapon.abilities || [],
      traits: weapon.traits || [],
      statBonus: weapon.statBonus || {},
      skillBonus: weapon.skillBonus || {},
      isCustom: false
    };
  };

  // Fetch complete weapon data from Firestore
  const fetchWeaponData = async (weaponId: string): Promise<WeaponItem | null> => {
    try {
      const weaponRef = doc(db, 'weapons', weaponId);
      const weaponSnap = await getDoc(weaponRef);
      
      if (weaponSnap.exists()) {
        const data = weaponSnap.data() as WeaponItem;
        console.log(`Fetched complete weapon data for ${data.name}:`, data);
        
        // Ensure we have the document ID
        return {
          ...data,
          id: weaponSnap.id
        };
      } else {
        console.warn(`Weapon with ID ${weaponId} not found in Firestore`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching weapon data for ID ${weaponId}:`, error);
      return null;
    }
  };

  useEffect(() => {
    const generateAttacks = async () => {
      setIsLoading(true);
      const newAttacks: Attack[] = [];
      
      // Process primary weapon if equipped
      if (equippedItems.primaryWeapon) {
        const primaryWeapon = equippedItems.primaryWeapon;
        
        // Check if we need to fetch complete data
        const needsCompleteData = !primaryWeapon.weaponType || !primaryWeapon.damageType || !primaryWeapon.meleeRanged;
        
        if (needsCompleteData) {
          console.log(`Primary weapon (${primaryWeapon.name}) has incomplete data. Fetching from Firestore...`);
          const completeWeapon = await fetchWeaponData(primaryWeapon.id);
          
          if (completeWeapon) {
            newAttacks.push(createAttackFromWeapon(completeWeapon, 'Primary'));
          } else {
            // Use existing incomplete data as fallback
            newAttacks.push(createAttackFromWeapon(primaryWeapon, 'Primary'));
          }
        } else {
          // Use existing data if it's complete
          newAttacks.push(createAttackFromWeapon(primaryWeapon, 'Primary'));
        }
      }
      
      // Process secondary weapon if equipped
      if (equippedItems.secondaryWeapon) {
        const secondaryWeapon = equippedItems.secondaryWeapon;
        
        // Check if we need to fetch complete data
        const needsCompleteData = !secondaryWeapon.weaponType || !secondaryWeapon.damageType || !secondaryWeapon.meleeRanged;
        
        if (needsCompleteData) {
          console.log(`Secondary weapon (${secondaryWeapon.name}) has incomplete data. Fetching from Firestore...`);
          const completeWeapon = await fetchWeaponData(secondaryWeapon.id);
          
          if (completeWeapon) {
            newAttacks.push(createAttackFromWeapon(completeWeapon, 'Secondary'));
          } else {
            // Use existing incomplete data as fallback
            newAttacks.push(createAttackFromWeapon(secondaryWeapon, 'Secondary'));
          }
        } else {
          // Use existing data if it's complete
          newAttacks.push(createAttackFromWeapon(secondaryWeapon, 'Secondary'));
        }
      }
      
      setAttacks(newAttacks);
      setIsLoading(false);
    };

    generateAttacks();
  }, [equippedItems]);

  const handleAttackClick = (attack: Attack) => {
    setSelectedAttack(attack);
    setIsModalOpen(true);
  };

  // Show loading state if needed
  if (isLoading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" />
          <Text color="gray.300">Loading attacks...</Text>
        </VStack>
      </Center>
    );
  }

  // No attacks message
  if (attacks.length === 0) {
    return (
      <Center h="300px">
        <VStack spacing={3}>
          <Alert status="info" variant="subtle" borderRadius="md" bg="blue.900" color="gray.100">
            <AlertIcon color="blue.300" />
            <Text>No attacks available. Equip weapons to create attacks.</Text>
          </Alert>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={4}>
      <ScrollArea className="h-[600px]">
        <SimpleGrid columns={[1, 2, 3]} spacing={4}>
          {attacks.map((attack) => (
            <AttackCard
              key={attack.id}
              attack={attack}
              onClick={() => handleAttackClick(attack)}
            />
          ))}
        </SimpleGrid>
      </ScrollArea>

      <AttackDetailModal
        attack={selectedAttack}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Box>
  );
};

export default AttackManager;