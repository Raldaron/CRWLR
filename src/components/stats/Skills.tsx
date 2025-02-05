import React from 'react';
import { Box, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Card } from '@/components/ui/card';

// This defines what information each skill has
interface Skill {
  name: string;
  attribute: string;
  level: number;
}

// This is a single skill card component
const SkillCard = ({ skill }: { skill: Skill }) => (
  <Card>
    <VStack p={4} spacing={2} alignItems="center">
      <Text fontSize="lg" fontWeight="bold">
        {skill.name}
      </Text>
      <Text fontSize="sm" color="gray.600">
        ({skill.attribute})
      </Text>
      <Text fontSize="2xl" fontWeight="bold">
        {skill.level}
      </Text>
    </VStack>
  </Card>
);

const Skills = () => {
  // List of all skills with their associated attributes
  const skills: Skill[] = [
    { name: "Abjuration", attribute: "Intelligence", level: 0 },
    { name: "Acrobatics", attribute: "Dexterity", level: 0 },
    { name: "Alchemy", attribute: "Intelligence", level: 0 },
    { name: "Animal Ken", attribute: "Charisma", level: 0 },
    { name: "Arcana", attribute: "Intelligence", level: 0 },
    { name: "Archery", attribute: "Dexterity", level: 0 },
    { name: "Artillery", attribute: "Intelligence", level: 0 },
    { name: "Athletics", attribute: "Strength", level: 0 },
    { name: "Awareness", attribute: "Perception", level: 0 },
    { name: "Block", attribute: "Stamina", level: 0 },
    { name: "Conjuration", attribute: "Intelligence", level: 0 },
    { name: "Deception", attribute: "Manipulation", level: 0 },
    { name: "Detect Trap", attribute: "Perception", level: 0 },
    { name: "Disguise", attribute: "Appearance", level: 0 },
    { name: "Divination", attribute: "Intelligence", level: 0 },
    { name: "Dodge", attribute: "Dexterity", level: 0 },
    { name: "Insight", attribute: "Perception", level: 0 },
    { name: "Enchantment", attribute: "Intelligence", level: 0 },
    { name: "Endurance", attribute: "Stamina", level: 0 },
    { name: "Engineering", attribute: "Intelligence", level: 0 },
    { name: "Evocation", attribute: "Intelligence", level: 0 },
    { name: "Explosives Handling", attribute: "Intelligence", level: 0 },
    { name: "Firearms", attribute: "Dexterity", level: 0 },
    { name: "Hold Breath", attribute: "Stamina", level: 0 },
    { name: "Illusion", attribute: "Intelligence", level: 0 },
    { name: "Intimidation", attribute: "Strength", level: 0 },
    { name: "Investigation", attribute: "Intelligence", level: 0 },
    { name: "Lore", attribute: "Intelligence", level: 0 },
    { name: "Medicine", attribute: "Intelligence", level: 0 },
    { name: "Melee", attribute: "Strength", level: 0 },
    { name: "Nature", attribute: "Intelligence", level: 0 },
    { name: "Necromancy", attribute: "Intelligence", level: 0 },
    { name: "Parry", attribute: "Dexterity", level: 0 },
    { name: "Performance", attribute: "Charisma", level: 0 },
    { name: "Persuasion", attribute: "Charisma", level: 0 },
    { name: "Resilience", attribute: "Stamina", level: 0 },
    { name: "Scrounge", attribute: "Perception", level: 0 },
    { name: "Seduction", attribute: "Appearance", level: 0 },
    { name: "Sense Deception", attribute: "Perception", level: 0 },
    { name: "Sleight of Hand", attribute: "Dexterity", level: 0 },
    { name: "Stealth", attribute: "Dexterity", level: 0 },
    { name: "Survival", attribute: "Intelligence", level: 0 },
    { name: "Tactics", attribute: "Intelligence", level: 0 },
    { name: "Tracking", attribute: "Perception", level: 0 },
    { name: "Transmutation", attribute: "Intelligence", level: 0 }
  ];

  return (
    <Box p={4}>
      <SimpleGrid columns={[2, 3, 4, 5]} spacing={4}>
        {skills.map((skill) => (
          <SkillCard key={skill.name} skill={skill} />
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default Skills;