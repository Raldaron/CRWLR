import React from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { useCharacter } from '@/context/CharacterContext';
import { Plus, Minus } from 'lucide-react';

// Helper function to standardize skill names
const standardizeSkillName = (skillName: string): string => {
  return skillName
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Interfaces
interface Skill {
  name: string;
  attribute: string;
  level: number;
}

interface SkillCardProps {
  skill: Skill;
  totalBonus: number;
  onIncrement: () => void;
  onDecrement: () => void;
  isIncrementDisabled: boolean;
  isDecrementDisabled: boolean;
}

// Get skill points for level ranges
const getSkillPointsForLevel = (level: number): number => {
  if (level <= 10) return 2;
  if (level <= 20) return 4;
  if (level <= 30) return 6;
  if (level <= 40) return 8;
  if (level <= 50) return 10;
  if (level <= 60) return 12;
  if (level <= 70) return 14;
  if (level <= 80) return 16;
  if (level <= 90) return 18;
  if (level <= 100) return 20;
  return 20; // Maximum points for any level over 100
};

// Skill Points Info Component
const SkillPointsInfo: React.FC = () => {
  const { characterLevel, availableSkillPoints } = useCharacter();
  
  const getCurrentTier = (level: number) => {
    if (level <= 10) return { min: 1, max: 10, points: 2 };
    if (level <= 20) return { min: 11, max: 20, points: 4 };
    if (level <= 30) return { min: 21, max: 30, points: 6 };
    if (level <= 40) return { min: 31, max: 40, points: 8 };
    if (level <= 50) return { min: 41, max: 50, points: 10 };
    if (level <= 60) return { min: 51, max: 60, points: 12 };
    if (level <= 70) return { min: 61, max: 70, points: 14 };
    if (level <= 80) return { min: 71, max: 80, points: 16 };
    if (level <= 90) return { min: 81, max: 90, points: 18 };
    return { min: 91, max: 100, points: 20 };
  };

  const currentTier = getCurrentTier(characterLevel);

  return (
    <Box mb={6}>
      <Box 
        p={4} 
        bg="purple.900" 
        borderRadius="lg"
        boxShadow="sm"
        borderWidth="1px"
        borderColor="purple.800"
      >
        <VStack spacing={2}>
          <Text fontSize="xl" fontWeight="bold" color="gray.200">
            Available Skill Points
          </Text>
          <Badge 
            fontSize="2xl" 
            colorScheme="purple" 
            p={2} 
            borderRadius="md"
            bg="purple.700"
            color="white"
          >
            {availableSkillPoints}
          </Badge>
          <HStack spacing={2}>
            <Text fontSize="sm" color="gray.300">
              Character Level: {characterLevel}
            </Text>
            <Badge colorScheme="purple">
              {currentTier.points} points per level
            </Badge>
          </HStack>
          <Text fontSize="xs" color="purple.300">
            Levels {currentTier.min}-{currentTier.max}
          </Text>
        </VStack>
      </Box>

      <SimpleGrid columns={[1, 2, 3]} spacing={4} mt={4} bg="gray.800" p={4} borderRadius="lg" borderWidth="1px" borderColor="gray.700">
        <Box>
          <Text fontSize="sm" fontWeight="bold" color="gray.300">Current Level Range</Text>
          <Text fontSize="sm" color="gray.400">Levels {currentTier.min}-{currentTier.max}</Text>
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="bold" color="gray.300">Points per Level</Text>
          <Text fontSize="sm" color="gray.400">{currentTier.points} points</Text>
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="bold" color="gray.300">Next Tier</Text>
          {characterLevel < 100 ? (
            <Text fontSize="sm" color="gray.400">
              Level {currentTier.max + 1}: {currentTier.points + 2} points
            </Text>
          ) : (
            <Text fontSize="sm" color="gray.500">
              Maximum level reached
            </Text>
          )}
        </Box>
      </SimpleGrid>
    </Box>
  );
};

// Skill Card Component
const SkillCard: React.FC<SkillCardProps> = ({ 
  skill, 
  totalBonus, 
  onIncrement,
  onDecrement,
  isIncrementDisabled,
  isDecrementDisabled
}) => {
  // Calculate the actual bonus modifier (difference between total and base)
  const bonusModifier = totalBonus - skill.level;
  
  return (
    <Box
      p={4}
      borderRadius="md"
      bg="gray.800"
      boxShadow="sm"
      borderWidth="1px"
      borderColor="gray.700"
      transition="all 0.2s"
      _hover={{ borderColor: "purple.600", boxShadow: "md" }}
    >
      <VStack spacing={2} alignItems="center">
        <Text fontSize="lg" fontWeight="bold" color="gray.200">
          {skill.name}
        </Text>
        <Text fontSize="sm" color="gray.400">({skill.attribute})</Text>
        <HStack spacing={2}>
          <Button
            size="xs"
            onClick={onDecrement}
            isDisabled={isDecrementDisabled}
            colorScheme="accent"
            variant="outline"
          >
            <Minus size={12} />
          </Button>
          <Text fontSize="2xl" fontWeight="bold" color="gray.200">
            {totalBonus}
            {bonusModifier > 0 && (
              <Text as="span" color="green.400" fontSize="md">
                {' '}(+{bonusModifier})
              </Text>
            )}
          </Text>
          <Button
            size="xs"
            onClick={onIncrement}
            isDisabled={isIncrementDisabled}
            colorScheme="purple"
          >
            <Plus size={12} />
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

// Main Skills Component
const Skills: React.FC = () => {
  const { 
    currentSkills,
    baseSkills,
    availableSkillPoints,
    increaseSkill,
    decreaseSkill
  } = useCharacter();
  
  const toast = useToast();

  const baseSkillList: Skill[] = [
    { name: "Acrobatics", attribute: "Dexterity", level: 0 },
    { name: "Alchemy", attribute: "Intelligence", level: 0 },
    { name: "Animal Ken", attribute: "Charisma", level: 0 },
    { name: "Arcana", attribute: "Intelligence", level: 0 },
    { name: "Archery", attribute: "Dexterity", level: 0 },
    { name: "Artillery", attribute: "Intelligence", level: 0 },
    { name: "Athletics", attribute: "Strength", level: 0 },
    { name: "Awareness", attribute: "Perception", level: 0 },
    { name: "Bare Knuckle", attribute: "Strength", level: 0 },
    { name: "Block", attribute: "Strength", level: 0 },
    { name: "Deception", attribute: "Wit", level: 0 },
    { name: "Detect Trap", attribute: "Perception", level: 0 },
    { name: "Disguise", attribute: "Charisma", level: 0 },
    { name: "Dodge", attribute: "Dexterity", level: 0 },
    { name: "Endurance", attribute: "Stamina", level: 0 },
    { name: "Engineering", attribute: "Intelligence", level: 0 },
    { name: "Explosives Handling", attribute: "Wit", level: 0 },
    { name: "Firearms", attribute: "Dexterity", level: 0 },
    { name: "Grit", attribute: "Stamina", level: 0 },
    { name: "Hold Breath", attribute: "Stamina", level: 0 },
    { name: "Insight", attribute: "Perception", level: 0 },
    { name: "Intimidation", attribute: "Charisma", level: 0 },
    { name: "Investigation", attribute: "Wit", level: 0 },
    { name: "Lockpick", attribute: "Dexterity", level: 0 },
    { name: "Lore", attribute: "Intelligence", level: 0 },
    { name: "Medicine", attribute: "Intelligence", level: 0 },
    { name: "Melee", attribute: "Strength", level: 0 },
    { name: "Nature", attribute: "Wit", level: 0 },
    { name: "Parry", attribute: "Strength", level: 0 },
    { name: "Performance", attribute: "Charisma", level: 0 },
    { name: "Persuasion", attribute: "Charisma", level: 0 },
    { name: "Resilience", attribute: "Stamina", level: 0 },
    { name: "Scrounge", attribute: "Perception", level: 0 },
    { name: "Seduction", attribute: "Charisma", level: 0 },
    { name: "Sense Deception", attribute: "Perception", level: 0 },
    { name: "Sleight of Hand", attribute: "Dexterity", level: 0 },
    { name: "Stealth", attribute: "Dexterity", level: 0 },
    { name: "Survival", attribute: "Wit", level: 0 },
    { name: "Tactics", attribute: "Wit", level: 0 },
    { name: "Tracking", attribute: "Perception", level: 0 }
  ];

  const handleIncreaseSkill = (skillName: string) => {
    if (availableSkillPoints > 0) {
      increaseSkill(skillName);
    } else {
      toast({
        title: "No skill points available",
        description: "Level up to get more skill points",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDecreaseSkill = (skillName: string) => {
    decreaseSkill(skillName);
  };

  return (
    <Box p={4}>
      <SkillPointsInfo />
      
      <SimpleGrid columns={[2, 3, 4, 5]} spacing={4}>
        {baseSkillList.map((skill) => {
          const standardizedSkillName = standardizeSkillName(skill.name);
          const totalBonus = currentSkills[standardizedSkillName] || 0;
          const baseLevel = baseSkills[standardizedSkillName] || 0;
          
          return (
            <SkillCard 
              key={skill.name} 
              skill={{
                ...skill,
                level: baseLevel
              }}
              totalBonus={totalBonus}
              onIncrement={() => handleIncreaseSkill(standardizedSkillName)}
              onDecrement={() => handleDecreaseSkill(standardizedSkillName)}
              isIncrementDisabled={availableSkillPoints <= 0}
              isDecrementDisabled={baseLevel <= 0}
            />
          );
        })}
      </SimpleGrid>
    </Box>
  );
};

export default Skills;