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
import { Clock, Crosshair } from 'lucide-react';
import type { TrapItem } from '@/types/trap';

interface TrapDetailModalProps {
  trap: TrapItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const TrapDetailModal = ({ trap, isOpen, onClose }: TrapDetailModalProps) => {
  if (!trap) return null;

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
            <Text fontSize="2xl">{trap.name}</Text>
            <Badge colorScheme={getRarityColor(trap.rarity)}>
              {trap.rarity}
            </Badge>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="start" spacing={4} width="100%">
            <Text color="gray.600">{trap.description}</Text>
            
            <Divider />
            
            <SimpleGrid columns={2} spacing={4} width="100%">
              <HStack>
                <Clock size={16} />
                <Box>
                  <Text fontWeight="semibold">Duration</Text>
                  <Text>{trap.duration}</Text>
                </Box>
              </HStack>
              <HStack>
                <Crosshair size={16} />
                <Box>
                  <Text fontWeight="semibold">Range</Text>
                  <Text>{trap.range}</Text>
                </Box>
              </HStack>
            </SimpleGrid>

            <Divider />

            <Box width="100%">
              <Text fontWeight="semibold" mb={2}>Effect</Text>
              <Text>{trap.effect}</Text>
            </Box>

            {(Object.keys(trap.vitalbonus).length > 0 || Object.keys(trap.skillBonus).length > 0) && (
              <>
                <Divider />
                <SimpleGrid columns={2} spacing={4} width="100%">
                  {Object.keys(trap.vitalbonus).length > 0 && (
                    <Box>
                      <Text fontWeight="semibold" mb={2}>Vital Bonuses</Text>
                      <VStack align="start">
                        {Object.entries(trap.vitalbonus).map(([stat, bonus]) => (
                          <Text key={stat}>
                            {stat}: +{bonus}
                          </Text>
                        ))}
                      </VStack>
                    </Box>
                  )}
                  
                  {Object.keys(trap.skillBonus).length > 0 && (
                    <Box>
                      <Text fontWeight="semibold" mb={2}>Skill Bonuses</Text>
                      <VStack align="start">
                        {Object.entries(trap.skillBonus).map(([skill, bonus]) => (
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

            {trap.abilities.length > 0 && (
              <>
                <Divider />
                <Box width="100%">
                  <Text fontWeight="semibold" mb={2}>Abilities</Text>
                  <VStack align="start">
                    {trap.abilities.map((ability, index) => (
                      <Text key={index}>{ability}</Text>
                    ))}
                  </VStack>
                </Box>
              </>
            )}

            {(trap.hpBonus > 0 || trap.mpBonus > 0) && (
              <>
                <Divider />
                <SimpleGrid columns={2} spacing={4} width="100%">
                  {trap.hpBonus > 0 && (
                    <Box>
                      <Text fontWeight="semibold">HP Bonus</Text>
                      <Text>+{trap.hpBonus}</Text>
                    </Box>
                  )}
                  {trap.mpBonus > 0 && (
                    <Box>
                      <Text fontWeight="semibold">MP Bonus</Text>
                      <Text>+{trap.mpBonus}</Text>
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

export default TrapDetailModal;