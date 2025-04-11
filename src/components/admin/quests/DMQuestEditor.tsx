// src/components/admin/quests/DMQuestEditor.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  useToast,
  Text,
  IconButton,
  Divider,
  SimpleGrid,
  Heading,
  Flex,
  Badge,
} from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Plus, Trash, Eye, Edit, Save } from 'lucide-react';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

// Import our updated Quest types
import { Quest, QuestObjective, QuestReward, QuestStatus } from '@/types/quest';

interface DMQuestEditorProps {
  questToEdit: Quest | null;
  onSaveComplete: () => void;
  onCancel: () => void;
  currentUserId?: string;
}

const DMQuestEditor: React.FC<DMQuestEditorProps> = ({
  questToEdit,
  onSaveComplete,
  onCancel,
  currentUserId
}) => {
  // Default quest structure using our consistent type
  const defaultQuest: Quest = {
    title: '',
    description: '',
    status: 'available',
    objectives: [],
    rewards: {
      items: [],
      experience: 0,
      gold: 0,
    },
    giver: '',
    location: '',
    requiredLevel: 1,
  };

  // State
  const [quest, setQuest] = useState<Quest>(defaultQuest);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewDescription, setIsPreviewDescription] = useState(false);
  const toast = useToast();
  const [newObjective, setNewObjective] = useState('');

  // Initialize with the quest to edit or default values
  useEffect(() => {
    if (questToEdit) {
      // Make a deep copy to avoid reference issues
      const questCopy = JSON.parse(JSON.stringify(questToEdit));
      setQuest({
        ...questCopy,
        rewards: {
          ...(questCopy.rewards || {}),
          items: questCopy.rewards?.items || [],
          other: questCopy.rewards?.other || '',
        }
      });
    } else {
      setQuest(defaultQuest);
    }
  }, [questToEdit]);

  // Handle standard input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setQuest(prev => ({ ...prev, [name]: value }));
  };

  // Handle number input changes
  const handleNumberChange = (fieldName: keyof Quest, value: number) => {
    setQuest(prev => ({ ...prev, [fieldName]: value }));
  };

  // Handle reward changes
  const handleRewardChange = (field: keyof QuestReward, value: any) => {
    setQuest(prev => ({
      ...prev,
      rewards: {
        ...(prev.rewards || { items: [] }),
        [field]: field === 'experience' || field === 'gold' ? Number(value) || 0 : value
      }
    }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setQuest(prev => ({ ...prev, [name]: checked }));
  };

  // Add a new objective
  const handleAddObjective = () => {
    if (!newObjective.trim()) return;
    
    const newObj: QuestObjective = {
      id: `obj-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      description: newObjective,
      completed: false,
      type: 'other',
      currentCount: 0,
      targetCount: 1,
      isOptional: false,
      isPreview: false,
    };
    
    setQuest(prev => ({
      ...prev,
      objectives: [...(prev.objectives || []), newObj]
    }));
    
    setNewObjective('');
  };

  // Update an objective
  const updateObjective = (index: number, field: keyof QuestObjective, value: any) => {
    setQuest(prev => {
      const objectives = [...(prev.objectives || [])];
      if (objectives[index]) {
        if ((field === 'targetCount' || field === 'currentCount') && typeof value === 'string') {
          value = parseInt(value, 10) || 0;
        } else if (field === 'isOptional' && typeof value !== 'boolean') {
          value = !!value;
        }
        objectives[index] = { ...objectives[index], [field]: value };
      }
      return { ...prev, objectives };
    });
  };

  // Toggle preview for a specific objective
  const toggleObjectivePreview = (index: number) => {
    setQuest(prev => {
      const objectives = [...(prev.objectives || [])];
      if (objectives[index]) {
        objectives[index] = { 
          ...objectives[index], 
          isPreview: !objectives[index].isPreview 
        };
      }
      return { ...prev, objectives };
    });
  };

  // Remove an objective
  const removeObjective = (index: number) => {
    setQuest(prev => ({
      ...prev,
      objectives: (prev.objectives || []).filter((_, i) => i !== index)
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!quest.title?.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Quest title is required.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Process reward items
      const finalRewardItems = (quest.rewards?.items || []).map(item => ({
        ...item,
        quantity: item.quantity || 1
      })).filter(item => item.id && item.name && item.quantity > 0);

      const finalRewards: QuestReward = {
        experience: quest.rewards?.experience || 0,
        gold: quest.rewards?.gold || 0,
        items: finalRewardItems,
        reputation: quest.rewards?.reputation || [],
        other: quest.rewards?.other?.trim() || '',
      };

      // Clean up empty rewards
      if (finalRewards.experience === 0) delete finalRewards.experience;
      if (finalRewards.gold === 0) delete finalRewards.gold;
      if (!finalRewards.items || finalRewards.items.length === 0) delete finalRewards.items;
      if (!finalRewards.reputation || finalRewards.reputation.length === 0) delete finalRewards.reputation;
      if (!finalRewards.other) delete finalRewards.other;

      // Clean up objectives
      const cleanedObjectives = (quest.objectives || []).map(obj => ({
        id: obj.id,
        description: obj.description || 'Objective details missing',
        completed: obj.completed || false,
        type: obj.type || 'other',
        target: obj.target || '',
        targetCount: obj.targetCount || 1,
        currentCount: 0,
        isOptional: obj.isOptional || false,
      }));

      // Prepare final quest data
      const questData = {
        title: quest.title,
        description: quest.description || '',
        status: quest.status || 'available',
        objectives: cleanedObjectives,
        rewards: finalRewards,
        giver: quest.giver || '',
        location: quest.location || '',
        requiredLevel: quest.requiredLevel || 1,
        createdBy: currentUserId || 'unknown',
        updatedAt: serverTimestamp(),
      };

      // Remove undefined fields
      Object.keys(questData).forEach(key => {
        if (questData[key as keyof typeof questData] === undefined) {
          delete questData[key as keyof typeof questData];
        }
      });

      // Save to Firestore
      if (quest.id) {
        // Update existing quest
        const questRef = doc(db, 'quests', quest.id);
        await setDoc(questRef, questData, { merge: true });
        toast({ title: 'Quest Updated', status: 'success', duration: 3000 });
      } else {
        // Create new quest
        const finalQuestData = { ...questData, createdAt: serverTimestamp() };
        await addDoc(collection(db, 'quests'), finalQuestData);
        toast({ title: 'Quest Created', status: 'success', duration: 3000 });
      }

      onSaveComplete();
    } catch (error) {
      console.error('Error saving quest:', error);
      toast({
        title: 'Error',
        description: 'Failed to save quest. Please try again.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box p={{ base: 2, md: 4 }} bg="gray.800" borderRadius="md">
      <VStack spacing={4} align="stretch">
        {/* Title */}
        <FormControl isRequired>
          <FormLabel>Title</FormLabel>
          <Input
            name="title"
            value={quest.title}
            onChange={handleInputChange}
            placeholder="Quest Title"
            bg="gray.700"
            borderColor="gray.600"
          />
        </FormControl>

        {/* Description with Markdown Toggle */}
        <FormControl isRequired>
          <FormLabel>Description</FormLabel>
          <HStack justifyContent="space-between" mb={2}>
            <Text fontSize="sm" color="gray.400">
              Markdown Supported
            </Text>
            <Button
              size="sm"
              variant="outline"
              leftIcon={isPreviewDescription ? <Edit size={16} /> : <Eye size={16} />}
              onClick={() => setIsPreviewDescription((prev) => !prev)}
            >
              {isPreviewDescription ? 'Edit' : 'Preview'}
            </Button>
          </HStack>

          {isPreviewDescription ? (
            <Box
              p={3}
              border="1px solid"
              borderColor="gray.600"
              borderRadius="md"
              bg="gray.700"
              minH="150px"
              overflow="auto"
            >
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{quest.description}</ReactMarkdown>
            </Box>
          ) : (
            <Textarea
              name="description"
              value={quest.description}
              onChange={handleInputChange}
              placeholder="Quest details, story, context... (Markdown supported)"
              minH="150px"
              bg="gray.700"
              borderColor="gray.600"
            />
          )}
        </FormControl>

        {/* Status, quest giver, location */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl>
            <FormLabel>Status</FormLabel>
            <Select 
              name="status" 
              value={quest.status} 
              onChange={handleInputChange}
              bg="gray.700"
              borderColor="gray.600"
            >
              <option value="available">Available</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel>Quest Giver</FormLabel>
            <Input
              name="giver"
              placeholder="e.g., Old Man Willow"
              value={quest.giver || ''}
              onChange={handleInputChange}
              bg="gray.700"
              borderColor="gray.600"
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>Location</FormLabel>
            <Input
              name="location"
              placeholder="e.g., Whispering Woods"
              value={quest.location || ''}
              onChange={handleInputChange}
              bg="gray.700"
              borderColor="gray.600"
            />
          </FormControl>
        </SimpleGrid>

        <FormControl>
          <FormLabel>Required Level</FormLabel>
          <NumberInput
            min={1}
            max={100}
            value={quest.requiredLevel || 1}
            onChange={(_, val) => handleNumberChange('requiredLevel', val)}
            bg="gray.700"
            borderColor="gray.600"
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <Divider my={4} borderColor="gray.600" />

        {/* Objectives */}
        <Heading size="sm" mb={3}>Objectives</Heading>
        
        {/* List of existing objectives */}
        <VStack spacing={3} align="stretch">
          {(quest.objectives || []).map((obj, index) => (
            <Box 
              key={obj.id || index} 
              p={3} 
              bg="gray.750" 
              borderRadius="md"
              borderLeft="4px"
              borderColor="blue.500"
            >
              <HStack mb={2} justify="space-between">
                <Text fontWeight="medium" color="gray.300">
                  Objective #{index + 1}
                </Text>
                <HStack spacing={1}>
                  <IconButton
                    aria-label={obj.isPreview ? "Edit" : "Preview"}
                    icon={obj.isPreview ? <Edit size={16} /> : <Eye size={16} />}
                    size="xs"
                    variant="ghost"
                    onClick={() => toggleObjectivePreview(index)}
                  />
                  <IconButton
                    aria-label="Remove objective"
                    icon={<Trash size={16} />}
                    size="xs"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => removeObjective(index)}
                  />
                </HStack>
              </HStack>
              
              {obj.isPreview ? (
                <Box bg="gray.700" p={3} borderRadius="md" overflow="auto">
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>{obj.description}</ReactMarkdown>
                </Box>
              ) : (
                <VStack spacing={3} align="stretch">
                  <Textarea
                    value={obj.description}
                    onChange={(e) => updateObjective(index, 'description', e.target.value)}
                    placeholder="Objective description..."
                    bg="gray.700"
                    borderColor="gray.600"
                  />
                  
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 2, md: 4 }}>
                    <FormControl size="sm">
                      <FormLabel fontSize="xs">Type</FormLabel>
                      <Select
                        size="sm"
                        value={obj.type || 'other'}
                        onChange={(e) => updateObjective(index, 'type', e.target.value)}
                        bg="gray.700"
                        borderColor="gray.600"
                      >
                        <option value="fetch">Fetch Item</option>
                        <option value="kill">Kill Target</option>
                        <option value="escort">Escort NPC</option>
                        <option value="explore">Explore Area</option>
                        <option value="talk">Talk to NPC</option>
                        <option value="use">Use Item</option>
                        <option value="other">Other</option>
                      </Select>
                    </FormControl>
                    
                    {(obj.type === 'fetch' || obj.type === 'kill' || obj.type === 'escort' || 
                      obj.type === 'talk' || obj.type === 'use') && (
                      <FormControl size="sm">
                        <FormLabel fontSize="xs">Target Name</FormLabel>
                        <Input
                          size="sm"
                          value={obj.target || ''}
                          onChange={(e) => updateObjective(index, 'target', e.target.value)}
                          placeholder="Item ID, NPC Name..."
                          bg="gray.700"
                          borderColor="gray.600"
                        />
                      </FormControl>
                    )}
                    
                    {(obj.type === 'fetch' || obj.type === 'kill') && (
                      <FormControl size="sm">
                        <FormLabel fontSize="xs">Count Required</FormLabel>
                        <NumberInput
                          size="sm"
                          min={1}
                          value={obj.targetCount || 1}
                          onChange={(_, val) => updateObjective(index, 'targetCount', val)}
                          bg="gray.700"
                          borderColor="gray.600"
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    )}
                  </SimpleGrid>
                  
                  <Checkbox
                    isChecked={obj.isOptional || false}
                    onChange={(e) => updateObjective(index, 'isOptional', e.target.checked)}
                    colorScheme="teal"
                  >
                    Optional Objective
                  </Checkbox>
                </VStack>
              )}
            </Box>
          ))}
        </VStack>
        
        {/* Add new objective */}
        <HStack>
          <Input
            placeholder="Add a new objective..."
            value={newObjective}
            onChange={(e) => setNewObjective(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddObjective();
              }
            }}
            bg="gray.700"
            borderColor="gray.600"
          />
          <Button
            leftIcon={<Plus size={18} />}
            onClick={handleAddObjective}
            colorScheme="blue"
            isDisabled={!newObjective.trim()}
          >
            Add
          </Button>
        </HStack>

        <Divider my={4} borderColor="gray.600" />

        {/* Rewards */}
        <Heading size="sm" mb={3}>Rewards</Heading>
        <Box p={4} bg="gray.750" borderRadius="md">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <FormControl>
              <FormLabel>Experience</FormLabel>
              <NumberInput
                bg="gray.700"
                borderColor="gray.600"
                min={0}
                value={quest.rewards?.experience || 0}
                onChange={(_, val) => handleRewardChange('experience', val)}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            
            <FormControl>
              <FormLabel>Gold</FormLabel>
              <NumberInput
                bg="gray.700"
                borderColor="gray.600"
                min={0}
                value={quest.rewards?.gold || 0}
                onChange={(_, val) => handleRewardChange('gold', val)}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </SimpleGrid>
          
          <FormControl mb={4}>
            <FormLabel>Item Rewards</FormLabel>
            <Text fontSize="sm" color="gray.400" mb={2}>
              Note: This version doesn't implement the item selector component.
              The full implementation would include an ItemSelect component here.
            </Text>
            
            {/* Display current reward items */}
            {quest.rewards?.items && quest.rewards.items.length > 0 ? (
              <VStack align="stretch" spacing={2} mb={4}>
                {quest.rewards.items.map((item, idx) => (
                  <HStack key={item.id || idx} bg="gray.700" p={2} borderRadius="md">
                    <Text>{item.name}</Text>
                    <Badge colorScheme="green">x{item.quantity}</Badge>
                    <IconButton
                      aria-label="Remove item"
                      icon={<Trash size={14} />}
                      size="xs"
                      colorScheme="red"
                      variant="ghost"
                      ml="auto"
                      onClick={() => {
                        const newItems = [...(quest.rewards?.items || [])];
                        newItems.splice(idx, 1);
                        handleRewardChange('items', newItems);
                      }}
                    />
                  </HStack>
                ))}
              </VStack>
            ) : (
              <Text fontSize="sm" color="gray.500" fontStyle="italic">No item rewards added</Text>
            )}
          </FormControl>
          
          <FormControl>
            <FormLabel>Other Rewards</FormLabel>
            <Textarea
              name="otherRewards"
              placeholder="Describe any other rewards..."
              value={quest.rewards?.other || ''}
              onChange={(e) => handleRewardChange('other', e.target.value)}
              bg="gray.700"
              borderColor="gray.600"
            />
          </FormControl>
        </Box>

        {/* Submit/Cancel Buttons */}
        <HStack 
          justifyContent="flex-end" 
          mt={6}
          spacing={3}
          flexDirection={{ base: "column", sm: "row" }}
        >
          <Button 
            variant="outline" 
            onClick={onCancel}
            width={{ base: "full", sm: "auto" }}
            order={{ base: 2, sm: 1 }}
          >
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="Saving..."
            leftIcon={<Save size={16} />}
            width={{ base: "full", sm: "auto" }}
            order={{ base: 1, sm: 2 }}
          >
            {quest.id ? 'Update Quest' : 'Create Quest'}
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default DMQuestEditor;