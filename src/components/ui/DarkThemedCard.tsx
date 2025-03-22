// components/ui/dark-themed-card.tsx
import React, { ReactNode } from 'react';
import { Box, HTMLChakraProps } from '@chakra-ui/react';

interface DarkThemedCardProps extends HTMLChakraProps<'div'> {
  children: ReactNode;
  isHoverable?: boolean;
  isSelected?: boolean;
  borderColor?: string;
  _hover?: HTMLChakraProps<'div'>['_hover'];
}

const DarkThemedCard: React.FC<DarkThemedCardProps> = ({ 
  children, 
  onClick, 
  isHoverable = true,
  isSelected = false,
  borderColor = "gray.700",
  height = "auto"
}) => {
  return (
    <Box
      bg="gray.800"
      borderRadius="lg"
      boxShadow="sm"
      borderWidth="1px"
      borderColor={isSelected ? "brand.400" : borderColor}
      p={4}
      height={height}
      transition="all 0.2s"
      _hover={
        isHoverable 
          ? { 
              boxShadow: "md", 
              borderColor: "brand.600",
              transform: "translateY(-2px)"
            } 
          : {}
      }
      cursor={onClick ? "pointer" : "default"}
      onClick={onClick}
    >
      {children}
    </Box>
  );
};

export default DarkThemedCard;