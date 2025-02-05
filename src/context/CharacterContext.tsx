'use client';

import React, { createContext, useContext, useState } from 'react';
import type { CharacterStats, Skill, Trait } from '@/types/character';
import type { Race } from '@/types/race';

interface CharacterContextType {
  stats: CharacterStats;
  setStats: React.Dispatch<React.SetStateAction<CharacterStats>>;
  skills: Skill[];
  setSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
  traits: Trait[];
  setTraits: React.Dispatch<React.SetStateAction<Trait[]>>;
  selectedRace: Race | null;  // Add this
  setSelectedRace: React.Dispatch<React.SetStateAction<Race | null>>;  // Add this
  resetStats: () => void;
}

const defaultStats: CharacterStats = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
  appearance: 10,
  manipulation: 10,
  perception: 10,
  wit: 10,
  stamina: 10
};

const defaultSkills: Skill[] = [
  { id: '1', name: 'Survival', level: 0, description: 'Ability to survive in harsh conditions' },
  { id: '2', name: 'Athletics', level: 0, description: 'Physical fitness and athletic ability' },
  { id: '3', name: 'Persuasion', level: 0, description: 'Ability to convince others' },
];

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<CharacterStats>(defaultStats);
  const [skills, setSkills] = useState<Skill[]>(defaultSkills);
  const [traits, setTraits] = useState<Trait[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);  // Add this

  const resetStats = () => {
    setStats(defaultStats);
    setSkills(defaultSkills);
    setTraits([]);
    setSelectedRace(null);  // Add this
  };

  // Debug log
  console.log('CharacterContext - selectedRace:', selectedRace);

  const value = {
    stats,
    setStats,
    skills,
    setSkills,
    traits,
    setTraits,
    selectedRace,  // Add this
    setSelectedRace,  // Add this
    resetStats
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
}