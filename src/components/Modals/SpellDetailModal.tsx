// --- START OF FILE components/Modals/SpellDetailModal.tsx ---
import React from 'react';
import {
  Modal, /* other Chakra imports */
  Box, Text, HStack, Icon, Badge, VStack, Divider, SimpleGrid,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody
} from '@chakra-ui/react';
// Import specific icons if needed, e.g., Book for keywords, Shield for saving throw
import { /* Icons */ ScrollText, Info, Book, Shield, Zap } from 'lucide-react';
import type { ActionSpell } from '@/context/CharacterContext'; // Use ActionSpell
import TruncatedTextWithModal from '../ui/TruncatedTextWithModal';

interface SpellDetailModalProps {
  spell: ActionSpell | null; // Use ActionSpell
  isOpen: boolean;
  onClose: () => void;
}

// ... (Keep helper functions: getRarityScheme, getDamageTypeColor, formatValue) ...
const getRarityScheme = (rarity?: string): string => { /* ... */ return ''; };
const getDamageTypeColor = (type?: string): string => { /* ... */ return ''; };
const formatValue = (value: string | number | undefined | null): string => { /* ... */ return '-'; };


const SpellDetailModal: React.FC<SpellDetailModalProps> = ({ spell, isOpen, onClose }) => {
  if (!spell) return null;

  // Safely check for keywords
  const keywordsExist = Array.isArray(spell.keywords) && spell.keywords.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
      <ModalContent bg="gray.800" color="gray.100" borderColor="gray.700">
        {/* ... ModalHeader ... */}
         <ModalHeader borderBottomWidth="1px" borderColor="gray.700">
          <HStack justify="space-between">
             <HStack>
                <Icon as={spell.source === 'scroll' ? ScrollText : Zap} color="brand.400" boxSize={6} />
                <VStack align="start" spacing={0}>
                <Text fontSize="xl" fontWeight="bold">{spell.name}</Text>
                {spell.source === 'scroll' && ( <Badge colorScheme="orange" size="sm">From Scroll (Utility Slot)</Badge> )}
                </VStack>
            </HStack>
             <HStack spacing={2}>
               {spell.school && <Badge colorScheme="purple">{spell.school}</Badge>}
               {spell.archetype && <Badge variant="outline">{spell.archetype}</Badge>}
            </HStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400" />
        <ModalBody py={4}>
          <VStack spacing={4} align="stretch">
             {/* ... Description, Effect ... */}
             <TruncatedTextWithModal text={spell.spelldescription || 'No spell description provided.'} modalTitle={`${spell.name} - Description`} charLimit={200} label="Description"/>
             {spell.effectdescription && spell.effectdescription !== '-' && ( <> <Divider borderColor="gray.600" /> <Box> <Text fontWeight="semibold" mb={1} color="gray.300">Effect</Text> <TruncatedTextWithModal text={spell.effectdescription} modalTitle={`${spell.name} - Effect`} charLimit={180} /> </Box> </> )}


             {/* --- Core Stats Grid --- */}
             <Divider borderColor="gray.600" />
             <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} width="100%">
                {/* ... Casting Time, Mana Cost, Range, Duration, Cooldown ... */}
                <Box><Text fontWeight="semibold" color="gray.300">Casting Time</Text><Text color="gray.300">{formatValue(spell.castingTime)}</Text></Box>
                <Box><Text fontWeight="semibold" color="gray.300">Mana Cost</Text><Text color="gray.300">{formatValue(spell.manaPointCost)}</Text></Box>
                <Box><Text fontWeight="semibold" color="gray.300">Range</Text><Text color="gray.300">{formatValue(spell.range)}</Text></Box>
                <Box><Text fontWeight="semibold" color="gray.300">Duration</Text><Text color="gray.300">{formatValue(spell.duration)}</Text></Box>
                <Box><Text fontWeight="semibold" color="gray.300">Cooldown</Text><Text color="gray.300">{formatValue(spell.cooldown)}</Text></Box>

                {/* FIX: Access spellModifier or spellCastingModifier */}
                {spell.spellModifier && (
                    <Box>
                        <Text fontWeight="semibold" color="gray.300">Modifier</Text>
                        <Text color="gray.300">{formatValue(spell.spellModifier)}</Text>
                    </Box>
                )}
                {/* OR use spellCastingModifier if that's the field name */}
                {/* {spell.spellCastingModifier && (
                    <Box>
                        <Text fontWeight="semibold" color="gray.300">Modifier</Text>
                        <Text color="gray.300">{formatValue(spell.spellCastingModifier)}</Text>
                    </Box>
                )} */}

                {/* FIX: Access spellSaveStat (which should exist based on previous code) */}
                {spell.spellSaveStat && (
                    <Box>
                        <Text fontWeight="semibold" color="gray.300">Save Stat</Text>
                        <Text color="gray.300">{formatValue(spell.spellSaveStat)}</Text>
                    </Box>
                )}

                {/* FIX: Access savingThrow */}
                {spell.savingThrow && (
                     <Box>
                        <Text fontWeight="semibold" color="gray.300">Saving Throw</Text>
                        <Text color="gray.300">{formatValue(spell.savingThrow)}</Text>
                    </Box>
                )}

                {/* ... other stats like DC, Attack Stat, Components ... */}

             </SimpleGrid>

             {/* ... Damage Section ... */}
             {(spell.damage && formatValue(spell.damage) !== '-') && ( <> <Divider borderColor="gray.600" /> <Box width="100%"> {/* ... damage display ... */} </Box> </> )}

             {/* --- Keywords Section --- */}
             {/* FIX: Check keywordsExist and access spell.keywords */}
             {keywordsExist && (
                <>
                    <Divider borderColor="gray.600" />
                    <Box width="100%">
                        <HStack mb={2}>
                            <Icon as={Book} size={16} color="orange.400"/>
                            <Text fontWeight="semibold" color="gray.300">Keywords</Text>
                        </HStack>
                        <HStack spacing={2} wrap="wrap">
                            {/* FIX: Add explicit types for map parameters */}
                            {spell.keywords!.map((keyword: string, idx: number) => (
                                <Badge key={`${keyword}-${idx}`} colorScheme="orange" variant="subtle">
                                    {keyword}
                                </Badge>
                            ))}
                        </HStack>
                    </Box>
                </>
             )}
             {/* --- End Keywords Section --- */}

             {/* ... Scaling Section ... */}

          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SpellDetailModal;
// --- END OF FILE components/Modals/SpellDetailModal.tsx ---