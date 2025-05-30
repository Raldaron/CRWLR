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
import type { ScrollItem, ScrollScaling } from '@/types/scroll';
import TruncatedTextWithModal from '../ui/TruncatedTextWithModal';

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

// Helper function to format values, replacing undefined/null/empty/"N/A" with '-'
const formatValue = (value: string | number | undefined | null): string => {
  // Check for explicitly "N/A" string as well
  if (value === undefined || value === null || String(value).trim() === '' || String(value).toUpperCase() === 'N/A') {
    return "-";
  }
  return String(value);
};

const ImprovedScrollDetailModal: React.FC<ScrollDetailModalProps> = ({ scroll, isOpen, onClose }) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  
  useEffect(() => {
    // Reset level when modal opens with a new scroll
    if (isOpen && scroll) {
      setCurrentLevel(1);
    }
  }, [isOpen, scroll]);

  if (!scroll) return null;

  // --- Scaling Processing Logic ---
  const getScalingEffects = (level: number): { level: number; effect: string }[] => {
    const effects: { level: number; effect: string }[] = [];
    if (!scroll.scaling) return effects;

    // Convert scaling object to array of { level, effect } entries
    const scalingObj = typeof scroll.scaling === 'object' && !Array.isArray(scroll.scaling) 
      ? scroll.scaling as ScrollScaling
      : {};

    for (let i = 1; i <= level; i++) {
      const levelKey = Object.keys(scalingObj).find(key => {
        // Match level X or level X+ format
        const levelPattern = new RegExp(`^level\\s*${i}(\\+|\\s*$)`, 'i');
        return levelPattern.test(key);
      });

      if (levelKey && scalingObj[levelKey]) {
        effects.push({ level: i, effect: scalingObj[levelKey] });
      }
    }
    return effects;
  };

  const currentScalingEffects = getScalingEffects(currentLevel);
  
  // Determine max level from scaling object
  const getMaxLevel = (): number => {
    if (!scroll.scaling || typeof scroll.scaling !== 'object' || Array.isArray(scroll.scaling)) {
      return 1;
    }
    
    const scalingObj = scroll.scaling as ScrollScaling;
    let maxLevel = 1;
    
    Object.keys(scalingObj).forEach(key => {
      const levelMatch = key.match(/level\s*(\d+)/i);
      if (levelMatch && levelMatch[1]) {
        const level = parseInt(levelMatch[1], 10);
        if (!isNaN(level) && level > maxLevel) {
          maxLevel = level;
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
  const hasScalingData = scroll.scaling && 
    typeof scroll.scaling === 'object' && 
    !Array.isArray(scroll.scaling) && 
    Object.keys(scroll.scaling).length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
      <ModalContent bg="gray.800" color="gray.100" borderColor="gray.700">
        {/* --- Header --- */}
        <ModalHeader borderBottomWidth="1px" borderColor="gray.700">
           <HStack>
            <Icon as={ScrollText} color="orange.400" boxSize={6} />
            <VStack align="start" spacing={0}>
              <Text fontSize="xl" fontWeight="bold">{scroll.name}</Text>
              <HStack spacing={2}>
                <Badge colorScheme={getRarityScheme(scroll.rarity)}>
                  {scroll.rarity || 'Common'}
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
            {scroll.description && (
              <TruncatedTextWithModal
                text={scroll.description}
                modalTitle={`${scroll.name} - Description`}
                charLimit={200}
                label="Description"
              />
            )}

            {/* Effect */}
            {(scroll.effect && formatValue(scroll.effect) !== '-') && (
              <>
                <Divider borderColor="gray.600" />
                <Box>
                  <TruncatedTextWithModal
                     label="Effect"
                     text={scroll.effect}
                     modalTitle={`${scroll.name} - Effect`}
                     charLimit={180}
                  />
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
                <Text color="gray.200" fontSize="sm">{formatValue(scroll.castingTime)}</Text>
              </Box>
              <Box>
                <HStack alignItems="center" spacing={1} mb={0.5}>
                    <Icon as={Zap} size={14} color="blue.400"/>
                    <Text fontWeight="semibold" color="gray.300" fontSize="sm">Mana Cost</Text>
                </HStack>
                <Text color="gray.200" fontSize="sm">{formatValue(scroll.manaPointCost)}</Text>
              </Box>
              <Box>
                 <HStack alignItems="center" spacing={1} mb={0.5}>
                    <Icon as={Crosshair} size={14} color="green.400"/>
                    <Text fontWeight="semibold" color="gray.300" fontSize="sm">Range</Text>
                 </HStack>
                <Text color="gray.200" fontSize="sm">{formatValue(scroll.range)}</Text>
              </Box>
              <Box>
                 <HStack alignItems="center" spacing={1} mb={0.5}>
                     <Icon as={Clock} size={14} color="yellow.400"/>
                    <Text fontWeight="semibold" color="gray.300" fontSize="sm">Duration</Text>
                 </HStack>
                <Text color="gray.200" fontSize="sm">{formatValue(scroll.duration)}</Text>
              </Box>
              <Box>
                 <HStack alignItems="center" spacing={1} mb={0.5}>
                     <Icon as={Clock} size={14} color="red.400"/>
                    <Text fontWeight="semibold" color="gray.300" fontSize="sm">Cooldown</Text>
                 </HStack>
                <Text color="gray.200" fontSize="sm">{formatValue(scroll.cooldown)}</Text>
              </Box>
              <Box>
                 <HStack alignItems="center" spacing={1} mb={0.5}>
                     <Icon as={Wand2} size={14} color="purple.400"/>
                    <Text fontWeight="semibold" color="gray.300" fontSize="sm">Modifier</Text>
                 </HStack>
                <Text color="gray.200" fontSize="sm">{formatValue(scroll.spellCastingModifier)}</Text>
              </Box>
            </SimpleGrid>

            {/* Damage Section */}
            {(scroll.damageAmount && formatValue(scroll.damageAmount) !== '-') && (
              <>
                <Divider borderColor="gray.600" />
                <Box width="100%">
                   <Text fontWeight="semibold" mb={1} color="gray.300">Damage</Text>
                  <HStack>
                    <Icon as={Target} color="red.400" />
                    <Text fontSize="md" fontWeight="bold" color="gray.100">{formatValue(scroll.damageAmount)}</Text>
                    {scroll.damageType && (
                      <Badge colorScheme={getDamageTypeColor(scroll.damageType)}>
                        {scroll.damageType}
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
            {(formatValue(scroll.buyValue) !== '-' || formatValue(scroll.sellValue) !== '-') && (
                <>
                 <Divider borderColor="gray.600" />
                 <SimpleGrid columns={2} spacing={4} width="100%" pt={2}>
                    <Box>
                         <HStack alignItems="center" spacing={1} mb={0.5}>
                            <Icon as={DollarSign} size={14} color="yellow.400"/>
                            <Text fontWeight="semibold" color="gray.300" fontSize="sm">Buy Value</Text>
                         </HStack>
                         <Text color="yellow.300" fontSize="sm">{formatValue(scroll.buyValue)} GP</Text>
                    </Box>
                    <Box>
                         <HStack alignItems="center" spacing={1} mb={0.5}>
                             <Icon as={DollarSign} size={14} color="yellow.400"/>
                             <Text fontWeight="semibold" color="gray.300" fontSize="sm">Sell Value</Text>
                         </HStack>
                         <Text color="yellow.300" fontSize="sm">{formatValue(scroll.sellValue)} GP</Text>
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