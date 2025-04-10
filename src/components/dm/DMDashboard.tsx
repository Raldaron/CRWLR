'use client';

import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Icon, // For Chevrons
} from '@chakra-ui/react';
import {
  Users,
  Gift,
  Award,
  Bell,
  ShoppingBag,
  FileText,
  Settings,
  ChevronRight,
  // Menu as MenuIcon, // Potential import if using a toggle header
} from 'lucide-react';
import { useDM } from '@/context/DMContext'; // Assuming this context provides DM status and data
import DMPlayerManager from './DMPlayerManager';
import DMLootManager from './DMLootManager';
import DMQuestManager from './DMQuestManager';
import DMNotificationManager from './DMNotificationManager';
import DMShopManager from './DMShopManager';
import DMCampaignManager from './DMCampaignManager';
import DMSettingsPanel from './DMSettingsPanel';

// Navigation item type
interface NavItem {
  name: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const DMDashboard: React.FC = () => {
  const { isDM, dmData } = useDM(); // Use your DM context hook
  const [activeTab, setActiveTab] = useState<string>('players');

  // Color mode values (hardcoded dark theme)
  const bgColor = "gray.900";
  const sidebarBg = "gray.800";
  const borderColor = "gray.700";
  const highlightColor = "brand.500"; // Use your theme's brand color
  const textColor = "gray.100";
  const inactiveTextColor = "gray.400";
  const hoverBgColor = "gray.700";

  // Define navigation items with their respective components
  const navItems: { [key: string]: NavItem } = {
    players: {
      name: 'Players',
      icon: <Users size={20} />,
      component: <DMPlayerManager />,
    },
    loot: {
      name: 'Loot Manager',
      icon: <Gift size={20} />,
      component: <DMLootManager />,
    },
    quests: {
      name: 'Quests',
      icon: <Award size={20} />,
      component: <DMQuestManager />,
    },
    notifications: {
      name: 'Notifications',
      icon: <Bell size={20} />,
      component: <DMNotificationManager />,
    },
    shop: {
      name: 'Shop Manager',
      icon: <ShoppingBag size={20} />,
      component: <DMShopManager />,
    },
    campaign: {
      name: 'Campaign Notes',
      icon: <FileText size={20} />,
      component: <DMCampaignManager />,
    },
    settings: {
      name: 'DM Settings',
      icon: <Settings size={20} />,
      component: <DMSettingsPanel />,
    },
  };

  // If the user is not a DM, show an error message
  if (!isDM) {
    return (
      <Box p={8} maxW="xl" mx="auto" textAlign="center">
        <Heading mb={4} color="red.500">Access Denied</Heading>
        <Text fontSize="lg" color="gray.300">
          You need Dungeon Master privileges to access this area.
        </Text>
        <Text mt={4} color="gray.400">
          Please contact your administrator or login with a DM account.
        </Text>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh">
      <Flex h="100vh" overflow="hidden"> {/* Main container */}
        {/* Sidebar Navigation */}
        <Box
          as="nav" // Semantic HTML5 tag
          w={{ base: "70px", md: "250px" }} // Responsive width: 70px on small screens, 250px on medium and up
          bg={sidebarBg}
          borderRight="1px"
          borderColor={borderColor}
          py={6}
          position="fixed" // Fix the sidebar position
          h="full" // Make sidebar full height
          zIndex="sticky" // Keep sidebar above scrolling content
          transition="width 0.2s ease-in-out" // Smooth width transition
        >
          <VStack spacing={4} align="stretch" h="full">
            {/* DM Header - Visible only on medium screens and up */}
            <Box px={4} mb={6} display={{ base: "none", md: "block" }}>
              <Heading size="md" color="brand.400" mb={1}>Dungeon Master</Heading>
              <Text color={inactiveTextColor} fontSize="sm" noOfLines={1}>
                {dmData?.name || 'DM Panel'} {/* Use DM data from context if available */}
              </Text>
            </Box>
            {/* DM Icon - Visible only on small screens */}
            <Box px={4} mb={6} display={{ base: "flex", md: "none" }} justifyContent="center">
              <Badge colorScheme="brand" p={2} borderRadius="md" fontSize="lg">
                DM
              </Badge>
            </Box>

            {/* Navigation Items */}
            <VStack spacing={1} align="stretch" flex={1} overflowY="auto"> {/* Allow nav items to scroll if needed */}
              {Object.entries(navItems).map(([key, item]) => (
                <Flex
                  key={key}
                  onClick={() => setActiveTab(key)}
                  py={3}
                  px={4} // Consistent padding
                  cursor="pointer"
                  alignItems="center"
                  justifyContent={{ base: 'center', md: 'flex-start' }} // Center icon on mobile, start on desktop
                  transition="all 0.2s ease-in-out"
                  bg={activeTab === key ? hoverBgColor : "transparent"} // Highlight background if active
                  color={activeTab === key ? textColor : inactiveTextColor} // Highlight text color if active
                  _hover={{ // Hover styles
                    bg: hoverBgColor,
                    color: textColor,
                  }}
                  borderLeft={{ md: "4px solid" }} // Show border indicator only on medium and up
                  borderColor={activeTab === key ? highlightColor : "transparent"} // Highlight border if active
                  role="group" // For potential future styling needs
                  title={item.name} // Add tooltip for icon-only view
                >
                  {/* Icon */}
                  <Box
                    mr={{ base: 0, md: 3 }} // Margin only on larger screens
                    display="flex"
                    alignItems="center"
                  >
                    {item.icon}
                  </Box>
                  {/* Text Label */}
                  <Text
                    fontWeight="medium"
                    display={{ base: "none", md: "block" }} // Show text only on larger screens
                  >
                    {item.name}
                  </Text>
                  {/* Active Indicator Arrow (Optional) */}
                  <Icon
                     as={ChevronRight}
                     ml="auto" // Push to the right
                     display={activeTab === key ? { base: 'none', md: 'block' } : 'none'} // Show only when active and on desktop
                     boxSize={4} // Icon size
                  />
                </Flex>
              ))}
            </VStack>
            {/* Optional: Add a footer or collapse/expand button here if needed */}
          </VStack>
        </Box>

        {/* Main Content Area */}
        <Box
          flex="1" // Take remaining space
          ml={{ base: "70px", md: "250px" }} // Adjust margin based on sidebar width
          p={{ base: 3, md: 6 }} // Responsive padding: smaller on mobile
          overflowY="auto" // Allow main content to scroll independently
          h="full" // Ensure it takes full height for scrolling
          transition="margin-left 0.2s ease-in-out" // Smooth margin transition
        >
          {/* Max width container for content */}
          <Box maxW="1400px" mx="auto">
            {/* Page Title */}
            <Heading
                mb={{ base: 3, md: 6 }} // Responsive margin bottom
                size={{ base: 'md', md: 'lg' }} // Responsive heading size
                color={textColor}
            >
              {navItems[activeTab]?.name} {/* Display name of the active tab */}
            </Heading>
            <Divider mb={{ base: 3, md: 6 }} borderColor={borderColor} />

            {/* Render the active component */}
            <Box> {/* Wrapper for the specific manager component */}
              {navItems[activeTab]?.component}
            </Box>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default DMDashboard;