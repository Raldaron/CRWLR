// components/admin/settings/DMGameConfiguration.tsx
import React, { useState, useEffect } from 'react';
import {
    Box, VStack, HStack, FormControl, FormLabel, Input, Button,
    Spinner, useToast, Heading, Switch, Text, Select
} from '@chakra-ui/react';
import { Save } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

interface GameSettings {
    gameName?: string;
    allowPVP?: boolean;
    experienceModifier?: number;
    // Add other global settings here
}

const DMGameConfiguration: React.FC = () => {
    const [settings, setSettings] = useState<Partial<GameSettings>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();
    const settingsRef = doc(db, 'gameSettings', 'globalConfig'); // Specific doc for global settings

    useEffect(() => {
        const loadSettings = async () => {
            setIsLoading(true);
            try {
                const docSnap = await getDoc(settingsRef);
                if (docSnap.exists()) {
                    setSettings(docSnap.data() as GameSettings);
                } else {
                    // Set default settings if document doesn't exist
                    setSettings({ gameName: 'Dungeon Crawler World', allowPVP: false, experienceModifier: 1.0 });
                }
            } catch (error) {
                console.error("Error loading game settings:", error);
                toast({ title: 'Error', description: 'Could not load game settings.', status: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, [toast]); // Removed settingsRef from dependencies to prevent potential loops if ref object changes identity

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked; // For switches/checkboxes

        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 1 : value // Ensure number parsing
        }));
    };

     const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setSettings(prev => ({ ...prev, [name]: checked }));
    };


    const handleSave = async () => {
        setIsSaving(true);
        try {
            const dataToSave = { ...settings, lastUpdated: serverTimestamp() };
            await setDoc(settingsRef, dataToSave, { merge: true }); // Use merge to be safe
            toast({ title: 'Settings Saved', description: 'Global game settings updated successfully.', status: 'success' });
        } catch (error) {
            console.error("Error saving game settings:", error);
            toast({ title: 'Error', description: 'Could not save game settings.', status: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <Spinner color="brand.400"/>;
    }

    return (
        <Box p={5} bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700">
            <Heading size="md" mb={4} color="gray.200">Global Game Configuration</Heading>
            <VStack spacing={4} align="stretch">
                <FormControl>
                    <FormLabel color="gray.300">Game Name</FormLabel>
                    <Input name="gameName" value={settings.gameName || ''} onChange={handleChange} bg="gray.700" borderColor="gray.600" />
                </FormControl>

                 <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="allow-pvp" mb="0" color="gray.300">
                        Allow Player vs Player (PVP)?
                    </FormLabel>
                    <Switch id="allow-pvp" name="allowPVP" isChecked={settings.allowPVP || false} onChange={handleSwitchChange} colorScheme="brand" />
                </FormControl>

                 <FormControl>
                    <FormLabel color="gray.300">Experience Modifier</FormLabel>
                    <Select name="experienceModifier" value={settings.experienceModifier || 1.0} onChange={handleChange} bg="gray.700" borderColor="gray.600">
                         <option value={0.5}>0.5x (Hardcore)</option>
                         <option value={0.75}>0.75x</option>
                         <option value={1.0}>1.0x (Standard)</option>
                         <option value={1.25}>1.25x</option>
                         <option value={1.5}>1.5x (Accelerated)</option>
                         <option value={2.0}>2.0x (Fast)</option>
                     </Select>
                     <Text fontSize="xs" color="gray.500" mt={1}>Adjusts the rate at which players gain experience.</Text>
                 </FormControl>

                {/* Add more settings fields here as needed */}

                <HStack justifyContent="flex-end" mt={5}>
                    <Button
                        leftIcon={<Save size={18} />}
                        colorScheme="brand"
                        onClick={handleSave}
                        isLoading={isSaving}
                        loadingText="Saving..."
                    >
                        Save Global Settings
                    </Button>
                </HStack>
            </VStack>
        </Box>
    );
};

export default DMGameConfiguration;