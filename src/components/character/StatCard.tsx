import React from 'react';
import {
  Box,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { Card, CardContent } from '@/components/ui/card';

interface CompactStatCardProps {
  label: string;
  current: number;
  max: number;
  color: string;
  formula: string;
  breakdown: string;
}

const CompactStatCard = ({
  label,
  current,
  max,
  color,
  formula,
  breakdown,
}: CompactStatCardProps) => {
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
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardContent>
          <VStack p={2} spacing={1} alignItems="center" minH="80px" justifyContent="center">
            <Text fontSize="md" fontWeight="semibold" color="gray.600">
              {label}
            </Text>
            <Text fontSize="xl" fontWeight="bold">
              <span style={{ color }}>{current}</span>
              <span className="text-gray-400">/{max}</span>
            </Text>
          </VStack>
        </CardContent>
      </Card>
    </Tooltip>
  );
};

export default CompactStatCard;