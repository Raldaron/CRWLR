import React from 'react';
import { Box, Text, Heading, VStack, Divider } from '@chakra-ui/react';

const DMSettingsPanel: React.FC = () => {
  return (
    <Box p={{ base: 2, md: 4 }}>
      <Heading size={{ base: 'md', md: 'lg' }} mb={4} color="gray.100">
        DM Settings
      </Heading>
      <VStack spacing={6} align="stretch">
        <Box bg="gray.800" p={4} borderRadius="md" borderColor="gray.700" borderWidth="1px">
          <Heading size="sm" mb={3} color="gray.200">General Settings</Heading>
          <Text color="gray.400">General DM-specific settings will go here.</Text>
          {/* Example: Toggle for enabling/disabling certain features */}
        </Box>

        <Divider borderColor="gray.700" />

        <Box bg="gray.800" p={4} borderRadius="md" borderColor="gray.700" borderWidth="1px">
          <Heading size="sm" mb={3} color="gray.200">Campaign Settings</Heading>
          <Text color="gray.400">Settings related to the current campaign (if applicable) could be managed here.</Text>
          {/* Example: Campaign name, default ruleset */}
        </Box>

         <Box bg="gray.800" p={4} borderRadius="md" borderColor="gray.700" borderWidth="1px">
          <Heading size="sm" mb={3} color="gray.200">Integration Settings</Heading>
          <Text color="gray.400">Settings for integrating with other tools or platforms.</Text>
          {/* Example: Discord webhook URL */}
        </Box>
      </VStack>
    </Box>
  );
};
export default DMSettingsPanel;