// src/components/admin/loot/DMCopyInventoryTool.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
    Button, Select, Input, VStack, HStack, Text, Spinner, useToast, Center,
    FormControl, FormLabel, Alert, AlertIcon, Box, Badge, Table, Thead, Tbody, Tr, Th, Td, TableContainer
} from '@chakra-ui/react';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import type { InventoryItem, InventoryItemWithQuantity } from '@/types/inventory'; // Use correct inventory types
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming ScrollArea exists

// Simplified Player/Character interfaces for selection
interface Player {
    id: string; // User ID
    displayName: string;
}

interface CharacterStub {
    id: string; // Character ID
    characterName: string;
    userId: string; // Link back to player
}

interface LootItem { // Define structure for items within the loot package
    id: string;
    name: string;
    description?: string;
    itemType: string;
    rarity: string;
    quantity: number; // Crucial: Ensure quantity is stored
    // Include other relevant base item properties you want in the loot package
    // e.g., damageAmount, armorRating, effect... but avoid overly complex objects if not needed.
    // You might want to store the original collectionName and itemId for reference.
    _originalItemId?: string;
    _originalCollection?: string;
}

interface DMCopyInventoryToolProps {
    isOpen: boolean;
    onClose: () => void;
    onLootBoxCreated: () => void; // Callback to refresh the package list in the parent
}

// --- Helper Function: Sanitize data for Firestore ---
const sanitizeForFirestore = (data: any): any => {
    if (data === undefined) {
        return null; // Convert top-level undefined to null
    }
    if (data === null || typeof data !== 'object' || data instanceof Timestamp || data instanceof Date || typeof data === 'function') {
         // Keep null, primitives, Timestamps, Dates, and functions as they are (though functions won't be stored)
        return data;
    }
    if (Array.isArray(data)) {
        // Recursively sanitize array elements and filter out any resulting undefined/null if necessary
        return data.map(item => sanitizeForFirestore(item));
         // If you want to completely remove nulls from arrays: .filter(item => item !== null);
    }

    // Recursively sanitize object properties
    const sanitizedObject: { [key: string]: any } = {};
    for (const key in data) {
        // Ensure we only process own properties and skip potential problematic ones
        if (Object.prototype.hasOwnProperty.call(data, key) && !key.startsWith('_') && key !== '$$typeof') {
            const value = data[key];
            if (value !== undefined) { // Only include defined properties
                 sanitizedObject[key] = sanitizeForFirestore(value);
            } else {
                 sanitizedObject[key] = null; // Explicitly set undefined to null
            }
        }
    }
    return sanitizedObject;
};
// --- End Helper Function ---

const DMCopyInventoryTool: React.FC<DMCopyInventoryToolProps> = ({ isOpen, onClose, onLootBoxCreated }) => {
    const { currentUser } = useAuth();
    const toast = useToast();

    const [players, setPlayers] = useState<Player[]>([]);
    const [characters, setCharacters] = useState<CharacterStub[]>([]);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
    const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
    const [characterInventory, setCharacterInventory] = useState<InventoryItemWithQuantity[]>([]); // State to hold fetched inventory
    const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
    const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
    const [isLoadingInventory, setIsLoadingInventory] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newPackageName, setNewPackageName] = useState('');

    // Fetch players
    useEffect(() => {
        if (!isOpen) return; // Only fetch when modal is open
        const fetchPlayers = async () => {
            setIsLoadingPlayers(true);
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const playerList = usersSnapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    displayName: docSnap.data().displayName || docSnap.data().email || 'Unknown Player',
                })).sort((a, b) => a.displayName.localeCompare(b.displayName));
                setPlayers(playerList);
            } catch (error) {
                toast({ title: 'Error loading players', status: 'error' });
                console.error("Error loading players:", error);
            } finally {
                setIsLoadingPlayers(false);
            }
        };
        fetchPlayers();
    }, [isOpen, toast]);

    // Fetch characters when player is selected
    useEffect(() => {
        if (!selectedPlayerId || !isOpen) {
            setCharacters([]);
            setSelectedCharacterId(''); // Reset character selection
            setCharacterInventory([]); // Reset inventory view
            return;
        }
        const fetchCharacters = async () => {
            setIsLoadingCharacters(true);
            setCharacterInventory([]); // Clear old inventory
            try {
                const q = query(collection(db, 'characters'), where('userId', '==', selectedPlayerId));
                const snapshot = await getDocs(q);
                const charList = snapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    characterName: docSnap.data().characterName || 'Unnamed Character',
                    userId: docSnap.data().userId,
                })).sort((a, b) => a.characterName.localeCompare(b.characterName));
                setCharacters(charList);
                if (charList.length > 0) {
                    // Optionally pre-select the first character or leave blank
                    // setSelectedCharacterId(charList[0].id);
                } else {
                     setSelectedCharacterId('');
                }
            } catch (error) {
                toast({ title: 'Error loading characters', status: 'error' });
                console.error("Error loading characters:", error);
            } finally {
                setIsLoadingCharacters(false);
            }
        };
        fetchCharacters();
    }, [selectedPlayerId, isOpen, toast]);

     // Fetch inventory when character is selected
     useEffect(() => {
        if (!selectedCharacterId || !isOpen) {
            setCharacterInventory([]);
            return;
        }
        const fetchInventory = async () => {
            setIsLoadingInventory(true);
            try {
                const charDocRef = doc(db, 'characters', selectedCharacterId);
                const charSnap = await getDoc(charDocRef);
                if (charSnap.exists()) {
                    const data = charSnap.data();
                    const rawInventory = Array.isArray(data.inventory) ? data.inventory : [];
                     // Basic validation
                     const validatedInventory = rawInventory.filter(inv => inv && inv.item && inv.item.id && typeof inv.quantity === 'number');
                    setCharacterInventory(validatedInventory);
                } else {
                    setCharacterInventory([]);
                    toast({ title: "Character data not found", status: 'warning' });
                }
            } catch (error) {
                toast({ title: 'Error loading inventory', status: 'error' });
                console.error("Error loading inventory:", error);
                setCharacterInventory([]);
            } finally {
                setIsLoadingInventory(false);
            }
        };
        fetchInventory();
    }, [selectedCharacterId, isOpen, toast]);


    // Handle the creation logic
    const handleCreateLootBoxFromInventory = async () => {
        if (!currentUser || !selectedCharacterId || !newPackageName.trim()) {
            toast({ title: 'Missing Information', description: 'Select player/character and enter a package name.', status: 'warning' });
            return;
        }
        if (characterInventory.length === 0) {
            toast({ title: 'Empty Inventory', description: 'Cannot create loot box from an empty inventory.', status: 'info' });
            return;
        }

        setIsCreating(true);
        try {
            // Transform inventory items to LootItems
            const lootItems: LootItem[] = characterInventory.map(invItem => ({
                id: invItem.item.id,
                name: invItem.item.name || 'Unknown Item', // Provide default
                description: invItem.item.description || '', // Default to empty string instead of undefined
                itemType: invItem.item.itemType || 'Miscellaneous', // Provide default
                rarity: invItem.item.rarity || 'Common', // Provide default
                quantity: invItem.quantity,
                _originalItemId: invItem.item.id,
                _originalCollection: invItem.item._collectionName || 'unknown', // Default if undefined
                // Selectively add other properties ONLY if they exist and are not undefined
                ...(invItem.item.buyValue !== undefined && { buyValue: invItem.item.buyValue }),
                ...(invItem.item.sellValue !== undefined && { sellValue: invItem.item.sellValue }),
                ...(invItem.item.weight !== undefined && { weight: invItem.item.weight }),
                ...(invItem.item.effect !== undefined && { effect: invItem.item.effect }),
                // Add more optional fields here using the same pattern...
            }));

            const character = characters.find(c => c.id === selectedCharacterId);

            const newPackageData = {
                name: newPackageName.trim(),
                description: `Copied from ${character?.characterName || 'character'}'s inventory on ${new Date().toLocaleDateString()}`,
                items: lootItems, // Use the transformed items
                dmId: currentUser!.uid, // Added non-null assertion as we checked above
                dmName: currentUser!.displayName || currentUser!.email, // Added non-null assertion
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
                sponsor: "DM Generated",
            };

            // *** FIX: Sanitize the data before sending to Firestore ***
            const sanitizedPackageData = sanitizeForFirestore(newPackageData);

            // Log the sanitized data for debugging (optional)
            console.log("Sanitized data being sent to Firestore:", JSON.stringify(sanitizedPackageData, null, 2));

            await addDoc(collection(db, 'lootPackages'), sanitizedPackageData); // Use sanitized data

            toast({ title: 'Loot Box Created', description: `Created "${newPackageData.name}" from inventory.`, status: 'success' });
            onLootBoxCreated();
            handleClose();

        } catch (error) {
            toast({ title: 'Error Creating Loot Box', status: 'error', description: error instanceof Error ? error.message : 'Unknown error'});
            console.error("Error creating loot box from inventory:", error);
        } finally {
            setIsCreating(false);
        }
    };

    // Reset state on close
    const handleClose = () => {
        setSelectedPlayerId('');
        setSelectedCharacterId('');
        setCharacterInventory([]);
        setCharacters([]);
        setNewPackageName('');
        setIsCreating(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent bg="gray.800" color="gray.100">
                <ModalHeader borderBottomWidth="1px" borderColor="gray.700">Copy Inventory to New Loot Box</ModalHeader>
                <ModalCloseButton />
                <ModalBody py={4}>
                    <VStack spacing={4} align="stretch">
                        {/* 1. Select Player */}
                        <FormControl isRequired>
                            <FormLabel fontSize="sm">Select Player</FormLabel>
                            <Select
                                placeholder="Choose a player..."
                                value={selectedPlayerId}
                                onChange={(e) => setSelectedPlayerId(e.target.value)}
                                isDisabled={isLoadingPlayers || isCreating}
                                bg="gray.700" borderColor="gray.600" size="sm"
                            >
                                {players.map(p => (
                                    <option key={p.id} value={p.id} style={{ backgroundColor: "#2D3748" }}>
                                        {p.displayName}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        {/* 2. Select Character */}
                        {selectedPlayerId && (
                            <FormControl isRequired>
                                <FormLabel fontSize="sm">Select Character</FormLabel>
                                {isLoadingCharacters ? <Center><Spinner size="sm" /></Center> : (
                                    <Select
                                        placeholder="Choose a character..."
                                        value={selectedCharacterId}
                                        onChange={(e) => setSelectedCharacterId(e.target.value)}
                                        isDisabled={characters.length === 0 || isCreating}
                                        bg="gray.700" borderColor="gray.600" size="sm"
                                    >
                                        {characters.map(c => (
                                            <option key={c.id} value={c.id} style={{ backgroundColor: "#2D3748" }}>
                                                {c.characterName}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                                {selectedPlayerId && !isLoadingCharacters && characters.length === 0 && (
                                     <Text fontSize="xs" color="yellow.400" mt={1}>This player has no characters.</Text>
                                )}
                            </FormControl>
                        )}

                        {/* 3. (Optional) Display Inventory */}
                        {selectedCharacterId && (
                             <Box>
                                <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.300">Character Inventory ({characterInventory.length} items)</Text>
                                {isLoadingInventory ? <Center><Spinner size="md"/></Center> :
                                characterInventory.length === 0 ? <Text fontSize="sm" color="gray.500">Inventory is empty.</Text> :
                                <ScrollArea className="h-[200px] border border-gray.600 rounded-md p-2 bg-gray.750">
                                    <TableContainer>
                                        <Table variant="simple" size="xs">
                                            <Thead>
                                                <Tr><Th px={1} py={0.5} color="gray.400">Item</Th><Th px={1} py={0.5} color="gray.400" isNumeric>Qty</Th></Tr>
                                            </Thead>
                                            <Tbody>
                                                {characterInventory.map(inv => (
                                                    <Tr key={inv.item.id}>
                                                        <Td px={1} py={0.5} color="gray.200" fontSize="xs">{inv.item.name}</Td>
                                                        <Td px={1} py={0.5} color="gray.200" fontSize="xs" isNumeric>{inv.quantity}</Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </TableContainer>
                                </ScrollArea>
                                }
                            </Box>
                        )}

                        {/* 4. New Loot Box Name */}
                        {selectedCharacterId && characterInventory.length > 0 && (
                            <FormControl isRequired>
                                <FormLabel fontSize="sm">New Loot Box Name</FormLabel>
                                <Input
                                    placeholder="Enter name for the new loot box"
                                    value={newPackageName}
                                    onChange={(e) => setNewPackageName(e.target.value)}
                                    isDisabled={isCreating}
                                    bg="gray.700" borderColor="gray.600" size="sm"
                                />
                            </FormControl>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter borderTopWidth="1px" borderColor="gray.700">
                    <Button variant="ghost" mr={3} onClick={handleClose} isDisabled={isCreating}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme="brand"
                        onClick={handleCreateLootBoxFromInventory}
                        isLoading={isCreating}
                        loadingText="Creating..."
                        isDisabled={!selectedCharacterId || characterInventory.length === 0 || !newPackageName.trim()}
                    >
                        Create Loot Box
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default DMCopyInventoryTool;