import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  Text,
  Badge,
  SimpleGrid,
  Divider,
  Spinner,
  Button,
  HStack,
  Flex,
  useToast,
  Alert,
  AlertIcon,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { Gift, Package, Check, ShoppingBag, Award } from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { useCharacter } from '@/context/CharacterContext';
import { ScrollArea } from '@/components/ui/scroll-area';

// Interfaces
interface LootItem {
  id: string;
  name: string;
  description?: string;
  rarity: string;
  itemType: string;
  quantity: number;
  [key: string]: any;
}

interface LootDistribution {
  id: string;
  packageName: string;
  packageId: string;
  distributedBy: string;
  distributedAt: number;
  dmName: string;
  items: LootItem[];
  acknowledged: boolean;
  sponsor?: string;
}

// Utility Functions
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

const getRarityColor = (rarity: string): string => {
  const rarityColors: { [key: string]: string } = {
    'common': 'gray',
    'uncommon': 'green',
    'rare': 'blue',
    'epic': 'purple',
    'legendary': 'orange',
    'unique': 'yellow',
    'very rare': 'red'
  };
  return rarityColors[rarity.toLowerCase()] || 'gray';
};

// List of possible sponsors
const SPONSORS = [
  "Arcane Arsenal",
  "Mystic Forge",
  "Dragon's Hoard",
  "Celestial Artifacts",
  "Enchanted Emporium",
  "Royal Armory",
  "Merchant Guild",
  "Adventurer's League",
  "Magic Council",
  "The Artificers"
];

// Get a random sponsor
const getRandomSponsor = (): string => {
  return SPONSORS[Math.floor(Math.random() * SPONSORS.length)];
};

const PlayerLoot: React.FC = () => {
  // Hooks
  const { currentUser } = useAuth();
  const { addToInventory } = useCharacter();
  const toast = useToast();
  
  // State Management
  const [lootHistory, setLootHistory] = useState<LootDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [selectedLoot, setSelectedLoot] = useState<LootDistribution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');

  // Memoized Calculations
  const unacknowledgedLoot = useMemo(() => 
    lootHistory.filter(loot => !loot.acknowledged), 
    [lootHistory]
  );

  const acknowledgedLoot = useMemo(() => 
    lootHistory.filter(loot => loot.acknowledged), 
    [lootHistory]
  );

  // Fetch Loot History
  useEffect(() => {
    const fetchLootHistory = async () => {
      if (!currentUser) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const lootQuery = query(
          collection(db, 'lootDistributions'),
          where('recipientId', '==', currentUser.uid)
        );
        
        const lootSnapshot = await getDocs(lootQuery);
        
        const history: LootDistribution[] = await Promise.all(
          lootSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            
            // Fetch DM name
            let dmName = 'System AI';
            if (data.distributedBy) {
              try {
                const dmDocs = await getDocs(
                  query(
                    collection(db, 'users'), 
                    where('userId', '==', data.distributedBy)
                  )
                );
                
                if (!dmDocs.empty) {
                  const dmData = dmDocs.docs[0].data();
                  dmName = dmData.displayName || dmData.email || 'System AI';
                }
              } catch (dmError) {
                console.error('Error fetching DM name:', dmError);
              }
            }
            
            // Sort the distribution items by name to maintain consistency
            const sortedItems = (data.items || []).sort((a: LootItem, b: LootItem) => 
              a.name.localeCompare(b.name)
            );
            
            return {
              id: doc.id,
              packageName: data.packageName || 'Mystery Loot Box',
              packageId: data.packageId || '',
              distributedBy: data.distributedBy,
              distributedAt: data.distributedAt instanceof Timestamp 
                ? data.distributedAt.toMillis() 
                : data.distributedAt,
              dmName,
              items: sortedItems,
              acknowledged: data.acknowledged || false,
              sponsor: data.sponsor || getRandomSponsor()
            };
          })
        );
        
        // Sort history by distribution date (most recent first)
        const sortedHistory = history.sort((a, b) => b.distributedAt - a.distributedAt);
        
        setLootHistory(sortedHistory);
      } catch (fetchError) {
        console.error('Error loading loot history:', fetchError);
        setError('Failed to load loot history. Please try again later.');
        toast({
          title: 'Loot Fetch Error',
          description: 'Unable to retrieve loot box history',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLootHistory();
  }, [currentUser, toast]);

  // Acknowledge Loot Handler
  const handleAcknowledgeLoot = async (lootId: string) => {
    if (!currentUser) return;
    
    setIsAcknowledging(true);
    
    try {
      // Find the specific loot package
      const lootBox = lootHistory.find(loot => loot.id === lootId);
      
      if (lootBox) {
        // First check if it's already acknowledged in the database
        const lootRef = doc(db, 'lootDistributions', lootId);
        const lootDoc = await getDoc(lootRef);
        
        if (lootDoc.exists() && lootDoc.data().acknowledged) {
          toast({
            title: 'Already Acknowledged',
            description: `This loot box has already been added to your inventory`,
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          
          // Update local state to match database
          setLootHistory(prevHistory => 
            prevHistory.map(loot => 
              loot.id === lootId ? { ...loot, acknowledged: true } : loot
            )
          );
          
          setIsAcknowledging(false);
          return;
        }
        
        // Properly add ALL quantities of EACH item to inventory
        lootBox.items.forEach(item => {
          // Add the FULL quantity of the item to inventory
          for (let i = 0; i < (item.quantity || 1); i++) {
            addToInventory({
              ...item,
              description: item.description || ''
            });
          }
        });
        
        // Update the database to mark as acknowledged
        await updateDoc(lootRef, {
          acknowledged: true,
          acknowledgedAt: Date.now()
        });
        
        // Update local state
        setLootHistory(prevHistory => 
          prevHistory.map(loot => 
            loot.id === lootId ? { ...loot, acknowledged: true } : loot
          )
        );
        
        toast({
          title: 'Loot Box Opened!',
          description: `Items from ${lootBox.packageName} added to inventory`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (acknowledgeError) {
      console.error('Loot acknowledgement error:', acknowledgeError);
      toast({
        title: 'Opening Failed',
        description: 'Could not open loot box. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsAcknowledging(false);
    }
  };

  // Rendering Conditions
  if (isLoading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner size="xl" color="brand.400" />
        <Text mt={4} color="gray.300">Loading loot box history...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} textAlign="center">
        <Alert status="error">
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      </Box>
    );
  }

  if (lootHistory.length === 0) {
    return (
      <Box p={8} textAlign="center">
        <Gift size={64} className="mx-auto mb-4 text-brand-400" />
        <Text fontSize="xl" mb={2} color="gray.200">
          No Loot Boxes Yet
        </Text>
        <Text color="gray.400">
          You haven't received any loot boxes yet.
        </Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      {/* Unacknowledged Loot Alert */}
      {unacknowledgedLoot.length > 0 && (
        <Alert 
          status="success" 
          mb={4} 
          bg="amber.800" 
          color="white" 
          borderRadius="md"
        >
          <AlertIcon color="amber.300" />
          <Text>
            You have {unacknowledgedLoot.length} new loot {unacknowledgedLoot.length === 1 ? 'box' : 'boxes'} to open!
          </Text>
        </Alert>
      )}
      
      {/* View Toggle */}
      <HStack mb={4} spacing={4}>
        <Button 
          colorScheme={viewMode === 'active' ? 'brand' : 'gray'}
          variant={viewMode === 'active' ? 'solid' : 'outline'}
          onClick={() => setViewMode('active')}
          leftIcon={<Gift />}
        >
          Available Loot Boxes
        </Button>
        <Button 
          colorScheme={viewMode === 'history' ? 'brand' : 'gray'}
          variant={viewMode === 'history' ? 'solid' : 'outline'}
          onClick={() => setViewMode('history')}
          leftIcon={<Package />}
        >
          Loot History
        </Button>
      </HStack>
      
      {viewMode === 'active' ? (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {/* Available Loot Boxes */}
          <Box>
            <Heading size="md" mb={4} color="gray.200">
              <Gift className="inline mr-2" />
              Available Loot Boxes
            </Heading>
            
            <ScrollArea className="h-[500px]">
              <VStack spacing={3} align="stretch">
                {unacknowledgedLoot.length === 0 ? (
                  <Box p={6} textAlign="center" bg="gray.800" borderRadius="md">
                    <Text color="gray.400">No unopened loot boxes available</Text>
                  </Box>
                ) : (
                  unacknowledgedLoot.map(loot => (
                    <Box 
                      key={loot.id} 
                      p={4} 
                      borderWidth="1px" 
                      borderRadius="md" 
                      borderColor="amber.600"
                      bg="gray.800"
                      _hover={{ borderColor: "amber.500", boxShadow: "md" }}
                      onClick={() => setSelectedLoot(loot)}
                      cursor="pointer"
                      position="relative"
                    >
                      <VStack align="start" spacing={2}>
                        <HStack width="full" justify="space-between">
                          <HStack>
                            <Award className="text-amber-400" />
                            <Text fontWeight="bold" color="gray.200">{loot.packageName}</Text>
                          </HStack>
                          <Badge colorScheme="yellow">New!</Badge>
                        </HStack>
                        
                        <Text fontSize="sm" color="amber.300">
                          Sponsored by: {loot.sponsor}
                        </Text>
                        
                        <Text fontSize="xs" color="gray.500">
                          Received: {formatDate(loot.distributedAt)}
                        </Text>
                        
                        <HStack spacing={2} width="full" justify="space-between">
                          <Badge colorScheme="brand">{loot.items.length} {loot.items.length === 1 ? 'item' : 'items'}</Badge>

                          <Button
                            size="sm"
                            colorScheme="amber"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcknowledgeLoot(loot.id);
                            }}
                            isLoading={isAcknowledging}
                          >
                            Open Box
                          </Button>
                        </HStack>
                      </VStack>
                    </Box>
                  ))
                )}
              </VStack>
            </ScrollArea>
          </Box>
          
          {/* Loot Box Details */}
          <Box>
            {selectedLoot ? (
              <Box
                p={4}
                borderWidth="1px"
                borderRadius="md"
                borderColor="gray.700"
                bg="gray.800"
              >
                <VStack align="stretch" spacing={4}>
                  <HStack>
                    <Award className="text-amber-400" size={24} />
                    <Heading size="md" color="gray.200">{selectedLoot.packageName}</Heading>
                  </HStack>
                  
                  <HStack>
                    <Text fontSize="sm" color="amber.300">
                      Sponsored by: {selectedLoot.sponsor}
                    </Text>
                    <Text fontSize="sm" color="gray.400">
                      Received: {formatDate(selectedLoot.distributedAt)}
                    </Text>
                  </HStack>
                  
                  <Divider borderColor="gray.700" />
                  
                  <Box>
                    <Text fontWeight="bold" mb={2} color="gray.300">
                      <ShoppingBag className="inline mr-2" size={16} />
                      Items Inside
                    </Text>
                    
                    <VStack spacing={2} align="stretch">
                      {selectedLoot.items.map(item => (
                        <Box
                          key={item.id}
                          p={3}
                          borderWidth="1px"
                          borderRadius="md"
                          borderColor="gray.700"
                          bg="gray.750"
                        >
                          <Flex justify="space-between" align="center">
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="bold" color="gray.200">{item.name}</Text>
                              <HStack>
                                <Badge>{item.itemType}</Badge>
                                <Badge colorScheme={getRarityColor(item.rarity)}>{item.rarity}</Badge>
                                {item.quantity > 1 && (
                                  <Badge colorScheme="blue">x{item.quantity}</Badge>
                                )}
                              </HStack>
                            </VStack>
                          </Flex>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                  
                  {!selectedLoot.acknowledged && (
                    <Button
                      colorScheme="amber"
                      onClick={() => handleAcknowledgeLoot(selectedLoot.id)}
                      leftIcon={<Gift size={16} />}
                      isLoading={isAcknowledging}
                    >
                      Open Loot Box
                    </Button>
                  )}
                </VStack>
              </Box>
            ) : (
              <Box
                p={8}
                borderWidth="1px"
                borderRadius="md"
                borderColor="gray.700"
                bg="gray.800"
                textAlign="center"
              >
                <Gift size={48} className="mx-auto mb-4 text-amber-400" />
                <Text color="gray.400">
                  Select a loot box to view contents
                </Text>
              </Box>
            )}
          </Box>
        </SimpleGrid>
      ) : (
        // History View
        <Box>
          <Heading size="md" mb={4} color="gray.200">
            <Package className="inline mr-2" />
            Loot Box History
          </Heading>
          
          {acknowledgedLoot.length === 0 ? (
            <Box p={6} textAlign="center" bg="gray.800" borderRadius="md">
              <Text color="gray.400">No loot box history yet</Text>
            </Box>
          ) : (
            <ScrollArea className="h-[600px]">
              <Box bg="gray.800" borderRadius="md" p={4}>
                <Table variant="simple" size="sm">
                  <Thead bg="gray.700">
                    <Tr>
                      <Th color="gray.300">Loot Box</Th>
                      <Th color="gray.300">Sponsor</Th>
                      <Th color="gray.300">Items</Th>
                      <Th color="gray.300">Received</Th>
                      <Th color="gray.300">Opened</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {acknowledgedLoot.map(loot => (
                      <Tr 
                        key={loot.id} 
                        _hover={{ bg: "gray.750" }}
                        cursor="pointer"
                        onClick={() => setSelectedLoot(loot)}
                      >
                        <Td>
                          <HStack>
                            <Award size={14} className="text-amber-400" />
                            <Text color="gray.200">{loot.packageName}</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Text color="amber.300">{loot.sponsor}</Text>
                        </Td>
                        <Td>
                          <Badge colorScheme="brand">{loot.items.length}</Badge>
                        </Td>
                        <Td>
                          <Text color="gray.400" fontSize="sm">
                            {new Date(loot.distributedAt).toLocaleDateString()}
                          </Text>
                        </Td>
                        <Td>
                          <Badge colorScheme="green" variant="outline">
                            <Check size={12} className="mr-1" /> Opened
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </ScrollArea>
          )}
          
          {/* Selected Loot Box Detail */}
          {selectedLoot && (
            <Box
              p={4}
              mt={4}
              borderWidth="1px"
              borderRadius="md"
              borderColor="gray.700"
              bg="gray.800"
            >
              <VStack align="stretch" spacing={4}>
                <HStack>
                  <Award className="text-amber-400" size={24} />
                  <Heading size="md" color="gray.200">{selectedLoot.packageName}</Heading>
                </HStack>
                
                <HStack>
                  <Text fontSize="sm" color="amber.300">
                    Sponsored by: {selectedLoot.sponsor}
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    Received: {formatDate(selectedLoot.distributedAt)}
                  </Text>
                </HStack>
                
                <Divider borderColor="gray.700" />
                
                <Box>
                  <Text fontWeight="bold" mb={2} color="gray.300">
                    <ShoppingBag className="inline mr-2" size={16} />
                    Items Received
                  </Text>
                  
                  <VStack spacing={2} align="stretch">
                    {selectedLoot.items.map(item => (
                      <Box
                        key={item.id}
                        p={3}
                        borderWidth="1px"
                        borderRadius="md"
                        borderColor="gray.700"
                        bg="gray.750"
                      >
                        <Flex justify="space-between" align="center">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" color="gray.200">{item.name}</Text>
                            <HStack>
                              <Badge>{item.itemType}</Badge>
                              <Badge colorScheme={getRarityColor(item.rarity)}>{item.rarity}</Badge>
                              {item.quantity > 1 && (
                                <Badge colorScheme="blue">x{item.quantity}</Badge>
                              )}
                            </HStack>
                          </VStack>
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PlayerLoot;
