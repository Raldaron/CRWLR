'use client';

import React, { useState } from 'react';
import { Box } from '@chakra-ui/react';
import TabLayout from './TabLayout';
import { Tab } from '../../types/tabs';

// Stats Components (moved from Character)
import Stats from '../stats/Stats';
import Skills from '../stats/Skills';
import Traits from '../stats/Traits';

// Action Components
import Attacks from '../actions/Attacks';
import Abilities from '../actions/Abilities';
import Spells from '../actions/Spells';

// Equipment Components
import Weapons from '../equipment/Weapons';
import Armor from '../equipment/Armor';
import Utility from '../equipment/Utility';

// Other Components
import Character from '../character/Character'; // New Character component (to be created)
import Inventory from '../inventory/Inventory';
import Arcana from '../arcana/Arcana';
import Loot from '../loot/Loot';
import Quests from '../quests/Quests';
import Notes from '../notes/Notes';

const GameApp: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<number>(0);

  // Define the main tabs structure with actual content components
  const mainTabs: Tab[] = [
    {
      id: 'character',
      label: 'Character',
      content: <Character /> // Using the new Character component
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
      <Box 
        maxW="6xl" 
        mx="auto" 
        bg="white" 
        borderRadius="lg" 
        boxShadow="md" 
        p={6}
      >
        <TabLayout
          tabs={mainTabs}
          activeTab={activeMainTab}
          onTabChange={(index: number) => {
            setActiveMainTab(index);
            setActiveSubTab(0); // Reset subtab when main tab changes
          }}
        />
      </Box>
    </Box>
  );
};

export default GameApp;