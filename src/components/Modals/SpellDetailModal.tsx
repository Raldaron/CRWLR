import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  SimpleGrid,
  Box,
  Button,
} from '@chakra-ui/react';
import { Scroll, Clock, Zap, Target, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import type { Spell } from '@/types/spell';

interface SpellDetailModalProps {
  spell: Spell | null;  // Allow null
  isOpen: boolean;
  onClose: () => void;
  sourceItem?: string;
  spellLevel?: number;
  onLevelChange?: (spellName: string, level: number) => void;
}
  
const SpellDetailModal: React.FC<SpellDetailModalProps> = ({ 
  spell, 
  isOpen, 
  onClose,
  sourceItem,
  spellLevel = 1,
  onLevelChange
}) => {
  const [currentLevel, setCurrentLevel] = useState(spellLevel);

  // Update local state when the spellLevel prop changes
  useEffect(() => {
    setCurrentLevel(spellLevel);
  }, [spellLevel]);

  if (!spell) return null;  // Early return if spell is null

  // Format display value - replace "N/A" with "-"
  const formatValue = (value: string) => {
    return value === "N/A" ? "-" : value;
  };

  // Get spell scaling effects up to the current level
  const getScalingEffects = (currentLevel: number): string[] => {
    const effects: string[] = [];
    for (let i = 1; i <= currentLevel; i++) {
      const effect = spell.scaling[`Level ${i}`];
      if (effect && effect.trim() !== '') {
        effects.push(`Level ${i}: ${effect}`);
      }
    }
    return effects;
  };

  // Current scaling effects based on selected level
  const currentScalingEffects = getScalingEffects(currentLevel);

  // Level increment/decrement handlers
  const incrementLevel = () => {
    if (currentLevel < 20) {
      const newLevel = currentLevel + 1;
      setCurrentLevel(newLevel);
      // Call parent handler if provided
      if (onLevelChange && spell) {
        onLevelChange(spell.name, newLevel);
      }
    }
  };

  const decrementLevel = () => {
    if (currentLevel > 1) {
      const newLevel = currentLevel - 1;
      setCurrentLevel(newLevel);
      // Call parent handler if provided
      if (onLevelChange && spell) {
        onLevelChange(spell.name, newLevel);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent bg="gray.800" borderColor="gray.700">
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <HStack spacing={2}>
              <Scroll className="text-blue-400" />
              <Text fontSize="2xl" color="blue.300">{spell.name}</Text>
            </HStack>
            {sourceItem && (
              <Text fontSize="sm" color="gray.400">{sourceItem}</Text>
            )}
            <Badge colorScheme="purple">{spell.archetype}</Badge>
          </VStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400" />
        <ModalBody pb={6}>
          <VStack align="start" spacing={4} width="100%">
            <Text color="gray.400">{spell.description}</Text>
            
            <Divider borderColor="gray.700" />
            
            <SimpleGrid columns={2} spacing={4} width="100%">
              <Box>
                <HStack>
                  <Clock size={16} className="text-gray-400" />
                  <Text fontWeight="semibold" color="gray.300">Casting Time</Text>
                </HStack>
                <Text color="gray.400">{formatValue(spell.castingTime)}</Text>
              </Box>
              <Box>
                <HStack>
                  <Target size={16} className="text-gray-400" />
                  <Text fontWeight="semibold" color="gray.300">Range</Text>
                </HStack>
                <Text color="gray.400">{formatValue(spell.range)}</Text>
              </Box>
              <Box>
                <HStack>
                  <Zap size={16} className="text-gray-400" />
                  <Text fontWeight="semibold" color="gray.300">AP Cost</Text>
                </HStack>
                <Text color="gray.400">{formatValue(spell.abilityPointCost)}</Text>
              </Box>
              <Box>
                <HStack>
                  <Clock size={16} className="text-gray-400" />
                  <Text fontWeight="semibold" color="gray.300">Cooldown</Text>
                </HStack>
                <Text color="gray.400">{formatValue(spell.cooldown)}</Text>
              </Box>
            </SimpleGrid>

            <Divider borderColor="gray.700" />
            
            <Box width="100%">
              <HStack mb={2} justify="space-between">
                <Text fontWeight="semibold" color="gray.300">Spell Scaling</Text>
                <HStack>
                  <Button
                    size="xs"
                    onClick={decrementLevel}
                    isDisabled={currentLevel <= 1}
                    leftIcon={<ChevronDown size={16} />}
                    colorScheme="accent"
                    variant="outline"
                  >
                    Lower
                  </Button>
                  <Text fontWeight="bold" color="gray.300">Level {currentLevel}</Text>
                  <Button
                    size="xs"
                    onClick={incrementLevel}
                    isDisabled={currentLevel >= 20}
                    rightIcon={<ChevronUp size={16} />}
                    colorScheme="brand"
                  >
                    Raise
                  </Button>
                </HStack>
              </HStack>
              
              {currentScalingEffects.length > 0 ? (
                <VStack align="stretch" spacing={2}>
                  {currentScalingEffects.map((effect, index) => (
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
                  ))}
                </VStack>
              ) : (
                <Text color="gray.500" fontStyle="italic">
                  No scaling effects available for this level
                </Text>
              )}
            </Box>

            {spell.damage !== "N/A" && (
              <>
                <Divider borderColor="gray.700" />
                <Box width="100%">
                  <Text fontWeight="semibold" mb={2} color="gray.300">Damage</Text>
                  <HStack>
                    <Text fontSize="lg" fontWeight="bold" color="accent.300">{formatValue(spell.damage)}</Text>
                    <Badge colorScheme="red">
                      {formatValue(spell.damageType)}
                    </Badge>
                  </HStack>
                </Box>
              </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SpellDetailModal;