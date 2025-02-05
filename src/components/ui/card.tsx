import { Box, BoxProps } from '@chakra-ui/react';
import { ReactNode } from 'react';

interface CardProps extends BoxProps {
  children: ReactNode;
}

export const Card = ({ children, ...props }: CardProps) => {
  return (
    <Box
      bg="white"
      borderRadius="lg"
      boxShadow="md"
      p={4}
      {...props}
    >
      {children}
    </Box>
  );
};

export const CardHeader = ({ children, ...props }: CardProps) => {
  return (
    <Box
      pb={4}
      mb={4}
      borderBottom="1px"
      borderColor="gray.200"
      {...props}
    >
      {children}
    </Box>
  );
};

export const CardContent = ({ children, ...props }: CardProps) => {
  return (
    <Box {...props}>
      {children}
    </Box>
  );
};