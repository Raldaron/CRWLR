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
import { Clock, Target, Droplet, BatteryCharging } from 'lucide-react';
import type { PotionItem } from '../../types/potion'; // Ensure path is correct
// Import the new component
import TruncatedTextWithModal from '../ui/TruncatedTextWithModal'; // Adjust path if needed

interface PotionDetailModalProps {
  potion: PotionItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const PotionDetailModal = ({ potion, isOpen, onClose }: PotionDetailModalProps) => {
  if (!potion) return null;

  const getRarityColor = (rarity: string) => {
    switch(rarity?.toLowerCase()) { // Safety check
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'very rare': return 'red';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      case 'celestial': return 'yellow';
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
             <HStack spacing={2}>
                <Badge colorScheme={getRarityColor(potion.rarity)}>
                {potion.rarity}
                </Badge>
                <Badge variant="outline">{potion.itemType || 'Potion'}</Badge>
             </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="start" spacing={4} width="100%">
            {/* Use TruncatedTextWithModal for description */}
            <TruncatedTextWithModal
              text={potion.description}
              modalTitle={`${potion.name} - Description`}
              charLimit={200}
            />

            <Divider />

            <SimpleGrid columns={2} spacing={4} width="100%">
              {potion.duration && potion.duration !== 'N/A' && (
                <Box>
                  <HStack>
                    <Icon as={Clock} color="gray.500" />
                    <Text fontWeight="semibold">Duration</Text>
                  </HStack>
                  <Text>{potion.duration}</Text>
                </Box>
              )}
              {potion.range && potion.range !== 'N/A' && (
                <Box>
                  <HStack>
                    <Icon as={Target} color="gray.500" />
                    <Text fontWeight="semibold">Range</Text>
                  </HStack>
                  <Text>{potion.range}</Text>
                </Box>
              )}
            </SimpleGrid>

             {(potion.duration || potion.range) && <Divider />}


            {/* Use TruncatedTextWithModal for effect */}
            {potion.effect && (
                <Box width="100%">
                    <TruncatedTextWithModal
                        label="Effect"
                        text={potion.effect}
                        modalTitle={`${potion.name} - Effect`}
                        charLimit={180}
                    />
                </Box>
            )}

            {(potion.healfor || potion.manaback) && (
              <>
                <Divider />
                <SimpleGrid columns={2} spacing={4} width="100%">
                  {potion.healfor && potion.healfor !== 'N/A' && (
                    <Box>
                       <HStack><Icon as={Droplet} color="red.400" /><Text fontWeight="semibold">Healing</Text></HStack>
                      <Text>Restores {potion.healfor} HP</Text>
                    </Box>
                  )}
                  {potion.manaback && potion.manaback !== 'N/A' && (
                    <Box>
                      <HStack><Icon as={BatteryCharging} color="blue.400" /><Text fontWeight="semibold">Mana</Text></HStack>
                      <Text>Restores {potion.manaback} MP</Text>
                    </Box>
                  )}
                </SimpleGrid>
              </>
            )}

             {(potion.sellValue !== undefined || potion.buyValue !== undefined) && (
                <>
                 <Divider />
                </>
            )}

          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PotionDetailModal;