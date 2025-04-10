// components/actions/Attacks.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  Center,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCharacter } from '@/context/CharacterContext';
import AttackCard from '@/components/ItemCards/AttackCard';
import AttackDetailModal from '@/components/Modals/AttackDetailModal';
import type { Attack } from '@/types/attack';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

const Attacks: React.FC = () => {
  const { equippedItems } = useCharacter();
  const [isLoading, setIsLoading] = useState(true);
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [selectedAttack, setSelectedAttack] = useState<Attack | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generate attacks whenever equipped weapons change
  useEffect(() => {
    const generateAttacks = async () => {
      setIsLoading(true);
      const attacksList: Attack[] = [];
      
      try {
        // Process primary weapon
        if (equippedItems.primaryWeapon) {
          const primaryWeapon = equippedItems.primaryWeapon;
          
          // Check if the weapon data is complete
          const needsMoreData = !primaryWeapon.weaponType || !primaryWeapon.damageType || !primaryWeapon.meleeRanged;
          let weaponData = primaryWeapon;
          
          // If we're missing critical data, try to fetch it
          if (needsMoreData) {
            try {
              const weaponDoc = await getDoc(doc(db, 'weapons', primaryWeapon.id));
              if (weaponDoc.exists()) {
                const freshData = weaponDoc.data();
                // Merge the fresh data with our existing weapon data
                weaponData = {
                  ...primaryWeapon,
                  weaponType: freshData.weaponType || primaryWeapon.weaponType || 'Unknown',
                  damageType: freshData.damageType || primaryWeapon.damageType || 'Physical',
                  meleeRanged: freshData.meleeRanged || primaryWeapon.meleeRanged || 'Melee',
                  handsRequired: freshData.handsRequired || primaryWeapon.handsRequired || 'One-handed',
                  magicNonMagical: freshData.magicNonMagical || primaryWeapon.magicNonMagical || 'Non-Magical'
                };
              }
            } catch (error) {
              console.error("Error fetching complete weapon data:", error);
            }
          }
          
          // Create the attack with whatever data we have
          attacksList.push(createAttackFromWeapon(weaponData, 'Primary'));
        }
        
        // Process secondary weapon
        if (equippedItems.secondaryWeapon) {
          const secondaryWeapon = equippedItems.secondaryWeapon;
          
          // Check if the weapon data is complete
          const needsMoreData = !secondaryWeapon.weaponType || !secondaryWeapon.damageType || !secondaryWeapon.meleeRanged;
          let weaponData = secondaryWeapon;
          
          // If we're missing critical data, try to fetch it
          if (needsMoreData) {
            try {
              const weaponDoc = await getDoc(doc(db, 'weapons', secondaryWeapon.id));
              if (weaponDoc.exists()) {
                const freshData = weaponDoc.data();
                // Merge the fresh data with our existing weapon data
                weaponData = {
                  ...secondaryWeapon,
                  weaponType: freshData.weaponType || secondaryWeapon.weaponType || 'Unknown',
                  damageType: freshData.damageType || secondaryWeapon.damageType || 'Physical',
                  meleeRanged: freshData.meleeRanged || secondaryWeapon.meleeRanged || 'Melee',
                  handsRequired: freshData.handsRequired || secondaryWeapon.handsRequired || 'One-handed',
                  magicNonMagical: freshData.magicNonMagical || secondaryWeapon.magicNonMagical || 'Non-Magical'
                };
              }
            } catch (error) {
              console.error("Error fetching complete weapon data:", error);
            }
          }
          
          // Create the attack with whatever data we have
          attacksList.push(createAttackFromWeapon(weaponData, 'Secondary'));
        }
        
        setAttacks(attacksList);
      } catch (error) {
        console.error("Error generating attacks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    generateAttacks();
  }, [equippedItems]);

  // Function to create attack from weapon
  const createAttackFromWeapon = (weapon: any, slot: string) => {
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
    
    const slotForAttack = slot === 'Primary' ? 'primaryWeapon' : 'secondaryWeapon';
    
    return {
      id: `${weapon.id}-${slotForAttack}-attack`,
      weaponId: weapon.id,
      name: `${weapon.name} (${slot})`,
      description: weapon.description || `Attack with your ${weapon.name}`,
      damageAmount: weapon.damageAmount || '1d6',
      damageType: damageType,
      meleeRanged: meleeRanged as 'Melee' | 'Ranged',
      weaponType: weaponType,
      handsRequired: handsRequired,
      slot: slotForAttack as 'primaryWeapon' | 'secondaryWeapon',
      range: range,
      magicNonMagical: magicNonMagical as 'Magical' | 'Non-Magical',
      abilities: weapon.abilities || [],
      traits: weapon.traits || [],
      statBonus: weapon.statBonus || {},
      skillBonus: weapon.skillBonus || {},
      isCustom: false
    };
  };

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

export default Attacks;