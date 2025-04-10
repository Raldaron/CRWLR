// src/hooks/useSpells.ts
import { useState, useEffect, useCallback } from 'react';
import { Spell } from '@/types/spell';
import { fetchAllSpells, fetchSpellsByArchetype } from '@/services/spellDataService';

interface UseSpellsReturn {
  spells: Spell[];
  loading: boolean;
  error: Error | null;
  fetchSpells: () => Promise<void>;
  fetchByArchetype: (archetype: string) => Promise<void>;
  getSpellById: (id: string) => Spell | undefined;
}

/**
 * Custom hook for working with spells
 */
export const useSpells = (): UseSpellsReturn => {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all spells
  const fetchSpells = useCallback(async () => {
    try {
      setLoading(true);
      const allSpells = await fetchAllSpells();
      setSpells(allSpells);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch spells'));
      console.error('Error in useSpells:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch spells by archetype
  const fetchByArchetype = useCallback(async (archetype: string) => {
    try {
      setLoading(true);
      const filteredSpells = await fetchSpellsByArchetype(archetype);
      setSpells(filteredSpells);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(`Failed to fetch spells for archetype: ${archetype}`));
      console.error('Error in useSpells fetchByArchetype:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get a spell by ID
  const getSpellById = useCallback(
    (id: string) => {
      return spells.find(spell => spell.id === id);
    },
    [spells]
  );

  // Load spells on initial mount
  useEffect(() => {
    fetchSpells();
  }, [fetchSpells]);

  return {
    spells,
    loading,
    error,
    fetchSpells,
    fetchByArchetype,
    getSpellById,
  };
};

export default useSpells;