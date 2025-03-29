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
          <Text fontWeight="bold" fontSize="sm">Formula: {formula}</Text>
          <Text fontSize="sm">{breakdown}</Text>
        </VStack>
      }
      placement="top"
      hasArrow
    >
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardContent>
          <VStack 
            p={{ base: 1, md: 2 }} 
            spacing={1} 
            alignItems="center" 
            minH={{ base: "60px", md: "80px" }} 
            justifyContent="center"
          >
            <Text 
              fontSize={{ base: "xs", md: "md" }} 
              fontWeight="semibold" 
              color="gray.600"
              textAlign="center"
            >
              {label}
            </Text>
            <Text 
              fontSize={{ base: "md", md: "xl" }} 
              fontWeight="bold"
              textAlign="center"
            >
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