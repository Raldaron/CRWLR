// components/character/Stats.tsx
'use client';

import React from 'react';
import { Box, SimpleGrid, Text, VStack, Tooltip } from '@chakra-ui/react';
import { Card } from '@/components/ui/card';
import { useCharacter } from '@/context/CharacterContext';
import type { CharacterStats } from '@/types/character';

interface StatCardProps {
  name: string;
  baseValue: number;
  currentValue: number;
}

const StatCard: React.FC<StatCardProps> = ({ name, baseValue, currentValue }) => {
  const bonus = currentValue - baseValue;
  console.log(`${name} - Base: ${baseValue}, Current: ${currentValue}, Bonus: ${bonus}`);
  
  return (
    <Tooltip
      label={`Base: ${baseValue} + Racial Bonus: ${bonus}`}
      placement="top"
    >
      <Card>
        <VStack p={4} spacing={2} alignItems="center">
          <Text fontSize="lg" fontWeight="bold">
            {name}
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            {currentValue}
            {bonus > 0 && (
              <Text as="span" color="green.500" fontSize="md">
                {' '}(+{bonus})
              </Text>
            )}
          </Text>
        </VStack>
      </Card>
    </Tooltip>
  );
};

const Stats: React.FC = () => {
  const { baseStats, currentStats } = useCharacter();
  
  console.log('Stats Component - Base Stats:', baseStats);
  console.log('Stats Component - Current Stats:', currentStats);

  type StatGroupKey = keyof typeof statGroups;
  type StatName = keyof CharacterStats;

  const statGroups = {
    physical: ['strength', 'dexterity', 'stamina'] as StatName[],
    mental: ['intelligence', 'perception', 'wit'] as StatName[],
    social: ['charisma', 'manipulation', 'appearance'] as StatName[]
  };

  return (
    <Box p={4}>
      <SimpleGrid columns={3} spacing={6}>
        {(Object.entries(statGroups) as [StatGroupKey, StatName[]][]).map(([group, stats]) => (
          <Box key={group} bg="white" p={4} borderRadius="lg" boxShadow="sm">
            <Text fontSize="xl" fontWeight="bold" textAlign="center" mb={4} pb={2} borderBottomWidth={1}>
              {group.charAt(0).toUpperCase() + group.slice(1)}
            </Text>
            <VStack spacing={4}>
              {stats.map((stat) => (
                <StatCard
                  key={stat}
                  name={stat.charAt(0).toUpperCase() + stat.slice(1)}
                  baseValue={baseStats[stat] ?? 0}
                  currentValue={currentStats[stat] ?? 0}
                />
              ))}
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default Stats;