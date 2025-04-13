// --- START OF FILE components/stats/Skills.tsx ---
import React from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  IconButton,
  Badge,
  SimpleGrid,
  Tooltip,
  Icon, // Import Icon component
} from '@chakra-ui/react';
import { Plus, Minus, Info } from 'lucide-react'; // Keep Info icon
import { useCharacter, baseSkillList } from '@/context/CharacterContext'; // Import baseSkillList
import DarkThemedCard from '@/components/ui/DarkThemedCard';
import type { Skill as SkillType } from '@/types/character'; // Use Skill interface

// Helper to capitalize
const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

const Skills: React.FC = () => {
  const {
    baseSkills, // Points allocated by player
    currentSkills, // Derived total including bonuses
    availableSkillPoints,
    increaseSkill,
    decreaseSkill,
    selectedRace,
    selectedClass,
    getSkillBonus, // Function to get equipment bonus for a specific skill
  } = useCharacter();

  // Function to generate the breakdown tooltip for skills
  const getSkillBreakdown = (skillName: string): string => {
    const base = baseSkills[skillName] || 0;
    const raceBonus = selectedRace?.skillbonus?.[skillName] || 0;
    const classBonus = selectedClass?.skillbonus?.[skillName] || 0;
    const equipBonus = getSkillBonus(skillName); // Use the specific getter

    let breakdown = `Base (Invested): ${base}`;
    if (raceBonus !== 0) breakdown += `\nRace: ${raceBonus > 0 ? '+' : ''}${raceBonus}`;
    if (classBonus !== 0) breakdown += `\nClass: ${classBonus > 0 ? '+' : ''}${classBonus}`;
    if (equipBonus !== 0) breakdown += `\nEquipment: ${equipBonus > 0 ? '+' : ''}${equipBonus}`;
    breakdown += `\n--------------------`;
    breakdown += `\nTotal: ${currentSkills[skillName] || 0}`;
    return breakdown;
  };

  // Find skill details from baseSkillList
  const getSkillDetails = (skillName: string): SkillType | undefined => {
    return baseSkillList.find(s => s.name.toLowerCase() === skillName.toLowerCase());
  };

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg" color="gray.100">
            Skills
          </Heading>
          <Badge colorScheme="brand" fontSize="lg" px={3} py={1}>
            {availableSkillPoints} Points Available
          </Badge>
        </HStack>

        {/* REMOVED Stat Point Display */}
        {/* <Box p={4} bg="gray.700" borderRadius="md">
          <Text fontSize="lg" fontWeight="semibold" color="green.300">
            Available Stat Points: {availableStatPoints}
          </Text>
        </Box> */}

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {Object.entries(currentSkills)
            // Optional: Filter out skills with 0 total if desired
            // .filter(([_, value]) => value > 0)
            .sort(([skillA], [skillB]) => skillA.localeCompare(skillB)) // Sort alphabetically
            .map(([skillName, totalLevel]) => {
              const skillDetails = getSkillDetails(skillName); // Get attribute link
              const baseLevel = baseSkills[skillName] || 0; // Get base invested points

              return (
                <DarkThemedCard key={skillName} p={3} borderColor="gray.700">
                  <HStack justify="space-between" align="center" width="full">
                    <VStack align="start" spacing={0}>
                       <HStack>
                           <Text fontWeight="medium" color="gray.100" fontSize="md">
                               {skillName}
                           </Text>
                            <Tooltip label={<Text whiteSpace="pre-line">{getSkillBreakdown(skillName)}</Text>} placement="top" hasArrow bg="gray.700" color="white" px={3} py={2}>
                                <Box cursor="help" ml={1}>
                                <Info size={14} color="gray.500" />
                                </Box>
                            </Tooltip>
                       </HStack>
                       {/* Display Linked Attribute */}
                       {skillDetails && (
                            <Badge colorScheme="purple" variant="subtle" fontSize="xs">
                                {capitalize(skillDetails.attribute)}
                            </Badge>
                        )}
                    </VStack>

                    <HStack spacing={1}>
                      <IconButton
                        aria-label={`Decrease ${skillName}`}
                        icon={<Minus size={16} />}
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        onClick={() => decreaseSkill(skillName)}
                        isDisabled={baseLevel <= 0} // Can only decrease invested points
                      />
                      <Text fontSize="xl" fontWeight="bold" color="brand.300" minW="30px" textAlign="center">
                        {totalLevel}
                      </Text>
                      <IconButton
                        aria-label={`Increase ${skillName}`}
                        icon={<Plus size={16} />}
                        size="sm"
                        colorScheme="green"
                        onClick={() => increaseSkill(skillName)}
                        isDisabled={availableSkillPoints <= 0}
                      />
                    </HStack>
                  </HStack>
                  {/* Optional: Display base level if different from total */}
                  {baseLevel !== totalLevel && (
                    <Text fontSize="xs" color="gray.400" mt={1} textAlign="right">
                      (Base: {baseLevel})
                    </Text>
                  )}
                </DarkThemedCard>
              );
            })}
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

export default Skills;
// --- END OF FILE components/stats/Skills.tsx ---