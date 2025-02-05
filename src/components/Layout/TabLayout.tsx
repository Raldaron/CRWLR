'use client';

import React from 'react';
import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Box
} from '@chakra-ui/react';
import type { Tab as TabType } from '../../types/tabs';

interface TabLayoutProps {
  tabs: TabType[];
  activeTab: number;
  onTabChange: (index: number) => void;
  hasSubTabs?: boolean;
}

const TabLayout: React.FC<TabLayoutProps> = ({ 
  tabs, 
  activeTab, 
  onTabChange,
  hasSubTabs = false 
}) => {
  return (
    <Tabs
      index={activeTab}
      onChange={onTabChange}
      variant="line"
      colorScheme="blue"
      isLazy
    >
      <TabList borderBottom="1px" borderColor="gray.200">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            _selected={{
              color: 'blue.500',
              borderColor: 'currentColor',
            }}
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>

      <TabPanels>
        {tabs.map((tab) => (
          <TabPanel key={tab.id}>
            <Box pt={4}>
              {tab.content}
            </Box>
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
};

export default TabLayout;