import React, { useState } from 'react';
import { HStack, Badge, Button, Tooltip, Text } from '@chakra-ui/react';
import { Save, CloudOff, Cloud } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';

const SaveIndicator: React.FC = () => {
  // Instead of using saveCharacter which doesn't exist, use saveCharacterManually
  const { saveCharacterManually } = useCharacter();
  const [isLocalSaving, setIsLocalSaving] = useState(false);
  const [localLastSave, setLocalLastSave] = useState<number | null>(null);

  // Local state representing unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Try to use the context if properties exist, otherwise use local state
  const contextValue = useCharacter() as any;
  const isDirty = contextValue.isDirty !== undefined ? contextValue.isDirty : hasUnsavedChanges;
  const isSaving = contextValue.isSaving !== undefined ? contextValue.isSaving : isLocalSaving;
  const lastSaveTime = contextValue.lastSaveTime !== undefined ? contextValue.lastSaveTime : localLastSave;

  // Local fallback save function
  const handleManualSave = async () => {
    try {
      setIsLocalSaving(true);
      
      // If the context has the saveCharacterManually function, use it
      if (contextValue.saveCharacterManually) {
        await contextValue.saveCharacterManually();
      } else if (saveCharacterManually) {
        // Use the saveCharacterManually function from the context
        await saveCharacterManually();
      }
      
      setHasUnsavedChanges(false);
      setLocalLastSave(Date.now());
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsLocalSaving(false);
    }
  };

  // Use the context function if it exists, otherwise use our local one
  const saveFunction = contextValue.saveCharacterManually || handleManualSave;
  
  // Format the last save time
  const getLastSaveText = () => {
    if (!lastSaveTime) return "Never saved";
    
    const now = Date.now();
    const diffInSeconds = Math.floor((now - lastSaveTime) / 1000);
    
    if (diffInSeconds < 60) {
      return "Saved just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Saved ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      const date = new Date(lastSaveTime);
      return `Saved at ${date.toLocaleTimeString()}`;
    }
  };

  return (
    <HStack spacing={2} ml={2} fontSize="sm">
      {isDirty ? (
        <Tooltip label="You have unsaved changes">
          <Badge colorScheme="yellow" variant="solid" px={2}>
            <HStack spacing={1}>
              <CloudOff size={12} />
              <Text>Unsaved</Text>
            </HStack>
          </Badge>
        </Tooltip>
      ) : (
        <Tooltip label={getLastSaveText()}>
          <Badge colorScheme="green" variant="solid" px={2}>
            <HStack spacing={1}>
              <Cloud size={12} />
              <Text>Saved</Text>
            </HStack>
          </Badge>
        </Tooltip>
      )}
      
      <Tooltip label="Manually save your character">
        <Button
          size="sm"
          colorScheme="brand"
          leftIcon={<Save size={14} />}
          onClick={saveFunction}
          isLoading={isSaving}
          loadingText="Saving..."
          bg="gray.700"
          _hover={{ bg: "gray.600" }}
        >
          Save
        </Button>
      </Tooltip>
    </HStack>
  );
};

export default SaveIndicator;