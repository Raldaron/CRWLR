// Update the Stats component in Stats.tsx
import React from 'react';
import { 
  Box, 
  SimpleGrid, 
  Text, 
  VStack, 
  HStack, 
  IconButton, 
  Tooltip,
  Badge
} from '@chakra-ui/react';
import { Plus, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useCharacter } from '@/context/CharacterContext';
import type { CharacterStats } from '@/types/character';

interface StatCardProps {
  name: string;
  statKey: keyof CharacterStats;
  baseValue: number;
  currentValue: number;
}

const StatCard: React.FC<StatCardProps> = ({ 
  name, 
  statKey, 
  baseValue, 
  currentValue 
}) => {
  const { incrementStat, decrementStat, availableStatPoints } = useCharacter();
  const bonus = currentValue - baseValue;

  return (
    <Box
      bg="gray.800"
      borderRadius="lg"
      boxShadow="sm"
      borderWidth="1px"
      borderColor="gray.700"
      p={4}
      transition="all 0.2s"
      _hover={{ borderColor: "brand.600", boxShadow: "md" }}
    >
      <VStack spacing={2} alignItems="center" position="relative">
        <Text fontSize="lg" fontWeight="bold" color="gray.200">{name}</Text>
        
        {/* Stat Value Display */}
        <HStack spacing={2} align="center">
          <IconButton
            icon={<Minus />}
            size="xs"
            colorScheme="accent"
            aria-label="Decrease stat"
            onClick={() => decrementStat(statKey)}
            isDisabled={baseValue === currentValue}
          />
          
          <Text fontSize="2xl" fontWeight="bold" color="gray.200">
            {currentValue}
            {bonus > 0 && (
              <Text as="span" color="green.400" fontSize="md">
                {' '}(+{bonus})
              </Text>
            )}
          </Text>
          
          <IconButton
            icon={<Plus />}
            size="xs"
            colorScheme="brand"
            aria-label="Increase stat"
            onClick={() => incrementStat(statKey)}
            isDisabled={availableStatPoints === 0}
          />
        </HStack>
        
        {/* Base Value Tooltip */}
        <Tooltip 
          label={`Base value: ${baseValue}`} 
          placement="top"
          bg="gray.700"
          color="gray.200"
        >
          <Text fontSize="sm" color="gray.500">
            Base: {baseValue}
          </Text>
        </Tooltip>
      </VStack>
    </Box>
  );
};

const Stats: React.FC = () => {
  const { 
    baseStats, 
    currentStats, 
    availableStatPoints,
    characterLevel 
  } = useCharacter();
  
  type StatGroupKey = keyof typeof statGroups;
  type StatName = keyof CharacterStats;

  const statGroups = {
    physical: ['strength', 'dexterity', 'stamina'] as StatName[],
    mental: ['intelligence', 'perception', 'wit'] as StatName[],
    social: ['charisma'] as StatName[]
  };

  return (
    <Box p={4}>
      {/* Available Stat Points Display */}
      <Box 
        bg="brand.900" 
        borderRadius="lg" 
        p={4} 
        mb={4} 
        textAlign="center"
        position="relative"
        borderWidth="1px"
        borderColor="brand.800"
      >
        <Text fontSize="xl" fontWeight="bold" color="gray.200">
          Available Stat Points
        </Text>
        <Badge 
          colorScheme="brand" 
          fontSize="2xl" 
          borderRadius="full" 
          px={4} 
          py={2}
          bg="brand.700"
          color="white"
        >
          {availableStatPoints}
        </Badge>
        <Text fontSize="sm" color="gray.400" mt={2}>
          Level {characterLevel}
        </Text>
      </Box>

      {/* Stat Groups */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        {(Object.entries(statGroups) as [StatGroupKey, StatName[]][]).map(([group, stats]) => (
          <Box 
            key={group} 
            bg="gray.800" 
            p={4} 
            borderRadius="lg" 
            boxShadow="sm"
            borderWidth="1px"
            borderColor="gray.700"
          >
            <Text 
              fontSize="xl" 
              fontWeight="bold" 
              textAlign="center" 
              mb={4} 
              pb={2} 
              borderBottomWidth={1}
              borderColor="gray.700"
              color="gray.200"
            >
              {group.charAt(0).toUpperCase() + group.slice(1)}
            </Text>
            <VStack spacing={4}>
              {stats.map((stat) => (
                <StatCard
                  key={stat}
                  name={stat.charAt(0).toUpperCase() + stat.slice(1)}
                  statKey={stat}
                  baseValue={baseStats[stat]}
                  currentValue={currentStats[stat]}
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