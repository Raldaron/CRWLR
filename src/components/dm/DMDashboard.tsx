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
  Icon,
  useTheme, // Import useTheme to access theme values if needed (optional)
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
import { useDM } from '@/context/DMContext';
// Import child components (ensure paths are correct)
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
  component: React.ReactNode; // This component needs to be responsive internally too
}

const DMDashboard: React.FC = () => {
  const { isDM, dmData } = useDM();
  const [activeTab, setActiveTab] = useState<string>('players');
  const theme = useTheme(); // Access theme values if needed

  // Theme values (using semantic tokens or direct values from your theme.ts is recommended)
  // These fall back to direct values if theme structure is different
  const bgColor = theme.semanticTokens?.colors?.bg?.default || "gray.900";
  const sidebarBg = theme.semanticTokens?.colors?.bgAlt?.default || "gray.800";
  const borderColor = theme.semanticTokens?.colors?.border?.default || "gray.700";
  const highlightColor = theme.colors?.teal?.[500] || "teal.500"; // Using teal as example highlight
  const textColor = theme.semanticTokens?.colors?.text?.default || "gray.100";
  const inactiveTextColor = theme.colors?.gray?.[400] || "gray.400";
  const hoverBgColor = theme.colors?.gray?.[700] || "gray.700";
  const primaryHeadingColor = theme.colors?.brand?.[400] || "purple.400"; // Example using brand color

  // Define navigation items with their respective components
  // NOTE: Each of these components (DMPlayerManager, etc.) MUST be designed
  // to be responsive themselves using Chakra's responsive styles.
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

  // Loading state or access denied check
  if (!isDM) { // Assuming useDM handles loading state internally
    return (
      <Box p={8} maxW="xl" mx="auto" textAlign="center">
        <Heading mb={4} color="red.500">Access Denied</Heading>
        <Text fontSize="lg" color={textColor}>
          You need Dungeon Master privileges to access this area.
        </Text>
        <Text mt={4} color={inactiveTextColor}>
          Please contact your administrator or login with a DM account.
        </Text>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Flex container for sidebar + content layout */}
      <Flex h="100vh" overflow="hidden">

        {/* --- Responsive Sidebar Navigation --- */}
        <Box
          as="nav"
          // Responsive Width: Narrow icon-only on mobile, wider with text on desktop
          w={{ base: "60px", md: "240px" }}
          bg={sidebarBg}
          borderRight="1px"
          borderColor={borderColor}
          py={6}
          position="fixed"
          h="full"
          zIndex="sticky" // Keep it above scrolling content
          transition="width 0.2s ease-in-out" // Smooth width change
        >
          <VStack spacing={4} align="stretch" h="full">

            {/* DM Header - Hidden on mobile, shown on desktop */}
            <Box px={4} mb={6} display={{ base: "none", md: "block" }}>
              <Heading size="md" color={primaryHeadingColor} mb={1} noOfLines={1}>
                Dungeon Master
              </Heading>
              <Text color={inactiveTextColor} fontSize="sm" noOfLines={1}>
                {dmData?.name || 'DM Panel'}
              </Text>
            </Box>

            {/* DM Icon - Shown centered on mobile, hidden on desktop */}
            <Box px={4} mb={6} display={{ base: "flex", md: "none" }} justifyContent="center">
              <Badge colorScheme="brand" p={1.5} borderRadius="md" fontSize="md">
                DM
              </Badge>
            </Box>

            {/* Navigation Items Container */}
            <VStack spacing={1} align="stretch" flex={1} overflowY="auto" overflowX="hidden">
              {Object.entries(navItems).map(([key, item]) => (
                <Flex
                  key={key}
                  onClick={() => setActiveTab(key)}
                  py={3}
                  // Responsive Padding: More horizontal padding on desktop
                  px={{ base: 2, md: 4 }}
                  cursor="pointer"
                  alignItems="center"
                  // Responsive Justification: Center icon on mobile, start-aligned on desktop
                  justifyContent={{ base: 'center', md: 'flex-start' }}
                  transition="all 0.2s ease-in-out"
                  bg={activeTab === key ? hoverBgColor : "transparent"}
                  color={activeTab === key ? textColor : inactiveTextColor}
                  _hover={{
                    bg: hoverBgColor,
                    color: textColor,
                  }}
                  // Responsive Border Indicator: Only shown on desktop
                  borderLeft={{ md: "4px solid" }}
                  borderColor={activeTab === key ? highlightColor : "transparent"}
                  role="group"
                  title={item.name} // Tooltip helpful for icon-only view
                  overflow="hidden" // Prevent text overflow issues during transition
                  whiteSpace="nowrap" // Keep text on one line
                >
                  {/* Icon */}
                  <Box
                    // Responsive Margin: Only add right margin on desktop when text is visible
                    mr={{ base: 0, md: 3 }}
                    display="flex"
                    alignItems="center"
                    // Ensure icon color changes correctly
                    color={activeTab === key ? textColor : inactiveTextColor}
                    _groupHover={{ // Ensure icon color changes on hover too
                      color: textColor
                    }}
                  >
                    {item.icon}
                  </Box>

                  {/* Text Label - Hidden on mobile, shown on desktop */}
                  <Text
                    fontWeight="medium"
                    display={{ base: "none", md: "block" }}
                  >
                    {item.name}
                  </Text>

                  {/* Active Indicator Arrow (Optional) - Hidden on mobile */}
                  <Icon
                     as={ChevronRight}
                     ml="auto"
                     display={activeTab === key ? { base: 'none', md: 'block' } : 'none'}
                     boxSize={4}
                  />
                </Flex>
              ))}
            </VStack>

            {/* Optional Footer Area (Example) */}
            {/*
            <Box mt="auto" p={4} borderTop="1px" borderColor={borderColor} display={{ base: "none", md: "block" }}>
              <Text fontSize="xs" color={inactiveTextColor}>© 2023 Your App</Text>
            </Box>
            */}

          </VStack>
        </Box>

        {/* --- Responsive Main Content Area --- */}
        <Box
          flex="1"
          // Responsive Margin: Adjust left margin based on sidebar width
          ml={{ base: "60px", md: "240px" }}
          // Responsive Padding: Smaller on mobile, larger on desktop
          p={{ base: 3, md: 6 }}
          overflowY="auto" // Allow content to scroll vertically
          h="full"
          transition="margin-left 0.2s ease-in-out" // Smooth margin change
        >
          {/* Max width container for content readability */}
          <Box maxW="1600px" mx="auto"> {/* Increased maxW slightly */}

            {/* Page Title */}
            <Heading
                // Responsive Margin Bottom
                mb={{ base: 4, md: 6 }}
                // Responsive Heading Size
                size={{ base: 'lg', md: 'xl' }} // Adjusted sizes slightly
                color={textColor}
            >
              {navItems[activeTab]?.name}
            </Heading>

            {/* Divider */}
            <Divider mb={{ base: 4, md: 6 }} borderColor={borderColor} />

            {/* Render the active component */}
            {/* IMPORTANT: The component rendered here (e.g., DMPlayerManager) */}
            {/* needs its own internal responsive design using Chakra UI tools */}
            {/* like SimpleGrid, responsive Flex direction, etc. */}
            <Box>
              {navItems[activeTab]?.component}
            </Box>

          </Box> {/* End Max Width Container */}
        </Box> {/* End Main Content Area */}

      </Flex> {/* End Main Flex Container */}
    </Box> /* End Root Box */
  );
};

export default DMDashboard;