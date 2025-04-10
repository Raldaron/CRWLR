// --- START OF FILE PlayerLoot.tsx ---
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Center, // Added from playerloot2
} from '@chakra-ui/react';
import { Gift, Package, Check, ShoppingBag, Award, Clock, UserCheck } from 'lucide-react'; // Added Clock, UserCheck
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  updateDoc,
  getDoc,
  orderBy,
  serverTimestamp, // Added from playerloot2
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { useCharacter } from '@/context/CharacterContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { InventoryItem } from '@/types/inventory'; // Use Base InventoryItem type

// Interfaces (Using refined versions from playerloot2)
interface LootItem {
  id: string; // Should match the original item's ID from the 'items' collection
  name: string;
  description?: string;
  rarity: string;
  itemType: string;
  quantity: number; // Quantity within this specific loot drop
  [key: string]: any; // Allow other properties from the base item
}

interface LootDistribution {
  id: string; // Firestore document ID of the distribution record
  packageName: string;
  packageId: string; // ID of the LootPackage template if applicable
  distributedBy: string; // DM's User ID
  distributedAt: number; // Milliseconds timestamp
  dmName: string; // DM's display name
  items: LootItem[]; // Array of items in this specific loot drop
  acknowledged: boolean;
  acknowledgedAt?: number; // Milliseconds timestamp when acknowledged
  sponsor?: string;
  recipientId: string; // Ensure recipientId is included
}

// Utility Functions (Using refined versions from playerloot2)
const formatDate = (timestamp: number | undefined): string => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  // Use more specific options for clarity
  return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
  });
};

const getRarityColor = (rarity: string): string => {
  const rarityColors: { [key: string]: string } = {
    'common': 'gray', 'uncommon': 'green', 'rare': 'blue',
    'epic': 'purple', 'legendary': 'orange', 'unique': 'yellow',
    'very rare': 'red', 'exceedingly rare': 'pink', 'artifact': 'red', // Added artifact
  };
  // Handle potential null/undefined rarity gracefully
  return rarityColors[rarity?.toLowerCase()] || 'gray';
};

// Define your SPONSORS list here (as in original PlayerLoot.tsx)
const SPONSORS = [
  "Arcane Arsenal", "Mystic Forge", "Dragon's Hoard", "Celestial Artifacts",
  "Enchanted Emporium", "Royal Armory", "Merchant Guild", "Adventurer's League",
  "Magic Council", "The Artificers"
];
const getRandomSponsor = (): string => SPONSORS[Math.floor(Math.random() * SPONSORS.length)];

// --- Component Definition ---
const PlayerLoot: React.FC = () => {
  // Hooks
  const { currentUser } = useAuth();
  // Use addMultipleItemsToInventory and saveCharacterManually from context
  const { addMultipleItemsToInventory, saveCharacterManually } = useCharacter();
  const toast = useToast();

  // State Management
  const [lootHistory, setLootHistory] = useState<LootDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [processingLootId, setProcessingLootId] = useState<string | null>(null);
  const [selectedLoot, setSelectedLoot] = useState<LootDistribution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');

  // Memoized Calculations
  const unacknowledgedLoot = useMemo(() => lootHistory.filter(loot => !loot.acknowledged), [lootHistory]);
  const acknowledgedLoot = useMemo(() => lootHistory.filter(loot => loot.acknowledged), [lootHistory]);

  // Fetch Loot History (Refined version using useCallback and orderBy)
  const fetchLootHistory = useCallback(async () => {
      if (!currentUser) return;
      setIsLoading(true);
      setError(null);
      console.log("Fetching loot history for user:", currentUser.uid);

      try {
          const lootQuery = query(
              collection(db, 'lootDistributions'),
              where('recipientId', '==', currentUser.uid), // Query based on the correct recipient field
              orderBy('distributedAt', 'desc') // Order by distribution date descending
          );
          const lootSnapshot = await getDocs(lootQuery);
          console.log(`Found ${lootSnapshot.size} loot distribution documents.`);

          const historyPromises = lootSnapshot.docs.map(async (docSnap) => {
              const data = docSnap.data();
              let dmName = data.dmName || 'System AI'; // Use stored DM name or default

              // Optional: Fetch DM name if missing and distributedBy exists
              if (!data.dmName && data.distributedBy) {
                  try {
                       // Try fetching from 'users' collection by DM's UID
                       const dmUserRef = doc(db, 'users', data.distributedBy);
                       const dmUserSnap = await getDoc(dmUserRef);
                       if (dmUserSnap.exists()) {
                           dmName = dmUserSnap.data().displayName || dmUserSnap.data().email || dmName;
                       } else {
                           console.warn(`DM user document not found for ID: ${data.distributedBy}`);
                       }
                  } catch (dmError) { console.error(`Error fetching DM name for ${data.distributedBy}:`, dmError); }
              }

              const items = data.items || [];
              // Ensure items are sorted consistently for display
              const sortedItems = Array.isArray(items)
                  ? [...items].sort((a: LootItem, b: LootItem) => (a.name || '').localeCompare(b.name || ''))
                  : [];

              // Ensure timestamps are numbers (milliseconds)
              const distributedAt = data.distributedAt instanceof Timestamp
                  ? data.distributedAt.toMillis()
                  : typeof data.distributedAt === 'number' ? data.distributedAt : Date.now();
              const acknowledgedAt = data.acknowledgedAt
                  ? (data.acknowledgedAt instanceof Timestamp ? data.acknowledgedAt.toMillis() : typeof data.acknowledgedAt === 'number' ? data.acknowledgedAt : undefined)
                  : undefined;

              return {
                  id: docSnap.id,
                  packageName: data.packageName || 'Mystery Loot Box',
                  packageId: data.packageId || '',
                  recipientId: data.recipientId, // Keep recipientId from Firestore
                  distributedBy: data.distributedBy,
                  distributedAt: distributedAt,
                  dmName,
                  items: sortedItems,
                  acknowledged: data.acknowledged || false,
                  acknowledgedAt: acknowledgedAt,
                  sponsor: data.sponsor || getRandomSponsor() // Use stored sponsor or generate random
              } as LootDistribution; // Assert type
          });

          const resolvedHistory = await Promise.all(historyPromises);
          setLootHistory(resolvedHistory);
          console.log("Loot history loaded and processed:", resolvedHistory.length, "items");

      } catch (fetchError: any) {
          console.error('Error loading loot history:', fetchError);
          setError(`Failed to load loot history: ${fetchError.message}`);
          toast({ title: 'Loot Fetch Error', description: fetchError.message, status: 'error' });
      } finally {
          setIsLoading(false);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, toast]); // Depend only on currentUser.uid and toast

  // Fetch loot history on component mount and when fetch function changes
  useEffect(() => {
      fetchLootHistory();
  }, [fetchLootHistory]);

  // Acknowledge Loot (Using robust version from playerloot2)
  const handleAcknowledgeLoot = useCallback(async (lootId: string) => {
    if (!currentUser || isAcknowledging) return;

    const lootBox = lootHistory.find(loot => loot.id === lootId);

    if (!lootBox) {
        toast({ title: 'Error', description: 'Loot box not found.', status: 'error', duration: 2000 });
        return;
    }
     if (lootBox.acknowledged) {
        toast({ title: 'Already Opened', status: 'info', duration: 2000 });
        return;
    }

    setIsAcknowledging(true);
    setProcessingLootId(lootId);
    console.log(`Acknowledging loot box ID: ${lootId}, Name: ${lootBox.packageName}`);

    const lootRef = doc(db, 'lootDistributions', lootId);

    try {
        // --- Step 1: Double-check Firestore status ---
        const lootDocSnap = await getDoc(lootRef);
        if (!lootDocSnap.exists()) {
            throw new Error("Loot distribution record not found in database.");
        }
        if (lootDocSnap.data()?.acknowledged) {
             toast({ title: 'Already Opened', description: 'This box was already opened elsewhere.', status: 'warning', duration: 3000 });
             setLootHistory(prev => prev.map(l => l.id === lootId ? { ...l, acknowledged: true, acknowledgedAt: lootDocSnap.data()?.acknowledgedAt instanceof Timestamp ? lootDocSnap.data()?.acknowledgedAt.toMillis() : lootDocSnap.data()?.acknowledgedAt } : l));
             setIsAcknowledging(false);
             setProcessingLootId(null);
             return;
        }

        // --- Step 2: Update Firestore FIRST ---
        const ackTimestamp = serverTimestamp(); // Use server timestamp for accuracy
        await updateDoc(lootRef, {
            acknowledged: true,
            acknowledgedAt: ackTimestamp
        });
        console.log(`Firestore document ${lootId} marked as acknowledged.`);

        // --- Step 3: Prepare items for inventory ---
        const itemsToAdd: InventoryItem[] = [];
        let totalItemsProcessed = 0;

        if (Array.isArray(lootBox.items)) {
            lootBox.items.forEach(lootItem => {
                if (lootItem && lootItem.name && lootItem.id) {
                    const quantity = Math.max(1, Number(lootItem.quantity) || 1);
                    const baseInvItem: InventoryItem = {
                        id: lootItem.id,
                        name: lootItem.name,
                        description: lootItem.description || '',
                        itemType: lootItem.itemType || 'Miscellaneous',
                        rarity: lootItem.rarity || 'Common',
                        // Include other relevant fields from lootItem if necessary
                        ...(lootItem.buyValue && { buyValue: lootItem.buyValue }),
                        ...(lootItem.sellValue && { sellValue: lootItem.sellValue }),
                        // ... add other fields as needed ...
                    };
                    for (let i = 0; i < quantity; i++) {
                        itemsToAdd.push(baseInvItem);
                    }
                    totalItemsProcessed += quantity;
                } else { console.warn("Skipping invalid item structure:", lootItem); }
            });
        } else {
            console.warn("Loot box items data is not an array:", lootBox.items);
            // If items might be legitimately empty, don't throw error here
            // throw new Error("Invalid item data structure in loot box.");
        }
        console.log(`Prepared ${itemsToAdd.length} individual item instances.`);

        // --- Step 4: Add items to CharacterContext inventory ---
        if (itemsToAdd.length > 0) {
             console.log("Calling addMultipleItemsToInventory...");
             addMultipleItemsToInventory(itemsToAdd);
             console.log("addMultipleItemsToInventory finished.");
             // --- Step 5: Save Character Context ---
             console.log("Calling saveCharacterManually...");
             await saveCharacterManually();
             console.log("saveCharacterManually completed.");
        } else {
            console.log("No valid items to add to inventory.");
             // Even if empty, we need to save if other character state *might* have changed implicitly
             // However, in this specific flow, only inventory changes. If no items added, saving might be skippable.
             // For safety, let's still save, but you could optimize this later.
             console.log("Calling saveCharacterManually even with no items (optional step)...");
             await saveCharacterManually();
             console.log("saveCharacterManually completed (optional step).");
        }

        // --- Step 6: Update local UI state ---
        const clientAckTime = Date.now(); // Use client time for immediate UI update
        setLootHistory(prevHistory =>
            prevHistory.map(loot =>
                loot.id === lootId ? { ...loot, acknowledged: true, acknowledgedAt: clientAckTime } : loot
            )
        );

        // --- Step 7: Update selected loot view if necessary ---
        if (selectedLoot?.id === lootId) {
            setSelectedLoot(prev => prev ? { ...prev, acknowledged: true, acknowledgedAt: clientAckTime } : null);
        }

        // --- Step 8: Show success message ---
        toast({
            title: 'Loot Box Opened!',
            description: `${totalItemsProcessed} item(s) from "${lootBox.packageName}" added to your inventory.`,
            status: 'success',
            duration: 4000,
            isClosable: true,
        });

    } catch (error: any) {
        console.error('Loot acknowledgement error:', error);
        toast({
            title: 'Opening Failed',
            description: error.message || 'Could not open loot box. Please try again.',
            status: 'error',
            duration: 3000,
            isClosable: true,
        });
        // Optional: Consider reverting local state if Firestore update failed but context was modified (complex)
    } finally {
        setIsAcknowledging(false);
        setProcessingLootId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isAcknowledging, lootHistory, addMultipleItemsToInventory, saveCharacterManually, toast, selectedLoot?.id]); // Added selectedLoot?.id dependency


  // --- Render Logic ---
  if (isLoading) {
    return <Center h="200px"><Spinner size="xl" color="brand.400" /></Center>;
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert status="error">
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      </Box>
    );
  }

  if (lootHistory.length === 0 && !isLoading) {
    return (
      <Box p={8} textAlign="center">
        <Gift size={64} className="mx-auto mb-4 text-brand-400" />
        <Text fontSize="xl" mb={2} color="gray.200">No Loot Boxes Yet</Text>
        <Text color="gray.400">Your loot box history is empty.</Text>
      </Box>
    );
  }


  return (
    <Box p={4}>
      {/* Unacknowledged Loot Alert */}
      {unacknowledgedLoot.length > 0 && viewMode === 'active' && (
        <Alert status="success" mb={4} bg="amber.800" color="white" borderRadius="md">
          <AlertIcon color="amber.300" />
          <Text>You have {unacknowledgedLoot.length} new loot {unacknowledgedLoot.length === 1 ? 'box' : 'boxes'}!</Text>
        </Alert>
      )}

      {/* View Toggle */}
      <HStack mb={4} spacing={4}>
        <Button
          onClick={() => { setViewMode('active'); setSelectedLoot(null); }} // Clear selection on view change
          isActive={viewMode === 'active'}
          variant={viewMode === 'active' ? 'solid' : 'outline'}
          colorScheme="brand"
          leftIcon={<Gift/>}
        >
            Available ({unacknowledgedLoot.length})
        </Button>
        <Button
          onClick={() => { setViewMode('history'); setSelectedLoot(null); }} // Clear selection on view change
          isActive={viewMode === 'history'}
          variant={viewMode === 'history' ? 'solid' : 'outline'}
          colorScheme="brand"
          leftIcon={<Package/>}
        >
            History ({acknowledgedLoot.length})
        </Button>
      </HStack>

      {/* Conditional Rendering based on viewMode */}
      {viewMode === 'active' ? (
        // --- Available Loot Boxes ---
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {/* List of Available Loot */}
          <Box>
             <Heading size="md" mb={4} color="gray.200">Open Your Loot</Heading>
             <ScrollArea className="h-[500px] pr-3">
                <VStack spacing={3} align="stretch">
                   {unacknowledgedLoot.length === 0 ? (
                       <Center h="200px" bg="gray.800" borderRadius="md">
                         <Text color="gray.400">No unopened loot boxes.</Text>
                       </Center>
                    ) : (
                       unacknowledgedLoot.map(loot => (
                          <Box
                            key={loot.id}
                            p={4}
                            borderWidth="1px"
                            borderRadius="md"
                            borderColor={selectedLoot?.id === loot.id ? "brand.400" : "amber.600"} // Highlight selected
                            bg="gray.800"
                            _hover={{ borderColor: "amber.500", boxShadow: "md" }}
                            onClick={() => setSelectedLoot(loot)}
                            cursor="pointer"
                            position="relative"
                          >
                             <VStack align="start" spacing={2}>
                                <HStack width="full" justify="space-between">
                                    <HStack><Award className="text-amber-400" /><Text fontWeight="bold" color="gray.100" noOfLines={1}>{loot.packageName}</Text></HStack>
                                    <Badge colorScheme="yellow" variant="solid">New!</Badge>
                                </HStack>
                                <Text fontSize="sm" color="amber.300" fontStyle="italic">Sponsored by: {loot.sponsor}</Text>
                                <Text fontSize="xs" color="gray.400"><Clock size={12} className="inline mr-1" />{formatDate(loot.distributedAt)}</Text>
                                <HStack spacing={2} width="full" justify="space-between" mt={2}>
                                    <Badge colorScheme="brand">{loot.items.length} {loot.items.length === 1 ? 'Item Type' : 'Item Types'}</Badge>
                                    <Button
                                        size="sm"
                                        colorScheme="amber"
                                        onClick={(e) => { e.stopPropagation(); handleAcknowledgeLoot(loot.id); }}
                                        isLoading={isAcknowledging && processingLootId === loot.id}
                                        loadingText="Opening..."
                                        isDisabled={isAcknowledging} // Disable while any box is opening
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

          {/* Selected Loot Box Details (Active View) */}
          <Box>
              <Heading size="md" mb={4} color="gray.200">Box Contents</Heading>
              {selectedLoot && !selectedLoot.acknowledged ? (
                <Box p={4} borderWidth="1px" borderRadius="md" borderColor="gray.700" bg="gray.850" h="500px">
                   <ScrollArea className="h-full pr-3">
                       <VStack align="stretch" spacing={4}>
                          <HStack><Award className="text-amber-400" size={24} /><Heading size="lg" color="gray.100">{selectedLoot.packageName}</Heading></HStack>
                          <HStack justify="space-between">
                              <Text fontSize="md" color="amber.300" fontStyle="italic">Sponsored by: {selectedLoot.sponsor}</Text>
                              <Text fontSize="sm" color="gray.400"><Clock size={12} className="inline mr-1" />Received: {formatDate(selectedLoot.distributedAt)}</Text>
                           </HStack>
                          <Divider borderColor="gray.600" />
                          <Box><Text fontWeight="bold" mb={2} color="gray.300"><ShoppingBag className="inline mr-2" size={16} />Items Inside:</Text>
                             <VStack spacing={2} align="stretch">
                                {selectedLoot.items.length === 0 ? (
                                    <Text color="gray.500">This box appears empty.</Text>
                                ) : (
                                    selectedLoot.items.map((item, index) => (
                                       <Box key={item.id || `${selectedLoot.id}-item-${index}`} p={3} borderWidth="1px" borderRadius="md" borderColor="gray.700" bg="gray.750">
                                          <Flex justify="space-between" align="center">
                                              <VStack align="start" spacing={1} flex="1" mr={2}>
                                                  <Text fontWeight="bold" color="gray.100" noOfLines={1}>{item.name}</Text>
                                                  <HStack wrap="wrap">
                                                      <Badge variant="outline" colorScheme="gray">{item.itemType}</Badge>
                                                      <Badge colorScheme={getRarityColor(item.rarity)}>{item.rarity}</Badge>
                                                      {item.quantity > 1 && (<Badge colorScheme="blue" variant="solid">x{item.quantity}</Badge>)}
                                                   </HStack>
                                                  {item.description && <Text fontSize="xs" color="gray.300" noOfLines={2}>{item.description}</Text>}
                                              </VStack>
                                          </Flex>
                                       </Box>
                                    ))
                                )}
                             </VStack>
                          </Box>
                          <Button
                            mt={4}
                            colorScheme="amber"
                            onClick={() => handleAcknowledgeLoot(selectedLoot.id)}
                            leftIcon={<Gift size={16} />}
                            isLoading={isAcknowledging && processingLootId === selectedLoot.id}
                            loadingText="Opening..."
                            isDisabled={isAcknowledging} // Disable while any box is opening
                            width="full"
                           >
                            Open This Loot Box
                           </Button>
                       </VStack>
                   </ScrollArea>
                </Box>
              ) : (
                <Center h="500px" borderWidth="1px" borderRadius="md" borderColor="gray.700" bg="gray.850">
                  <VStack>
                      <Gift size={48} className="text-amber-400 opacity-50" />
                      <Text color="gray.500">Select an available loot box to see its contents.</Text>
                  </VStack>
                </Center>
              )}
          </Box>
        </SimpleGrid>
      ) : (
        // --- History View ---
        <Box>
          <Heading size="md" mb={4} color="gray.200"><Package className="inline mr-2" />Loot Box History</Heading>
          {acknowledgedLoot.length === 0 ? (
             <Center h="200px" bg="gray.800" borderRadius="md">
                 <Text color="gray.400">No opened loot box history yet.</Text>
            </Center>
           ) : (
             <ScrollArea className="h-[600px]">
                <Box bg="gray.850" borderRadius="md" borderWidth="1px" borderColor="gray.700">
                   <Table variant="simple" size="sm">
                      <Thead bg="gray.700">
                          <Tr>
                              <Th color="gray.300">Loot Box</Th>
                              <Th color="gray.300">Sponsor</Th>
                              <Th color="gray.300" isNumeric>Item Types</Th>
                              {/* <Th color="gray.300">Received</Th> */}
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
                                bg={selectedLoot?.id === loot.id ? "gray.750" : "transparent"} // Highlight selected row
                            >
                               <Td><HStack><Award size={14} className={loot.sponsor ? "text-amber-400" : "text-gray-500"} /><Text color="gray.100" fontWeight="medium">{loot.packageName}</Text></HStack></Td>
                               <Td><Text color="amber.300" fontSize="xs">{loot.sponsor || 'Unknown'}</Text></Td>
                               <Td isNumeric><Badge colorScheme="brand">{loot.items.length}</Badge></Td>
                               {/* <Td><Text color="gray.400" fontSize="xs">{formatDate(loot.distributedAt)}</Text></Td> */}
                               <Td>
                                   <Badge colorScheme="green" variant="subtle" fontSize="xs">
                                      <HStack spacing={1}>
                                          <UserCheck size={12}/>
                                          <span>{formatDate(loot.acknowledgedAt)}</span>
                                      </HStack>
                                    </Badge>
                                </Td>
                            </Tr>
                         ))}
                      </Tbody>
                   </Table>
                </Box>
             </ScrollArea>
           )}

           {/* Detail View for History */}
           {selectedLoot && viewMode === 'history' && selectedLoot.acknowledged && (
                <Box p={4} mt={4} borderWidth="1px" borderRadius="md" borderColor="gray.700" bg="gray.850">
                   <VStack align="stretch" spacing={4}>
                      <HStack justify="space-between">
                         <HStack><Award className={selectedLoot.sponsor ? "text-amber-400" : "text-gray-500"} size={24} /><Heading size="lg" color="gray.100">{selectedLoot.packageName}</Heading></HStack>
                         <Badge colorScheme="green" variant="solid"><HStack><UserCheck size={14}/><span>Opened</span></HStack></Badge>
                      </HStack>
                      <HStack justify="space-between">
                          <Text fontSize="md" color="amber.300" fontStyle="italic">Sponsored by: {selectedLoot.sponsor || 'Unknown'}</Text>
                          <Text fontSize="sm" color="gray.400"><Clock size={12} className="inline mr-1" />Opened: {formatDate(selectedLoot.acknowledgedAt)}</Text>
                      </HStack>
                      <Divider borderColor="gray.600" />
                      <Box><Text fontWeight="bold" mb={2} color="gray.300"><ShoppingBag className="inline mr-2" size={16} />Items Received:</Text>
                         <ScrollArea className="max-h-[300px] pr-3">
                             <VStack spacing={2} align="stretch">
                                 {selectedLoot.items.length === 0 ? (
                                      <Text color="gray.500">This box was empty.</Text>
                                  ) : (
                                      selectedLoot.items.map((item, index) => (
                                         <Box key={item.id || `${selectedLoot.id}-hist-item-${index}`} p={3} borderWidth="1px" borderRadius="md" borderColor="gray.700" bg="gray.750">
                                            <Flex justify="space-between" align="center">
                                               <VStack align="start" spacing={1} flex="1" mr={2}>
                                                   <Text fontWeight="bold" color="gray.100" noOfLines={1}>{item.name}</Text>
                                                   <HStack wrap="wrap">
                                                       <Badge variant="outline" colorScheme="gray">{item.itemType}</Badge>
                                                       <Badge colorScheme={getRarityColor(item.rarity)}>{item.rarity}</Badge>
                                                       {item.quantity > 1 && (<Badge colorScheme="blue" variant="solid">x{item.quantity}</Badge>)}
                                                    </HStack>
                                                   {item.description && <Text fontSize="xs" color="gray.300" noOfLines={2}>{item.description}</Text>}
                                               </VStack>
                                            </Flex>
                                         </Box>
                                      ))
                                  )}
                             </VStack>
                         </ScrollArea>
                      </Box>
                   </VStack>
                </Box>
           )}
           {viewMode === 'history' && !selectedLoot && acknowledgedLoot.length > 0 && (
                <Center h="100px" mt={4} borderWidth="1px" borderRadius="md" borderColor="gray.700" bg="gray.850">
                  <VStack>
                      <Package size={32} className="text-gray-600" />
                      <Text color="gray.500">Select a row from the history table to view details.</Text>
                  </VStack>
                </Center>
           )}
        </Box>
      )}
    </Box>
  );
};

export default PlayerLoot;
// --- END OF FILE PlayerLoot.tsx ---