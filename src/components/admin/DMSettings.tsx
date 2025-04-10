// components/admin/DMSettings.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Switch,
  FormControl,
  FormLabel,
  Button,
  Alert,
  AlertIcon,
  VStack,
  HStack,
  useToast,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { Copy, Check, Key, Shield } from 'lucide-react';

// DM Settings component to enable/disable DM mode and set DM password
const DMSettings: React.FC = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [isDM, setIsDM] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dmPassword, setDmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Load user's DM status
  useEffect(() => {
    const loadDMStatus = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        
        // Check if game settings document exists
        const gameSettingsRef = doc(db, 'gameSettings', 'dmConfig');
        const gameSettingsSnap = await getDoc(gameSettingsRef);
        
        if (gameSettingsSnap.exists()) {
          const gameData = gameSettingsSnap.data();
          
          // Check if current user is a DM
          setIsDM(gameData.dmList?.includes(currentUser.uid) || false);
          setDmPassword(gameData.password || '');
        } else {
          // Create default settings if none exist
          const defaultSettings = {
            password: generateRandomPassword(),
            dmList: [currentUser.uid], // First user becomes DM by default
            createdBy: currentUser.uid,
            createdAt: Date.now()
          };
          
          await setDoc(gameSettingsRef, defaultSettings);
          setIsDM(true);
          setDmPassword(defaultSettings.password);
        }
        
        // Also update user's profile to mark as DM
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.isDM !== isDM) {
            await updateDoc(userRef, { isDM });
          }
        }
      } catch (error) {
        console.error('Error loading DM status:', error);
        toast({
          title: 'Error',
          description: 'Failed to load DM settings',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDMStatus();
  }, [currentUser, toast]);
  
  // Toggle DM mode
  const handleToggleDM = async () => {
    if (!currentUser) return;
    
    if (!isDM) {
      // Becoming a DM requires the password
      onOpen();
    } else {
      // Turning off DM mode
      await updateDMStatus(false);
    }
  };
  
  // Update DM status in database
  const updateDMStatus = async (newStatus: boolean) => {
    if (!currentUser) return;
    
    try {
      setIsSaving(true);
      
      // Update game settings
      const gameSettingsRef = doc(db, 'gameSettings', 'dmConfig');
      const gameSettingsSnap = await getDoc(gameSettingsRef);
      
      if (gameSettingsSnap.exists()) {
        const gameData = gameSettingsSnap.data();
        const dmList = gameData.dmList || [];
        
        if (newStatus && !dmList.includes(currentUser.uid)) {
          // Add to DM list
          await updateDoc(gameSettingsRef, {
            dmList: [...dmList, currentUser.uid]
          });
        } else if (!newStatus && dmList.includes(currentUser.uid)) {
          // Remove from DM list
          await updateDoc(gameSettingsRef, {
            dmList: dmList.filter((id: string) => id !== currentUser.uid)
          });
        }
      }
      
      // Update user profile
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { isDM: newStatus });
      
      setIsDM(newStatus);
      
      toast({
        title: newStatus ? 'DM Mode Activated' : 'DM Mode Deactivated',
        description: newStatus ? 'You now have DM privileges' : 'DM privileges removed',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating DM status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update DM status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
      setCurrentPassword('');
    }
  };
  
  // Handle password verification
  const handlePasswordVerify = async () => {
    if (!currentPassword.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter the DM password',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      const gameSettingsRef = doc(db, 'gameSettings', 'dmConfig');
      const gameSettingsSnap = await getDoc(gameSettingsRef);
      
      if (gameSettingsSnap.exists()) {
        const gameData = gameSettingsSnap.data();
        
        if (gameData.password === currentPassword) {
          await updateDMStatus(true);
        } else {
          toast({
            title: 'Incorrect Password',
            description: 'The DM password is incorrect',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify password',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Change DM password (only current DMs can do this)
  const handleChangePassword = async () => {
    if (!currentUser || !isDM) return;
    
    try {
      setIsSaving(true);
      
      const newPassword = generateRandomPassword();
      
      // Update game settings
      const gameSettingsRef = doc(db, 'gameSettings', 'dmConfig');
      await updateDoc(gameSettingsRef, { password: newPassword });
      
      setDmPassword(newPassword);
      
      toast({
        title: 'Password Updated',
        description: 'DM password has been changed',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: 'Failed to change password',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Copy password to clipboard
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(dmPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: 'Password Copied',
      description: 'DM password copied to clipboard',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };
  
  // Generate a random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  if (isLoading) {
    return (
      <Box p={4} textAlign="center">
        <Text>Loading DM settings...</Text>
      </Box>
    );
  }
  
  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" borderColor="gray.700" bg="gray.800">
      <VStack spacing={6} align="stretch">
        <Heading size="md" color="gray.200">
          <Shield className="inline mr-2" /> DM Mode Settings
        </Heading>
        
        <FormControl display="flex" alignItems="center" justifyContent="space-between">
          <FormLabel htmlFor="dm-mode" mb="0" color="gray.300">
            Enable DM Mode
          </FormLabel>
          <Switch 
            id="dm-mode" 
            isChecked={isDM} 
            onChange={handleToggleDM}
            colorScheme="brand"
          />
        </FormControl>
        
        {isDM && (
          <>
            <Alert status="success" bg="green.800" color="white">
              <AlertIcon color="green.200" />
              You are currently in DM Mode
            </Alert>
            
            <Box>
              <Text fontWeight="bold" mb={2} color="gray.300">DM Password</Text>
              <Text fontSize="sm" color="gray.400" mb={2}>
                Share this password with other DMs to give them access to DM mode
              </Text>
              
              <InputGroup>
                <Input
                  value={dmPassword}
                  isReadOnly
                  bg="gray.700"
                  borderColor="gray.600"
                  type={showPassword ? 'text' : 'password'}
                />
                <InputRightElement width="4.5rem">
                  <Button 
                    h="1.75rem" 
                    size="sm" 
                    onClick={handleCopyPassword}
                    bg="gray.600"
                    _hover={{ bg: "gray.500" }}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              
              <HStack mt={4} spacing={4}>
                <Button
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  variant="outline"
                  colorScheme="gray"
                >
                  {showPassword ? 'Hide' : 'Show'} Password
                </Button>
                
                <Button
                  size="sm"
                  onClick={handleChangePassword}
                  isLoading={isSaving}
                  leftIcon={<Key size={16} />}
                  colorScheme="brand"
                >
                  Generate New Password
                </Button>
              </HStack>
            </Box>
          </>
        )}
      </VStack>
      
      {/* Password verification modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader color="gray.200">Enter DM Password</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            <Text color="gray.300" mb={4}>
              Please enter the DM password to enable DM mode
            </Text>
            <Input
              placeholder="Enter password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              bg="gray.700"
              borderColor="gray.600"
            />
            <Button
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              variant="outline"
              colorScheme="gray"
              mt={2}
            >
              {showPassword ? 'Hide' : 'Show'} Password
            </Button>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={handlePasswordVerify}
              isLoading={isSaving}
            >
              Verify
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DMSettings;