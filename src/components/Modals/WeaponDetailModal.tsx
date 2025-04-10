import React from 'react';
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
  Icon, // Added Icon
} from '@chakra-ui/react';
import type { WeaponItem } from '@/types/weapon';
// Import the new component
import TruncatedTextWithModal from '../ui/TruncatedTextWithModal'; // Adjust path if needed
import { Heart, Zap } from 'lucide-react'; // For HP/MP Bonus

interface WeaponDetailModalProps {
  weapon: WeaponItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const WeaponDetailModal = ({ weapon, isOpen, onClose }: WeaponDetailModalProps) => {
  if (!weapon) return null;

  const getRarityColor = (rarity: string) => {
    switch(rarity?.toLowerCase()) {
      case 'common': return 'gray'; case 'uncommon': return 'green';
      case 'rare': return 'blue'; case 'epic': return 'purple';
      case 'legendary': return 'orange'; default: return 'gray';
    }
  };

  const getDamageTypeColor = (type?: string) => {
    switch(type?.toLowerCase()) {
      case 'slashing': return 'red'; case 'piercing': return 'blue';
      case 'bludgeoning': return 'orange'; case 'fire': return 'red';
      case 'cold': return 'blue'; case 'lightning': return 'yellow';
      case 'acid': return 'green'; case 'force': return 'purple';
      default: return 'gray';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Text fontSize="2xl">{weapon.name}</Text>
            <HStack spacing={2}>
              <Badge colorScheme={getRarityColor(weapon.rarity)}>
                {weapon.rarity}
              </Badge>
              <Badge variant="outline">
                {weapon.weaponType}
              </Badge>
              <Badge colorScheme={weapon.meleeRanged === 'Melee' ? 'red' : 'blue'}>
                {weapon.meleeRanged}
              </Badge>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="start" spacing={4} width="100%">
            {/* Use TruncatedTextWithModal for description */}
            <TruncatedTextWithModal
              text={weapon.description}
              modalTitle={`${weapon.name} - Description`}
              charLimit={200}
            />

            <Divider />

            <SimpleGrid columns={2} spacing={4} width="100%">
              <Box> <Text fontWeight="semibold">Weapon Type</Text> <Text>{weapon.weaponType}</Text> </Box>
              <Box> <Text fontWeight="semibold">Hands Required</Text> <Text>{weapon.handsRequired}</Text> </Box>
              <Box> <Text fontWeight="semibold">Magical Type</Text> <Text>{weapon.magicNonMagical}</Text> </Box>
              <Box> <Text fontWeight="semibold">Combat Type</Text> <Text>{weapon.meleeRanged}</Text> </Box>
            </SimpleGrid>

            <Divider />

            <Box width="100%">
              <Text fontWeight="semibold" mb={2}>Damage</Text>
              <HStack>
                <Text fontSize="lg" fontWeight="bold">{weapon.damageAmount}</Text>
                <Badge colorScheme={getDamageTypeColor(weapon.damageType)}>
                  {weapon.damageType}
                </Badge>
              </HStack>
            </Box>

            {(weapon.statBonus && Object.keys(weapon.statBonus).length > 0) || (weapon.skillBonus && Object.keys(weapon.skillBonus).length > 0) ? (
              <>
                <Divider />
                <SimpleGrid columns={2} spacing={4} width="100%">
                  {weapon.statBonus && Object.keys(weapon.statBonus).length > 0 && (
                    <Box>
                      <Text fontWeight="semibold" mb={2}>Vital Bonuses</Text>
                      <VStack align="start">
                        {Object.entries(weapon.statBonus).map(([stat, bonus]) => (
                          <Text key={stat}> {stat}: +{bonus} </Text>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  {weapon.skillBonus && Object.keys(weapon.skillBonus).length > 0 && (
                    <Box>
                      <Text fontWeight="semibold" mb={2}>Skill Bonuses</Text>
                      <VStack align="start">
                        {Object.entries(weapon.skillBonus).map(([skill, bonus]) => (
                          <Text key={skill}> {skill}: +{bonus} </Text>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </SimpleGrid>
              </>
            ) : null}

            {weapon.abilities && weapon.abilities.length > 0 && (
              <>
                <Divider />
                <Box width="100%">
                  <Text fontWeight="semibold" mb={2}>Abilities</Text>
                  <VStack align="start">
                    {weapon.abilities.map((ability, index) => (
                      <Text key={index} whiteSpace="pre-wrap">{ability}</Text>
                    ))}
                  </VStack>
                </Box>
              </>
            )}

            {weapon.traits && weapon.traits.length > 0 && (
              <>
                <Divider />
                <Box width="100%">
                  <Text fontWeight="semibold" mb={2}>Traits</Text>
                  <VStack align="start">
                    {weapon.traits.map((trait, index) => (
                      <Text key={index} whiteSpace="pre-wrap">{trait}</Text>
                    ))}
                  </VStack>
                </Box>
              </>
            )}

            {weapon.spellsGranted && weapon.spellsGranted.length > 0 && (
                 <>
                    <Divider />
                    <Box width="100%">
                    <Text fontWeight="semibold" mb={2}>Spells Granted</Text>
                    <VStack align="start">
                        {/* Assuming spellsGranted is an array of strings */}
                        {weapon.spellsGranted.map((spell: string, index: number) => (
                         <Text key={index} whiteSpace="pre-wrap">{spell}</Text>
                        ))}
                    </VStack>
                    </Box>
                </>
            )}

            {(weapon.hpBonus > 0 || weapon.mpBonus > 0) && (
              <>
                <Divider />
                <SimpleGrid columns={2} spacing={4} width="100%">
                  {weapon.hpBonus > 0 && (
                    <HStack><Icon as={Heart} color="red.400"/><Text fontWeight="semibold">HP Bonus:</Text><Text>+{weapon.hpBonus}</Text></HStack>
                  )}
                  {weapon.mpBonus > 0 && (
                    <HStack><Icon as={Zap} color="blue.400"/><Text fontWeight="semibold">MP Bonus:</Text><Text>+{weapon.mpBonus}</Text></HStack>
                  )}
                </SimpleGrid>
              </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default WeaponDetailModal;