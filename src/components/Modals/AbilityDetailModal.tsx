import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  VStack,
  Badge,
  Box,
  Spinner,
  Divider,
  SimpleGrid,
  HStack,
  Button,
} from '@chakra-ui/react';
import { Star, Clock, Zap } from 'lucide-react';

interface AbilityDetailModalProps {
  abilityName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Ability {
  name: string;
  description: string;
  effect: string;
  range: string;
  damage: string;
  damagetype: string;
  scaling: {
    [key: string]: string;
  };
  abilitypointcost: number;
  cooldown: string;
  specialrules?: {
    [key: string]: string;
  };
}

const AbilityDetailModal: React.FC<AbilityDetailModalProps> = ({ 
  abilityName, 
  isOpen, 
  onClose 
}) => {
  const [ability, setAbility] = useState<Ability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAbilityData = async () => {
      if (!abilityName) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/data/abilities.json');
        const data = await response.json();
        
        // Find the ability by name (case-insensitive)
        const abilityKey = Object.keys(data.abilities).find(
          key => data.abilities[key].name.toLowerCase() === abilityName.toLowerCase()
        );
        
        if (abilityKey) {
          setAbility(data.abilities[abilityKey]);
        } else {
          // If we can't find an exact match, try to find a partial match
          const partialMatch = Object.values(data.abilities).find(
            (a: any) => a.name.toLowerCase().includes(abilityName.toLowerCase())
          );
          
          if (partialMatch) {
            setAbility(partialMatch as Ability);
          } else {
            setError(`Could not find ability: ${abilityName}`);
            // Create a placeholder ability
            setAbility({
              name: abilityName,
              description: 'Ability details not found in database.',
              effect: 'Unknown effect',
              range: 'Unknown',
              damage: 'N/A',
              damagetype: 'N/A',
              scaling: {},
              abilitypointcost: 0,
              cooldown: 'Unknown'
            });
          }
        }
      } catch (err) {
        console.error('Error fetching ability data:', err);
        setError('Failed to load ability data');
        // Create a placeholder ability
        setAbility({
          name: abilityName,
          description: 'Error loading ability details.',
          effect: 'Unknown effect',
          range: 'Unknown',
          damage: 'N/A',
          damagetype: 'N/A',
          scaling: {},
          abilitypointcost: 0,
          cooldown: 'Unknown'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && abilityName) {
      fetchAbilityData();
    }
  }, [abilityName, isOpen]);

  // Fix: Replace /n/n with actual line breaks and apply white-space: pre-wrap
  const formatDescription = (text: string) => {
    // Replace "/n/n" with actual line breaks if present
    return text.replace(/\/n\/n/g, '\n\n');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isLoading ? (
            <Text>Loading ability...</Text>
          ) : (
            <VStack align="start" spacing={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <Star size={18} className="text-purple-500" />
                <Text>{ability?.name || abilityName}</Text>
              </Box>
              <Badge colorScheme="purple">Ability</Badge>
            </VStack>
          )}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" p={8}>
              <Spinner size="xl" color="purple.500" />
            </Box>
          ) : error ? (
            <Text color="red.500">{error}</Text>
          ) : ability ? (
            <VStack align="start" spacing={4}>
              <Box>
                <Text fontWeight="semibold" mb={2}>Description</Text>
                {/* Fix: Apply white-space: pre-wrap to preserve line breaks */}
                <Text 
                  whiteSpace="pre-wrap" 
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {formatDescription(ability.description)}
                </Text>
              </Box>
              
              <Box>
                <Text fontWeight="semibold" mb={2}>Effect</Text>
                <Text whiteSpace="pre-wrap">{formatDescription(ability.effect)}</Text>
              </Box>
              
              <SimpleGrid columns={2} spacing={4} width="100%">
                <Box>
                  <Text fontWeight="semibold">Range</Text>
                  <Text>{ability.range}</Text>
                </Box>
                {ability.damage !== "N/A" && (
                  <Box>
                    <Text fontWeight="semibold">Damage</Text>
                    <Text>{ability.damage} {ability.damagetype}</Text>
                  </Box>
                )}
              </SimpleGrid>

              <Divider />

              <Box width="100%">
                <HStack justify="space-between" mb={4}>
                  <Text fontWeight="semibold">
                    Cooldown
                  </Text>
                </HStack>
                
                <Text>{ability.cooldown}</Text>
              </Box>
              
              {/* Special Rules Section (if present in the ability data) */}
              {ability.specialrules && (
                <>
                  <Divider />
                  <Box width="100%">
                    <Text fontWeight="semibold" mb={2}>Special Rules</Text>
                    <VStack align="start" spacing={2}>
                      {Object.entries(ability.specialrules).map(([key, rule]) => (
                        <Text key={key}>{key}. {rule}</Text>
                      ))}
                    </VStack>
                  </Box>
                </>
              )}
            </VStack>
          ) : (
            <Text>No ability data available</Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AbilityDetailModal;