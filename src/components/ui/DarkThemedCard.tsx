// components/ui/dark-themed-card.tsx
import React, { ReactNode } from 'react';
import { Box } from '@chakra-ui/react';

interface DarkThemedCardProps {
  children: ReactNode;
  onClick?: () => void;
  isHoverable?: boolean;
  isSelected?: boolean;
  borderColor?: string;
  height?: string | number;
  transition?: string;
  p?: number;
  textAlign?: string;
  hoverEffect?: string;
  cursor?: string;
  boxShadow?: string;
  borderWidth?: string | number;
  _hover?: {
    borderColor?: string;
    transform?: string;
    boxShadow?: string;
  };
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