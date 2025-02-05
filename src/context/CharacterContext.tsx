import React, { createContext, useContext, useState } from 'react';
import type { CharacterStats, Skill, Trait } from '@/types/character';

interface CharacterContextType {
  stats: CharacterStats;
  setStats: React.Dispatch<React.SetStateAction<CharacterStats>>;
  skills: Skill[];
  setSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
  traits: Trait[];
  setTraits: React.Dispatch<React.SetStateAction<Trait[]>>;
  // Add function to reset stats to base values
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
  // Add more default skills as needed
];

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<CharacterStats>(defaultStats);
  const [skills, setSkills] = useState<Skill[]>(defaultSkills);
  const [traits, setTraits] = useState<Trait[]>([]);

  const resetStats = () => {
    setStats(defaultStats);
    setSkills(defaultSkills);
    setTraits([]);
  };

  const value = {
    stats,
    setStats,
    skills,
    setSkills,
    traits,
    setTraits,
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