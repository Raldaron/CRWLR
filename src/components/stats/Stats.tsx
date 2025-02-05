// components/character/Stats.tsx
import React, { useState } from 'react';
import { Box, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Card } from '@/components/ui/card';

interface StatItem {
  name: string;
  value: number;
}

interface StatGroupProps {
  title: string;
  stats: StatItem[];
}

interface StatCardProps {
  name: string;
  value: number;
}

// Individual stat card component
const StatCard: React.FC<StatCardProps> = ({ name, value }) => (
  <Card>
    <VStack p={4} spacing={2} alignItems="center">
      <Text fontSize="lg" fontWeight="bold">
        {name}
      </Text>
      <Text fontSize="2xl" fontWeight="bold">
        {value}
      </Text>
    </VStack>
  </Card>
);

// Group of stats
const StatGroup: React.FC<StatGroupProps> = ({ title, stats }) => (
  <Box bg="white" p={4} borderRadius="lg" boxShadow="sm">
    <Text fontSize="xl" fontWeight="bold" textAlign="center" mb={4} pb={2} borderBottomWidth={1}>
      {title}
    </Text>
    <VStack spacing={4}>
      {stats.map((stat) => (
        <StatCard key={stat.name} name={stat.name} value={stat.value} />
      ))}
    </VStack>
  </Box>
);

interface StatsState {
  physical: StatItem[];
  mental: StatItem[];
  social: StatItem[];
}

const Stats: React.FC = () => {
  const [stats] = useState<StatsState>({
    physical: [
      { name: 'Strength', value: 10 },
      { name: 'Dexterity', value: 10 },
      { name: 'Stamina', value: 10 },
    ],
    mental: [
      { name: 'Intelligence', value: 10 },
      { name: 'Perception', value: 10 },
      { name: 'Wit', value: 10 },
    ],
    social: [
      { name: 'Charisma', value: 10 },
      { name: 'Manipulation', value: 10 },
      { name: 'Appearance', value: 10 },
    ],
  });

  return (
    <Box p={4}>
      <SimpleGrid columns={3} spacing={6}>
        <StatGroup title="Physical" stats={stats.physical} />
        <StatGroup title="Mental" stats={stats.mental} />
        <StatGroup title="Social" stats={stats.social} />
      </SimpleGrid>
    </Box>
  );
};

export default Stats;