import React from 'react';
import { Box, Text, VStack, Tooltip } from '@chakra-ui/react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  current: number;
  max: number;
  icon: LucideIcon;
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
  breakdown,
}) => {
  return (
    <Tooltip
      label={
        <VStack spacing={1} p={2}>
          <Text fontWeight="bold">Formula: {formula}</Text>
          <Text>{breakdown}</Text>
        </VStack>
      }
      placement="top"
    >
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
    </Tooltip>
  );
};

export default StatCard;