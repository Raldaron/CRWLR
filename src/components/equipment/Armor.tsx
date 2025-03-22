// src/components/equipment/Armor.tsx
'use client';

import React from 'react';
import { Box } from '@chakra-ui/react';
import ArmorEquipment from './ArmorEquipment';

const Armor: React.FC = () => {
  return (
    <Box p={4}>
      <ArmorEquipment />
    </Box>
  );
};

export default Armor;