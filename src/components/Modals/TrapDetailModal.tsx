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
import { Clock, Crosshair, Settings, AlertTriangle, Zap } from 'lucide-react';
import type { TrapItem, AdditionalEffect } from '@/types/trap';
// Import the new component
import TruncatedTextWithModal from '../ui/TruncatedTextWithModal'; // Adjust path if needed

interface TrapDetailModalProps {
  trap: TrapItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const TrapDetailModal = ({ trap, isOpen, onClose }: TrapDetailModalProps) => {
  if (!trap) return null;

  // Function to safely parse additionaleffects JSON string
   const parseAdditionalEffects = (effectsString?: string): AdditionalEffect[] => {
        if (!effectsString || effectsString.trim() === '{}' || effectsString.trim() === '') return [];
        try {
            const parsed = JSON.parse(effectsString);
            if (Array.isArray(parsed) && parsed.every(eff => typeof eff === 'object' && eff !== null && 'name' in eff && 'description' in eff)) {
                return parsed as AdditionalEffect[];
            }
            console.warn("Parsed additionaleffects is not in the expected array format:", parsed);
            return [];
        } catch (error) {
            console.error("Failed to parse additionaleffects JSON:", error, "String was:", effectsString);
            return [];
        }
    };

  const additionalEffects = parseAdditionalEffects(trap.additionaleffects);


  const getRarityColor = (rarity: string) => {
    switch(rarity?.toLowerCase()) {
      case 'common': return 'gray'; case 'uncommon': return 'green';
      case 'rare': return 'blue'; case 'epic': return 'purple';
      case 'legendary': return 'orange'; case 'very rare': return 'red';
      default: return 'gray';
    }
  };

   const getDamageTypeColor = (type?: string) => {
    switch(type?.toLowerCase()) {
      case 'fire': return 'red'; case 'cold': return 'blue';
      case 'lightning': return 'yellow'; case 'acid': return 'green';
      case 'force': return 'purple'; case 'piercing': return 'orange';
      case 'bludgeoning': return 'gray'; case 'thunder': return 'yellow';
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
             <HStack>
                <Badge colorScheme={getRarityColor(trap.rarity)}>
                {trap.rarity}
                </Badge>
                 <Badge variant="outline">Trap</Badge>
             </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="start" spacing={4} width="100%">
            {/* Use TruncatedTextWithModal for description */}
             <TruncatedTextWithModal
                text={trap.description}
                modalTitle={`${trap.name} - Description`}
                charLimit={200}
             />

            <Divider />

            <SimpleGrid columns={2} spacing={4} width="100%">
              <HStack><Icon as={Clock} size={16} /><Text fontWeight="semibold">Duration:</Text><Text>{trap.duration || 'N/A'}</Text></HStack>
              {trap.range && <HStack><Icon as={Crosshair} size={16} /><Text fontWeight="semibold">Range:</Text><Text>{trap.range}</Text></HStack>}
              {trap.triggerMechanism && <HStack><Icon as={Zap} size={16} /><Text fontWeight="semibold">Trigger:</Text><Text>{trap.triggerMechanism}</Text></HStack>}
              {trap.operation && <HStack><Icon as={Settings} size={16} /><Text fontWeight="semibold">Operation:</Text><Text>{trap.operation}</Text></HStack>}
            </SimpleGrid>

            <Divider />

            {/* Use TruncatedTextWithModal for effect */}
            {trap.effect && (
                <Box width="100%">
                    <TruncatedTextWithModal
                        label="Effect"
                        text={trap.effect}
                        modalTitle={`${trap.name} - Effect`}
                        charLimit={180}
                    />
                </Box>
            )}

            {trap.damage && trap.damage !== 'N/A' && (
                 <>
                 <Divider />
                 <Box width="100%">
                     <Text fontWeight="semibold" mb={2}>Damage</Text>
                     <HStack>
                         <Icon as={AlertTriangle} color="red.400" />
                         <Text fontSize="lg" fontWeight="bold">{trap.damage}</Text>
                         {trap.damageType && (
                             <Badge colorScheme={getDamageTypeColor(trap.damageType)}>
                                 {trap.damageType}
                             </Badge>
                         )}
                     </HStack>
                 </Box>
                 </>
             )}

            {additionalEffects.length > 0 && (
                <>
                <Divider />
                <Box width="100%">
                    <Text fontWeight="semibold" mb={2} mt={4}>Additional Effects</Text>
                    <VStack align="start" spacing={2}>
                    {additionalEffects.map((effect, index) => (
                        <Box key={index} p={3} bg="gray.50" borderRadius="md" w="full">
                            <Text fontWeight="semibold">{effect.name}</Text>
                            <TruncatedTextWithModal
                                text={effect.description}
                                modalTitle={`${effect.name} - Description`}
                                charLimit={100}
                            />
                        </Box>
                    ))}
                    </VStack>
                </Box>
                </>
            )}

             {(trap.sellValue !== undefined || trap.buyValue !== undefined) && (
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

export default TrapDetailModal;