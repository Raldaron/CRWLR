import React from 'react';
import { Box } from '@chakra-ui/react';
import WeaponsEquipment from './WeaponsEquipment';

const Weapons: React.FC = () => {
  return (
    <Box p={4}>
      <WeaponsEquipment />
    </Box>
  );
};

export default Weapons;