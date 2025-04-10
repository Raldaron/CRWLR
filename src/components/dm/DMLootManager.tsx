// src/components/dm/DMLootManager.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'; // Added useRef, useCallback
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  SimpleGrid,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  useToast,
  VStack,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  CheckboxGroup,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  InputGroup,
  InputLeftElement,
  Center, // Added Center
  TableContainer, // Added TableContainer
} from '@chakra-ui/react';
import {
  Gift,
  Plus,
  Trash,
  Copy,
  Send,
  Users,
  Calendar,
  Search,
  Package,
  History,
  Wand2,
  AlertTriangle,
  ShoppingCart
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  Timestamp, // Added Timestamp
  deleteDoc, // Added deleteDoc
  orderBy,
  writeBatch, // Added orderBy
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext'; // Assuming auth context exists
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming ScrollArea exists

// Item interfaces
interface LootItem {
  id: string;
  name: string;
  description?: string;
  itemType: string;
  rarity: string;
  quantity: number;
}

// Player interface (simplified)
interface Player {
  id: string; // Character document ID
  userId: string;
  characterName: string;
  characterLevel: number;
  selectedRace?: { name: string } | null;
  selectedClass?: { name: string } | null;
  email?: string;
}

// Loot package interface
interface LootPackage {
  id: string;
  name: string;
  description: string;
  items: LootItem[];
  createdAt: Timestamp; // Changed to Timestamp
  lastUpdated?: Timestamp; // Changed to Timestamp
  dmId: string;
  dmName?: string;
  sponsor?: string;
}

// Loot distribution interface
interface LootDistribution {
    id: string;
    packageId: string;
    packageName: string;
    recipientId: string; // Character ID
    recipientName: string;
    distributedBy: string; // DM User ID
    // --- FIX: Store as number (milliseconds) after fetching ---
    distributedAt: number;
    dmName?: string;
    items: LootItem[];
    acknowledged: boolean;
    sponsor?: string;
  }

  // List of possible sponsors for loot drops
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

  // Item types for categorization
  const ITEM_TYPES = [
    'Weapon',
    'Armor',
    'Ammunition',
    'Potion',
    'Scroll',
    'Crafting Component',
    'Trap',
    'Explosive',
    'Throwable',
    'Miscellaneous'
  ];

  // Rarity options
  const RARITY_OPTIONS = [
    'Common',
    'Uncommon',
    'Rare',
    'Epic',
    'Legendary',
    'Unique',
    'Exceedingly Rare'
  ];

  const DMLootManager: React.FC = () => {
    const { currentUser } = useAuth(); // Get current user from context
    // State for players and items
    const [players, setPlayers] = useState<Player[]>([]);
    const [allItems, setAllItems] = useState<LootItem[]>([]);
    const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
    const [isLoadingItems, setIsLoadingItems] = useState(true);

    // State for loot packages
    const [lootPackages, setLootPackages] = useState<LootPackage[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingPackages, setIsLoadingPackages] = useState(true);

    // State for loot distributions
    const [lootDistributions, setLootDistributions] = useState<LootDistribution[]>([]);
    const [isLoadingDistributions, setIsLoadingDistributions] = useState(true);

    // State for creating new loot package
    const [newPackage, setNewPackage] = useState<{
      name: string;
      description: string;
      sponsor: string;
      items: LootItem[];
    }>({
      name: '',
      description: '',
      sponsor: SPONSORS[0],
      items: []
    });

    // State for modals
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
    const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<LootPackage | null>(null);

    // State for creating custom item
    const [newItem, setNewItem] = useState<Omit<LootItem, 'id'>>({
      name: '',
      description: '',
      itemType: ITEM_TYPES[0],
      rarity: RARITY_OPTIONS[0],
      quantity: 1
    });

    // State for searching and filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [itemSearchTerm, setItemSearchTerm] = useState('');

    // State for selecting players for distribution
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]); // Stores Character IDs

    // Delete confirmation dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [packageToDelete, setPackageToDelete] = useState<string | null>(null);
    const cancelRef = React.useRef<HTMLButtonElement>(null) as React.RefObject<HTMLButtonElement>;

    // Toast for notifications
    const toast = useToast();

    // Active tab state
    const [activeTab, setActiveTab] = useState(0);

    // Helper function to map collection names to item types
     const getItemTypeFromCollection = (collection: string): string => {
       switch (collection) {
         case 'weapons': return 'Weapon';
         case 'armor': return 'Armor';
         case 'ammunition': return 'Ammunition';
         case 'potions': return 'Potion';
         case 'scrolls': return 'Scroll';
         case 'crafting_components': return 'Crafting Component';
         case 'traps': return 'Trap';
         case 'explosives': return 'Explosive'; // Consider base type, specific types might be in data
         case 'miscellaneous_items': return 'Miscellaneous'; // Added for misc
         default: return 'Miscellaneous'; // Default fallback
       }
     };

    // Fetch players and items data
    useEffect(() => {
      const fetchPlayersAndItems = async () => {
        if (!currentUser) {
             setIsLoadingPlayers(false);
             setIsLoadingItems(false);
             return;
         }
        try {
          // Fetch players (Characters associated with any user for selection)
          setIsLoadingPlayers(true);
          const charactersRef = collection(db, 'characters'); // Fetch all characters
          const charactersSnapshot = await getDocs(charactersRef);

          const playersList: Player[] = [];
          charactersSnapshot.forEach((doc) => {
            const data = doc.data();
            playersList.push({
              id: doc.id, // Character ID
              userId: data.userId || '',
              characterName: data.characterName || 'Unnamed Character',
              characterLevel: data.characterLevel || 1,
              selectedRace: data.selectedRace,
              selectedClass: data.selectedClass,
              // email: data.email || 'Unknown' // Email might be on the user doc, not character
            });
          });

          setPlayers(playersList);
          setIsLoadingPlayers(false);

          // Fetch items from various collections (Global Catalog)
          setIsLoadingItems(true);
          const itemCollections = [
            'weapons', 'armor', 'ammunition', 'potions',
            'scrolls', 'crafting_components', 'traps', 'explosives', 'miscellaneous_items' // Added misc
          ];

          const allItemsList: LootItem[] = [];

          for (const collectionName of itemCollections) {
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(collectionRef);

            snapshot.forEach((doc) => {
              const data = doc.data();
              allItemsList.push({
                id: doc.id,
                name: data.name || 'Unknown Item',
                description: data.description || '',
                // Prioritize itemType from data, fallback to collection name mapping
                itemType: data.itemType || getItemTypeFromCollection(collectionName),
                rarity: data.rarity || 'Common',
                quantity: 1 // Default quantity for catalog view
              });
            });
          }
           allItemsList.sort((a, b) => a.name.localeCompare(b.name)); // Sort catalog items
          setAllItems(allItemsList);
          setIsLoadingItems(false);

        } catch (error) {
          console.error('Error fetching data:', error);
          toast({
            title: 'Error',
            description: 'Failed to load players and items',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          setIsLoadingPlayers(false);
          setIsLoadingItems(false);
        }
      };

      fetchPlayersAndItems();
    }, [toast, currentUser]); // Added currentUser dependency

    // Fetch loot packages created by the current DM
    useEffect(() => {
      const fetchLootPackages = async () => {
        if (!currentUser) {
             setIsLoadingPackages(false);
             setLootPackages([]);
             return;
         }
        try {
          setIsLoadingPackages(true);
          const packagesRef = collection(db, 'lootPackages');
          const q = query(packagesRef, where("dmId", "==", currentUser.uid)); // Query by DM ID
          const packagesSnapshot = await getDocs(q);

          const packagesList: LootPackage[] = [];
          packagesSnapshot.forEach((doc) => {
            const data = doc.data();
            packagesList.push({
              id: doc.id,
              name: data.name || 'Unnamed Package',
              description: data.description || '',
              items: data.items || [],
              createdAt: data.createdAt || Timestamp.now(), // Ensure Timestamp
              lastUpdated: data.lastUpdated, // Optional Timestamp
              dmId: data.dmId || '',
              dmName: data.dmName || 'Unknown DM',
              sponsor: data.sponsor || SPONSORS[0]
            });
          });

          // Sort by created date, newest first
           packagesList.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

          setLootPackages(packagesList);
          setIsLoadingPackages(false);
        } catch (error) {
          console.error('Error fetching loot packages:', error);
          toast({
            title: 'Error',
            description: 'Failed to load loot packages',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          setIsLoadingPackages(false);
        }
      };

      fetchLootPackages();
    }, [toast, currentUser]); // Added currentUser dependency

    // Fetch loot distributions sent by the current DM
    useEffect(() => {
      const fetchLootDistributions = async () => {
         if (!currentUser) {
             setIsLoadingDistributions(false);
             setLootDistributions([]);
             return;
         }
        try {
          setIsLoadingDistributions(true);
          const distributionsRef = collection(db, 'lootDistributions');
           const q = query(distributionsRef, where("distributedBy", "==", currentUser.uid), orderBy("distributedAt", "desc")); // Filter by DM ID and Order
          const distributionsSnapshot = await getDocs(q);

          const distributionsList: LootDistribution[] = [];
          distributionsSnapshot.forEach((doc) => {
            const data = doc.data();
            // --- FIX: Convert Timestamp to number here ---
            const distributedAtMillis = data.distributedAt instanceof Timestamp
                                        ? data.distributedAt.toMillis()
                                        : typeof data.distributedAt === 'number' ? data.distributedAt : Date.now();
            distributionsList.push({
              id: doc.id,
              packageId: data.packageId || '',
              packageName: data.packageName || 'Unknown Package',
              recipientId: data.recipientId || '', // Should be Character ID now based on handleDistributeLoot
              recipientName: data.recipientName || 'Unknown Character', // Store character name
              distributedBy: data.distributedBy || '',
              distributedAt: distributedAtMillis, // Store as number
              dmName: data.dmName || 'Unknown DM',
              items: data.items || [],
              acknowledged: data.acknowledged || false,
              sponsor: data.sponsor || SPONSORS[0]
            });
          });

          // --- FIX: Sort by the number directly ---
          distributionsList.sort((a, b) => b.distributedAt - a.distributedAt);

          setLootDistributions(distributionsList);
          setIsLoadingDistributions(false);
        } catch (error) {
          console.error('Error fetching loot distributions:', error);
          toast({
            title: 'Error',
            description: 'Failed to load loot distributions',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          setIsLoadingDistributions(false);
        }
      };

      fetchLootDistributions();
    }, [toast, currentUser]); // Added currentUser dependency

    // Create new loot package
    const handleCreatePackage = async () => {
        if (!currentUser) {
             toast({ title: "Not Logged In", status: "error" }); return;
         }
      try {
        // Validate inputs
        if (!newPackage.name) {
          toast({
            title: 'Name Required',
            description: 'Please give your loot package a name',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        if (newPackage.items.length === 0) {
          toast({
            title: 'Items Required',
            description: 'Add at least one item to your loot package',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        // Get DM info
        const dmId = currentUser.uid;
        const dmName = currentUser.displayName || currentUser.email || 'Dungeon Master';

         // Create loot package in Firestore with server timestamps
         const now = serverTimestamp();
        const packageRef = await addDoc(collection(db, 'lootPackages'), {
          name: newPackage.name,
          description: newPackage.description,
          items: newPackage.items,
          createdAt: now,
          lastUpdated: now,
          dmId: dmId,
          dmName: dmName,
          sponsor: newPackage.sponsor
        });

        // Fetch the created package to get server-generated timestamp for local state
         const newDocSnap = await getDoc(packageRef);
         const newLootPackage = { id: newDocSnap.id, ...newDocSnap.data() } as LootPackage;

        // Add to local state and re-sort
         setLootPackages(prev => [newLootPackage, ...prev].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));


        // Reset form
        setNewPackage({
          name: '',
          description: '',
          sponsor: SPONSORS[0],
          items: []
        });

        toast({
          title: 'Loot Package Created',
          description: `"${newLootPackage.name}" has been created successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        setActiveTab(1); // Switch to packages tab after creation

      } catch (error) {
        console.error('Error creating loot package:', error);
        toast({
          title: 'Error',
          description: 'Failed to create loot package',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    // Add existing item to package
    const handleAddItem = (item: LootItem) => {
        // Check if item already exists in the package being created
         const existingIndex = newPackage.items.findIndex(pkgItem => pkgItem.id === item.id);
         if (existingIndex > -1) {
             // Increment quantity if item exists
             const updatedItems = newPackage.items.map((pkgItem, index) =>
                 index === existingIndex
                     ? { ...pkgItem, quantity: pkgItem.quantity + 1 }
                     : pkgItem
             );
             setNewPackage({ ...newPackage, items: updatedItems });
         } else {
             // Add new item with quantity 1
             setNewPackage({
                 ...newPackage,
                 items: [...newPackage.items, { ...item, quantity: 1 }] // Ensure quantity is set
             });
         }
      setIsAddItemModalOpen(false);
    };

    // Create and add custom item
    const handleCreateItem = () => {
      if (!newItem.name) {
        toast({
          title: 'Name Required',
          description: 'Please enter a name for the item',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Generate a unique ID for the custom item (consider if these should be saved elsewhere)
      const customItem: LootItem = {
        ...newItem,
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      setNewPackage({
        ...newPackage,
        items: [...newPackage.items, customItem]
      });

      // Reset form
      setNewItem({
        name: '',
        description: '',
        itemType: ITEM_TYPES[0],
        rarity: RARITY_OPTIONS[0],
        quantity: 1
      });

      setIsCreateItemModalOpen(false);
    };

    // Remove item from package being created
    const handleRemoveItem = (itemId: string) => {
      setNewPackage({
        ...newPackage,
        items: newPackage.items.filter(item => item.id !== itemId)
      });
    };

     // Update quantity of item in the package being created
     const handleUpdateItemQuantityInForm = (itemId: string, newQuantity: number) => {
         const quantity = isNaN(newQuantity) || newQuantity < 0 ? 0 : newQuantity; // Ensure valid number
         if (quantity <= 0) {
             // Remove item if quantity is 0 or less
             handleRemoveItem(itemId);
         } else {
             setNewPackage(prev => ({
                 ...prev,
                 items: prev.items.map(item =>
                     item.id === itemId ? { ...item, quantity: quantity } : item
                 )
             }));
         }
     };

    // Open distribution modal
    const handleOpenDistributeModal = (pkg: LootPackage) => {
      setSelectedPackage(pkg);
      setSelectedPlayers([]);
      setIsDistributeModalOpen(true);
    };

    // Distribute loot to selected players
    const handleDistributeLoot = async () => {
      if (!selectedPackage || !currentUser) return;

      if (selectedPlayers.length === 0) {
        toast({
          title: 'No Players Selected',
          description: 'Please select at least one player character to receive this loot',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setIsSubmitting(true); // Indicate submission start

      try {
        // Get DM info
        const dmId = currentUser.uid;
        const dmName = currentUser.displayName || currentUser.email || 'Dungeon Master';

        // Create distribution for each selected player character
        const batch = writeBatch(db); // Use a batch for efficiency
        const newDistributionsForState: LootDistribution[] = [];
        const nowMillis = Date.now(); // Approximate timestamp for local state update

        for (const characterId of selectedPlayers) {
          const player = players.find(p => p.id === characterId);
          if (!player) continue;

          // Create distribution document in Firestore
          const distributionRef = doc(collection(db, 'lootDistributions')); // Generate ref first
          const distributionData = {
            packageId: selectedPackage.id,
            packageName: selectedPackage.name,
            recipientId: player.userId, // Use the Player's User ID
            characterId: player.id, // Keep track of the specific Character ID
            recipientName: player.characterName, // Store character name for easy display
            distributedBy: dmId,
            distributedAt: serverTimestamp(), // Use server timestamp
            dmName: dmName,
            items: selectedPackage.items,
            acknowledged: false,
            sponsor: selectedPackage.sponsor || SPONSORS[0] // Use selected or default sponsor
          };
          batch.set(distributionRef, distributionData);

          // Prepare data for immediate local state update (using client time approximation)
           newDistributionsForState.push({
                id: distributionRef.id, // Use the generated ID
                packageId: selectedPackage.id,
                packageName: selectedPackage.name,
                recipientId: player.userId,
                recipientName: player.characterName,
                distributedBy: dmId,
                distributedAt: nowMillis, // Approximate time for UI
                dmName: dmName,
                items: selectedPackage.items,
                acknowledged: false,
                sponsor: selectedPackage.sponsor || SPONSORS[0],
            });
        }

        // Commit the batch write to Firestore
        await batch.commit();

        // Update local state and re-sort
        setLootDistributions(prev =>
          [...newDistributionsForState, ...prev].sort((a, b) => b.distributedAt - a.distributedAt)
        );

        toast({
          title: 'Loot Distributed',
          description: `"${selectedPackage.name}" sent to ${selectedPlayers.length} player(s)`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Close modal and reset selections
        setIsDistributeModalOpen(false);
        setSelectedPlayers([]);
        setSelectedPackage(null); // Deselect package after sending

      } catch (error) {
        console.error('Error distributing loot:', error);
        toast({
          title: 'Error',
          description: `Failed to distribute loot package: ${error instanceof Error ? error.message : 'Unknown error'}`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
         setIsSubmitting(false); // Indicate submission end
      }
    };


    // Handle package deletion
    const handleDeletePackage = async () => {
      if (!packageToDelete) return;

      try {
        // Delete from Firestore
         await deleteDoc(doc(db, 'lootPackages', packageToDelete));

        // For now, just remove from local state
        setLootPackages(lootPackages.filter(pkg => pkg.id !== packageToDelete));

        toast({
          title: 'Package Deleted',
          description: 'Loot package has been deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        setPackageToDelete(null);
        setIsDeleteDialogOpen(false);

      } catch (error) {
        console.error('Error deleting package:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete loot package',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

     // Format date for display (using number)
     const formatDate = (timestamp: number | undefined): string => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            // hour: '2-digit', // Optional: Add time if needed
            // minute: '2-digit',
        });
    };

    // Filter items based on search term
    const filteredItems = allItems.filter(item =>
      item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
      item.itemType.toLowerCase().includes(itemSearchTerm.toLowerCase())
    );

    // Filter packages based on search term
    const filteredPackages = lootPackages.filter(pkg =>
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <Box p={{base: 2, md: 4}}> {/* Responsive Padding */}
        <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="brand" isLazy>
          <TabList borderColor="gray.700">
            <Tab
              _selected={{ color: "brand.400", borderColor: "gray.700 gray.700 gray.800 gray.700" }}
              color="gray.400"
            >
              <HStack spacing={2}>
                <Gift size={16} />
                <Text>Create Loot</Text> {/* Shortened Label */}
              </HStack>
            </Tab>
            <Tab
              _selected={{ color: "brand.400", borderColor: "gray.700 gray.700 gray.800 gray.700" }}
              color="gray.400"
            >
              <HStack spacing={2}>
                <Package size={16} />
                <Text>Packages</Text> {/* Shortened Label */}
              </HStack>
            </Tab>
            <Tab
              _selected={{ color: "brand.400", borderColor: "gray.700 gray.700 gray.800 gray.700" }}
              color="gray.400"
            >
              <HStack spacing={2}>
                <History size={16} />
                <Text>History</Text> {/* Shortened Label */}
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Create Loot Package Tab */}
            <TabPanel p={0} pt={{base: 4, md: 6}}> {/* Responsive Padding */}
               <Grid templateColumns={{ base: "1fr", lg: "1.5fr 1fr" }} gap={{base: 4, md: 6}}> {/* Adjusted ratio and responsive gap */}
                {/* Left side: Form */}
                <Box>
                  <FormControl mb={4}>
                    <FormLabel color="gray.300">Package Name</FormLabel>
                    <Input
                      value={newPackage.name}
                      onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                      placeholder="Enter a name for this loot package"
                      bg="gray.800"
                      borderColor="gray.700"
                    />
                  </FormControl>

                  <FormControl mb={4}>
                    <FormLabel color="gray.300">Description</FormLabel>
                    <Textarea
                      value={newPackage.description}
                      onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                      placeholder="Describe this loot package (visible to players)"
                      bg="gray.800"
                      borderColor="gray.700"
                      rows={3}
                    />
                  </FormControl>

                  <FormControl mb={4}>
                    <FormLabel color="gray.300">Sponsor</FormLabel>
                    <Select
                      value={newPackage.sponsor}
                      onChange={(e) => setNewPackage({ ...newPackage, sponsor: e.target.value })}
                      bg="gray.800"
                      borderColor="gray.700"
                      iconColor="gray.400" // Style dropdown arrow
                    >
                      {SPONSORS.map((sponsor) => (
                        <option key={sponsor} value={sponsor} style={{backgroundColor: "#2D3748"}}>{sponsor}</option> // Darker option background
                      ))}
                    </Select>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      The sponsor will be displayed to players when they receive the loot.
                    </Text>
                  </FormControl>

                   <HStack spacing={{base: 2, md: 4}} mb={6} wrap="wrap"> {/* Responsive spacing and wrap */}
                    <Button
                      onClick={() => setIsAddItemModalOpen(true)}
                      leftIcon={<Plus size={16} />}
                      colorScheme="brand"
                      isDisabled={isLoadingItems}
                      size="sm" // Smaller buttons
                    >
                      Add Item
                    </Button>

                    <Button
                      onClick={() => setIsCreateItemModalOpen(true)}
                      leftIcon={<Wand2 size={16} />}
                      colorScheme="purple"
                       size="sm" // Smaller buttons
                    >
                      Create Custom
                    </Button>
                  </HStack>

                  <Box>
                    <Text fontWeight="medium" mb={2} color="gray.300">Items in this package:</Text>
                    {newPackage.items.length === 0 ? (
                      <Card bg="gray.800" borderColor="gray.700">
                        <CardBody py={8} textAlign="center">
                          <Text color="gray.500">No items added yet</Text>
                          <Text fontSize="sm" color="gray.500" mt={2}>
                            Use the buttons above to add items
                          </Text>
                        </CardBody>
                      </Card>
                    ) : (
                       <ScrollArea className="h-[300px] pr-2"> {/* Fixed height scroll area */}
                        {newPackage.items.map((item, index) => (
                          <Card key={`${item.id}-${index}`} mb={2} bg="gray.750" borderColor="gray.700"> {/* Darker item card */}
                            <CardBody py={2} px={3}> {/* Reduced padding */}
                              <Flex justify="space-between" align="center">
                                <Box flex={1} mr={2}> {/* Allow text to wrap */}
                                  <Text color="gray.200" fontWeight="medium" fontSize="sm">{item.name}</Text>
                                  <HStack spacing={2} mt={1} wrap="wrap"> {/* Wrap badges */}
                                    <Badge colorScheme={getRarityColor(item.rarity)} fontSize="xs">
                                      {item.rarity}
                                    </Badge>
                                    <Badge fontSize="xs">{item.itemType}</Badge>
                                  </HStack>
                                </Box>
                                 <HStack spacing={1}>
                                      <NumberInput
                                         size="xs"
                                         value={item.quantity}
                                         onChange={(_, value) => handleUpdateItemQuantityInForm(item.id, isNaN(value) ? 1 : value)} // Added NaN check
                                         min={1}
                                         max={999} // Adjust max if needed
                                         w="60px" // Fixed width
                                         bg="gray.800"
                                         borderColor="gray.600"
                                      >
                                         <NumberInputField />
                                         <NumberInputStepper>
                                            <NumberIncrementStepper borderColor="gray.600"/>
                                            <NumberDecrementStepper borderColor="gray.600"/>
                                         </NumberInputStepper>
                                      </NumberInput>
                                     <IconButton
                                       aria-label="Remove item"
                                       icon={<Trash size={14} />}
                                       size="xs"
                                       colorScheme="red"
                                       variant="ghost"
                                       onClick={() => handleRemoveItem(item.id)}
                                     />
                                </HStack>
                              </Flex>
                            </CardBody>
                          </Card>
                        ))}
                      </ScrollArea>
                    )}
                  </Box>

                  <Button
                    mt={8}
                    colorScheme="brand"
                     size={{base: "md", md: "lg"}} // Responsive size
                    width="full"
                    onClick={handleCreatePackage}
                    isDisabled={newPackage.items.length === 0 || !newPackage.name}
                  >
                    Create Loot Package
                  </Button>
                </Box>

                {/* Right side: Preview */}
                 <Box display={{base: 'none', lg: 'block'}}> {/* Hide preview on smaller screens */}
                  <Card bg="gray.800" borderColor="gray.700" mb={4} position="sticky" top="20px"> {/* Sticky Preview */}
                    <CardBody>
                      <Heading size="md" mb={2} color="brand.400">Preview</Heading>
                      <Text color="gray.300" fontWeight="bold" fontSize="lg">
                        {newPackage.name || 'Unnamed Package'}
                      </Text>
                      <Text color="gray.400" fontSize="sm" mb={4}>
                        {newPackage.description || 'No description provided'}
                      </Text>

                       <HStack mb={4} wrap="wrap"> {/* Wrap badges */}
                        <Badge colorScheme="purple">
                          Sponsor: {newPackage.sponsor}
                        </Badge>
                        <Badge colorScheme="brand">
                          {newPackage.items.length} items
                        </Badge>
                      </HStack>

                      <Text fontSize="sm" color="gray.500">
                        This is how the package will appear to players.
                      </Text>
                    </CardBody>
                  </Card>

                  <Box bg="gray.800" p={4} borderRadius="md" position="sticky" top="220px"> {/* Adjust top offset */}
                    <Text fontSize="sm" color="gray.300" mb={2}>💡 Tips:</Text>
                    <VStack spacing={1} align="start" fontSize="xs" color="gray.400">
                      <Text>• Mix rarities</Text>
                      <Text>• Customize descriptions</Text>
                      <Text>• Include consumables</Text>
                      <Text>• Consider player level</Text>
                    </VStack>
                  </Box>
                </Box>
              </Grid>
            </TabPanel>

            {/* Loot Packages Tab */}
             <TabPanel p={0} pt={{base: 4, md: 6}}> {/* Responsive Padding */}
               <Flex mb={4} direction={{base: 'column', md: 'row'}} gap={3} justifyContent="space-between" alignItems="center"> {/* Responsive flex direction */}
                 <Text fontSize="lg" color="gray.300" whiteSpace="nowrap"> {/* Prevent wrapping */}
                   {lootPackages.length} Package(s)
                </Text>

                <Input
                  placeholder="Search packages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                   width={{ base: "100%", md: "300px" }}
                  bg="gray.800"
                  borderColor="gray.700"
                   size="sm" // Smaller search input
                />
              </Flex>

              {isLoadingPackages ? (
                 <Center my={8}><Spinner size="xl" color="brand.500" /></Center> // Use Center
              ) : filteredPackages.length === 0 ? (
                <Card bg="gray.800" borderColor="gray.700">
                  <CardBody py={8} textAlign="center">
                    <Gift size={40} className="mx-auto mb-4 text-gray-500" />
                    <Text color="gray.500">No loot packages found</Text>
                    {searchTerm ? (
                      <Text fontSize="sm" color="gray.500" mt={2}>
                        Try a different search term
                      </Text>
                    ) : (
                      <Text fontSize="sm" color="gray.500" mt={2}>
                        Create a loot package to get started
                      </Text>
                    )}
                  </CardBody>
                </Card>
              ) : (
                 <ScrollArea className="h-[calc(100vh - 250px)]"> {/* Add ScrollArea */}
                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }} gap={4}> {/* Responsive grid */}
                    {filteredPackages.map((pkg) => (
                        <Card key={pkg.id} bg="gray.800" borderColor="gray.700" _hover={{ borderColor: "gray.600" }}>
                        <CardBody p={4}> {/* Slightly reduced padding */}
                            <VStack align="start" spacing={3}>
                            <Box width="full">
                                <Flex justify="space-between" align="start" width="full">
                                <Text fontWeight="bold" fontSize="md" color="gray.200"> {/* Slightly smaller heading */}
                                    {pkg.name}
                                </Text>
                                <Badge colorScheme="brand" fontSize="xs"> {/* Smaller badge */}
                                    {pkg.items.length} {pkg.items.length === 1 ? 'item' : 'items'}
                                </Badge>
                                </Flex>
                                <Text fontSize="sm" color="gray.400" noOfLines={2} mt={1}>
                                {pkg.description}
                                </Text>
                            </Box>

                             <Badge colorScheme="purple" fontSize="xs"> {/* Smaller badge */}
                                Sponsored by: {pkg.sponsor}
                            </Badge>

                            <HStack spacing={2} fontSize="xs" color="gray.500">
                                <Calendar size={12} />
                                 <Text>Created: {formatDate(pkg.createdAt instanceof Timestamp ? pkg.createdAt.toMillis() : pkg.createdAt)}</Text> {/* Ensure conversion */}
                            </HStack>

                             <HStack spacing={1} width="full"> {/* Reduced spacing */}
                                <Button
                                leftIcon={<Send size={14} />}
                                size="xs" // Smaller buttons
                                colorScheme="brand"
                                onClick={() => handleOpenDistributeModal(pkg)}
                                flex={1}
                                >
                                Distribute
                                </Button>

                                <IconButton
                                aria-label="Delete package"
                                icon={<Trash size={14} />}
                                size="xs" // Smaller buttons
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => {
                                    setPackageToDelete(pkg.id);
                                    setIsDeleteDialogOpen(true);
                                }}
                                />

                                <IconButton
                                aria-label="Duplicate package"
                                icon={<Copy size={14} />}
                                size="xs" // Smaller buttons
                                colorScheme="blue"
                                variant="ghost"
                                onClick={() => {
                                    // Clone the package
                                    setNewPackage({
                                    name: `Copy of ${pkg.name}`,
                                    description: pkg.description,
                                    sponsor: pkg.sponsor ?? SPONSORS[0],
                                    items: [...pkg.items]
                                    });
                                    setActiveTab(0); // Switch to Create tab

                                    toast({
                                    title: 'Package Duplicated',
                                    description: 'Edit and save the copy as needed',
                                    status: 'info',
                                    duration: 3000,
                                    isClosable: true,
                                    });
                                }}
                                />
                            </HStack>
                            </VStack>
                        </CardBody>
                        </Card>
                    ))}
                    </Grid>
                 </ScrollArea>
              )}
            </TabPanel>

            {/* Distribution History Tab */}
             <TabPanel p={0} pt={{base: 4, md: 6}}> {/* Responsive Padding */}
              <Flex mb={4} justifyContent="space-between" alignItems="center">
                 <Text fontSize={{base: "md", md: "lg"}} color="gray.300"> {/* Responsive font size */}
                   {lootDistributions.length} Distribution(s)
                </Text>
              </Flex>

              {isLoadingDistributions ? (
                 <Center my={8}><Spinner size="xl" color="brand.500" /></Center> // Use Center
              ) : lootDistributions.length === 0 ? (
                <Card bg="gray.800" borderColor="gray.700">
                  <CardBody py={8} textAlign="center">
                    <History size={40} className="mx-auto mb-4 text-gray-500" />
                    <Text color="gray.500">No distribution history</Text>
                    <Text fontSize="sm" color="gray.500" mt={2}>
                      Distribute loot packages to players to see history
                    </Text>
                  </CardBody>
                </Card>
              ) : (
                 <ScrollArea className="h-[calc(100vh - 200px)]"> {/* Added ScrollArea */}
                  <TableContainer>
                    <Table variant="simple" size="sm"> {/* Use size sm */}
                    <Thead bg="gray.800" position="sticky" top={0} zIndex={1}> {/* Sticky header */}
                        <Tr>
                        <Th color="gray.300" borderColor="gray.600">Package</Th>{/* --- FIX: Removed whitespace --- */}<Th color="gray.300" borderColor="gray.600">Recipient</Th>{/* --- FIX: Removed whitespace --- */}<Th color="gray.300" borderColor="gray.600" display={{base: 'none', md: 'table-cell'}}>Items</Th>{/* --- FIX: Removed whitespace --- */}<Th color="gray.300" borderColor="gray.600" display={{base: 'none', lg: 'table-cell'}}>Date</Th>{/* --- FIX: Removed whitespace --- */}<Th color="gray.300" borderColor="gray.600">Status</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {lootDistributions.map((dist) => (
                        <Tr key={dist.id} _hover={{ bg: "gray.750" }} borderColor="gray.600">
                            <Td borderColor="gray.600">
                                <Text color="gray.200">{dist.packageName}</Text>
                                 <Text fontSize="xs" color="gray.500" mt={1} display={{base: 'none', md: 'block'}}> {/* Hide on mobile */}
                                Spon: {dist.sponsor}
                                </Text>
                            </Td>
                            <Td color="gray.300" borderColor="gray.600">
                            {dist.recipientName}
                            </Td>
                             <Td isNumeric display={{base: 'none', md: 'table-cell'}} borderColor="gray.600"> {/* Hide on mobile */}
                            <Badge colorScheme="brand" fontSize="xs"> {/* Smaller badge */}
                                {dist.items.length} items
                            </Badge>
                            </Td>
                             <Td color="gray.400" fontSize="xs" display={{base: 'none', lg: 'table-cell'}} borderColor="gray.600"> {/* Hide on smaller screens */}
                                {formatDate(dist.distributedAt)}
                            </Td>
                            <Td borderColor="gray.600">
                            <Badge
                                colorScheme={dist.acknowledged ? "green" : "yellow"}
                                fontSize="xs" // Smaller badge
                            >
                                {dist.acknowledged ? "Claimed" : "Pending"}
                            </Badge>
                            </Td>
                        </Tr>
                        ))}
                    </Tbody>
                    </Table>
                  </TableContainer>
                 </ScrollArea>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Add Item Modal */}
        <Modal isOpen={isAddItemModalOpen} onClose={() => setIsAddItemModalOpen(false)} size="xl" scrollBehavior="inside"> {/* Allow inside scroll */}
          <ModalOverlay />
          <ModalContent bg="gray.800" borderColor="gray.700">
            <ModalHeader color="gray.100">Add Item to Loot Package</ModalHeader>
            <ModalCloseButton color="gray.400" />
            <ModalBody py={4}> {/* Add padding */}
              <InputGroup mb={4}>
                <InputLeftElement pointerEvents="none">
                  <Search className="h-4 w-4 text-gray-400" />
                </InputLeftElement>
                <Input
                  placeholder="Search items..."
                  value={itemSearchTerm}
                  onChange={(e) => setItemSearchTerm(e.target.value)}
                  bg="gray.700"
                  borderColor="gray.600"
                  size="sm" // Smaller input
                />
              </InputGroup>

              {isLoadingItems ? (
                 <Center my={8}><Spinner size="xl" color="brand.500" /></Center> // Use Center
              ) : filteredItems.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Text color="gray.400">No items found</Text>
                </Box>
              ) : (
                 <ScrollArea className="h-[40vh]"> {/* Scrollable area */}
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    {filteredItems.map((item) => (
                        <Card
                        key={item.id}
                        bg="gray.700"
                        borderColor="gray.600"
                        cursor="pointer"
                        onClick={() => handleAddItem(item)}
                        _hover={{ borderColor: "brand.400" }}
                        p={3} // Add padding
                        >
                            <Text fontWeight="medium" color="gray.200" fontSize="sm">{item.name}</Text>
                            <HStack mt={2} spacing={2}>
                            <Badge fontSize="xs">{item.itemType}</Badge>
                            <Badge colorScheme={getRarityColor(item.rarity)} fontSize="xs">
                                {item.rarity}
                            </Badge>
                            </HStack>
                        </Card>
                    ))}
                    </SimpleGrid>
                 </ScrollArea>
              )}
            </ModalBody>
            <ModalFooter borderTop="1px solid" borderColor="gray.700"> {/* Add border */}
              <Button colorScheme="gray" variant="ghost" mr={3} onClick={() => setIsAddItemModalOpen(false)}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Create Custom Item Modal */}
         <Modal isOpen={isCreateItemModalOpen} onClose={() => setIsCreateItemModalOpen(false)} size={{base: 'full', md: 'md'}}> {/* Responsive size */}
          <ModalOverlay />
          <ModalContent bg="gray.800" borderColor="gray.700">
            <ModalHeader color="gray.100">Create Custom Item</ModalHeader>
            <ModalCloseButton color="gray.400" />
            <ModalBody py={4}> {/* Add padding */}
              <FormControl mb={3}>
                <FormLabel color="gray.300" fontSize="sm">Item Name</FormLabel> {/* Smaller label */}
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Enter item name"
                  bg="gray.700"
                  borderColor="gray.600"
                  size="sm" // Smaller input
                />
              </FormControl>

              <FormControl mb={3}>
                 <FormLabel color="gray.300" fontSize="sm">Description</FormLabel> {/* Smaller label */}
                <Textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Enter item description"
                  bg="gray.700"
                  borderColor="gray.600"
                  rows={3}
                  size="sm" // Smaller textarea
                />
              </FormControl>

              <SimpleGrid columns={2} spacing={3} mb={3}>
                <FormControl>
                   <FormLabel color="gray.300" fontSize="sm">Item Type</FormLabel> {/* Smaller label */}
                  <Select
                    value={newItem.itemType}
                    onChange={(e) => setNewItem({ ...newItem, itemType: e.target.value })}
                    bg="gray.700"
                    borderColor="gray.600"
                    size="sm" // Smaller select
                    iconColor="gray.400"
                  >
                    {ITEM_TYPES.map((type) => (
                      <option key={type} value={type} style={{backgroundColor: "#2D3748"}}>{type}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                   <FormLabel color="gray.300" fontSize="sm">Rarity</FormLabel> {/* Smaller label */}
                  <Select
                    value={newItem.rarity}
                    onChange={(e) => setNewItem({ ...newItem, rarity: e.target.value })}
                    bg="gray.700"
                    borderColor="gray.600"
                    size="sm" // Smaller select
                    iconColor="gray.400"
                  >
                    {RARITY_OPTIONS.map((rarity) => (
                      <option key={rarity} value={rarity} style={{backgroundColor: "#2D3748"}}>{rarity}</option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                 <FormLabel color="gray.300" fontSize="sm">Quantity</FormLabel> {/* Smaller label */}
                <NumberInput
                  value={newItem.quantity}
                   onChange={(_, value) => setNewItem({ ...newItem, quantity: isNaN(value) ? 1 : value })} // Handle NaN
                  min={1}
                  max={99}
                  bg="gray.700"
                  borderColor="gray.600"
                  size="sm" // Smaller number input
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper borderColor="gray.600" color="gray.400" />
                    <NumberDecrementStepper borderColor="gray.600" color="gray.400" />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </ModalBody>
            <ModalFooter borderTop="1px solid" borderColor="gray.700"> {/* Add border */}
               <Button colorScheme="gray" variant="ghost" mr={3} onClick={() => setIsCreateItemModalOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="brand" onClick={handleCreateItem}>
                Create & Add
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Distribute Modal */}
         <Modal isOpen={isDistributeModalOpen} onClose={() => setIsDistributeModalOpen(false)} size={{base: 'full', md: 'xl'}} scrollBehavior="inside"> {/* Responsive size, allow scroll */}
          <ModalOverlay />
          <ModalContent bg="gray.800" borderColor="gray.700">
            <ModalHeader color="gray.100">
              Distribute Loot
              {selectedPackage && (
                <Text fontSize="sm" color="gray.400" fontWeight="normal">
                  {selectedPackage.name}
                </Text>
              )}
            </ModalHeader>
            <ModalCloseButton color="gray.400" />
            <ModalBody py={4}> {/* Add padding */}
              <Text mb={4} color="gray.300">
                Select player characters to receive this package:
              </Text>

              {isLoadingPlayers ? (
                 <Center my={8}><Spinner size="xl" color="brand.500" /></Center> // Use Center
              ) : players.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Text color="gray.400">No players/characters found</Text>
                </Box>
              ) : (
                 <ScrollArea className="h-[40vh]"> {/* Scrollable area */}
                  <CheckboxGroup
                    colorScheme="brand"
                    value={selectedPlayers}
                    onChange={(values) => setSelectedPlayers(values as string[])}
                  >
                     <VStack align="stretch" spacing={2}>
                      {players.map((player) => (
                        <Checkbox
                          key={player.id}
                          value={player.id} // Use Character ID
                          borderColor="gray.600"
                           p={2} // Add padding for easier tapping
                           borderRadius="md" // Rounded corners
                           _hover={{ bg: "gray.700" }} // Hover effect
                        >
                           <HStack spacing={{base: 1, md: 2}}> {/* Responsive spacing */}
                             <Text color="gray.200" fontSize="sm">{player.characterName}</Text>
                            <Badge colorScheme="brand" fontSize="xs">Lvl {player.characterLevel}</Badge>
                            {player.selectedClass && (
                              <Badge colorScheme="purple" fontSize="xs">{player.selectedClass.name}</Badge>
                            )}
                          </HStack>
                        </Checkbox>
                      ))}
                    </VStack>
                  </CheckboxGroup>
                 </ScrollArea>
              )}

              {selectedPackage && (
                <Box mt={6} p={3} bg="gray.700" borderRadius="md">
                  <Text fontSize="sm" fontWeight="bold" color="gray.300" mb={1}>
                    Package Contents:
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    {selectedPackage.items.length} items including:
                    {' ' + selectedPackage.items
                      .slice(0, 3)
                      .map(item => `${item.quantity}x ${item.name}`) // Show quantity
                      .join(', ')}
                    {selectedPackage.items.length > 3 ? ' and more...' : ''}
                  </Text>
                </Box>
              )}

              <HStack justifyContent="space-between" mt={4}>
                <Text fontSize="sm" color="gray.400">
                  {selectedPlayers.length} selected
                </Text>

                <Badge colorScheme={selectedPlayers.length > 0 ? "brand" : "gray"} fontSize="xs"> {/* Smaller badge */}
                  {selectedPlayers.length} {selectedPlayers.length === 1 ? 'recipient' : 'recipients'}
                </Badge>
              </HStack>
            </ModalBody>
            <ModalFooter borderTop="1px solid" borderColor="gray.700"> {/* Add border */}
               <Button colorScheme="gray" variant="ghost" mr={3} onClick={() => setIsDistributeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleDistributeLoot}
                isDisabled={selectedPlayers.length === 0 || isSubmitting} // Added isSubmitting disable
                 isLoading={isSubmitting} // Show spinner on button
                 loadingText="Distributing..."
                leftIcon={<Send size={16} />}
              >
                Distribute Loot
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteDialogOpen}
          leastDestructiveRef={cancelRef}
          onClose={() => setIsDeleteDialogOpen(false)}
          isCentered // Center dialog
        >
          <AlertDialogOverlay>
            <AlertDialogContent bg="gray.800" borderColor="gray.700">
              <AlertDialogHeader fontSize="lg" fontWeight="bold" color="gray.100">
                Delete Loot Package
              </AlertDialogHeader>

              <AlertDialogBody color="gray.300">
                <HStack spacing={2} mb={4}>
                  <AlertTriangle size={20} className="text-red-400" />
                  <Text>Are you sure you want to delete this loot package?</Text>
                </HStack>
                <Text color="gray.400" fontSize="sm">
                  This action cannot be undone.
                </Text>
              </AlertDialogBody>

              <AlertDialogFooter>
                 <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)} variant="ghost" color="gray.300">
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={handleDeletePackage} ml={3}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

      </Box>
    );
  };

// Helper function to determine badge color based on rarity
const getRarityColor = (rarity: string): string => {
  switch (rarity?.toLowerCase()) { // Added optional chaining and lowercase check
    case 'common': return 'gray';
    case 'uncommon': return 'green';
    case 'rare': return 'blue';
    case 'epic': return 'purple';
    case 'legendary': return 'orange';
    case 'unique': return 'yellow';
    case 'exceedingly rare': return 'pink'; // Adjusted color
    case 'artifact': return 'red'; // Added artifact if needed
    default: return 'gray';
  }
};

// --- ADD THIS LINE AT THE VERY END ---
export default DMLootManager;