'use client';

import React, { useState } from 'react';
import { Box, Flex, SimpleGrid, Tooltip } from '@chakra-ui/react';
import TabLayout from './TabLayout';
import { Tab } from '../../types/tabs';
import { useCharacter } from '@/context/CharacterContext';

// Import all components
import Stats from '../stats/Stats';
import Skills from '../stats/Skills';
import Traits from '../stats/Traits';
import Attacks from '../actions/Attacks';
import Abilities from '../actions/Abilities';
import Spells from '../actions/Spells';
import Weapons from '../equipment/Weapons';
import Armor from '../equipment/Armor';
import Utility from '../equipment/Utility';
import Character from '../character/Character';
import Inventory from '../inventory/Inventory';
import Arcana from '../arcana/Arcana';
import Loot from '../loot/Loot';
import Quests from '../quests/Quests';
import Notes from '../notes/Notes';

interface StatCardProps {
  label: string;
  current: number;
  max: number;
  color: string;
  formula: string;
  breakdown: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, current, max, color, formula, breakdown }) => (
  <Tooltip
    label={
      <div className="p-2">
        <div className="font-bold">Formula: {formula}</div>
        <div>{breakdown}</div>
      </div>
    }
    placement="bottom"
  >
    <div className="w-24 h-24">
      <div
        className="h-full w-full rounded-lg shadow-sm flex flex-col items-center justify-center bg-white transition-shadow hover:shadow-md"
        style={{ borderTop: `4px solid ${color}` }}
      >
        <span className="text-sm font-semibold text-gray-600">{label}</span>
        <span className="text-lg font-bold">
          <span style={{ color }}>{current}</span>
          <span className="text-gray-400">/{max}</span>
        </span>
      </div>
    </div>
  </Tooltip>
);

const GameApp: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<number>(0);
  const { currentStats } = useCharacter();
  const characterLevel = 1;

  // Calculate stats
  const maxHp = 8 * currentStats.stamina + characterLevel;
  const maxMp = 5 * currentStats.intelligence + characterLevel;
  const maxAp = characterLevel * 2;

  const mainTabs: Tab[] = [
    {
      id: 'character',
      label: 'Character',
      content: <Character />
    },
    {
      id: 'stats',
      label: 'Stats',
      content: (
        <TabLayout
          tabs={[
            { id: 'stats', label: 'Stats', content: <Stats /> },
            { id: 'skills', label: 'Skills', content: <Skills /> },
            { id: 'traits', label: 'Traits', content: <Traits /> }
          ]}
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
        />
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      content: (
        <TabLayout
          tabs={[
            { id: 'attacks', label: 'Attacks', content: <Attacks /> },
            { id: 'abilities', label: 'Abilities', content: <Abilities /> },
            { id: 'spells', label: 'Spells', content: <Spells /> }
          ]}
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
        />
      )
    },
    {
      id: 'equipment',
      label: 'Equipment',
      content: (
        <TabLayout
          tabs={[
            { id: 'weapons', label: 'Weapons', content: <Weapons /> },
            { id: 'armor', label: 'Armor', content: <Armor /> },
            { id: 'utility', label: 'Utility', content: <Utility /> }
          ]}
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
        />
      )
    },
    {
      id: 'inventory',
      label: 'Inventory',
      content: <Inventory />
    },
    {
      id: 'arcana',
      label: 'Arcana',
      content: <Arcana />
    },
    {
      id: 'loot',
      label: 'Loot',
      content: <Loot />
    },
    {
      id: 'quests',
      label: 'Quests',
      content: <Quests />
    },
    {
      id: 'notes',
      label: 'Notes',
      content: <Notes />
    }
  ];

  return (
    <Box minH="100vh" p={4} bg="gray.50">
      <Box maxW="6xl" mx="auto" bg="white" borderRadius="lg" boxShadow="md">
        {/* Header with Stat Cards */}
        <Flex p={4} borderBottom="1px" borderColor="gray.200" justify="center" gap={4}>
          <StatCard 
            label="HP" 
            current={maxHp} 
            max={maxHp} 
            color="#E53E3E"
            formula="8 × Stamina + Level"
            breakdown={`8 × ${currentStats.stamina} + ${characterLevel} = ${maxHp}`}
          />
          <StatCard 
            label="MP" 
            current={maxMp} 
            max={maxMp} 
            color="#3182CE"
            formula="5 × Intelligence + Level"
            breakdown={`5 × ${currentStats.intelligence} + ${characterLevel} = ${maxMp}`}
          />
          <StatCard 
            label="AP" 
            current={maxAp} 
            max={maxAp} 
            color="#D69E2E"
            formula="2 × Level"
            breakdown={`2 × ${characterLevel} = ${maxAp}`}
          />
        </Flex>

        {/* Main Content */}
        <Box p={6}>
          <TabLayout
            tabs={mainTabs}
            activeTab={activeMainTab}
            onTabChange={(index: number) => {
              setActiveMainTab(index);
              setActiveSubTab(0);
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default GameApp;