import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  Badge,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';
import { Item } from '../../../types';

interface ItemDetailModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
}

const getRarityScheme = (rarity: string) => {
  switch(rarity.toLowerCase()) {
    case 'common': return 'gray';
    case 'uncommon': return 'green';
    case 'rare': return 'blue';
    case 'epic': return 'purple';
    case 'legendary': return 'orange';
    default: return 'gray';
  }
};

export const ItemDetailModal = ({ item, isOpen, onClose }: ItemDetailModalProps) => {
  if (!item) return null;

  const renderStatPair = (label: string, value: any) => {
    if (!value || value === 'N/A' || value === 0) return null;
    
    return (
      <Stat size="sm">
        <StatLabel fontSize="xs">{label}</StatLabel>
        <StatNumber fontSize="sm">{value}</StatNumber>
      </Stat>
    );
  };

  const renderBonuses = (bonuses: Record<string, number>) => {
    if (!bonuses || Object.keys(bonuses).length === 0) return null;

    return Object.entries(bonuses).map(([key, value]) => {
      if (!value) return null;
      return (
        <Text key={key} fontSize="sm">
          {key}: +{value}
        </Text>
      );
    });
  };

  const renderAbilities = (abilities: string[] | Record<string, any>) => {
    if (!abilities || (Array.isArray(abilities) && abilities.length === 0) || 
        (!Array.isArray(abilities) && Object.keys(abilities).length === 0)) return null;

    return (
      <VStack align="start" w="full" spacing={1}>
        <Text fontSize="sm" fontWeight="semibold">Abilities:</Text>
        {Array.isArray(abilities) ? (
          abilities.map((ability, index) => (
            <Text key={index} fontSize="sm">• {ability}</Text>
          ))
        ) : (
          Object.entries(abilities).map(([key, value]) => (
            <Text key={key} fontSize="sm">• {key}: {value}</Text>
          ))
        )}
      </VStack>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Text>{item.name}</Text>
            <Badge colorScheme={getRarityScheme(item.rarity)}>
              {item.rarity}
            </Badge>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="start" spacing={4} w="full">
            {item.description && (
              <Text fontSize="sm" color="gray.600">
                {item.description}
              </Text>
            )}
            
            <Divider />

            <SimpleGrid columns={2} spacing={4} w="full">
              {Object.entries(item).map(([key, value]) => {
                // Skip certain fields we handle specially
                if (['name', 'description', 'rarity'].includes(key)) return null;
                
                // Handle objects
                if (typeof value === 'object') return null;
                
                return renderStatPair(
                  key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                  value
                );
              })}
            </SimpleGrid>

            {'vitalBonus' in item && item.vitalBonus && (
              <VStack align="start" w="full" spacing={1}>
                <Text fontSize="sm" fontWeight="semibold">Vital Bonuses:</Text>
                {renderBonuses(item.vitalBonus)}
              </VStack>
            )}

            {'skillBonus' in item && item.skillBonus && (
              <VStack align="start" w="full" spacing={1}>
                <Text fontSize="sm" fontWeight="semibold">Skill Bonuses:</Text>
                {renderBonuses(item.skillBonus)}
              </VStack>
            )}

            {'abilities' in item && renderAbilities(item.abilities)}

            {'effect' in item && item.effect && (
              <VStack align="start" w="full" spacing={1}>
                <Text fontSize="sm" fontWeight="semibold">Effect:</Text>
                <Text fontSize="sm">{item.effect}</Text>
              </VStack>
            )}

            {('hpBonus' in item && item.hpBonus > 0) || ('mpBonus' in item && item.mpBonus > 0) ? (
              <SimpleGrid columns={2} spacing={4} w="full">
                {item.hpBonus > 0 && renderStatPair('HP Bonus', `+${item.hpBonus}`)}
                {item.mpBonus > 0 && renderStatPair('MP Bonus', `+${item.mpBonus}`)}
              </SimpleGrid>
            ) : null}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};