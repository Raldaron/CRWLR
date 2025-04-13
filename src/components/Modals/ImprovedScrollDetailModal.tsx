// ImprovedScrollDetailModal.tsx
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
// Import relevant icons
import { ScrollText, Clock, Zap, Crosshair, BarChart, Target, Wand2, DollarSign, Info, ChevronUp, ChevronDown } from 'lucide-react';
import type { ScrollItem } from '@/types/scroll';

interface ScrollDetailModalProps {
  scroll: ScrollItem | null;
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to get rarity color scheme
const getRarityScheme = (rarity?: string): string => {
  switch (rarity?.toLowerCase()) {
    case 'common': return 'gray';
    case 'uncommon': return 'green';
    case 'rare': return 'blue';
    case 'epic': return 'purple';
    case 'legendary': return 'orange';
    case 'unique': return 'yellow';
    default: return 'gray';
  }
};

// Helper function to get damage type color scheme
const getDamageTypeColor = (type?: string): string => {
  switch (type?.toLowerCase()) {
    case 'fire': return 'red';
    case 'cold': return 'blue';
    case 'lightning': return 'yellow';
    case 'acid': return 'green';
    case 'force': return 'purple';
    case 'necrotic': return 'gray';
    case 'radiant': return 'yellow';
    case 'poison': return 'teal';
    case 'psychic': return 'pink';
    case 'thunder': return 'cyan';
    default: return 'gray';
  }
};

// Enhanced Helper: Normalize scroll properties with fallbacks for different field names
const getScrollProperty = (scroll: any, properties: string[]): any => {
  for (const prop of properties) {
    if (scroll && prop in scroll && scroll[prop] !== undefined && scroll[prop] !== null) {
      return scroll[prop];
    }
  }
  return null;
};

// Helper function to format values, replacing undefined/null/empty/"N/A" with '-'
const formatValue = (value: any): string => {
  // Check for explicitly "N/A" string as well
  if (value === undefined || value === null || String(value).trim() === '' || String(value).toUpperCase() === 'N/A') {
    return "-";
  }
  return String(value);
};

const ImprovedScrollDetailModal: React.FC<ScrollDetailModalProps> = ({ scroll, isOpen, onClose }) => {
  console.log("Scroll data:", scroll); // Debug: log all scroll data to console
  
  const [currentLevel, setCurrentLevel] = useState(1);
  
  useEffect(() => {
    // Reset level when modal opens with a new scroll
    if (isOpen && scroll) {
      setCurrentLevel(1);
    }
  }, [isOpen, scroll]);

  if (!scroll) return null;

  // --- Extract scroll properties with fallbacks for different naming conventions ---
  const scrollName = getScrollProperty(scroll, ['name']) || 'Unknown Scroll';
  const scrollDescription = getScrollProperty(scroll, ['description']) || '';
  const scrollEffect = getScrollProperty(scroll, ['effect', 'spellEffect', 'effectDescription']) || '';
  const scrollRarity = getScrollProperty(scroll, ['rarity']) || 'Common';
  
  // Time-based properties
  const castingTime = getScrollProperty(scroll, ['castingTime', 'castTime']) || '-';
  const duration = getScrollProperty(scroll, ['duration', 'spellDuration']) || '-';
  const cooldown = getScrollProperty(scroll, ['cooldown', 'spellCooldown']) || '-';
  
  // Resource properties
  const manaCost = getScrollProperty(scroll, ['manaPointCost', 'manaCost', 'mpCost']) || '-';
  const modifier = getScrollProperty(scroll, ['spellCastingModifier', 'castingModifier', 'modifier']) || '-';
  
  // Combat properties
  const range = getScrollProperty(scroll, ['range', 'spellRange']) || '-';
  const damageAmount = getScrollProperty(scroll, ['damageAmount', 'damage']) || '-';
  const damageType = getScrollProperty(scroll, ['damageType', 'damagetype', 'damage_type']) || '-';
  
  // Value properties
  const buyValue = getScrollProperty(scroll, ['buyValue', 'buy_value', 'value']) || '-';
  const sellValue = getScrollProperty(scroll, ['sellValue', 'sell_value']) || '-';
  
  // --- Scaling Data ---
  let scrollScaling = getScrollProperty(scroll, ['scaling']) || null;
  if (typeof scrollScaling === 'string') {
    try {
      scrollScaling = JSON.parse(scrollScaling);
    } catch (e) {
      console.error("Error parsing scaling string:", e);
      scrollScaling = null;
    }
  }

  // --- Scaling Processing Logic ---
  const getScalingEffects = (level: number): { level: number; effect: string }[] => {
    const effects: { level: number; effect: string }[] = [];
    if (!scrollScaling || typeof scrollScaling !== 'object') return effects;

    // Convert scaling object to array of { level, effect } entries
    for (let i = 1; i <= level; i++) {
      // Try multiple possible formatting patterns for level keys
      const possibleKeys = [
        `level ${i}`, 
        `level${i}`,
        `Level ${i}`, 
        `Level${i}`,
        `lvl ${i}`,
        `lvl${i}`,
        `${i}`
      ];
      
      // Find a matching key in the scaling object
      for (const key of possibleKeys) {
        if (scrollScaling[key]) {
          effects.push({ level: i, effect: scrollScaling[key] });
          break;
        }
      }
    }
    
    return effects;
  };

  const currentScalingEffects = getScalingEffects(currentLevel);
  
  // Determine max level from scaling object
  const getMaxLevel = (): number => {
    if (!scrollScaling || typeof scrollScaling !== 'object') {
      return 1;
    }
    
    let maxLevel = 1;
    
    // Examine all keys in the scaling object to find the highest level number
    Object.keys(scrollScaling).forEach(key => {
      // Try to extract level number with different patterns
      const patterns = [
        /level\s*(\d+)/i,   // "level X"
        /lvl\s*(\d+)/i,     // "lvl X"
        /^(\d+)$/           // just the number
      ];
      
      for (const pattern of patterns) {
        const match = key.match(pattern);
        if (match && match[1]) {
          const level = parseInt(match[1], 10);
          if (!isNaN(level) && level > maxLevel) {
            maxLevel = level;
          }
        }
      }
    });
    
    return maxLevel;
  };
  
  const maxLevel = getMaxLevel();

  const incrementLevel = () => {
    if (currentLevel < maxLevel) {
      setCurrentLevel(currentLevel + 1);
    }
  };

  const decrementLevel = () => {
    if (currentLevel > 1) {
      setCurrentLevel(currentLevel - 1);
    }
  };

  // Check if scroll has any scaling data
  const hasScalingData = scrollScaling && 
    typeof scrollScaling === 'object' && 
    Object.keys(scrollScaling).length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
      <ModalContent bg="gray.800" color="gray.100" borderColor="gray.700">
        {/* --- Header --- */}
        <ModalHeader borderBottomWidth="1px" borderColor="gray.700">
           <HStack>
            <Icon as={ScrollText} color="orange.400" boxSize={6} />
            <VStack align="start" spacing={0}>
              <Text fontSize="xl" fontWeight="bold">{scrollName}</Text>
              <HStack spacing={2}>
                <Badge colorScheme={getRarityScheme(scrollRarity)}>
                  {scrollRarity}
                </Badge>
                <Badge variant="outline" colorScheme="orange">Scroll</Badge>
              </HStack>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400" />

        {/* --- Body --- */}
        <ModalBody py={4}>
          <VStack spacing={4} align="stretch">

            {/* Description */}
            {scrollDescription && (
              <Box>
                <Text fontWeight="semibold" color="gray.300" mb={1}>Description</Text>
                <Text color="gray.400" whiteSpace="pre-wrap">{scrollDescription}</Text>
              </Box>
            )}

            {/* Effect */}
            {(scrollEffect && formatValue(scrollEffect) !== '-') && (
              <>
                <Divider borderColor="gray.600" />
                <Box>
                  <Text fontWeight="semibold" color="gray.300" mb={1}>Effect</Text>
                  <Text color="gray.400" whiteSpace="pre-wrap">{scrollEffect}</Text>
                </Box>
              </>
            )}

            <Divider borderColor="gray.600" />

            {/* Core Scroll Properties Grid */}
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} width="100%">
              <Box>
                <HStack alignItems="center" spacing={1} mb={0.5}>
                    <Icon as={Clock} size={14} color="cyan.400"/>
                    <Text fontWeight="semibold" color="gray.300" fontSize="sm">Casting Time</Text>
                </HStack>
                <Text color="gray.200" fontSize="sm">{formatValue(castingTime)}</Text>
              </Box>
              <Box>
                <HStack alignItems="center" spacing={1} mb={0.5}>
                    <Icon as={Zap} size={14} color="blue.400"/>
                    <Text fontWeight="semibold" color="gray.300" fontSize="sm">Mana Cost</Text>
                </HStack>
                <Text color="gray.200" fontSize="sm">{formatValue(manaCost)}</Text>
              </Box>
              <Box>
                 <HStack alignItems="center" spacing={1} mb={0.5}>
                    <Icon as={Crosshair} size={14} color="green.400"/>
                    <Text fontWeight="semibold" color="gray.300" fontSize="sm">Range</Text>
                 </HStack>
                <Text color="gray.200" fontSize="sm">{formatValue(range)}</Text>
              </Box>
              <Box>
                 <HStack alignItems="center" spacing={1} mb={0.5}>
                     <Icon as={Clock} size={14} color="yellow.400"/>
                    <Text fontWeight="semibold" color="gray.300" fontSize="sm">Duration</Text>
                 </HStack>
                <Text color="gray.200" fontSize="sm">{formatValue(duration)}</Text>
              </Box>
              <Box>
                 <HStack alignItems="center" spacing={1} mb={0.5}>
                     <Icon as={Clock} size={14} color="red.400"/>
                    <Text fontWeight="semibold" color="gray.300" fontSize="sm">Cooldown</Text>
                 </HStack>
                <Text color="gray.200" fontSize="sm">{formatValue(cooldown)}</Text>
              </Box>
              <Box>
                 <HStack alignItems="center" spacing={1} mb={0.5}>
                     <Icon as={Wand2} size={14} color="purple.400"/>
                    <Text fontWeight="semibold" color="gray.300" fontSize="sm">Modifier</Text>
                 </HStack>
                <Text color="gray.200" fontSize="sm">{formatValue(modifier)}</Text>
              </Box>
            </SimpleGrid>

            {/* Damage Section */}
            {(damageAmount && formatValue(damageAmount) !== '-') && (
              <>
                <Divider borderColor="gray.600" />
                <Box width="100%">
                   <Text fontWeight="semibold" mb={1} color="gray.300">Damage</Text>
                  <HStack>
                    <Icon as={Target} color="red.400" />
                    <Text fontSize="md" fontWeight="bold" color="gray.100">{formatValue(damageAmount)}</Text>
                    {damageType && (
                      <Badge colorScheme={getDamageTypeColor(damageType)}>
                        {damageType}
                      </Badge>
                    )}
                  </HStack>
                </Box>
              </>
            )}

            {/* Scaling Section */}
            {hasScalingData && (
              <>
                <Divider borderColor="gray.600" />
                <Box width="100%">
                  <HStack justify="space-between" mb={4}>
                    <HStack>
                      <Icon as={BarChart} size={16} color="teal.400" />
                      <Text fontWeight="semibold" color="gray.300">Scaling Effects</Text>
                    </HStack>
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
                        isDisabled={currentLevel >= maxLevel}
                        rightIcon={<ChevronUp size={16} />}
                        colorScheme="brand"
                      >
                        Raise
                      </Button>
                    </HStack>
                  </HStack>

                  {currentScalingEffects.length > 0 ? (
                    <VStack
                      align="stretch"
                      spacing={2}
                    >
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

            {/* Value Section */}
            {(formatValue(buyValue) !== '-' || formatValue(sellValue) !== '-') && (
                <>
                 <Divider borderColor="gray.600" />
                 <SimpleGrid columns={2} spacing={4} width="100%" pt={2}>
                    <Box>
                         <HStack alignItems="center" spacing={1} mb={0.5}>
                            <Icon as={DollarSign} size={14} color="yellow.400"/>
                            <Text fontWeight="semibold" color="gray.300" fontSize="sm">Buy Value</Text>
                         </HStack>
                         <Text color="yellow.300" fontSize="sm">{formatValue(buyValue)} GP</Text>
                    </Box>
                    <Box>
                         <HStack alignItems="center" spacing={1} mb={0.5}>
                             <Icon as={DollarSign} size={14} color="yellow.400"/>
                             <Text fontWeight="semibold" color="gray.300" fontSize="sm">Sell Value</Text>
                         </HStack>
                         <Text color="yellow.300" fontSize="sm">{formatValue(sellValue)} GP</Text>
                    </Box>
                 </SimpleGrid>
                </>
            )}

          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ImprovedScrollDetailModal;