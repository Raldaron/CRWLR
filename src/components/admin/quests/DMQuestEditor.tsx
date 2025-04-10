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
} from '@chakra-ui/react';
import { Quest } from '@/types/quest';

interface DMQuestEditorProps {
  questToEdit: Quest | null;
  onSaveComplete: () => void;
  onCancel: () => void;
}

// Default empty quest structure
const defaultQuest: Quest = {
  id: '',
  title: '',
  description: '',
  status: 'available',
  type: 'main',
  difficulty: 'normal',
  recommendedLevel: 1,
  goldReward: 0,
  itemRewards: [],
  xpReward: 0,
  assignedTo: [],
  location: '',
  completionCriteria: '',
  isHidden: false,
  createdAt: new Date().getTime(),
  updatedAt: new Date().getTime(),
  objectives: [],
  rewards: [],
};

const DMQuestEditor: React.FC<DMQuestEditorProps> = ({
  questToEdit,
  onSaveComplete,
  onCancel,
}) => {
  // State for quest data
  const [quest, setQuest] = useState<Quest>(defaultQuest);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Initialize with the quest to edit or default values
  useEffect(() => {
    if (questToEdit) {
      setQuest(questToEdit);
    } else {
      setQuest({
        ...defaultQuest,
        id: `quest_${Date.now()}`, // Generate a unique ID
      });
    }
  }, [questToEdit]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setQuest((prev) => ({ ...prev, [name]: value }));
  };

  // Handle number input changes
  const handleNumberChange = (name: string, value: number) => {
    setQuest((prev) => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setQuest((prev) => ({ ...prev, [name]: checked }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!quest.title.trim() || !quest.description.trim()) {
        toast({
          title: 'Missing Information',
          description: 'Title and description are required.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setIsSubmitting(false);
        return;
      }

      // Update timestamps
      const updatedQuest: Quest = {
        ...quest,
        updatedAt: new Date().getTime(),
        createdAt: quest.createdAt || new Date().getTime(),
      };

      // Here you would typically save to your database
      // For this example, we'll just simulate a successful save
      setTimeout(() => {
        toast({
          title: 'Quest Saved',
          description: `Quest "${updatedQuest.title}" has been saved successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setIsSubmitting(false);
        onSaveComplete();
      }, 1000);
    } catch (error) {
      console.error('Error saving quest:', error);
      toast({
        title: 'Error',
        description: 'Failed to save quest. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} p={4} bg="gray.800" borderRadius="md">
      <VStack spacing={4} align="start">
        <FormControl isRequired>
          <FormLabel>Quest Title</FormLabel>
          <Input
            name="title"
            value={quest.title}
            onChange={handleInputChange}
            placeholder="Enter quest title"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Description</FormLabel>
          <Textarea
            name="description"
            value={quest.description}
            onChange={handleInputChange}
            placeholder="Enter quest description"
            minH="150px"
          />
        </FormControl>

        <HStack spacing={4} width="100%">
          <FormControl>
            <FormLabel>Status</FormLabel>
            <Select name="status" value={quest.status} onChange={handleInputChange}>
              <option value="available">Available</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Type</FormLabel>
            <Select name="type" value={quest.type} onChange={handleInputChange}>
              <option value="main">Main Quest</option>
              <option value="side">Side Quest</option>
              <option value="daily">Daily</option>
              <option value="world">World Event</option>
            </Select>
          </FormControl>
        </HStack>

        <HStack spacing={4} width="100%">
          <FormControl>
            <FormLabel>Difficulty</FormLabel>
            <Select name="difficulty" value={quest.difficulty} onChange={handleInputChange}>
              <option value="trivial">Trivial</option>
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
              <option value="challenging">Challenging</option>
              <option value="epic">Epic</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Recommended Level</FormLabel>
            <NumberInput
              min={1}
              max={100}
              value={quest.recommendedLevel}
              onChange={(_, value) => handleNumberChange('recommendedLevel', value)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </HStack>

        <HStack spacing={4} width="100%">
          <FormControl>
            <FormLabel>Gold Reward</FormLabel>
            <NumberInput
              min={0}
              value={quest.goldReward}
              onChange={(_, value) => handleNumberChange('goldReward', value)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl>
            <FormLabel>XP Reward</FormLabel>
            <NumberInput
              min={0}
              value={quest.xpReward}
              onChange={(_, value) => handleNumberChange('xpReward', value)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </HStack>

        <FormControl>
          <FormLabel>Location</FormLabel>
          <Input
            name="location"
            value={quest.location}
            onChange={handleInputChange}
            placeholder="Quest location"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Completion Criteria</FormLabel>
          <Textarea
            name="completionCriteria"
            value={quest.completionCriteria}
            onChange={handleInputChange}
            placeholder="What must be done to complete this quest?"
          />
        </FormControl>

        <FormControl>
          <Checkbox
            name="isHidden"
            isChecked={quest.isHidden}
            onChange={handleCheckboxChange}
          >
            Hidden Quest (not visible to players until revealed)
          </Checkbox>
        </FormControl>

        <HStack spacing={4} mt={4} width="100%" justifyContent="flex-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            type="submit"
            isLoading={isSubmitting}
            loadingText="Saving..."
          >
            Save Quest
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default DMQuestEditor;