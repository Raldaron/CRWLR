'use client';

import React from 'react';
import { Box, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Card, CardContent } from '@/components/ui/card';
import { useCharacter } from '@/context/CharacterContext';
import { Heart, Brain, Zap } from 'lucide-react';
import RaceSelectionModals from './RaceSelectionModals';

// StatCard interface
interface StatCardProps {
  label: string;
  current: number;
  max: number;
  icon: React.ElementType;
  color: string;
  formula: string;
  breakdown: string;
}

// StatCard component
const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  current, 
  max, 
  icon: Icon,
  color,
  formula,
  breakdown
}) => {
  return (
    <Card
      className="transition-all duration-200 hover:shadow-lg"
      style={{ borderTop: `4px solid ${color}` }}
    >
      <CardContent>
        <VStack p={4} spacing={3} alignItems="center" minH="150px" justifyContent="center">
          <Icon size={24} color={color} />
          <Text fontSize="xl" fontWeight="bold" color="gray.600">
            {label}
          </Text>
          <Text fontSize="3xl" fontWeight="bold">
            <span style={{ color }}>{current}</span>
            <span className="text-gray-400">/{max}</span>
          </Text>
          <Text fontSize="xs" color="gray.500">
            {breakdown}
          </Text>
        </VStack>
      </CardContent>
    </Card>
  );
};

// Main Character component
const Character: React.FC = () => {
  const { stats } = useCharacter();
  const characterLevel = 1;
  
  // Calculate stats
  const maxHp = 8 * stats.constitution + characterLevel;
  const maxMp = 5 * stats.intelligence + characterLevel;
  const maxAp = characterLevel * 2;

  return (
    <Box p={6}>
      {/* Character Creation Section */}
      <SimpleGrid columns={2} spacing={6} className="mb-8">
        <Card>
          <CardContent className="p-4">
            <Text className="text-lg font-semibold mb-4">Race</Text>
            <RaceSelectionModals />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Text className="text-lg font-semibold mb-4">Class</Text>
            {/* Class selection will be implemented similarly */}
          </CardContent>
        </Card>
      </SimpleGrid>

      {/* Resource Cards */}
      <SimpleGrid columns={3} spacing={6}>
        <StatCard 
          label="HP" 
          current={maxHp} 
          max={maxHp}
          icon={Heart}
          color="#E53E3E"
          formula="8 × Constitution + Level"
          breakdown={`8 × ${stats.constitution} + ${characterLevel} = ${maxHp}`}
        />
        <StatCard 
          label="MP" 
          current={maxMp} 
          max={maxMp}
          icon={Brain}
          color="#3182CE"
          formula="5 × Intelligence + Level"
          breakdown={`5 × ${stats.intelligence} + ${characterLevel} = ${maxMp}`}
        />
        <StatCard 
          label="AP" 
          current={maxAp} 
          max={maxAp}
          icon={Zap}
          color="#D69E2E"
          formula="2 × Level"
          breakdown={`2 × ${characterLevel} = ${maxAp}`}
        />
      </SimpleGrid>
    </Box>
  );
};

export default Character;