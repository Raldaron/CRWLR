'use client';
import React, { useState, useEffect } from 'react';
import { Box, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCharacter } from '@/context/CharacterContext';
import AttackCard, { Attack } from '@/components/ItemCards/AttackCard';
import AttackDetailModal from '@/components/Modals/AttackDetailModal';
import type { WeaponItem } from '@/types/weapon';

const Attacks: React.FC = () => {
  const { equippedItems } = useCharacter();
  const [attacks, setAttacks] = useState<Attack[]>([]);

  // Generate attacks based on equipped weapons
  useEffect(() => {
    const weaponAttacks: Attack[] = [];
    
    // Process primary weapon
    if (equippedItems.primaryWeapon) {
      const primaryWeapon = equippedItems.primaryWeapon;
      weaponAttacks.push(createAttackFromWeapon(primaryWeapon, 'Primary'));
    }
    
    // Process secondary weapon
    if (equippedItems.secondaryWeapon) {
      const secondaryWeapon = equippedItems.secondaryWeapon;
      weaponAttacks.push(createAttackFromWeapon(secondaryWeapon, 'Secondary'));
    }
    
    setAttacks(weaponAttacks);
  }, [equippedItems]);

  // Helper function to create an attack from a weapon
  const createAttackFromWeapon = (weapon: WeaponItem, slot: string): Attack => {
    // Calculate range based on weapon type
    const range = weapon.meleeRanged === 'Ranged' 
      ? (weapon.weaponType.toLowerCase().includes('bow') ? '60 ft' : 
         weapon.weaponType.toLowerCase().includes('gun') ? '90 ft' : '30 ft')
      : 'Melee';

    // Create attack object
    return {
      id: `${weapon.id}-attack`,
      name: `${weapon.name} Attack`,
      description: `Attack with your ${weapon.name}`,
      damageAmount: weapon.damageAmount,
      damageType: weapon.damageType,
      range: range,
      weaponType: weapon.weaponType,
      weaponId: weapon.id,
      apCost: 1, // Default AP cost
      sourceItem: `${slot} Weapon: ${weapon.name}`,
      // Add the missing properties
      traits: weapon.traits || [],
      abilities: weapon.abilities || []
    };
  };

  const [selectedAttack, setSelectedAttack] = useState<Attack | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAttackClick = (attack: Attack) => {
    setSelectedAttack(attack);
    setIsModalOpen(true);
  };

  return (
    <Box p={4}>
      {attacks.length === 0 ? (
        <VStack spacing={4} py={8}>
          <Text color="gray.500">No attacks available</Text>
          <Text color="gray.400" fontSize="sm">
            Equip weapons to create attack options
          </Text>
        </VStack>
      ) : (
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
      )}

      {/* Attack Detail Modal */}
      <AttackDetailModal
        attack={selectedAttack}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAttack(null);
        }}
      />
    </Box>
  );
};

export default Attacks;