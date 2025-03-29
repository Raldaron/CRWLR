import React, { useState } from 'react';
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
  Box,
  Button,
  useToast,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { Swords, Target, Zap, Shield, Star, Award } from 'lucide-react';
import type { Attack } from '@/components/ItemCards/AttackCard';
import { useCharacter } from '@/context/CharacterContext';
import TraitDetailModal from '@/components/Modals/TraitDetailModal';
import AbilityDetailModal from '@/components/Modals/AbilityDetailModal';

interface AttackDetailModalProps {
  attack: Attack | null;
  isOpen: boolean;
  onClose: () => void;
}

const AttackDetailModal: React.FC<AttackDetailModalProps> = ({ 
  attack, 
  isOpen, 
  onClose 
}) => {
  const toast = useToast();
  const { executeAttack } = useCharacter();
  
  // States for trait and ability detail modals
  const [selectedTrait, setSelectedTrait] = useState<string | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [isTraitModalOpen, setIsTraitModalOpen] = useState(false);
  const [isAbilityModalOpen, setIsAbilityModalOpen] = useState(false);
  
  if (!attack) return null;

  const getDamageTypeColor = (type: string) => {
    switch(type.toLowerCase()) {
      case 'slashing': return 'red';
      case 'piercing': return 'blue';
      case 'bludgeoning': return 'orange';
      case 'fire': return 'red';
      case 'cold': return 'blue';
      case 'lightning': return 'yellow';
      case 'acid': return 'green';
      case 'force': return 'purple';
      default: return 'gray';
    }
  };
  
  const handleAttackAction = () => {
    // Execute the attack using the context function
    if (attack) {
      executeAttack(attack.id);
      
      // Show feedback to the user
      toast({
        title: "Attack executed!",
        description: `You attacked with ${attack.name} dealing ${attack.damageAmount} ${attack.damageType} damage`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={2}>
              <Swords className="text-red-500" />
              <Text>{attack.name}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="start" spacing={4} width="100%">
              <Text>{attack.description || `Basic attack with ${attack.sourceItem || 'your weapon'}`}</Text>
              
              <Divider />
              
              {/* Damage Information */}
              <Box width="100%">
                <HStack spacing={2} mb={2}>
                  <Swords size={16} />
                  <Text fontWeight="semibold">Damage</Text>
                </HStack>
                <HStack ml={6}>
                  <Text fontSize="lg" fontWeight="bold">{attack.damageAmount}</Text>
                  <Badge colorScheme={getDamageTypeColor(attack.damageType)}>
                    {attack.damageType}
                  </Badge>
                </HStack>
              </Box>

              {/* Range Information */}
              <Box width="100%">
                <HStack spacing={2} mb={2}>
                  <Target size={16} />
                  <Text fontWeight="semibold">Range</Text>
                </HStack>
                <Text ml={6}>{attack.range || 'Melee'}</Text>
              </Box>

              {/* AP Cost */}
              <Box width="100%">
                <HStack spacing={2} mb={2}>
                  <Zap size={16} />
                  <Text fontWeight="semibold">AP Cost</Text>
                </HStack>
                <Text ml={6}>{attack.apCost || 1} Action Points</Text>
              </Box>

              {/* Weapon Information */}
              <Box width="100%">
                <HStack spacing={2} mb={2}>
                  <Shield size={16} />
                  <Text fontWeight="semibold">Weapon Type</Text>
                </HStack>
                <Text ml={6}>{attack.weaponType}</Text>
              </Box>

              {/* Traits Section */}
              {attack.traits && attack.traits.length > 0 && (
                <>
                  <Divider />
                  <Box width="100%">
                    <HStack spacing={2} mb={2}>
                      <Award size={16} />
                      <Text fontWeight="semibold">Weapon Traits</Text>
                    </HStack>
                    <Wrap spacing={2} ml={6}>
                      {attack.traits.map((trait, index) => (
                        <WrapItem key={index}>
                          <Badge 
                            colorScheme="green" 
                            cursor="pointer"
                            onClick={() => {
                              setSelectedTrait(trait);
                              setIsTraitModalOpen(true);
                            }}
                            p={1}
                            _hover={{ bg: 'green.100' }}
                          >
                            {trait}
                          </Badge>
                        </WrapItem>
                      ))}
                    </Wrap>
                    <Text fontSize="xs" color="gray.500" mt={1} ml={6}>
                      Click on a trait to see details
                    </Text>
                  </Box>
                </>
              )}

              {/* Abilities Section */}
              {attack.abilities && attack.abilities.length > 0 && (
                <>
                  <Divider />
                  <Box width="100%">
                    <HStack spacing={2} mb={2}>
                      <Star size={16} />
                      <Text fontWeight="semibold">Weapon Abilities</Text>
                    </HStack>
                    <Wrap spacing={2} ml={6}>
                      {attack.abilities.map((ability, index) => (
                        <WrapItem key={index}>
                          <Badge 
                            colorScheme="purple" 
                            cursor="pointer"
                            onClick={() => {
                              setSelectedAbility(ability);
                              setIsAbilityModalOpen(true);
                            }}
                            p={1}
                            _hover={{ bg: 'purple.100' }}
                          >
                            {ability}
                          </Badge>
                        </WrapItem>
                      ))}
                    </Wrap>
                    <Text fontSize="xs" color="gray.500" mt={1} ml={6}>
                      Click on an ability to see details
                    </Text>
                  </Box>
                </>
              )}

              {attack.sourceItem && (
                <>
                  <Divider />
                  <Text fontSize="sm" color="gray.500">
                    Source: {attack.sourceItem}
                  </Text>
                </>
              )}

              <Divider />
              
              {/* Attack Action Button */}
              <Button 
                colorScheme="red" 
                width="100%"
                leftIcon={<Swords size={16} />}
                onClick={handleAttackAction}
              >
                Execute Attack
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Trait Detail Modal */}
      {selectedTrait && (
        <TraitDetailModal
          traitName={selectedTrait}
          isOpen={isTraitModalOpen}
          onClose={() => setIsTraitModalOpen(false)}
        />
      )}

      {/* Ability Detail Modal */}
      {selectedAbility && (
        <AbilityDetailModal
          abilityName={selectedAbility}
          isOpen={isAbilityModalOpen}
          onClose={() => setIsAbilityModalOpen(false)}
        />
      )}
    </>
  );
};

export default AttackDetailModal;