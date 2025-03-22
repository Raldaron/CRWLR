// components/inventory/Inventory.tsx
import React, { useState } from 'react';
import { Box, Tabs, TabList, TabPanels, Tab, TabPanel, Text } from '@chakra-ui/react';
import { Package, ShoppingBag } from 'lucide-react';
import InventoryMain from './InventoryMain';
import ItemCatalog from './ItemCatalog';

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box p={4} width="100%">
      <Tabs index={activeTab} onChange={setActiveTab} colorScheme="blue" variant="line" size="lg">
        {/* Use a Box with overflowX so tabs can scroll horizontally */}
        <Box overflowX="auto">
          <TabList flexWrap="wrap">
            <Tab>
              <Box display="flex" alignItems="center">
                <Package style={{ marginRight: '0.5rem' }} />
                <Text>My Inventory</Text>
              </Box>
            </Tab>
            <Tab>
              <Box display="flex" alignItems="center">
                <ShoppingBag style={{ marginRight: '0.5rem' }} />
                <Text>Add Items</Text>
              </Box>
            </Tab>
          </TabList>
        </Box>
        <TabPanels>
          <TabPanel p={0} pt={4}>
            <InventoryMain />
          </TabPanel>
          <TabPanel p={0} pt={4}>
            <ItemCatalog />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Inventory;
