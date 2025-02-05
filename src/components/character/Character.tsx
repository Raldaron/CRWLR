import React, { useState, useEffect } from 'react';
import { Box, SimpleGrid, Text, VStack, Tooltip } from '@chakra-ui/react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useCharacter } from '@/context/CharacterContext';
import { Heart, Brain, Zap } from 'lucide-react';
import RaceSelection from './RaceSelection';
import type { Race } from '@/types/character';
import StatCard from './StatCard';

const Character: React.FC = () => {
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const { stats, setStats, skills, setSkills } = useCharacter();
  const characterLevel = 1;
  
  // Calculate stats including racial bonuses
  const maxHp = 8 * stats.constitution + characterLevel;
  const maxMp = 5 * stats.intelligence + characterLevel;
  const maxAp = characterLevel * 2;

  // Handle race selection and apply bonuses
  const handleRaceSelect = (race: Race) => {
    setSelectedRace(race);

    // Apply stat bonuses
    setStats(prevStats => {
      const newStats = { ...prevStats };
      Object.entries(race.statbonus).forEach(([stat, bonus]) => {
        const statKey = stat as keyof typeof newStats;
        if (statKey in newStats) {
          newStats[statKey] += bonus;
        }
      });
      return newStats;
    });

    // Apply skill bonuses
    setSkills(prevSkills => {
      return prevSkills.map(skill => {
        const bonus = race.skillbonus[skill.name.toLowerCase()] || 0;
        return {
          ...skill,
          level: skill.level + bonus
        };
      });
    });
  };

  return (
    <Box p={6}>
      {/* Main character info card */}
      <Card className="mb-8">
        <CardHeader>
          <Text fontSize="3xl" fontWeight="bold">Character Name</Text>
        </CardHeader>
        <CardContent>
          <SimpleGrid columns={3} spacing={6} mb={8}>
            <Box>
              <Text color="gray.600">Race</Text>
              <RaceSelection
                selectedRace={selectedRace}
                onRaceSelect={handleRaceSelect}
              />
            </Box>
            <Box>
              <Text color="gray.600">Class</Text>
              <Text fontSize="2xl" fontWeight="bold">Class</Text>
            </Box>
            <Box>
              <Text color="gray.600">Level</Text>
              <Text fontSize="2xl" fontWeight="bold">{characterLevel}</Text>
            </Box>
          </SimpleGrid>
        </CardContent>
      </Card>

      {/* Resource Cards */}
      <SimpleGrid columns={3} spacing={6}>
        <StatCard 
          label="HP" 
          current={maxHp} 
          max={maxHp}
          icon={Heart}
          color="#E53E3E"
          formula="8 × Constitution + Level"
          breakdown={`8 × ${stats.constitution} + ${characterLevel} = ${maxHp}`}
        />
        <StatCard 
          label="MP" 
          current={maxMp} 
          max={maxMp}
          icon={Brain}
          color="#3182CE"
          formula="5 × Intelligence + Level"
          breakdown={`5 × ${stats.intelligence} + ${characterLevel} = ${maxMp}`}
        />
        <StatCard 
          label="AP" 
          current={maxAp} 
          max={maxAp}
          icon={Zap}
          color="#D69E2E"
          formula="2 × Level"
          breakdown={`2 × ${characterLevel} = ${maxAp}`}
        />
      </SimpleGrid>
    </Box>
  );
};

export default Character;