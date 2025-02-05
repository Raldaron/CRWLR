import React, { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
  Box,
  Text,
  VStack,
  List,
  ListItem,
  useDisclosure,
} from '@chakra-ui/react';

// Define interfaces for our race data
interface StatBonus {
  [key: string]: number;
}

interface SkillBonus {
  [key: string]: number;
}

interface Race {
  name: string;
  description: string;
  statbonus: StatBonus;
  skillbonus: SkillBonus;
  abilities: string[];
  traits: string[];
  lore: string;
  armorrating: number;
}

interface Races {
  [key: string]: Race;
}

// Props interfaces
interface RaceSelectionProps {
  selectedRace: Race | null;
  onRaceSelect: (race: Race) => void;
}

interface RaceCardProps {
  race: Race;
}

interface RaceDetailsProps {
  race: Race;
}

// Main component
const RaceSelection: React.FC<RaceSelectionProps> = ({ selectedRace, onRaceSelect }) => {
  const { isOpen: isRaceListOpen, onOpen: openRaceList, onClose: closeRaceList } = useDisclosure();
  const { isOpen: isRaceDetailsOpen, onOpen: openRaceDetails, onClose: closeRaceDetails } = useDisclosure();
  
  const [viewingRace, setViewingRace] = useState<Race | null>(null);
  const [races, setRaces] = useState<Races | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRaces() {
      try {
        const racesModule = await import('@/data/races.json');
        setRaces(racesModule.default);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading races:', err);
        setError('Failed to load races data');
        setIsLoading(false);
      }
    }

    loadRaces();
  }, []);

  const handleRaceClick = (race: Race) => {
    setViewingRace(race);
    closeRaceList();
    openRaceDetails();
  };

  const handleRaceSelect = () => {
    if (viewingRace) {
      onRaceSelect(viewingRace);
      closeRaceDetails();
    }
  };

  // Race card component
  const RaceCard: React.FC<RaceCardProps> = ({ race }) => (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      cursor="pointer"
      onClick={() => handleRaceClick(race)}
      _hover={{ shadow: 'md', transform: 'scale(1.02)' }}
      transition="all 0.2s"
      bg="white"
    >
      <Text fontSize="xl" fontWeight="bold">{race.name}</Text>
    </Box>
  );

  // Race details component
  const RaceDetails: React.FC<RaceDetailsProps> = ({ race }) => (
    <VStack align="stretch" spacing={4}>
      <Text fontSize="2xl" fontWeight="bold">{race.name}</Text>
      <Text>{race.description}</Text>
      
      <Box>
        <Text fontWeight="bold" mb={2}>Stat Bonuses:</Text>
        <List spacing={2}>
          {Object.entries(race.statbonus).map(([stat, bonus]) => (
            <ListItem key={stat}>
              {stat.charAt(0).toUpperCase() + stat.slice(1)}: +{bonus}
            </ListItem>
          ))}
        </List>
      </Box>

      <Box>
        <Text fontWeight="bold" mb={2}>Skill Bonuses:</Text>
        <List spacing={2}>
          {Object.entries(race.skillbonus).map(([skill, bonus]) => (
            <ListItem key={skill}>
              {skill.charAt(0).toUpperCase() + skill.slice(1)}: +{bonus}
            </ListItem>
          ))}
        </List>
      </Box>

      <Box>
        <Text fontWeight="bold" mb={2}>Abilities:</Text>
        <List spacing={2}>
          {race.abilities.map((ability: string) => (
            <ListItem key={ability}>{ability}</ListItem>
          ))}
        </List>
      </Box>

      <Box>
        <Text fontWeight="bold" mb={2}>Traits:</Text>
        <List spacing={2}>
          {race.traits.map((trait: string) => (
            <ListItem key={trait}>{trait}</ListItem>
          ))}
        </List>
      </Box>

      <Text fontWeight="bold">Lore:</Text>
      <Text>{race.lore}</Text>

      <Button colorScheme="blue" onClick={handleRaceSelect}>
        Select {race.name}
      </Button>
    </VStack>
  );

  return (
    <>
      <Button onClick={openRaceList}>
        {selectedRace ? selectedRace.name : 'Select Race'}
      </Button>

      {/* Race List Modal */}
      <Modal isOpen={isRaceListOpen} onClose={closeRaceList} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Choose Your Race</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {isLoading ? (
              <Text>Loading races...</Text>
            ) : error ? (
              <Text color="red.500">{error}</Text>
            ) : races && Object.keys(races).length > 0 ? (
              <SimpleGrid columns={2} spacing={4}>
                {Object.entries(races).map(([key, race]) => (
                  <RaceCard key={key} race={race} />
                ))}
              </SimpleGrid>
            ) : (
              <Text>No races available</Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Race Details Modal */}
      <Modal isOpen={isRaceDetailsOpen} onClose={closeRaceDetails} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Race Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {viewingRace && <RaceDetails race={viewingRace} />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default RaceSelection;