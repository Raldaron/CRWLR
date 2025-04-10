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
  Icon,
} from '@chakra-ui/react';
import { Scroll, Clock, Zap, Target, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import type { Spell } from '@/types/spell';

interface SpellDetailModalProps {
  spell: Spell | null;
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

  useEffect(() => {
    setCurrentLevel(spellLevel);
  }, [spellLevel]);

  if (!spell) return null;

  const hasValue = (value: any): boolean => {
    return value !== undefined && value !== null && value !== '' && value !== 'N/A' && value !== '-';
  };

  const formatDescription = (text: string | undefined): string => {
    if (!text) return '';
    // Replace any "\n" (escaped newlines) with actual newlines
    return text.replace(/\\n/g, '\n');
  };

  const getScalingEffects = (selectedLevel: number): { level: number; effect: string }[] => {
    const effects: { level: number; effect: string }[] = [];
    if (!spell.scaling) return effects;

    for (let i = 1; i <= selectedLevel; i++) {
      const levelKey = `level ${i}`;
      const effect = spell.scaling[levelKey];

      if (hasValue(effect)) {
        effects.push({ level: i, effect: effect });
      }
    }
    return effects;
  };

  const currentScalingEffects = getScalingEffects(currentLevel);

  const incrementLevel = () => {
    if (currentLevel < 20) {
      const newLevel = currentLevel + 1;
      setCurrentLevel(newLevel);
      if (onLevelChange && spell) {
        onLevelChange(spell.name, newLevel);
      }
    }
  };

  const decrementLevel = () => {
    if (currentLevel > 1) {
      const newLevel = currentLevel - 1;
      setCurrentLevel(newLevel);
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
              <Icon as={Scroll} className="text-blue-400" />
              <Text fontSize="2xl" color="blue.300">{spell.name}</Text>
            </HStack>
            {sourceItem && (
              <Text fontSize="sm" color="gray.400">{sourceItem}</Text>
            )}
            {hasValue(spell.archetype) && (
              <Badge colorScheme="purple">{spell.archetype}</Badge>
            )}
          </VStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400" />
        <ModalBody pb={6}>
          <VStack align="start" spacing={4} width="100%">

            {hasValue(spell.spelldescription) && (
              <Box width="100%">
                <Text fontWeight="semibold" color="gray.300" mb={1}>Description</Text>
                <Text color="gray.400" whiteSpace="pre-wrap">{formatDescription(spell.spelldescription)}</Text>
                <Divider borderColor="gray.700" mt={3}/>
              </Box>
            )}

            {hasValue(spell.effectdescription) && (
                <Box width="100%">
                    <HStack mb={1}>
                        <Icon as={Sparkles} size={16} className="text-gray-400" />
                        <Text fontWeight="semibold" color="gray.300">Effect</Text>
                    </HStack>
                    <Text color="gray.400" whiteSpace="pre-wrap">{formatDescription(spell.effectdescription)}</Text>
                    <Divider borderColor="gray.700" mt={3}/>
                </Box>
            )}

            <SimpleGrid columns={2} spacing={4} width="100%">
              {hasValue(spell.castingTime) && (
                <Box>
                  <HStack>
                    <Icon as={Clock} size={16} className="text-gray-400" />
                    <Text fontWeight="semibold" color="gray.300">Casting Time</Text>
                  </HStack>
                  <Text color="gray.400">{spell.castingTime}</Text>
                </Box>
              )}
              {hasValue(spell.range) && (
                <Box>
                  <HStack>
                    <Icon as={Target} size={16} className="text-gray-400" />
                    <Text fontWeight="semibold" color="gray.300">Range</Text>
                  </HStack>
                  <Text color="gray.400">{spell.range}</Text>
                </Box>
              )}
              {hasValue(spell.manaPointCost) && (
                 <Box>
                   <HStack>
                     <Icon as={Zap} size={16} className="text-gray-400" />
                     <Text fontWeight="semibold" color="gray.300">Mana Cost</Text>
                   </HStack>
                   <Text color="gray.400">{String(spell.manaPointCost)}</Text>
                 </Box>
              )}
              {hasValue(spell.cooldown) && (
                <Box>
                  <HStack>
                    <Icon as={Clock} size={16} className="text-gray-400" />
                    <Text fontWeight="semibold" color="gray.300">Cooldown</Text>
                  </HStack>
                  <Text color="gray.400">{spell.cooldown}</Text>
                </Box>
              )}
            </SimpleGrid>

            {(hasValue(spell.damage) || hasValue(spell.damageType)) && (
              <>
                <Divider borderColor="gray.700" />
                <Box width="100%">
                  <Text fontWeight="semibold" mb={2} color="gray.300">Damage</Text>
                  <HStack>
                    {hasValue(spell.damage) && (
                       <Text fontSize="lg" fontWeight="bold" color="accent.300">{spell.damage}</Text>
                    )}
                    {hasValue(spell.damageType) && (
                       <Badge colorScheme="red">{spell.damageType}</Badge>
                    )}
                  </HStack>
                </Box>
              </>
            )}

            {hasValue(spell.spellCastingModifier) && (
                 <>
                    <Divider borderColor="gray.700" />
                    <Box width="100%">
                        <Text fontWeight="semibold" mb={1} color="gray.300">Spellcasting Modifier</Text>
                        <Badge colorScheme="purple">{spell.spellCastingModifier}</Badge>
                    </Box>
                 </>
            )}

            {hasValue(spell.savingThrow) && (
                <>
                    <Divider borderColor="gray.700" />
                    <Box width="100%">
                        <Text fontWeight="semibold" mb={1} color="gray.300">Saving Throw</Text>
                        <Text color="gray.400">{spell.savingThrow}</Text>
                    </Box>
                </>
            )}

            {/* Keywords section if available */}
            {hasValue(spell.keywords) && (
                <>
                    <Divider borderColor="gray.700" />
                    <Box width="100%">
                        <Text fontWeight="semibold" mb={1} color="gray.300">Keywords</Text>
                        <HStack spacing={2} flexWrap="wrap">
                            {(Array.isArray(spell.keywords) ? spell.keywords : (spell.keywords || '').split(', ')).map((keyword, idx) => (
                                <Badge key={idx} colorScheme="teal" mb={1}>{keyword}</Badge>
                            ))}
                        </HStack>
                    </Box>
                </>
            )}

            {/* Spell Scaling Section */}
            {spell.scaling && Object.keys(spell.scaling).length > 0 && (
              <>
                <Divider borderColor="gray.700" />
                <Box width="100%">
                  <HStack justify="space-between" mb={4}>
                    <Text fontWeight="semibold" color="gray.300">Active Scaling Effects</Text>
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
                      {currentScalingEffects.map(({ level, effect }, index) => (
                        <Box
                          key={index}
                          p={3}
                          bg="blue.900"
                          borderRadius="md"
                          borderLeft="4px"
                          borderColor="blue.500"
                        >
                          <Text color="gray.100">
                            <Text as="span" fontWeight="bold" color="blue.300">Level {level}:</Text> {effect}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Text color="gray.500" fontStyle="italic">
                      No scaling effects specified up to Level {currentLevel}.
                    </Text>
                  )}
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