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
import { Card, CardContent } from '@/components/ui/card';
import { useCharacter } from '@/context/CharacterContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { Ability, AbilitiesData } from '@/types/ability';

interface AbilityCardProps {
  ability: Ability;
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

  return (
    <>
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={onOpen}
      >
        <CardContent>
          <VStack 
            spacing={2} 
            p={4} 
            align="center" 
            justify="center" 
            height="150px"
          >
            <Text 
              fontSize="lg" 
              fontWeight="bold" 
              color="blue.600"
              textAlign="center"
            >
              {ability.name}
            </Text>
            <Badge colorScheme="purple" fontSize="sm">
              AP Cost: {ability.abilitypointcost}
            </Badge>
            <Badge colorScheme="orange" fontSize="sm">
              {ability.cooldown}
            </Badge>
            <Badge colorScheme="blue" fontSize="sm">
              Level: {level}
            </Badge>
          </VStack>
        </CardContent>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Text fontSize="2xl" color="blue.600">
              {ability.name}
            </Text>
            <HStack spacing={2} mt={1}>
              <Badge colorScheme="purple">AP Cost: {ability.abilitypointcost}</Badge>
              <Badge colorScheme="orange">{ability.cooldown}</Badge>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="start" spacing={4} width="100%">
              <Box width="100%">
                <Text fontWeight="semibold" color="gray.700">Description</Text>
                <Text>{ability.description}</Text>
              </Box>

              <Box width="100%">
                <Text fontWeight="semibold" color="gray.700">Effect</Text>
                <Text>{ability.effect}</Text>
              </Box>

              <SimpleGrid columns={2} spacing={4} width="100%">
                <Box>
                  <Text fontWeight="semibold" color="gray.700">Range</Text>
                  <Text>{ability.range}</Text>
                </Box>
                {ability.damage !== "N/A" && (
                  <Box>
                    <Text fontWeight="semibold" color="gray.700">Damage</Text>
                    <Text>{ability.damage} {ability.damagetype}</Text>
                  </Box>
                )}
              </SimpleGrid>

              <Divider />

              <Box width="100%">
                <HStack justify="space-between" mb={4}>
                  <Text fontWeight="semibold" color="gray.700">
                    Level {level}
                  </Text>
                  <HStack>
                    <Button
                      size="sm"
                      onClick={decrementLevel}
                      isDisabled={level <= 1}
                      leftIcon={<ChevronDown size={16} />}
                    >
                      Lower
                    </Button>
                    <Button
                      size="sm"
                      onClick={incrementLevel}
                      isDisabled={level >= maxLevel}
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
                        bg="blue.50" 
                        borderRadius="md"
                        borderLeft="4px"
                        borderColor="blue.500"
                      >
                        <Text>{effect}</Text>
                      </Box>
                    ))
                  ) : (
                    <Text color="gray.500" fontStyle="italic">
                      No effects available yet
                    </Text>
                  )}
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

const Abilities: React.FC = () => {
  const { selectedRace, selectedClass } = useCharacter();
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

  if (!selectedRace && !selectedClass) {
    return (
      <Box p={4} textAlign="center">
        <Text color="gray.500">Select a race and class to view abilities</Text>
      </Box>
    );
  }

  if (!abilitiesData) {
    return (
      <Box p={4} textAlign="center">
        <Text color="gray.500">Loading abilities...</Text>
      </Box>
    );
  }

  // Combine abilities from both race and class using Array.from
  const raceAbilities = selectedRace?.abilities || [];
  const classAbilities = selectedClass?.abilities || [];
  const allAbilities = Array.from(new Set([...raceAbilities, ...classAbilities]));

  const abilityDetails = allAbilities.map((abilityName: string) => {
    const ability = Object.values(abilitiesData.abilities).find(
      (a: Ability) => a.name.toLowerCase() === abilityName.toLowerCase()
    );
    
    return ability || { 
      name: abilityName,
      description: "Ability details not found",
      effect: "Unknown",
      range: "Unknown",
      damage: "Unknown",
      damagetype: "Unknown",
      scaling: {},
      abilitypointcost: 0,
      cooldown: "Unknown"
    };
  });

  return (
    <ScrollArea className="h-[600px] pr-4">
      <SimpleGrid 
        columns={{ base: 2, sm: 3, md: 4 }} 
        spacing={4} 
        p={4}
      >
        {abilityDetails.map((ability: Ability) => (
          <AbilityCard key={ability.name} ability={ability} />
        ))}
      </SimpleGrid>
    </ScrollArea>
  );
};

export default Abilities;