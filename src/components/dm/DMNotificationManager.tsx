// components/dm/DMNotificationManager.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import {
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  CheckboxGroup,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  InputGroup,
  Center,
  TableContainer,
  InputLeftElement,
  Tooltip,
} from '@chakra-ui/react';
import {
  Bell,
  Calendar,
  CheckSquare,
  CircleAlert,
  Clock,
  Copy,
  Edit,
  Globe,
  Info,
  Mail,
  MessageCircle,
  Plus,
  Send,
  Settings,
  Star,
  Trash,
  User,
  Users,
  AlertTriangle,
  BellRing,
  MessageSquare,
  Megaphone,
  Eye,
  Search,
  MailOpen,
  X
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  getDoc, // Added orderBy
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext'; // Assuming auth context exists
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming ScrollArea exists

// Define interfaces
interface Player {
  id: string; // Character ID
  userId: string;
  characterName: string;
  characterLevel: number;
  selectedRace?: { name: string } | null;
  selectedClass?: { name: string } | null;
}

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'message' | 'event' | 'reward' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  senderId: string; // DM User ID
  senderName: string;
  recipientIds: string[]; // Character IDs
  recipientNames?: string[];
  createdAt: Timestamp; // Keep as Timestamp
  expiresAt?: Timestamp; // Keep as Timestamp
  isGlobal: boolean;
  isRead: { [characterId: string]: boolean }; // Keyed by Character ID
  icon?: string;
  color?: string;
  actionUrl?: string;
  actionLabel?: string;
}

const NotificationTypes = [
  { value: 'announcement', label: 'Announcement', icon: <Megaphone size={16} />, color: 'brand' },
  { value: 'message', label: 'Message', icon: <MessageCircle size={16} />, color: 'green' },
  { value: 'event', label: 'Event', icon: <Calendar size={16} />, color: 'purple' },
  { value: 'reward', label: 'Reward', icon: <Star size={16} />, color: 'yellow' },
  { value: 'alert', label: 'Alert', icon: <CircleAlert size={16} />, color: 'red' },
];

const DMNotificationManager: React.FC = () => {
  const { currentUser } = useAuth(); // Get current user
  // State for notifications and players
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  // State for creating/editing notifications
  const [newNotification, setNewNotification] = useState<Omit<Notification, 'id' | 'createdAt' | 'senderId' | 'senderName' | 'isRead'>>({
    title: '',
    content: '',
    type: 'announcement',
    priority: 'medium',
    recipientIds: [],
    isGlobal: false,
  });

  // State for notification targeting
  const [isGlobalMode, setIsGlobalMode] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]); // Stores Character IDs
  const [isExpiryEnabled, setIsExpiryEnabled] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string>(''); // Store as string for input[type=datetime-local]

  // State for UI elements
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // UI-related state
  const [isEditing, setIsEditing] = useState(false);
  const [editingNotificationId, setEditingNotificationId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);

  // Modal controls
  const { isOpen: isNotificationModalOpen, onOpen: onOpenNotificationModal, onClose: onCloseNotificationModal } = useDisclosure();
  const { isOpen: isPreviewModalOpen, onOpen: onOpenPreviewModal, onClose: onClosePreviewModal } = useDisclosure();

  // Toast for notifications
  const toast = useToast();

  // Cancel ref for delete dialog
  const cancelRef = React.useRef<HTMLButtonElement>(null!);

  // Fetch notifications and players from Firestore
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
           setIsLoadingNotifications(false);
           setIsLoadingPlayers(false);
           return;
       }
      try {
        // Fetch notifications sent by this DM
        setIsLoadingNotifications(true);
         const notificationsQuery = query(
            collection(db, 'notifications'),
            where("senderId", "==", currentUser.uid), // Filter by sender
             orderBy("createdAt", "desc") // Order by creation date
         );
        const notificationsSnapshot = await getDocs(notificationsQuery);

        const fetchedNotifications: Notification[] = [];
        notificationsSnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedNotifications.push({
            id: doc.id,
            title: data.title || '',
            content: data.content || '',
            type: data.type || 'announcement',
            priority: data.priority || 'medium',
            senderId: data.senderId || '',
            senderName: data.senderName || 'Dungeon Master',
            recipientIds: data.recipientIds || [],
            recipientNames: data.recipientNames || [],
            createdAt: data.createdAt || Timestamp.now(), // Ensure Timestamp
            expiresAt: data.expiresAt, // Optional Timestamp
            isGlobal: data.isGlobal || false,
            isRead: data.isRead || {},
            icon: data.icon,
            color: data.color,
            actionUrl: data.actionUrl,
            actionLabel: data.actionLabel,
          });
        });

        // No need to sort here, Firestore does it
        setNotifications(fetchedNotifications);
        setIsLoadingNotifications(false);

        // Fetch players (Characters)
        setIsLoadingPlayers(true);
         const playersQuery = query(collection(db, 'characters')); // Fetch all characters for selection
        const playersSnapshot = await getDocs(playersQuery);

        const fetchedPlayers: Player[] = [];
        playersSnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedPlayers.push({
            id: doc.id, // Character ID
            userId: data.userId || '',
            characterName: data.characterName || 'Unnamed Character',
            characterLevel: data.characterLevel || 1,
            selectedRace: data.selectedRace,
            selectedClass: data.selectedClass,
          });
        });

         fetchedPlayers.sort((a, b) => a.characterName.localeCompare(b.characterName)); // Sort characters by name
        setPlayers(fetchedPlayers);
        setIsLoadingPlayers(false);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load notifications or players',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setIsLoadingNotifications(false);
        setIsLoadingPlayers(false);
      }
    };

    fetchData();
  }, [toast, currentUser]); // Added currentUser dependency

  // Filter notifications based on search term and selected type
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'all' || notification.type === selectedType;

    return matchesSearch && matchesType;
  });

  // Create or update a notification
  const handleSaveNotification = async () => {
     if (!currentUser) {
         toast({ title: "Not Logged In", status: "error" }); return;
     }
    try {
      // Validation
      if (!newNotification.title.trim()) {
        toast({ title: 'Title Required', status: 'warning' }); return;
      }
      if (!newNotification.content.trim()) {
        toast({ title: 'Content Required', status: 'warning' }); return;
      }
      if (!isGlobalMode && selectedPlayers.length === 0) {
        toast({ title: 'Recipients Required', status: 'warning' }); return;
      }

      // Get DM info
      const dmId = currentUser.uid;
      const dmName = currentUser.displayName || currentUser.email || 'Dungeon Master';

      // Prepare notification data
      const recipientIds = isGlobalMode ? [] : selectedPlayers; // Character IDs
      const recipientNames = isGlobalMode ? [] : players
        .filter(player => selectedPlayers.includes(player.id))
        .map(player => player.characterName);

      // Create empty isRead object for recipients
      const isRead: { [characterId: string]: boolean } = {};
      if (!isGlobalMode) {
        recipientIds.forEach(id => { isRead[id] = false; });
      } else {
          // For global, initialize for all known players (optional, depends on read tracking needs)
          // players.forEach(p => { isRead[p.id] = false; });
      }

      // Process expiry date string into Timestamp or null
       let expiresAtTimestamp: Timestamp | null = null;
       if (isExpiryEnabled && expiryDate) {
           try {
               expiresAtTimestamp = Timestamp.fromDate(new Date(expiryDate));
           } catch (e) {
               console.error("Invalid date format for expiry:", expiryDate);
               toast({ title: "Invalid Expiry Date", status: "warning" });
               return; // Prevent saving with invalid date
           }
       }

      // Determine icon and color based on type
      const typeInfo = NotificationTypes.find(t => t.value === newNotification.type);
      const icon = typeInfo?.value || 'announcement';
      const color = typeInfo?.color || 'brand';

       const notificationData: Omit<Notification, 'id'> = {
           title: newNotification.title,
           content: newNotification.content,
           type: newNotification.type,
           priority: newNotification.priority,
           senderId: dmId,
           senderName: dmName,
           recipientIds,
           recipientNames,
           createdAt: serverTimestamp() as Timestamp, // Will be set by server
           expiresAt: expiresAtTimestamp || undefined, // Use Timestamp or undefined
           isGlobal: isGlobalMode,
           isRead,
           icon,
           color,
           actionUrl: newNotification.actionUrl,
           actionLabel: newNotification.actionLabel,
       };

      if (isEditing && editingNotificationId) {
        // Update existing notification
         const { createdAt, ...updateData } = notificationData; // Exclude createdAt on update
        await updateDoc(doc(db, 'notifications', editingNotificationId), updateData);

        // Fetch updated doc for local state consistency
         const updatedDocSnap = await getDoc(doc(db, 'notifications', editingNotificationId));
         const updatedNotification = { id: editingNotificationId, ...updatedDocSnap.data() } as Notification;

        // Update local state and re-sort
         setNotifications(prev => prev.map(n => n.id === editingNotificationId ? updatedNotification : n)
                                        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
         );

        toast({ title: 'Notification Updated', status: 'success' });
      } else {
        // Create new notification
        const docRef = await addDoc(collection(db, 'notifications'), notificationData);

         // Fetch created doc for local state consistency
         const newDocSnap = await getDoc(docRef);
         const newNotificationWithId = { id: docRef.id, ...newDocSnap.data() } as Notification;

        // Add new notification to local state and re-sort
         setNotifications(prev => [newNotificationWithId, ...prev]
                                     .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
         );

        toast({ title: 'Notification Sent', status: 'success' });
      }

      // Reset form and close modal
      resetNotificationForm();
      onCloseNotificationModal();

    } catch (error) {
      console.error('Error saving notification:', error);
      toast({ title: 'Error', description: 'Failed to save notification', status: 'error' });
    }
  };

    // Handle notification deletion
    const handleDeleteNotification = async () => {
      if (!notificationToDelete) return;

      try {
        // Delete from Firestore
        await deleteDoc(doc(db, 'notifications', notificationToDelete));

        // Update local state
        setNotifications(notifications.filter(
          notification => notification.id !== notificationToDelete
        ));

        toast({ title: 'Notification Deleted', status: 'success' });

        // Close dialog and reset state
        setIsDeleteDialogOpen(false);
        setNotificationToDelete(null);

      } catch (error) {
        console.error('Error deleting notification:', error);
        toast({ title: 'Error', description: 'Failed to delete notification', status: 'error' });
      }
    };

    // Reset notification form to defaults
    const resetNotificationForm = () => {
      setNewNotification({
        title: '',
        content: '',
        type: 'announcement',
        priority: 'medium',
        recipientIds: [],
        isGlobal: false,
        actionUrl: '', // Reset optional fields
        actionLabel: '',
      });
      setIsGlobalMode(false);
      setSelectedPlayers([]);
      setIsExpiryEnabled(false);
       setExpiryDate(''); // Reset date string
      setIsEditing(false);
      setEditingNotificationId(null);
    };

    // Handle editing a notification
    const handleEditNotification = (notification: Notification) => {
      // Set form values
      setNewNotification({
        title: notification.title,
        content: notification.content,
        type: notification.type,
        priority: notification.priority,
        recipientIds: notification.recipientIds,
        isGlobal: notification.isGlobal,
        actionUrl: notification.actionUrl,
        actionLabel: notification.actionLabel,
      });

      // Set other form state
      setIsGlobalMode(notification.isGlobal);
      setSelectedPlayers(notification.recipientIds); // Character IDs
      setIsExpiryEnabled(!!notification.expiresAt);
       // Format Timestamp to datetime-local string if it exists
       setExpiryDate(notification.expiresAt
        ? new Date(notification.expiresAt.toMillis() - (new Date().getTimezoneOffset() * 60000)) // Adjust for local timezone for input
              .toISOString().slice(0, 16)
        : '');

      // Set editing state
      setIsEditing(true);
      setEditingNotificationId(notification.id);

      // Open modal
      onOpenNotificationModal();
    };

    // Format date for display
     const formatDate = (timestamp: Timestamp | undefined): string => {
        if (!timestamp) return 'N/A';
        return timestamp.toDate().toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
        });
    };

    // Get color scheme based on priority
    const getPriorityColorScheme = (priority: string): string => {
      switch (priority) {
        case 'low': return 'green';
        case 'medium': return 'blue';
        case 'high': return 'orange';
        case 'urgent': return 'red';
        default: return 'blue';
      }
    };

    // Get icon for notification type
    const getNotificationTypeIcon = (type: string) => {
      const typeInfo = NotificationTypes.find(t => t.value === type);
      return typeInfo?.icon || <MessageCircle size={16} />;
    };

    // Count unread notifications (approximation based on fetched data)
    const countUnreadNotifications = (): number => {
        // This count is DM-side and doesn't reflect real-time player reads perfectly
        // It counts notifications where *at least one* intended recipient *might* not have read it
        return notifications.filter(n => {
            if (n.isGlobal) {
                 // Consider global unread if *any* known player hasn't read it OR if no reads recorded yet
                 return players.length === 0 || players.some(p => !n.isRead[p.id]);
            } else {
                // Consider targeted unread if *any* recipient hasn't read it
                 return n.recipientIds.some(id => !n.isRead[id]);
            }
        }).length;
    };

    return (
      <Box p={{base: 2, md: 4}}> {/* Responsive Padding */}
        <VStack spacing={4} align="stretch">
           <Flex justify="space-between" align="center" wrap="wrap" gap={3}> {/* Responsive Flex */}
             <Heading size={{base: 'md', md: 'lg'}} color="gray.100"> {/* Responsive Heading */}
                Notifications
             </Heading>

            <HStack>
              <Button
                leftIcon={<Plus />}
                colorScheme="brand"
                 size="sm" // Smaller button on mobile
                onClick={() => {
                  resetNotificationForm();
                  onOpenNotificationModal();
                }}
              >
                New
              </Button>
            </HStack>
          </Flex>

          <Divider borderColor="gray.700" />

          {/* Filters and Search */}
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={3}
            justify="space-between"
            align={{ base: 'stretch', md: 'center' }}
          >
            <HStack flex={1}> {/* Allow type select to take space */}
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                bg="gray.800"
                borderColor="gray.600"
                _hover={{ borderColor: 'gray.500' }}
                w={{ base: 'full', md: '200px' }}
                 size="sm" // Smaller select
                 iconColor="gray.400"
              >
                <option value="all" style={{backgroundColor: "#2D3748"}}>All Types</option>
                {NotificationTypes.map(type => (
                  <option key={type.value} value={type.value} style={{backgroundColor: "#2D3748"}}>{type.label}</option>
                ))}
              </Select>
            </HStack>

            <InputGroup w={{ base: 'full', md: '300px' }} size="sm"> {/* Smaller input group */}
               <InputLeftElement pointerEvents="none" height="32px"> {/* Adjust height */}
                   <Search size={14} color='gray.400' /> {/* Smaller icon */}
               </InputLeftElement>
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg="gray.800"
                borderColor="gray.600"
                _hover={{ borderColor: 'gray.500' }}
                pl={8} // Adjust padding left
              />
            </InputGroup>
          </Flex>

          {/* Notifications List */}
          {isLoadingNotifications ? (
             <Center my={8}><Spinner size="xl" color="brand.500" /></Center> // Use Center
          ) : filteredNotifications.length === 0 ? (
            <Card bg="gray.800" borderColor="gray.700" my={4}>
              <CardBody textAlign="center" py={8}>
                <Icon as={Bell} boxSize={12} color="gray.400" mb={4} />
                <Text color="gray.400">No notifications found</Text>
                <Text color="gray.500" fontSize="sm" mt={2}>
                  {selectedType !== 'all' || searchTerm
                    ? 'Try adjusting your filters or search term'
                    : 'Create your first notification'}
                </Text>
              </CardBody>
            </Card>
          ) : (
             <ScrollArea className="h-[calc(100vh - 260px)]"> {/* Scrollable area */}
                 <TableContainer>
                    <Table variant="simple" size="sm"> {/* Smaller table */}
                        <Thead bg="gray.800" position="sticky" top={0} zIndex={1}> {/* Sticky header */}
                        <Tr>
                            <Th color="gray.300" borderColor="gray.600" px={2}>Type</Th> {/* Reduced padding */}
                            <Th color="gray.300" borderColor="gray.600" px={2}>Title</Th>
                            <Th color="gray.300" display={{ base: 'none', md: 'table-cell' }} borderColor="gray.600" px={2}>Created</Th>
                            <Th color="gray.300" display={{ base: 'none', lg: 'table-cell' }} borderColor="gray.600" px={2}>Recipients</Th> {/* Hide on md */}
                            <Th color="gray.300" display={{ base: 'none', sm: 'table-cell' }} borderColor="gray.600" px={2}>Priority</Th> {/* Hide only on base */}
                            <Th color="gray.300" textAlign="right" borderColor="gray.600" px={2}>Actions</Th>
                        </Tr>
                        </Thead>
                        <Tbody>
                        {filteredNotifications.map(notification => (
                            <Tr key={notification.id} _hover={{ bg: 'gray.750' }} borderColor="gray.600">
                            <Td px={2}> {/* Reduced padding */}
                                <Tooltip label={NotificationTypes.find(t => t.value === notification.type)?.label}>
                                    <Flex align="center" justify={{base: 'center', sm: 'flex-start'}}> {/* Center icon on base */}
                                        {getNotificationTypeIcon(notification.type)}
                                    </Flex>
                                </Tooltip>
                            </Td>
                            <Td fontWeight="medium" color="gray.200" px={2}>{notification.title}</Td>
                             <Td display={{ base: 'none', md: 'table-cell' }} fontSize="xs" color="gray.400" px={2}> {/* Smaller font */}
                                {formatDate(notification.createdAt)}
                            </Td>
                             <Td display={{ base: 'none', lg: 'table-cell' }} px={2}> {/* Hide on md */}
                                {notification.isGlobal ? (
                                <Badge colorScheme="purple" fontSize="xs">Global</Badge>
                                ) : (
                                <Text fontSize="xs"> {/* Smaller font */}
                                    {notification.recipientIds.length} player(s)
                                </Text>
                                )}
                            </Td>
                             <Td display={{ base: 'none', sm: 'table-cell' }} px={2}> {/* Hide only on base */}
                                <Badge colorScheme={getPriorityColorScheme(notification.priority)} fontSize="xs"> {/* Smaller badge */}
                                {notification.priority}
                                </Badge>
                            </Td>
                            <Td textAlign="right" px={2}>
                                <HStack justify="flex-end" spacing={1}> {/* Reduced spacing */}
                                <IconButton
                                    aria-label="View notification"
                                    icon={<Eye size={14} />} // Smaller icon
                                    size="xs" // Smaller button
                                    colorScheme="blue"
                                    variant="ghost"
                                    onClick={() => {
                                    setNewNotification({ // Populate state for preview
                                        title: notification.title,
                                        content: notification.content,
                                        type: notification.type,
                                        priority: notification.priority,
                                        recipientIds: notification.recipientIds,
                                        isGlobal: notification.isGlobal,
                                        actionUrl: notification.actionUrl,
                                        actionLabel: notification.actionLabel,
                                    });
                                    onOpenPreviewModal();
                                    }}
                                />
                                <IconButton
                                    aria-label="Edit notification"
                                    icon={<Edit size={14} />} // Smaller icon
                                    size="xs" // Smaller button
                                    colorScheme="brand"
                                    variant="ghost"
                                    onClick={() => handleEditNotification(notification)}
                                />
                                <IconButton
                                    aria-label="Delete notification"
                                    icon={<Trash size={14} />} // Smaller icon
                                    size="xs" // Smaller button
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={() => {
                                    setNotificationToDelete(notification.id);
                                    setIsDeleteDialogOpen(true);
                                    }}
                                />
                                </HStack>
                            </Td>
                            </Tr>
                        ))}
                        </Tbody>
                    </Table>
                 </TableContainer>
            </ScrollArea>
          )}
        </VStack>

        {/* Create/Edit Notification Modal */}
         <Modal isOpen={isNotificationModalOpen} onClose={onCloseNotificationModal} size={{base: "full", md: "xl"}} scrollBehavior="inside"> {/* Responsive size, scroll inside */}
          <ModalOverlay />
          <ModalContent bg="gray.800" borderColor="gray.700">
             <ModalHeader color="gray.200" borderBottom="1px solid" borderColor="gray.700"> {/* Add border */}
              {isEditing ? 'Edit Notification' : 'New Notification'}
            </ModalHeader>
            <ModalCloseButton color="gray.400" />
            <ModalBody py={4}> {/* Add padding */}
              <ScrollArea className="h-[70vh]"> {/* Scrollable Body */}
                <VStack spacing={4} align="stretch">
                    <FormControl isRequired> {/* Mark required */}
                    <FormLabel color="gray.300" fontSize="sm">Title</FormLabel>
                    <Input
                        placeholder="Notification title"
                        value={newNotification.title}
                        onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                        bg="gray.750" borderColor="gray.600" size="sm"
                    />
                    </FormControl>

                    <FormControl isRequired> {/* Mark required */}
                    <FormLabel color="gray.300" fontSize="sm">Content</FormLabel>
                    <Textarea
                        placeholder="Notification content..."
                        value={newNotification.content}
                        onChange={(e) => setNewNotification({ ...newNotification, content: e.target.value })}
                        minH="120px" bg="gray.750" borderColor="gray.600" size="sm"
                    />
                    </FormControl>

                     <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                        <FormLabel color="gray.300" fontSize="sm">Type</FormLabel>
                        <Select size="sm"
                        value={newNotification.type}
                        onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as Notification['type'] })}
                        bg="gray.750" borderColor="gray.600" iconColor="gray.400"
                        >
                        {NotificationTypes.map(type => (
                            <option key={type.value} value={type.value} style={{backgroundColor: "#2D3748"}}>{type.label}</option>
                        ))}
                        </Select>
                    </FormControl>

                    <FormControl>
                        <FormLabel color="gray.300" fontSize="sm">Priority</FormLabel>
                        <Select size="sm"
                        value={newNotification.priority}
                        onChange={(e) => setNewNotification({ ...newNotification, priority: e.target.value as Notification['priority'] })}
                        bg="gray.750" borderColor="gray.600" iconColor="gray.400"
                        >
                        <option value="low" style={{backgroundColor: "#2D3748"}}>Low</option>
                        <option value="medium" style={{backgroundColor: "#2D3748"}}>Medium</option>
                        <option value="high" style={{backgroundColor: "#2D3748"}}>High</option>
                        <option value="urgent" style={{backgroundColor: "#2D3748"}}>Urgent</option>
                        </Select>
                    </FormControl>
                    </SimpleGrid>

                    <FormControl>
                    <FormLabel color="gray.300" fontSize="sm">Recipients</FormLabel>
                    <RadioGroup
                        value={isGlobalMode ? 'global' : 'specific'}
                        onChange={(value) => setIsGlobalMode(value === 'global')}
                        mb={3}
                    >
                        <Stack direction={{base: 'column', sm: 'row'}} spacing={4}> {/* Responsive stack */}
                        <Radio value="global" colorScheme="purple" size="sm">Global</Radio>
                        <Radio value="specific" colorScheme="blue" size="sm">Specific Players</Radio>
                        </Stack>
                    </RadioGroup>

                    {!isGlobalMode && (
                        <Box
                        maxH="200px" overflowY="auto" borderWidth="1px" borderRadius="md"
                        p={2} bg="gray.750" borderColor="gray.600"
                        >
                        {isLoadingPlayers ? (
                            <Center py={4}><Spinner size="sm" /></Center>
                        ) : players.length === 0 ? (
                            <Text color="gray.400" textAlign="center" py={4} fontSize="sm">No players found</Text>
                        ) : (
                            <CheckboxGroup
                            value={selectedPlayers}
                            onChange={(values) => setSelectedPlayers(values as string[])}
                            colorScheme="brand"
                            >
                            <VStack spacing={1} align="stretch"> {/* Reduced spacing */}
                                {players.map(player => (
                                <Checkbox key={player.id} value={player.id} size="sm" p={1.5} borderRadius="sm" _hover={{bg: "gray.600"}}> {/* Reduced padding */}
                                    <HStack spacing={1}>
                                    <Text color="gray.200" fontSize="sm">{player.characterName}</Text>
                                    <Text color="gray.500" fontSize="xs">
                                        (Lvl {player.characterLevel})
                                    </Text>
                                    </HStack>
                                </Checkbox>
                                ))}
                            </VStack>
                            </CheckboxGroup>
                        )}
                        </Box>
                    )}
                    </FormControl>

                    <FormControl>
                    <FormLabel color="gray.300" fontSize="sm">Expiry (Optional)</FormLabel>
                    <Checkbox size="sm"
                        isChecked={isExpiryEnabled}
                        onChange={(e) => setIsExpiryEnabled(e.target.checked)}
                        colorScheme="brand" mb={2}
                    >
                        Set expiry date
                    </Checkbox>

                    {isExpiryEnabled && (
                        <Input size="sm"
                        type="datetime-local"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        bg="gray.750" borderColor="gray.600"
                        sx={{ colorScheme: 'dark' }} // Hint for date picker theme
                        />
                    )}
                    </FormControl>

                    <Divider borderColor="gray.700" />

                    <Box>
                    <FormLabel color="gray.300" mb={1} fontSize="sm">Action (Optional)</FormLabel>
                    <Text color="gray.400" fontSize="xs" mb={2}> {/* Smaller description */}
                        Add a button for players to click.
                    </Text>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        <FormControl>
                        <FormLabel color="gray.300" fontSize="xs">Button Text</FormLabel>
                        <Input size="sm"
                            placeholder="e.g., View Details"
                            value={newNotification.actionLabel || ''}
                            onChange={(e) => setNewNotification({ ...newNotification, actionLabel: e.target.value })}
                            bg="gray.750" borderColor="gray.600"
                        />
                        </FormControl>

                        <FormControl>
                        <FormLabel color="gray.300" fontSize="xs">URL / Action ID</FormLabel>
                        <Input size="sm"
                            placeholder="Link or identifier"
                            value={newNotification.actionUrl || ''}
                            onChange={(e) => setNewNotification({ ...newNotification, actionUrl: e.target.value })}
                            bg="gray.750" borderColor="gray.600"
                        />
                        </FormControl>
                    </SimpleGrid>
                    </Box>
                </VStack>
              </ScrollArea>
            </ModalBody>
             <ModalFooter borderTop="1px solid" borderColor="gray.700"> {/* Add border */}
              <Button variant="ghost" colorScheme="gray" mr={3} onClick={onCloseNotificationModal}>
                Cancel
              </Button>
              <Button
                leftIcon={<Send size={16} />}
                colorScheme="brand"
                onClick={handleSaveNotification}
              >
                {isEditing ? 'Update' : 'Send'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Notification Preview Modal */}
         <Modal isOpen={isPreviewModalOpen} onClose={onClosePreviewModal} size={{base: 'full', md: 'lg'}} isCentered> {/* Responsive size */}
          <ModalOverlay />
          <ModalContent bg="gray.800" borderColor="gray.700">
            <ModalHeader color="gray.200">Preview Notification</ModalHeader>
            <ModalCloseButton color="gray.400" />
            <ModalBody py={4}>
              <Card bg="gray.750" borderWidth="1px" borderColor="gray.600" shadow="md" mb={4}>
                <CardBody p={4}> {/* Adjust padding */}
                  <VStack align="stretch" spacing={3}>
                    <Flex justify="space-between" align="center">
                      <HStack>
                        {getNotificationTypeIcon(newNotification.type)}
                        <Text fontWeight="bold" color="gray.200">{newNotification.title}</Text>
                      </HStack>
                      <Badge colorScheme={getPriorityColorScheme(newNotification.priority)} fontSize="xs">
                        {newNotification.priority}
                      </Badge>
                    </Flex>

                    <Text color="gray.300" whiteSpace="pre-wrap" fontSize="sm"> {/* Slightly smaller font */}
                      {newNotification.content}
                    </Text>

                    {newNotification.actionLabel && newNotification.actionUrl && (
                      <Button size="sm" colorScheme="brand" mt={2} alignSelf="flex-start">
                        {newNotification.actionLabel}
                      </Button>
                    )}

                     <Text fontSize="xs" color="gray.500" mt={2}>
                      Sent by: {currentUser?.displayName || 'DM'} • Just Now
                    </Text>
                  </VStack>
                </CardBody>
              </Card>

               <HStack align="center" color="gray.400" fontSize="sm">
                   <Icon as={Info} boxSize={4} mr={1}/>
                   <Text>This is a preview of the notification.</Text>
               </HStack>
            </ModalBody>
             <ModalFooter borderTop="1px solid" borderColor="gray.700"> {/* Add border */}
              <Button colorScheme="gray" variant="ghost" onClick={onClosePreviewModal}>
                Close
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
              <AlertDialogHeader color="gray.100">
                Delete Notification
              </AlertDialogHeader>
              <AlertDialogBody color="gray.300">
                Are you sure you want to delete this notification? This action cannot be undone.
              </AlertDialogBody>
               <AlertDialogFooter borderTop="1px solid" borderColor="gray.700"> {/* Add border */}
                <Button
                  ref={cancelRef}
                  onClick={() => setIsDeleteDialogOpen(false)}
                  variant="ghost"
                  colorScheme="gray"
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  ml={3}
                  onClick={handleDeleteNotification}
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    );
  };

  export default DMNotificationManager;