// components/TabLayout.tsx

import React from 'react';
import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Box,
  useBreakpointValue,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  HStack,
} from '@chakra-ui/react';
import { ChevronDown } from 'lucide-react';
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
  // Use responsive design to determine if we show tabs or dropdown on small screens
  const isMobile = useBreakpointValue({ base: true, md: false });

  // For mobile, we'll use a dropdown menu instead of tabs
  if (isMobile) {
    return (
      <Box>
        <Menu>
          <MenuButton
            as={Button}
            mb={4}
            width="full"
            justifyContent="space-between"
            textAlign="left"
            variant="outline"
            bg="gray.800"
            borderColor="gray.700"
            _hover={{ bg: 'gray.700' }}
            _active={{ bg: 'gray.700' }}
          >
            <HStack justifyContent="space-between" width="100%">
              <span>{tabs[activeTab]?.label || "Select"}</span>
              <ChevronDown size={16} />
            </HStack>
          </MenuButton>
          <MenuList bg="gray.800" borderColor="gray.700">
            {tabs.map((tab, index) => (
              <MenuItem 
                key={tab.id} 
                onClick={() => onTabChange(index)}
                bg="gray.800"
                _hover={{ bg: 'gray.700' }}
              >
                {tab.label}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        <Box pt={2}>
          {tabs[activeTab]?.content}
        </Box>
      </Box>
    );
  }

  // For desktop, use normal tabs
  return (
    <Tabs
      index={activeTab}
      onChange={onTabChange}
      variant="line"
      colorScheme="brand"
      isLazy
    >
      <TabList 
        borderBottom="1px" 
        borderColor="gray.700"
        overflowX="auto" // Allow horizontal scrolling for tabs if needed
        css={{
          // Hide scrollbar but keep functionality
          '&::-webkit-scrollbar': { height: '4px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: 'transparent' },
          '&:hover::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.2)' }
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            _selected={{
              color: 'brand.300',
              borderColor: 'currentColor',
            }}
            whiteSpace="nowrap" // Prevent text wrapping in tabs
            py={2}
            px={4}
            color="gray.400"
            _hover={{ color: 'gray.300' }}
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