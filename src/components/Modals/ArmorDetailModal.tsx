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
} from '@chakra-ui/react';
import type { ArmorItem } from '@/types/armor';

interface ArmorDetailModalProps {
  armor: ArmorItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const ArmorDetailModal = ({ armor, isOpen, onClose }: ArmorDetailModalProps) => {
  if (!armor) return null;

  const getRarityColor = (rarity: string) => {
    switch(rarity.toLowerCase()) {
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      case 'unique': return 'yellow';
      case 'heirloom': return 'red';
      case 'exceedingly rare': return 'pink';
      default: return 'gray';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Text fontSize="2xl">{armor.name}</Text>
            <HStack spacing={2}>
              <Badge colorScheme={getRarityColor(armor.rarity)}>
                {armor.rarity}
              </Badge>
              <Badge variant="outline">
                {armor.armorType}
              </Badge>
              <Badge colorScheme="blue">
                AR: {armor.armorRating}
              </Badge>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="start" spacing={4} width="100%">
            <Text color="gray.600">{armor.description}</Text>
            
            <Divider />
            
            <SimpleGrid columns={2} spacing={4} width="100%">
              <Box>
                <Text fontWeight="semibold">Armor Type</Text>
                <Text>{armor.armorType}</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold">Armor Rating</Text>
                <Text>{armor.armorRating}</Text>
              </Box>
              {armor.tankModifier > 0 && (
                <Box>
                  <Text fontWeight="semibold">Tank Modifier</Text>
                  <Text>+{armor.tankModifier}</Text>
                </Box>
              )}
            </SimpleGrid>

            {(Object.keys(armor.statBonus).length > 0 || Object.keys(armor.skillBonus).length > 0) && (
              <>
                <Divider />
                <SimpleGrid columns={2} spacing={4} width="100%">
                  {Object.keys(armor.statBonus).length > 0 && (
                    <Box>
                      <Text fontWeight="semibold" mb={2}>Stat Bonuses</Text>
                      <VStack align="start">
                        {Object.entries(armor.statBonus).map(([stat, bonus]) => (
                          <Text key={stat}>
                            {stat}: +{bonus}
                          </Text>
                        ))}
                      </VStack>
                    </Box>
                  )}
                  
                  {Object.keys(armor.skillBonus).length > 0 && (
                    <Box>
                      <Text fontWeight="semibold" mb={2}>Skill Bonuses</Text>
                      <VStack align="start">
                        {Object.entries(armor.skillBonus).map(([skill, bonus]) => (
                          <Text key={skill}>
                            {skill}: +{bonus}
                          </Text>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </SimpleGrid>
              </>
            )}

            {armor.abilities.length > 0 && (
              <>
                <Divider />
                <Box width="100%">
                  <Text fontWeight="semibold" mb={2}>Abilities</Text>
                  <VStack align="start">
                    {armor.abilities.map((ability, index) => (
                      <Text key={index}>{ability}</Text>
                    ))}
                  </VStack>
                </Box>
              </>
            )}

            {armor.traits.length > 0 && (
              <>
                <Divider />
                <Box width="100%">
                  <Text fontWeight="semibold" mb={2}>Traits</Text>
                  <VStack align="start">
                    {armor.traits.map((trait, index) => (
                      <Text key={index}>{trait}</Text>
                    ))}
                  </VStack>
                </Box>
              </>
            )}

            {armor.spellsGranted.length > 0 && (
              <>
                <Divider />
                <Box width="100%">
                  <Text fontWeight="semibold" mb={2}>Spells Granted</Text>
                  <VStack align="start">
                    {armor.spellsGranted.map((spell, index) => (
                      <Text key={index}>{spell}</Text>
                    ))}
                  </VStack>
                </Box>
              </>
            )}

            {(armor.hpBonus > 0 || armor.mpBonus > 0) && (
              <>
                <Divider />
                <SimpleGrid columns={2} spacing={4} width="100%">
                  {armor.hpBonus > 0 && (
                    <Box>
                      <Text fontWeight="semibold">HP Bonus</Text>
                      <Text>+{armor.hpBonus}</Text>
                    </Box>
                  )}
                  {armor.mpBonus > 0 && (
                    <Box>
                      <Text fontWeight="semibold">MP Bonus</Text>
                      <Text>+{armor.mpBonus}</Text>
                    </Box>
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

export default ArmorDetailModal;