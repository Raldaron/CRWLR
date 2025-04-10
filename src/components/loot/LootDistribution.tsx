// components/loot/LootDistribution.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Input,
    Select,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Checkbox,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    useDisclosure,
    Spinner,
    Alert,
    AlertIcon,
    Badge,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    SimpleGrid,
    useToast,
    IconButton,
    Center
} from '@chakra-ui/react';
import {
    Plus,
    Search,
    Package,
    Send,
    Users,
    BookOpen,
    Trash,
    ShoppingBag,
    RefreshCw
} from 'lucide-react';
import { collection, addDoc, getDocs, query, where, getDoc, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import debounce from 'lodash/debounce';

/* -------------------------------------------------
   Interfaces
------------------------------------------------- */
interface LootPackage {
    id?: string;
    name: string;
    description: string;
    createdBy: string;
    createdAt: number;
    items: LootItem[];
    sponsor?: string;
}

interface LootItem {
    id: string;
    name: string;
    description: string;
    itemType: string;
    rarity: string;
    quantity: number;
    [key: string]: any;
}

interface Character {
    id: string;
    characterName: string;
    userId: string;
}

interface Player {
    id: string;
    displayName: string;
    email: string;
    characters: Character[];
}

// List of possible sponsors
const SPONSORS = [
    "Open Intellect Pacifist Action Network",
    "The Apothecary",
    "The Plenty",
    "Hank's Crab Ranch",
    "Dictum Waystation Controls ltd.",
    "The Valtay Corporation",
    "The Prism Kingdom",
    "Princess Formidable - The Skull Empire",
    "The Society for The Eradication of Koalas"
];

// Get a random sponsor or use the selected one
const getRandomSponsor = (selectedSponsor?: string): string => {
    if (selectedSponsor) return selectedSponsor;
    return SPONSORS[Math.floor(Math.random() * SPONSORS.length)];
};

/* -------------------------------------------------
   ItemSelect Component
------------------------------------------------- */
const ItemSelect: React.FC<{ onAddItem: (item: LootItem) => void }> = ({ onAddItem }) => {
    const [items, setItems] = useState<LootItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterRarity, setFilterRarity] = useState('');

    useEffect(() => {
        const loadItems = async () => {
            setIsLoading(true);
            try {
                const fileTypes = [
                    'weapons',
                    'armor',
                    'ammunition',
                    'potions',
                    'scrolls',
                    'crafting_components',
                    'traps',
                    'explosives'
                ];
                const allItems: LootItem[] = [];
                for (const fileType of fileTypes) {
                    try {
                        const response = await fetch(`/data/${fileType}.json`);
                        if (!response.ok) continue;
                        const data = await response.json();
                        let typeItems: any[] = [];
                        if (data[fileType]) {
                            typeItems = Object.values(data[fileType]);
                        } else if (data[fileType.slice(0, -1)]) {
                            typeItems = Object.values(data[fileType.slice(0, -1)]);
                        } else {
                            typeItems = Object.values(data);
                        }
                        typeItems.forEach((item: any) => {
                            if (!item) return;
                            const itemType = item.itemType || fileType.slice(0, -1);
                            allItems.push({
                                id: item.id || `${fileType}-${Math.random().toString(36).substring(2, 9)}`,
                                name: item.name || 'Unknown Item',
                                description: item.description || '',
                                itemType: itemType.charAt(0).toUpperCase() + itemType.slice(1),
                                rarity: item.rarity || 'Common',
                                quantity: 1,
                                ...item
                            });
                        });
                    } catch (error) {
                        console.error(`Error loading ${fileType}:`, error);
                    }
                }
                setItems(allItems);
            } catch (error) {
                console.error('Error loading items:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadItems();
    }, []);

    const itemTypes = Array.from(new Set(items.map(item => item.itemType)));
    const rarities = Array.from(new Set(items.map(item => item.rarity)));

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType ? item.itemType === filterType : true;
        const matchesRarity = filterRarity ? item.rarity === filterRarity : true;
        return matchesSearch && matchesType && matchesRarity;
    });

    const getRarityColor = (rarity: string) => {
        switch (rarity.toLowerCase()) {
            case 'common': return 'gray';
            case 'uncommon': return 'green';
            case 'rare': return 'blue';
            case 'epic': return 'purple';
            case 'legendary': return 'orange';
            case 'unique': return 'yellow';
            case 'very rare': return 'red';
            default: return 'gray';
        }
    };

    if (isLoading) {
        return (
            <Box textAlign="center" py={8}>
                <Spinner size="xl" color="brand.400" />
                <Text mt={4} color="gray.400">Loading items catalog...</Text>
            </Box>
        );
    }

    return (
        <Box>
            <VStack spacing={4} mb={4}>
                <HStack width="full">
                    <Input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        bg="gray.700"
                        borderColor="gray.600"
                    />
                    <Search size={20} color="gray.300" />
                </HStack>
                <HStack width="full">
                    <Select
                        placeholder="All Item Types"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        bg="gray.700"
                        borderColor="gray.600"
                    >
                        {itemTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </Select>
                    <Select
                        placeholder="All Rarities"
                        value={filterRarity}
                        onChange={(e) => setFilterRarity(e.target.value)}
                        bg="gray.700"
                        borderColor="gray.600"
                    >
                        {rarities.map(rarity => (
                            <option key={rarity} value={rarity}>{rarity}</option>
                        ))}
                    </Select>
                </HStack>
            </VStack>
            <ScrollArea className="h-[400px]">
                <SimpleGrid columns={[1, 2, 3]} spacing={4}>
                    {filteredItems.map(item => (
                        <Box
                            key={item.id}
                            p={3}
                            borderWidth="1px"
                            borderRadius="md"
                            borderColor="gray.700"
                            bg="gray.800"
                            _hover={{ borderColor: 'brand.500', cursor: 'pointer' }}
                            onClick={() => onAddItem({ ...item, quantity: 1 })}
                        >
                            <VStack align="start" spacing={1}>
                                <Text fontWeight="bold" color="gray.200">{item.name}</Text>
                                <HStack>
                                    <Badge>{item.itemType}</Badge>
                                    <Badge colorScheme={getRarityColor(item.rarity)}>{item.rarity}</Badge>
                                </HStack>
                                <Text fontSize="sm" color="gray.400" noOfLines={2}>{item.description}</Text>
                            </VStack>
                        </Box>
                    ))}
                    {filteredItems.length === 0 && (
                        <Box gridColumn="span 3" textAlign="center" py={4}>
                            <Text color="gray.400">No items found matching your filters</Text>
                        </Box>
                    )}
                </SimpleGrid>
            </ScrollArea>
        </Box>
    );
};

/* -------------------------------------------------
   LootPackageList Component
------------------------------------------------- */
const LootPackageList: React.FC<{
    packages: LootPackage[];
    onSelectPackage: (pkg: LootPackage) => void;
    onDeletePackage: (id: string) => void;
}> = ({ packages, onSelectPackage, onDeletePackage }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPackages = packages.filter(pkg =>
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box>
            <HStack mb={4}>
                <Input
                    placeholder="Search loot boxes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    bg="gray.700"
                    borderColor="gray.600"
                />
                <Search size={20} color="gray.300" />
            </HStack>
            <ScrollArea className="h-[500px]">
                <VStack spacing={3} align="stretch">
                    {filteredPackages.length === 0 ? (
                        <Box textAlign="center" py={8}>
                            <Text color="gray.400">No loot boxes found</Text>
                            <Text fontSize="sm" color="gray.500" mt={2}>Create a new loot box to get started</Text>
                        </Box>
                    ) : (
                        filteredPackages.map(pkg => (
                            <Box
                                key={pkg.id}
                                p={4}
                                borderWidth="1px"
                                borderRadius="md"
                                borderColor="gray.700"
                                bg="gray.800"
                                _hover={{ borderColor: 'brand.500' }}
                                position="relative"
                                cursor="pointer"
                                onClick={() => onSelectPackage(pkg)}
                            >
                                <HStack spacing={4}>
                                    <Package size={24} className="text-brand-400" />
                                    <VStack align="start" spacing={0}>
                                        <Text fontWeight="bold" color="gray.200">{pkg.name}</Text>
                                        <Text fontSize="sm" color="gray.400" noOfLines={1}>{pkg.description}</Text>
                                        <HStack mt={1}>
                                            <Badge colorScheme="brand">{pkg.items.length} items</Badge>
                                            <Text fontSize="xs" color="gray.500">
                                                Created {new Date(pkg.createdAt).toLocaleDateString()}
                                            </Text>
                                        </HStack>
                                    </VStack>
                                </HStack>
                                <Button
                                    position="absolute"
                                    top={2}
                                    right={2}
                                    size="xs"
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (pkg.id) onDeletePackage(pkg.id);
                                    }}
                                >
                                    <Trash size={16} />
                                </Button>
                            </Box>
                        ))
                    )}
                </VStack>
            </ScrollArea>
        </Box>
    );
};

/* -------------------------------------------------
   Main LootDistribution Component
------------------------------------------------- */
const LootDistribution: React.FC = () => {
    const { currentUser } = useAuth();
    const toast = useToast();
    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
    const { isOpen: isDistributeOpen, onOpen: onDistributeOpen, onClose: onDistributeClose } = useDisclosure();
  
    const [selectedSponsor, setSelectedSponsor] = useState<string>("");  
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
    const [lootPackages, setLootPackages] = useState<LootPackage[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<LootPackage | null>(null);
  
    // Package creation states
    const [newPackageName, setNewPackageName] = useState('');
    const [newPackageDescription, setNewPackageDescription] = useState('');
    const [newPackageItems, setNewPackageItems] = useState<LootItem[]>([]);
  
    // Loading and submission states
    const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
    const [isLoadingPackages, setIsLoadingPackages] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    // Optimize input handling
    const handlePackageNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Immediately update state with minimal work
      const value = e.target.value;
      
      // Optionally, add a simple validation if needed
      // but keep it extremely lightweight
      if (value.length <= 100) {  // Optional: limit name length
        setNewPackageName(value);
      }
    };

    /* Load players (with their characters) */
    const loadPlayers = async () => {
        if (!currentUser) return;
        setIsLoadingPlayers(true);
        try {
            const usersCollection = collection(db, 'users');
            const usersSnapshot = await getDocs(usersCollection);
            const playersList: Player[] = [];
            for (const userDoc of usersSnapshot.docs) {
                if (userDoc.id === currentUser.uid) continue; // Skip current user (DM)
                const userData = userDoc.data();
                const charactersQuery = query(
                    collection(db, 'characters'),
                    where('userId', '==', userDoc.id),
                    limit(5)
                );
                const charactersSnapshot = await getDocs(charactersQuery);
                const characters: Character[] = charactersSnapshot.docs.map(charDoc => ({
                    id: charDoc.id,
                    characterName: charDoc.data().characterName || 'Unnamed Character',
                    userId: userDoc.id
                }));
                playersList.push({
                    id: userDoc.id,
                    displayName: userData.displayName || userData.email || 'Unknown Player',
                    email: userData.email || '',
                    characters
                });
            }
            setPlayers(playersList);
        } catch (error) {
            console.error('Error loading players:', error);
            toast({
                title: 'Error',
                description: 'Failed to load players',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoadingPlayers(false);
        }
    };

    /* Load loot packages created by the current user */
    const loadLootPackages = async () => {
        if (!currentUser) return;
        setIsLoadingPackages(true);
        try {
            const packagesCollection = collection(db, 'lootPackages');
            const q = query(packagesCollection, where('createdBy', '==', currentUser.uid));
            const packagesSnapshot = await getDocs(q);
            const packagesList: LootPackage[] = [];
            packagesSnapshot.forEach(docSnap => {
                const packageData = docSnap.data() as LootPackage;
                packagesList.push({
                    ...packageData,
                    id: docSnap.id
                });
            });
            packagesList.sort((a, b) => b.createdAt - a.createdAt);
            setLootPackages(packagesList);
        } catch (error) {
            console.error('Error loading loot packages:', error);
            toast({
                title: 'Error',
                description: 'Failed to load loot packages',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoadingPackages(false);
        }
    };

    useEffect(() => {
        loadPlayers();
        loadLootPackages();
    }, [currentUser]);

    /* Toggle selection of a character */
    const handleSelectCharacter = (characterId: string) => {
        if (selectedCharacters.includes(characterId)) {
            setSelectedCharacters(selectedCharacters.filter(id => id !== characterId));
        } else {
            setSelectedCharacters([...selectedCharacters, characterId]);
        }
    };

    /* Distribute loot package to selected characters */
    const handleDistributeLoot = async () => {
        if (!currentUser || !selectedPackage) return;
        if (selectedCharacters.length === 0) {
            toast({
                title: 'Error',
                description: 'Please select at least one character',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        setIsSubmitting(true);
        try {
            for (const characterId of selectedCharacters) {
                const characterRef = doc(db, 'characters', characterId);
                const characterSnap = await getDoc(characterRef);
                if (!characterSnap.exists()) continue;
                const characterData = characterSnap.data();

                // Record loot distribution with sponsor information
                await addDoc(collection(db, 'lootDistributions'), {
                    packageId: selectedPackage.id,
                    packageName: selectedPackage.name,
                    characterId: characterId,
                    recipientId: characterData.userId,
                    distributedBy: currentUser.uid,
                    distributedAt: Date.now(),
                    items: selectedPackage.items,
                    acknowledged: false,
                    sponsor: selectedPackage.sponsor || getRandomSponsor()
                });
            }

            toast({
                title: 'Loot Boxes Sent',
                description: `Loot boxes have been sent to ${selectedCharacters.length} characters`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            setSelectedCharacters([]);
            onDistributeClose();
        } catch (error) {
            console.error('Error distributing loot:', error);
            toast({
                title: 'Error',
                description: `Failed to distribute loot boxes: ${error instanceof Error ? error.message : 'Unknown error'}`,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    /* Add, remove, and update items in the new package */
    const handleAddItem = (item: LootItem) => {
        const existingItemIndex = newPackageItems.findIndex(i => i.id === item.id);
        if (existingItemIndex >= 0) {
            const updatedItems = [...newPackageItems];
            updatedItems[existingItemIndex] = {
                ...updatedItems[existingItemIndex],
                quantity: updatedItems[existingItemIndex].quantity + 1
            };
            setNewPackageItems(updatedItems);
        } else {
            setNewPackageItems([...newPackageItems, item]);
        }
        toast({
            title: 'Item Added',
            description: `Added ${item.name} to the package`,
            status: 'success',
            duration: 2000,
            isClosable: true,
        });
    };

    const handleRemoveItem = (itemId: string) => {
        setNewPackageItems(newPackageItems.filter(item => item.id !== itemId));
    };

    const handleUpdateQuantity = (itemId: string, quantity: number) => {
        const updatedItems = newPackageItems.map(item =>
            item.id === itemId ? { ...item, quantity } : item
        );
        setNewPackageItems(updatedItems);
    };

    /* Create a new loot package */
    const handleCreatePackage = async () => {
        if (!currentUser) return;
        if (!newPackageName.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a loot box name',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        if (newPackageItems.length === 0) {
            toast({
                title: 'Error',
                description: 'Please add at least one item to the loot box',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        setIsSubmitting(true);
        try {
            const newPackage: LootPackage = {
                name: newPackageName,
                description: newPackageDescription,
                createdBy: currentUser.uid,
                createdAt: Date.now(),
                items: newPackageItems,
                sponsor: selectedSponsor || getRandomSponsor()
            };
            const docRef = await addDoc(collection(db, 'lootPackages'), newPackage);
            setLootPackages([
                { ...newPackage, id: docRef.id },
                ...lootPackages
            ]);
            toast({
                title: 'Loot Box Created',
                description: `Loot box "${newPackageName}" has been created`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            setNewPackageName('');
            setNewPackageDescription('');
            setNewPackageItems([]);
            setSelectedSponsor("");
            onCreateClose();
        } catch (error) {
            console.error('Error creating loot package:', error);
            toast({
                title: 'Error',
                description: 'Failed to create loot box',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    /* Delete a loot package (mark as deleted) */
    const handleDeletePackage = async (packageId: string) => {
        if (!currentUser) return;
        if (!window.confirm('Are you sure you want to delete this loot package?')) {
            return;
        }
        try {
            await updateDoc(doc(db, 'lootPackages', packageId), {
                deleted: true,
                deletedAt: Date.now()
            });
            setLootPackages(lootPackages.filter(pkg => pkg.id !== packageId));
            toast({
                title: 'Package Deleted',
                description: 'Loot package has been deleted',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Error deleting loot package:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete loot package',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    /* Select a package for distribution */
    const handleSelectPackage = (pkg: LootPackage) => {
        setSelectedPackage(pkg);
        onDistributeOpen();
    };

    /* Get badge color based on rarity */
    const getRarityColor = (rarity: string) => {
        switch (rarity.toLowerCase()) {
            case 'common': return 'gray';
            case 'uncommon': return 'green';
            case 'rare': return 'blue';
            case 'epic': return 'purple';
            case 'legendary': return 'orange';
            case 'unique': return 'yellow';
            case 'very rare': return 'red';
            default: return 'gray';
        }
    };

    /* PlayerSelect Component (character-based) */
    const PlayerSelect = () => {
        const [searchTerm, setSearchTerm] = useState('');
        const filteredPlayers = useMemo(() => {
            return players.filter(player =>
                player.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                player.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }, [players, searchTerm]);

        return (
            <Box>
                <HStack mb={4}>
                    <Input
                        placeholder="Search players..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        bg="gray.700"
                        borderColor="gray.600"
                    />
                    <Users size={20} color="gray.300" />
                </HStack>
                <ScrollArea className="h-[400px]">
                    <VStack spacing={3} align="stretch">
                        {filteredPlayers.length === 0 ? (
                            <Text color="gray.400" textAlign="center">No players found</Text>
                        ) : (
                            filteredPlayers.map(player => (
                                <Box
                                    key={player.id}
                                    bg="gray.800"
                                    p={3}
                                    borderRadius="md"
                                >
                                    <VStack align="start" spacing={2}>
                                        <Text fontWeight="bold" color="gray.200">
                                            {player.displayName} ({player.email})
                                        </Text>
                                        {player.characters.map(character => (
                                            <HStack key={character.id} width="full" justify="space-between">
                                                <HStack>
                                                    <Checkbox
                                                        isChecked={selectedCharacters.includes(character.id)}
                                                        onChange={() => handleSelectCharacter(character.id)}
                                                        colorScheme="brand"
                                                    />
                                                    <Text color="gray.300">{character.characterName}</Text>
                                                </HStack>
                                                <Badge colorScheme="purple">
                                                    {character.id}
                                                </Badge>
                                            </HStack>
                                        ))}
                                    </VStack>
                                </Box>
                            ))
                        )}
                    </VStack>
                </ScrollArea>
            </Box>
        );
    };

    return (
        <Box p={4}>
            <Tabs index={activeTabIndex} onChange={setActiveTabIndex} colorScheme="brand">
                <TabList>
                    <Tab>Loot Packages</Tab>
                    <Tab>Create Package</Tab>
                </TabList>
                <TabPanels>
                    {/* Loot Packages Tab */}
                    <TabPanel px={0}>
                        <Box mb={4}>
                            <HStack justify="space-between">
                                <Text fontSize="lg" fontWeight="bold" color="gray.200">
                                    Your Loot Packages
                                </Text>
                                <Button
                                    leftIcon={<Plus size={16} />}
                                    colorScheme="brand"
                                    onClick={onCreateOpen}
                                >
                                    Create Package
                                </Button>
                            </HStack>
                        </Box>
                        {isLoadingPackages ? (
                            <Box textAlign="center" py={8}>
                                <Spinner size="xl" color="brand.400" />
                                <Text mt={4} color="gray.400">Loading loot packages...</Text>
                            </Box>
                        ) : (
                            <LootPackageList
                                packages={lootPackages}
                                onSelectPackage={handleSelectPackage}
                                onDeletePackage={handleDeletePackage}
                            />
                        )}
                    </TabPanel>
                    {/* Create Package Tab */}
                    <TabPanel px={0}>
                        {/* Create Package Tab header */}
                        <Box mb={4}>
                            <Text fontSize="lg" fontWeight="bold" color="gray.200">
                                Create New Loot Box
                            </Text>
                        </Box>
                        <VStack spacing={4} align="stretch">
                            <Box>
                                <Text mb={2} color="gray.300">Loot Box Name</Text>
                                <Input
                                    placeholder="Enter loot box name..."
                                    value={newPackageName}
                                    onChange={(e) => setNewPackageName(e.target.value)}
                                    bg="gray.700"
                                    borderColor="gray.600"
                                />
                            </Box>
                            <Box>
                                <Text mb={2} color="gray.300">Description</Text>
                                <Input
                                    placeholder="Enter a description..."
                                    value={newPackageDescription}
                                    onChange={(e) => setNewPackageDescription(e.target.value)}
                                    bg="gray.700"
                                    borderColor="gray.600"
                                />
                            </Box>
                            <Box>
                                <Text mb={2} color="gray.300">Items in Package</Text>
                                <Table variant="simple" size="sm" mb={4}>
                                    <Thead bg="gray.700">
                                        <Tr>
                                            <Th color="gray.300">Item</Th>
                                            <Th color="gray.300">Type</Th>
                                            <Th color="gray.300">Rarity</Th>
                                            <Th color="gray.300" width="100px">Quantity</Th>
                                            <Th width="50px"></Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {newPackageItems.length === 0 ? (
                                            <Tr>
                                                <Td colSpan={5} textAlign="center">
                                                    <Text color="gray.400">No items added yet</Text>
                                                    <Text fontSize="sm" color="gray.500">Add items from the catalog below</Text>
                                                </Td>
                                            </Tr>
                                        ) : (
                                            newPackageItems.map(item => (
                                                <Tr key={item.id} _hover={{ bg: "gray.700" }}>
                                                    <Td>
                                                        <Text color="gray.200">{item.name}</Text>
                                                    </Td>
                                                    <Td>
                                                        <Badge>{item.itemType}</Badge>
                                                    </Td>
                                                    <Td>
                                                        <Badge colorScheme={getRarityColor(item.rarity)}>{item.rarity}</Badge>
                                                    </Td>
                                                    <Td>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={99}
                                                            value={item.quantity}
                                                            onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                            size="xs"
                                                            width="60px"
                                                            bg="gray.700"
                                                            borderColor="gray.600"
                                                        />
                                                    </Td>
                                                    <Td>
                                                        <IconButton
                                                            aria-label="Remove item"
                                                            icon={<Trash size={16} />}
                                                            size="xs"
                                                            colorScheme="red"
                                                            variant="ghost"
                                                            onClick={() => handleRemoveItem(item.id)}
                                                        />
                                                    </Td>
                                                </Tr>
                                            ))
                                        )}
                                    </Tbody>
                                </Table>
                                <Box borderWidth="1px" borderRadius="md" borderColor="gray.700" p={4}>
                                    <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.200">
                                        <ShoppingBag className="inline mr-2" size={18} />
                                        Item Catalog
                                    </Text>
                                    <ItemSelect onAddItem={handleAddItem} />
                                </Box>
                            </Box>
                            <Box mt={4}>
                                <Button
                                    colorScheme="brand"
                                    width="full"
                                    onClick={handleCreatePackage}
                                    isLoading={isSubmitting}
                                    loadingText="Creating..."
                                    leftIcon={<Plus size={16} />}
                                >
                                    Create Loot Box
                                </Button>
                            </Box>
                        </VStack>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* Modal for Create Package (mobile version) */}
            <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="full">
                <ModalOverlay />
                <ModalContent bg="gray.800" minH="100vh">
                    <ModalHeader color="gray.200">Create New Loot Box</ModalHeader>
                    <ModalCloseButton color="gray.400" />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Box>
                                <Text mb={2} color="gray.300">Loot Box Name</Text>
                                <Input
                                    placeholder="Enter loot box name..."
                                    value={newPackageName}
                                    onChange={(e) => setNewPackageName(e.target.value)}
                                    bg="gray.700"
                                    borderColor="gray.600"
                                />
                            </Box>
                            <Box>
                                <Text mb={2} color="gray.300">Description</Text>
                                <Input
                                    placeholder="Enter a description..."
                                    value={newPackageDescription}
                                    onChange={(e) => setNewPackageDescription(e.target.value)}
                                    bg="gray.700"
                                    borderColor="gray.600"
                                />
                            </Box>
                            <Box>
                                <Text mb={2} color="gray.300">Items in Package</Text>
                                <Table variant="simple" size="sm" mb={4}>
                                    <Thead bg="gray.700">
                                        <Tr>
                                            <Th color="gray.300">Item</Th>
                                            <Th color="gray.300" width="80px">Qty</Th>
                                            <Th width="40px"></Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {newPackageItems.length === 0 ? (
                                            <Tr>
                                                <Td colSpan={3} textAlign="center">
                                                    <Text color="gray.400">No items added yet</Text>
                                                </Td>
                                            </Tr>
                                        ) : (
                                            newPackageItems.map(item => (
                                                <Tr key={item.id} _hover={{ bg: "gray.700" }}>
                                                    <Td>
                                                        <Text color="gray.200">{item.name}</Text>
                                                        <Badge colorScheme={getRarityColor(item.rarity)} mr={1}>{item.rarity}</Badge>
                                                        <Badge>{item.itemType}</Badge>
                                                    </Td>
                                                    <Td>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={99}
                                                            value={item.quantity}
                                                            onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                            size="xs"
                                                            width="100%"
                                                            bg="gray.700"
                                                            borderColor="gray.600"
                                                        />
                                                    </Td>
                                                    <Td>
                                                        <IconButton
                                                            aria-label="Remove item"
                                                            icon={<Trash size={16} />}
                                                            size="xs"
                                                            colorScheme="red"
                                                            variant="ghost"
                                                            onClick={() => handleRemoveItem(item.id)}
                                                        />
                                                    </Td>
                                                </Tr>
                                            ))
                                        )}
                                    </Tbody>
                                </Table>
                                <Box borderWidth="1px" borderRadius="md" borderColor="gray.700" p={4}>
                                    <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.200">
                                        <ShoppingBag className="inline mr-2" size={18} />
                                        Item Catalog
                                    </Text>
                                    <ItemSelect onAddItem={handleAddItem} />
                                </Box>
                            </Box>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="gray" mr={3} onClick={onCreateClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="brand"
                            onClick={handleCreatePackage}
                            isLoading={isSubmitting}
                            loadingText="Creating..."
                        >
                            Create Loot Box
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Modal for Distribute Loot */}
            <Modal isOpen={isDistributeOpen} onClose={onDistributeClose} size="lg">
                <ModalOverlay />
                <ModalContent bg="gray.800">
                    <ModalHeader color="gray.200">
                        Distribute Loot Box: {selectedPackage?.name}
                    </ModalHeader>
                    <ModalCloseButton color="gray.400" />
                    {/* Distribution confirmation alert */}
                    <Alert status="info" mb={4} bg="blue.900" color="white">
                        <AlertIcon color="blue.200" />
                        <Text>You are in DM mode. Use this interface to distribute loot boxes to your players.</Text>
                    </Alert>
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <Box>
                                <Text fontWeight="bold" mb={2} color="gray.300">Package Contents</Text>
                                <Table variant="simple" size="sm" mb={4}>
                                    <Thead bg="gray.700">
                                        <Tr>
                                            <Th color="gray.300">Item</Th>
                                            <Th color="gray.300">Type</Th>
                                            <Th color="gray.300">Rarity</Th>
                                            <Th color="gray.300" width="80px">Qty</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {selectedPackage?.items.map(item => (
                                            <Tr key={item.id} _hover={{ bg: "gray.700" }}>
                                                <Td><Text color="gray.200">{item.name}</Text></Td>
                                                <Td><Badge>{item.itemType}</Badge></Td>
                                                <Td><Badge colorScheme={getRarityColor(item.rarity)}>{item.rarity}</Badge></Td>
                                                <Td><Text color="gray.200">{item.quantity}</Text></Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </Box>
                            <Box>
                                <Text fontWeight="bold" mb={2} color="gray.300">
                                    Select Players to Receive Loot
                                </Text>
                                {isLoadingPlayers ? (
                                    <Center py={4}>
                                        <Spinner size="md" color="brand.400" />
                                    </Center>
                                ) : (
                                    <>
                                        {players.length === 0 ? (
                                            <Alert status="warning" bg="gray.700" color="gray.200">
                                                <AlertIcon color="amber.400" />
                                                No players found. Make sure your players have accounts.
                                            </Alert>
                                        ) : (
                                            <Box>
                                                <PlayerSelect />
                                                <Box mt={4}>
                                                    <Text color="gray.300">
                                                        {selectedCharacters.length} character(s) selected
                                                    </Text>
                                                </Box>
                                            </Box>
                                        )}
                                    </>
                                )}
                            </Box>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="gray" mr={3} onClick={onDistributeClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="brand"
                            onClick={handleDistributeLoot}
                            isLoading={isSubmitting}
                            loadingText="Distributing..."
                            leftIcon={<Send size={16} />}
                            isDisabled={selectedCharacters.length === 0}
                        >
                            Send Loot
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default LootDistribution;
