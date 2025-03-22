import React from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  Badge,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
  Divider,
} from '@chakra-ui/react';
import { useCharacter } from '@/context/CharacterContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronUp, ChevronDown } from 'lucide-react';
import DarkThemedCard from '@/components/ui/DarkThemedCard';
import type { Ability, AbilitiesData } from '@/types/ability';

interface AbilityCardProps {
  ability: Ability & { sources?: string[] };
}

const AbilityCard: React.FC<AbilityCardProps> = ({ ability }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { abilityLevels, setAbilityLevel } = useCharacter();
  const maxLevel = 10;
  
  const level = abilityLevels[ability.name] || 1;

  const incrementLevel = () => {
    if (level < maxLevel) {
      setAbilityLevel(ability.name, level + 1);
    }
  };

  const decrementLevel = () => {
    if (level > 1) {
      setAbilityLevel(ability.name, level - 1);
    }
  };

  const getLevelEffects = (currentLevel: number): string[] => {
    const effects: string[] = [];
    for (let i = 1; i <= currentLevel; i++) {
      const effect = ability.scaling[`Level ${i}`];
      if (effect && effect.trim() !== '') {
        effects.push(`Level ${i}: ${effect}`);
      }
    }
    return effects;
  };

  const currentEffects = getLevelEffects(level);

  // Function to format description text, replacing /n/n with actual line breaks
  const formatDescription = (text: string) => {
    if (!text) return '';
    return text.replace(/\/n\/n/g, '\n\n');
  };

  return (
    <>
      <DarkThemedCard onClick={onOpen} height="150px">
        <VStack 
          spacing={1} 
          align="center" 
          justify="center"
          height="100%"
          overflow="hidden"
        >
          <Text 
            fontSize={{ base: "sm", md: "md" }} 
            fontWeight="bold" 
            color="blue.300"
            textAlign="center"
            noOfLines={2}
            width="100%"
          >
            {ability.name}
          </Text>
          <HStack spacing={1} wrap="wrap" justify="center" mb={1}>
            {ability.sources?.map((source, idx) => (
              <Badge 
                key={idx}
                colorScheme={
                  source === 'Race' ? 'green' :
                  source === 'Class' ? 'purple' :
                  'blue'
                }
                fontSize="2xs"
                px={1}
              >
                {source}
              </Badge>
            ))}
          </HStack>
          <HStack spacing={1} wrap="wrap" justify="center">
            <Badge colorScheme="purple" fontSize="2xs" px={1}>
              AP: {ability.abilitypointcost}
            </Badge>
            <Badge colorScheme="orange" fontSize="2xs" px={1} isTruncated maxWidth="80px">
              {ability.cooldown}
            </Badge>
            <Badge colorScheme="blue" fontSize="2xs" px={1}>
              Lvl: {level}
            </Badge>
          </HStack>
        </VStack>
      </DarkThemedCard>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.700">
          <ModalHeader>
            <Text fontSize="2xl" color="blue.300">
              {ability.name}
            </Text>
            <HStack spacing={2} mt={1}>
              <Badge colorScheme="purple">AP Cost: {ability.abilitypointcost}</Badge>
              <Badge colorScheme="orange">{ability.cooldown}</Badge>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={6}>
            <VStack align="start" spacing={4} width="100%">
              <Box width="100%">
                <Text fontWeight="semibold" color="gray.300">Description</Text>
                {/* Use whiteSpace="pre-wrap" to preserve line breaks and format description */}
                <Text whiteSpace="pre-wrap" style={{ whiteSpace: 'pre-wrap' }} color="gray.400">
                  {formatDescription(ability.description)}
                </Text>
              </Box>

              <Box width="100%">
                <Text fontWeight="semibold" color="gray.300">Effect</Text>
                {/* Also apply formatting to effect text */}
                <Text whiteSpace="pre-wrap" color="gray.400">
                  {formatDescription(ability.effect)}
                </Text>
              </Box>

              <SimpleGrid columns={2} spacing={4} width="100%">
                <Box>
                  <Text fontWeight="semibold" color="gray.300">Range</Text>
                  <Text color="gray.400">{ability.range}</Text>
                </Box>
                {ability.damage !== "N/A" && (
                  <Box>
                    <Text fontWeight="semibold" color="gray.300">Damage</Text>
                    <Text color="gray.400">{ability.damage} {ability.damagetype}</Text>
                  </Box>
                )}
              </SimpleGrid>

              <Divider borderColor="gray.600" />

              <Box width="100%">
                <HStack justify="space-between" mb={4}>
                  <Text fontWeight="semibold" color="gray.300">
                    Level {level}
                  </Text>
                  <HStack>
                    <Button
                      size="xs"
                      onClick={decrementLevel}
                      isDisabled={level <= 1}
                      colorScheme="accent"
                      variant="outline"
                      leftIcon={<ChevronDown size={16} />}
                    >
                      Lower
                    </Button>
                    <Button
                      size="xs"
                      onClick={incrementLevel}
                      isDisabled={level >= maxLevel}
                      colorScheme="purple"
                      rightIcon={<ChevronUp size={16} />}
                    >
                      Raise
                    </Button>
                  </HStack>
                </HStack>
                
                <VStack align="stretch" spacing={2}>
                  {currentEffects.length > 0 ? (
                    currentEffects.map((effect, index) => (
                      <Box 
                        key={index}
                        p={3} 
                        bg="blue.900" 
                        borderRadius="md"
                        borderLeft="4px"
                        borderColor="blue.500"
                      >
                        <Text color="gray.100">{effect}</Text>
                      </Box>
                    ))
                  ) : (
                    <Text color="gray.500" fontStyle="italic">
                      No effects available yet
                    </Text>
                  )}
                </VStack>
              </Box>
              
              {/* Display special rules if they exist */}
              {ability.specialrules && (
                <>
                  <Divider borderColor="gray.600" />
                  <Box width="100%">
                    <Text fontWeight="semibold" color="gray.300">Special Rules</Text>
                    <VStack align="start" spacing={2} mt={2}>
                      {Object.entries(ability.specialrules).map(([key, rule]) => (
                        <Text key={key} color="gray.400">{key}. {rule}</Text>
                      ))}
                    </VStack>
                  </Box>
                </>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

const Abilities: React.FC = () => {
  const { 
    selectedRace, 
    selectedClass, 
    equippedItems 
  } = useCharacter();
  const [abilitiesData, setAbilitiesData] = React.useState<AbilitiesData | null>(null);

  React.useEffect(() => {
    const loadAbilitiesData = async (): Promise<void> => {
      try {
        const response = await fetch('/data/abilities.json');
        const data: AbilitiesData = await response.json();
        setAbilitiesData(data);
      } catch (error) {
        console.error('Error loading abilities:', error);
      }
    };

    loadAbilitiesData();
  }, []);

  if (!abilitiesData) {
    return (
      <Box p={4} textAlign="center">
        <Text color="gray.400">Loading abilities...</Text>
      </Box>
    );
  }

  // Collect abilities from race, class, and equipped items
  const raceAbilities = selectedRace?.abilities || [];
  const classAbilities = selectedClass?.abilities || [];
  const equipmentAbilities = Object.values(equippedItems)
    .filter(item => item !== null)
    .flatMap(item => {
      // Each item can have an abilities array 
      if ('abilities' in item && Array.isArray((item as any).abilities)) {
        return (item as any).abilities || [];
      }
      return [];
    });

  // Combine all abilities and remove duplicates
  const allAbilities = Array.from(new Set([
    ...raceAbilities, 
    ...classAbilities, 
    ...equipmentAbilities
  ]));

  // No abilities message
  if (allAbilities.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Text color="gray.400">
          Select a race, class, or equip items to view abilities
        </Text>
      </Box>
    );
  }

  const abilityDetails = allAbilities.map((abilityName: string) => {
    // First try to lookup ability by exact key matching (case-sensitive)
    let ability = abilitiesData.abilities[abilityName.toLowerCase()];
    
    // If not found by key, try to find by name (case-insensitive)
    if (!ability) {
      const normalizedName = abilityName.toLowerCase();
      for (const key in abilitiesData.abilities) {
        if (abilitiesData.abilities[key].name.toLowerCase() === normalizedName) {
          ability = abilitiesData.abilities[key];
          break;
        }
      }
    }
    
    // Track sources
    const sources = [];
    if (raceAbilities.includes(abilityName)) sources.push('Race');
    if (classAbilities.includes(abilityName)) sources.push('Class');
    if (equipmentAbilities.includes(abilityName)) sources.push('Equipment');
    
    if (ability) {
      return {
        ...ability,
        sources
      };
    } else {
      // Fallback for abilities not found in the database
      return { 
        name: abilityName,
        description: "Ability details not found in database.",
        effect: "Unknown",
        range: "Unknown",
        damage: "N/A",
        damagetype: "N/A",
        scaling: {},
        abilitypointcost: 0,
        cooldown: "Unknown",
        sources
      };
    }
  });

  return (
    <ScrollArea className="h-[600px] pr-4">
      <SimpleGrid 
        columns={{ base: 2, sm: 3, md: 4, lg: 5 }} 
        spacing={3} 
        p={2}
      >
        {abilityDetails.map((ability) => (
          <AbilityCard key={ability.name} ability={ability} />
        ))}
      </SimpleGrid>
    </ScrollArea>
  );
};

export default Abilities;