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
  Icon,
} from '@chakra-ui/react';
import { Clock, Target } from 'lucide-react';
import type { PotionItem } from '../../types/potion';

interface PotionDetailModalProps {
  potion: PotionItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const PotionDetailModal = ({ potion, isOpen, onClose }: PotionDetailModalProps) => {
  if (!potion) return null;

  const getRarityColor = (rarity: string) => {
    switch(rarity.toLowerCase()) {
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Text fontSize="2xl">{potion.name}</Text>
            <Badge colorScheme={getRarityColor(potion.rarity)}>
              {potion.rarity}
            </Badge>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="start" spacing={4} width="100%">
            <Text color="gray.600">{potion.description}</Text>
            
            <Divider />
            
            <SimpleGrid columns={2} spacing={4} width="100%">
              <Box>
                <HStack>
                  <Icon as={Clock} color="gray.500" />
                  <Text fontWeight="semibold">Duration</Text>
                </HStack>
                <Text>{potion.duration}</Text>
              </Box>
              {potion.range !== 'N/A' && (
                <Box>
                  <HStack>
                    <Icon as={Target} color="gray.500" />
                    <Text fontWeight="semibold">Range</Text>
                  </HStack>
                  <Text>{potion.range}</Text>
                </Box>
              )}
            </SimpleGrid>

            <Divider />

            <Box width="100%">
              <Text fontWeight="semibold" mb={2}>Effect</Text>
              <Text>{potion.effect}</Text>
            </Box>

            {(Object.keys(potion.statBonus).length > 0 || Object.keys(potion.skillBonus).length > 0) && (
              <>
                <Divider />
                <SimpleGrid columns={2} spacing={4} width="100%">
                  {Object.keys(potion.statBonus).length > 0 && (
                    <Box>
                      <Text fontWeight="semibold" mb={2}>Stat Bonuses</Text>
                      <VStack align="start">
                        {Object.entries(potion.statBonus).map(([stat, bonus]) => (
                          <Text key={stat}>
                            {stat}: {typeof bonus === 'number' ? `+${bonus}` : bonus}
                          </Text>
                        ))}
                      </VStack>
                    </Box>
                  )}
                  
                  {Object.keys(potion.skillBonus).length > 0 && (
                    <Box>
                      <Text fontWeight="semibold" mb={2}>Skill Bonuses</Text>
                      <VStack align="start">
                        {Object.entries(potion.skillBonus).map(([skill, bonus]) => (
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

            {Object.keys(potion.abilities).length > 0 && (
              <>
                <Divider />
                <Box width="100%">
                  <Text fontWeight="semibold" mb={2}>Granted Abilities</Text>
                  <VStack align="start">
                    {Object.keys(potion.abilities).map((ability) => (
                      <Text key={ability}>{ability}</Text>
                    ))}
                  </VStack>
                </Box>
              </>
            )}

            {(potion.hpBonus > 0 || potion.mpBonus > 0) && (
              <>
                <Divider />
                <SimpleGrid columns={2} spacing={4} width="100%">
                  {potion.hpBonus > 0 && (
                    <Box>
                      <Text fontWeight="semibold">HP Bonus</Text>
                      <Text>+{potion.hpBonus}</Text>
                    </Box>
                  )}
                  {potion.mpBonus > 0 && (
                    <Box>
                      <Text fontWeight="semibold">MP Bonus</Text>
                      <Text>+{potion.mpBonus}</Text>
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

export default PotionDetailModal;