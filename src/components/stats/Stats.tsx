// --- START OF FILE components/stats/Stats.tsx ---
import React from 'react';
import {
    Box,
    Heading,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    VStack,
    Text,
    Tooltip,
    HStack,
    Icon,
} from '@chakra-ui/react';
import { Info } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';
import DarkThemedCard from '@/components/ui/DarkThemedCard'; // Assuming path is correct

const Stats: React.FC = () => {
  const {
    baseStats, // Get base stats (raw investment from skills)
    currentStats, // Get derived stats (base + race/class/equipment)
    selectedRace,
    selectedClass,
    getStatBonus, // Equipment bonus getter
  } = useCharacter();

  // Function to capitalize the first letter of a string
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Function to generate the breakdown tooltip
  const getStatBreakdown = (stat: keyof typeof baseStats): string => {
      const base = baseStats[stat] || 0;
      const raceBonus = selectedRace?.statbonus?.[stat] || 0;
      const classBonus = selectedClass?.statbonus?.[stat] || 0;
      const equipBonus = getStatBonus(stat); // Uses the context function

      let breakdown = `Base (Skill Investment): ${base}`;
      if (raceBonus !== 0) breakdown += `\nRace: ${raceBonus > 0 ? '+' : ''}${raceBonus}`;
      if (classBonus !== 0) breakdown += `\nClass: ${classBonus > 0 ? '+' : ''}${classBonus}`;
      if (equipBonus !== 0) breakdown += `\nEquipment: ${equipBonus > 0 ? '+' : ''}${equipBonus}`;
      breakdown += `\n--------------------`;
      breakdown += `\nTotal: ${currentStats[stat] || 0}`;
      return breakdown;
  };

  return (
    <Box p={4}>
      <Heading size="lg" mb={6} color="gray.100">
        Character Stats
      </Heading>

      <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={5}>
        {Object.entries(currentStats).map(([stat, value]) => (
          <Stat key={stat}> {/* Wrap the entire card content in <Stat> */}
            <DarkThemedCard p={4} borderColor="gray.700">
              <HStack justify="space-between" align="center" mb={2}>
                <StatLabel
                  fontSize="md"
                  fontWeight="medium"
                  color="brand.300"
                  textTransform="uppercase"
                >
                  {capitalize(stat)}
                </StatLabel>
                <Tooltip label={<Text whiteSpace="pre-line">{getStatBreakdown(stat as keyof typeof baseStats)}</Text>} placement="top" hasArrow bg="gray.700" color="white" px={3} py={2}>
                  <Box cursor="help">
                    <Info size={16} color="gray.500" />
                  </Box>
                </Tooltip>
              </HStack>
              <StatNumber fontSize="3xl" fontWeight="bold" color="gray.100">
                {value}
              </StatNumber>
              <StatHelpText fontSize="sm" color="gray.400">
                Base: {baseStats[stat as keyof typeof baseStats] || 0}
              </StatHelpText>
            </DarkThemedCard>
          </Stat>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default Stats;
// --- END OF FILE components/stats/Stats.tsx ---