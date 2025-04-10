// components/inventory/Inventory.tsx
import React, { useState } from 'react';
import { Box, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { Package, Store } from 'lucide-react'; // Changed ShoppingBag to Store
import InventoryMain from './InventoryMain';
// Removed ItemCatalog import
import PlayerShopInterface from '../shops/PlayerShopInterface'; // Import the new Shop Interface - Adjust path if needed

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box p={4} width="100%">
      {/* Use Chakra UI Tabs component */}
      <Tabs index={activeTab} onChange={setActiveTab} colorScheme="brand" variant="line" size="lg">
        <TabList borderBottom="1px" borderColor="gray.700">
          {/* First Tab: My Inventory */}
          <Tab color="gray.400" _selected={{ color: 'brand.300', borderColor: 'brand.300' }}>
            <Package style={{ marginRight: '0.5rem' }} />
            My Inventory
          </Tab>
          {/* Second Tab: Shops (Replaced Add Items) */}
          <Tab color="gray.400" _selected={{ color: 'brand.300', borderColor: 'brand.300' }}>
            <Store style={{ marginRight: '0.5rem' }} /> {/* Changed Icon */}
            Shops {/* Changed Label */}
          </Tab>
          {/* Third Tab: Gold - Removed as it's handled within PlayerShopInterface now */}
          {/*
          <Tab color="gray.400" _selected={{ color: 'brand.300', borderColor: 'brand.300' }}>
            <Coins style={{ marginRight: '0.5rem' }} />
            Gold
          </Tab>
          */}
          {/* Removed Debugger Tab */}
        </TabList>
        <TabPanels>
          {/* Content for "My Inventory" tab */}
          <TabPanel px={0} pt={4}><InventoryMain /></TabPanel>
          {/* Content for "Shops" tab (Replaced ItemCatalog) */}
          <TabPanel px={0} pt={4}><PlayerShopInterface /></TabPanel>
          {/* Removed Gold TabPanel */}
          {/* Removed Debugger TabPanel */}
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Inventory;