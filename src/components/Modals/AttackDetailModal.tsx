// src/components/Modals/AttackDetailModal.tsx
import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  SimpleGrid,
  Box,
  Icon,
  Button,
  Tooltip,
} from '@chakra-ui/react';
import { 
  Sword, 
  Target, 
  Star, 
  ShieldOff, 
  Power, 
  Sparkles 
} from 'lucide-react';
import type { Attack } from '@/types/attack';

interface AttackDetailModalProps {
  attack: Attack | null;
  isOpen: boolean;
  onClose: () => void;
  onExecuteAttack?: (attackId: string) => void;
}

const AttackDetailModal: React.FC<AttackDetailModalProps> = ({ 
  attack, 
  isOpen, 
  onClose,
  onExecuteAttack
}) => {
  if (!attack) return null;

  // Helper function to get damage type color
  const getDamageTypeColor = (type: string) => {
    switch(type.toLowerCase()) {
      case 'fire': return 'red';
      case 'cold': return 'blue';
      case 'lightning': return 'yellow';
      case 'acid': return 'green';
      case 'force': return 'purple';
      case 'piercing': return 'orange';
      case 'bludgeoning': return 'gray';
      case 'slashing': return 'cyan';
      case 'necrotic': return 'pink';
      case 'radiant': return 'brand';
      case 'poison': return 'teal';
      case 'physical': return 'gray';
      default: return 'gray';
    }
  };

  // Handle executing the attack
  const handleExecute = () => {
    if (onExecuteAttack && attack) {
      onExecuteAttack(attack.id);
    }
  };

  // Get display name for slot
  const slotName = attack.slot === 'primaryWeapon' ? 'Primary' : 'Secondary';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="gray.800" borderColor="gray.700">
        <ModalHeader color="gray.100">
          <HStack>
            <Icon 
              as={Sword} 
              color={attack.meleeRanged === 'Melee' ? "blue.400" : "green.400"} 
            />
            <Text>{attack.name}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400" />
        <ModalBody pb={6}>
          <VStack spacing={4} align="start">
            <Text color="gray.300" whiteSpace="pre-wrap">
              {attack.description}
            </Text>
            
            <Divider borderColor="gray.600" />
            
            <SimpleGrid columns={2} spacing={4} width="full">
              <Box>
                <Text fontWeight="semibold" color="gray.300">Weapon Slot</Text>
                <Badge mt={1} colorScheme={slotName === 'Primary' ? 'blue' : 'cyan'}>
                  {slotName}
                </Badge>
              </Box>
              
              <Box>
                <Text fontWeight="semibold" color="gray.300">Type</Text>
                <HStack mt={1}>
                  <Badge colorScheme={attack.meleeRanged === 'Melee' ? "blue" : "green"}>
                    {attack.meleeRanged}
                  </Badge>
                  <Badge variant="outline">
                    {attack.weaponType}
                  </Badge>
                </HStack>
              </Box>
              
              <Box>
                <Text fontWeight="semibold" color="gray.300">Hands Required</Text>
                <Badge mt={1}>{attack.handsRequired}</Badge>
              </Box>
              
              <Box>
                <Text fontWeight="semibold" color="gray.300">Damage</Text>
                <HStack mt={1}>
                  <Text fontWeight="bold" color="gray.100">{attack.damageAmount}</Text>
                  <Badge colorScheme={getDamageTypeColor(attack.damageType)}>
                    {attack.damageType}
                  </Badge>
                </HStack>
              </Box>
              
              {attack.magicNonMagical && (
                <Box>
                  <Text fontWeight="semibold" color="gray.300">Magic Type</Text>
                  <Badge mt={1} colorScheme={attack.magicNonMagical === 'Magical' ? "purple" : "gray"}>
                    {attack.magicNonMagical}
                  </Badge>
                </Box>
              )}
            </SimpleGrid>
            
            {/* Stat Bonuses Section */}
            {attack.statBonus && Object.keys(attack.statBonus).length > 0 && (
              <>
                <Divider borderColor="gray.600" />
                <Box width="full">
                  <Text fontWeight="semibold" mb={2} color="gray.300">
                    <HStack>
                      <Icon as={Star} color="yellow.400" />
                      <Text>Stat Bonuses</Text>
                    </HStack>
                  </Text>
                  <SimpleGrid columns={3} spacing={2}>
                    {Object.entries(attack.statBonus).map(([stat, bonus]) => (
                      <Badge key={stat} colorScheme="yellow" variant="outline">
                        +{bonus} {stat.charAt(0).toUpperCase() + stat.slice(1)}
                      </Badge>
                    ))}
                  </SimpleGrid>
                </Box>
              </>
            )}
            
            {/* Skill Bonuses Section */}
            {attack.skillBonus && Object.keys(attack.skillBonus).length > 0 && (
              <>
                <Divider borderColor="gray.600" />
                <Box width="full">
                  <Text fontWeight="semibold" mb={2} color="gray.300">
                    <HStack>
                      <Icon as={ShieldOff} color="teal.400" />
                      <Text>Skill Bonuses</Text>
                    </HStack>
                  </Text>
                  <SimpleGrid columns={3} spacing={2}>
                    {Object.entries(attack.skillBonus).map(([skill, bonus]) => (
                      <Badge key={skill} colorScheme="teal" variant="outline">
                        +{bonus} {skill.charAt(0).toUpperCase() + skill.slice(1)}
                      </Badge>
                    ))}
                  </SimpleGrid>
                </Box>
              </>
            )}
            
            {/* Abilities Section */}
            {attack.abilities && attack.abilities.length > 0 && (
              <>
                <Divider borderColor="gray.600" />
                <Box width="full">
                  <Text fontWeight="semibold" mb={2} color="gray.300">
                    <HStack>
                      <Icon as={Power} color="brand.400" />
                      <Text>Abilities</Text>
                    </HStack>
                  </Text>
                  <VStack align="start" spacing={2}>
                    {attack.abilities.map((ability, index) => (
                      <HStack key={index}>
                        <Icon as={Sparkles} color="brand.200" boxSize={3} />
                        <Text color="gray.300">{ability}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              </>
            )}
            
            {/* Traits Section */}
            {attack.traits && attack.traits.length > 0 && (
              <>
                <Divider borderColor="gray.600" />
                <Box width="full">
                  <Text fontWeight="semibold" mb={2} color="gray.300">
                    <HStack>
                      <Icon as={Star} color="orange.400" />
                      <Text>Traits</Text>
                    </HStack>
                  </Text>
                  <VStack align="start" spacing={2}>
                    {attack.traits.map((trait, index) => (
                      <HStack key={index}>
                        <Icon as={Sparkles} color="orange.200" boxSize={3} />
                        <Text color="gray.300">{trait}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              </>
            )}
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} color="gray.300">
            Close
          </Button>
          
          <Button 
              colorScheme={attack.meleeRanged === 'Melee' ? "blue" : "green"}
              leftIcon={<Sword size={16} />}
              onClick={handleExecute}
          >
              Execute Attack
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AttackDetailModal;
