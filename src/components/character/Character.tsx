'use client';

import React from 'react';
import { Box, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Card, CardContent } from '@/components/ui/card';
import { useCharacter } from '@/context/CharacterContext';
import { Heart, Brain, Zap } from 'lucide-react';
import RaceSelectionModals from './RaceSelectionModals';
import ClassSelectionModals from './ClassSelectionModals';

interface StatCardProps {
  label: string;
  current: number;
  max: number;
  icon: React.ElementType;
  color: string;
  formula: string;
  breakdown: string;
}

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

const Character: React.FC = () => {
  const { currentStats } = useCharacter();
  const characterLevel = 1;
  
  const maxHp = 8 * currentStats.stamina + characterLevel;
  const maxMp = 5 * currentStats.intelligence + characterLevel;
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
            <ClassSelectionModals />
          </CardContent>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default Character;