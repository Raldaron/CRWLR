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
  Icon,
} from '@chakra-ui/react';
import { Award } from 'lucide-react';

interface TraitDetailModalProps {
  traitName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Trait {
  name: string;
  description: string;
  effect: string;
}

const TraitDetailModal: React.FC<TraitDetailModalProps> = ({ 
  traitName, 
  isOpen, 
  onClose 
}) => {
  const [trait, setTrait] = useState<Trait | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTraitData = async () => {
      if (!traitName) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/data/traits.json');
        const data = await response.json();
        
        // First, try direct lookup with the exact traitName
        // This handles cases where the class passes the exact key like "eagleeye"
        if (data.traits[traitName]) {
          setTrait(data.traits[traitName]);
          setIsLoading(false);
          return;
        }
        
        // Next try to find the trait by key (ignoring case and spaces)
        const normalizedSearchTerm = traitName.toLowerCase().replace(/\s+/g, '');
        
        // Find the trait by key (case-insensitive, ignoring spaces)
        // First try exact key match
        let traitKey = Object.keys(data.traits).find(
          key => key.toLowerCase() === normalizedSearchTerm
        );
        
        // If that fails, try exact match with the original traitName
        if (!traitKey) {
          traitKey = Object.keys(data.traits).find(
            key => key.toLowerCase() === traitName.toLowerCase()
          );
        }
        
        if (traitKey) {
          setTrait(data.traits[traitKey]);
        } else {
          // If we can't find by key, try by name property
          const traitByName = Object.values(data.traits).find(
            (t: any) => t.name.toLowerCase() === traitName.toLowerCase()
          );
          
          if (traitByName) {
            setTrait(traitByName as Trait);
          } else {
            // If still not found, try partial matching on name
            const partialMatch = Object.values(data.traits).find(
              (t: any) => t.name.toLowerCase().includes(traitName.toLowerCase())
            );
            
            if (partialMatch) {
              setTrait(partialMatch as Trait);
            } else {
              setError(`Could not find trait: ${traitName}`);
              // Create a placeholder trait
              setTrait({
                name: traitName,
                description: 'Trait details not found in database.',
                effect: 'Unknown effect'
              });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching trait data:', err);
        setError('Failed to load trait data');
        // Create a placeholder trait
        setTrait({
          name: traitName,
          description: 'Error loading trait details.',
          effect: 'Unknown effect'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && traitName) {
      fetchTraitData();
    }
  }, [traitName, isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isLoading ? (
            <Text>Loading trait...</Text>
          ) : (
            <VStack align="start" spacing={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <Award size={18} className="text-green-500" />
                <Text>{trait?.name || traitName}</Text>
              </Box>
              <Badge colorScheme="green">Trait</Badge>
            </VStack>
          )}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" p={8}>
              <Spinner size="xl" color="green.500" />
            </Box>
          ) : error ? (
            <Text color="red.500">{error}</Text>
          ) : trait ? (
            <VStack align="start" spacing={4}>
              <Box>
                <Text fontWeight="semibold" mb={2}>Description</Text>
                <Text>{trait.description}</Text>
              </Box>
              
              {trait.effect && (
                <Box>
                  <Text fontWeight="semibold" mb={2}>Effect</Text>
                  <Text>{trait.effect}</Text>
                </Box>
              )}
            </VStack>
          ) : (
            <Text>No trait data available</Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TraitDetailModal;