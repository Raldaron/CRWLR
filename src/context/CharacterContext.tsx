'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CharacterStats, Skill, Trait } from '@/types/character';
import type { Race } from '@/types/race';
import type { Class } from '@/types/class';

interface AbilityLevels {
  [key: string]: number;
}

interface CharacterContextType {
  baseStats: CharacterStats;
  currentStats: CharacterStats;
  setBaseStats: React.Dispatch<React.SetStateAction<CharacterStats>>;
  baseSkills: Skill[];
  currentSkills: Skill[];
  setBaseSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
  traits: Trait[];
  setTraits: React.Dispatch<React.SetStateAction<Trait[]>>;
  selectedRace: Race | null;
  setSelectedRace: React.Dispatch<React.SetStateAction<Race | null>>;
  selectedClass: Class | null;
  setSelectedClass: React.Dispatch<React.SetStateAction<Class | null>>;
  abilityLevels: AbilityLevels;
  setAbilityLevel: (abilityName: string, level: number) => void;
  resetCharacter: () => void;
}

const defaultStats: CharacterStats = {
  strength: 10,
  dexterity: 10,
  stamina: 10,
  intelligence: 10,
  perception: 10,
  wit: 10,
  charisma: 10,
  manipulation: 10,
  appearance: 10
};

const defaultSkills: Skill[] = [
  { id: '1', name: 'Survival', level: 0, description: 'Ability to survive in harsh conditions' },
  { id: '2', name: 'Athletics', level: 0, description: 'Physical fitness and athletic ability' },
  { id: '3', name: 'Persuasion', level: 0, description: 'Ability to convince others' },
];

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export function CharacterProvider({ children }: { children: React.ReactNode }) {
  // Stats management
  const [baseStats, setBaseStats] = useState<CharacterStats>(defaultStats);
  const [currentStats, setCurrentStats] = useState<CharacterStats>(defaultStats);
  
  // Skills management
  const [baseSkills, setBaseSkills] = useState<Skill[]>(defaultSkills);
  const [currentSkills, setCurrentSkills] = useState<Skill[]>(defaultSkills);
  
  // Other state
  const [traits, setTraits] = useState<Trait[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [abilityLevels, setAbilityLevels] = useState<AbilityLevels>({});

  // Update stats and skills when race or class changes
  useEffect(() => {
    // Start with base stats
    const newStats = { ...baseStats };
    const newSkills = baseSkills.map(skill => ({ ...skill }));
    const newAbilityLevels = { ...abilityLevels };

    // Apply race bonuses if a race is selected
    if (selectedRace) {
      Object.entries(selectedRace.statbonus).forEach(([stat, bonus]) => {
        if (stat in newStats) {
          newStats[stat as keyof CharacterStats] += bonus;
        }
      });

      newSkills.forEach(skill => {
        const raceBonus = selectedRace.skillbonus[skill.name.toLowerCase()] || 0;
        skill.level += raceBonus;
      });

      selectedRace.abilities.forEach(abilityName => {
        if (!newAbilityLevels[abilityName]) {
          newAbilityLevels[abilityName] = 1;
        }
      });
    }

    // Apply class bonuses if a class is selected
    if (selectedClass) {
      Object.entries(selectedClass.statbonus).forEach(([stat, bonus]) => {
        if (stat in newStats) {
          newStats[stat as keyof CharacterStats] += bonus;
        }
      });

      newSkills.forEach(skill => {
        const classBonus = selectedClass.skillbonus[skill.name.toLowerCase()] || 0;
        skill.level += classBonus;
      });

      selectedClass.abilities.forEach(abilityName => {
        if (!newAbilityLevels[abilityName]) {
          newAbilityLevels[abilityName] = 1;
        }
      });
    }

    setCurrentStats(newStats);
    setCurrentSkills(newSkills);
    setAbilityLevels(newAbilityLevels);
    
  }, [selectedRace, selectedClass, baseStats, baseSkills]);

  const setAbilityLevel = (abilityName: string, level: number) => {
    setAbilityLevels(prev => ({
      ...prev,
      [abilityName]: level
    }));
  };

  const resetCharacter = () => {
    setBaseStats(defaultStats);
    setCurrentStats(defaultStats);
    setBaseSkills(defaultSkills);
    setCurrentSkills(defaultSkills);
    setTraits([]);
    setSelectedRace(null);
    setSelectedClass(null);
    setAbilityLevels({});
  };

  const value = {
    baseStats,
    currentStats,
    setBaseStats,
    baseSkills,
    currentSkills,
    setBaseSkills,
    traits,
    setTraits,
    selectedRace,
    setSelectedRace,
    selectedClass,
    setSelectedClass,
    abilityLevels,
    setAbilityLevel,
    resetCharacter
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