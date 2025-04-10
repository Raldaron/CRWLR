// g:/CRWLR/src/components/admin/items/DMItemEditor.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  Spinner,
  useToast,
  Heading,
  SimpleGrid,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  Divider,
  Text,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  IconButton,
} from '@chakra-ui/react';
import { Save, X, Plus, Trash } from 'lucide-react';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import type { InventoryItem } from '@/types/inventory';

// Define Item type locally, ensuring optional fields and nested magic properties
type Item = InventoryItem & {
  collectionName?: string;
  id?: string;
  statBonus?: { [key: string]: number };
  skillBonus?: { [key: string]: number };
  abilities?: string[];
  traits?: string[];
  magicProperties?: InventoryItem['magicProperties'] & {
    additionalEffects?: { name: string; description: string }[];
    scaling?: { level: number; effect: string }[];
    spellsGranted?: string[];
    castingTime?: string;
    manaCost?: number;
    cooldown?: string;
  };
};

interface DMItemEditorProps {
  itemToEdit: Item | null;
  onSaveComplete: () => void;
  onCancel: () => void;
}

// Constants for dropdowns and common stats/skills
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
const RARITIES = [
  'Common',
  'Uncommon',
  'Rare',
  'Very Rare',
  'Epic',
  'Legendary',
  'Unique',
  'Artifact',
  'Exceedingly Rare'
];
const COMMON_STATS = ['strength', 'dexterity', 'stamina', 'intelligence', 'perception', 'wit', 'charisma'];
const COMMON_SKILLS = [
  'melee',
  'ranged-combat',
  'archery',
  'firearms',
  'stealth',
  'arcana',
  'medicine',
  'survival',
  'persuasion',
  'intimidation',
  'athletics',
  'acrobatics',
  'engineering',
  'alchemy'
];

// Default empty structure for nested magic properties
const defaultMagicProperties = {
  additionalEffects: [] as { name: string; description: string }[],
  scaling: [] as { level: number; effect: string }[],
  spellsGranted: [] as string[],
  castingTime: '',
  manaCost: 0,
  cooldown: ''
};

const DMItemEditor: React.FC<DMItemEditorProps> = ({ itemToEdit, onSaveComplete, onCancel }) => {
  // Function to initialize state merging existing item data with defaults
  const getInitialState = (): Partial<Item> => {
    if (itemToEdit) {
      return {
        ...itemToEdit,
        statBonus: itemToEdit.statBonus || {},
        skillBonus: itemToEdit.skillBonus || {},
        abilities: itemToEdit.abilities || [],
        traits: itemToEdit.traits || [],
        quantity: itemToEdit.quantity ?? 1,
        magicProperties: {
          ...(itemToEdit.magicProperties || {}),
          additionalEffects: itemToEdit.magicProperties?.additionalEffects || [],
          scaling: itemToEdit.magicProperties?.scaling || [],
          spellsGranted: itemToEdit.magicProperties?.spellsGranted || [],
          castingTime: itemToEdit.magicProperties?.castingTime || '',
          manaCost: itemToEdit.magicProperties?.manaCost ?? 0,
          cooldown: itemToEdit.magicProperties?.cooldown || ''
        }
      };
    } else {
      return {
        itemType: 'Miscellaneous',
        rarity: 'Common',
        quantity: 1,
        statBonus: {},
        skillBonus: {},
        abilities: [],
        traits: [],
        magicProperties: { ...defaultMagicProperties }
      };
    }
  };

  const [itemData, setItemData] = useState<Partial<Item>>(getInitialState());
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Temporary state for nested array inputs (Additional Effects and Scaling)
  const [newEffectName, setNewEffectName] = useState('');
  const [newEffectDesc, setNewEffectDesc] = useState('');
  const [newScalingLevel, setNewScalingLevel] = useState<number | string>(1);
  const [newScalingEffect, setNewScalingEffect] = useState('');

  useEffect(() => {
    setItemData(getInitialState());
    setNewEffectName('');
    setNewEffectDesc('');
    setNewScalingLevel(1);
    setNewScalingEffect('');
  }, [itemToEdit]);

  // --- General Change Handlers ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === 'abilities_input' || name === 'traits_input') {
      const key = name === 'abilities_input' ? 'abilities' : 'traits';
      const arrayValue = value.split(',').map(s => s.trim()).filter(Boolean);
      setItemData(prev => ({ ...prev, [key]: arrayValue }));
    } else if (name === 'spellsGranted_input') {
      const arrayValue = value.split(',').map(s => s.trim()).filter(Boolean);
      setItemData(prev => ({
        ...prev,
        magicProperties: { ...(prev.magicProperties || defaultMagicProperties), spellsGranted: arrayValue }
      }));
    } else {
      setItemData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
      }));
    }
  };

  const handleNestedChange = (category: keyof Item, key: string, value: any) => {
    setItemData(prev => {
      const currentCategory = (prev[category] as object | undefined) || {};
      return { ...prev, [category]: { ...currentCategory, [key]: value } };
    });
  };

  const handleNumberChange = (name: string, valueAsString: string, valueAsNumber: number) => {
    setItemData(prev => ({ ...prev, [name]: isNaN(valueAsNumber) ? 0 : valueAsNumber }));
  };

  const handleNestedNumberChange = (category: keyof Item, key: string, valueAsNumber: number) => {
    setItemData(prev => {
      const currentCategory = (prev[category] as { [key: string]: any } | undefined) || {};
      const newValue = isNaN(valueAsNumber) ? 0 : valueAsNumber;
      if (newValue === 0) {
        const { [key]: _, ...rest } = currentCategory;
        return { ...prev, [category]: Object.keys(rest).length > 0 ? rest : {} };
      } else {
        return { ...prev, [category]: { ...currentCategory, [key]: newValue } };
      }
    });
  };

  // --- Handlers for Additional Effects ---
  const handleAddAdditionalEffect = () => {
    if (!newEffectName.trim() || !newEffectDesc.trim()) return;
    const newEffect = { name: newEffectName, description: newEffectDesc };
    const currentEffects = itemData.magicProperties?.additionalEffects || [];
    handleNestedChange('magicProperties', 'additionalEffects', [...currentEffects, newEffect]);
    setNewEffectName('');
    setNewEffectDesc('');
  };

  const handleRemoveAdditionalEffect = (index: number) => {
    const currentEffects = itemData.magicProperties?.additionalEffects || [];
    handleNestedChange(
      'magicProperties',
      'additionalEffects',
      currentEffects.filter((_: { name: string; description: string }, i: number) => i !== index)
    );
  };

  // --- Handlers for Scaling ---
  const handleAddScaling = () => {
    const level = parseInt(String(newScalingLevel), 10);
    if (isNaN(level) || level < 1 || !newScalingEffect.trim()) return;
    const newRule = { level, effect: newScalingEffect };
    const currentScaling = itemData.magicProperties?.scaling || [];
    const updatedScaling = [...currentScaling, newRule].sort((a, b) => a.level - b.level);
    handleNestedChange('magicProperties', 'scaling', updatedScaling);
    setNewScalingLevel(1);
    setNewScalingEffect('');
  };

  const handleRemoveScaling = (index: number) => {
    const currentScaling = itemData.magicProperties?.scaling || [];
    handleNestedChange(
      'magicProperties',
      'scaling',
      currentScaling.filter((_: { level: number; effect: string }, i: number) => i !== index)
    );
  };

  // --- Firestore Interaction ---
  const getTargetCollection = (itemType: string | undefined): string => {
    switch (itemType) {
      case 'Weapon': return 'weapons';
      case 'Armor': return 'armor';
      case 'Ammunition': return 'ammunition';
      case 'Potion': return 'potions';
      case 'Scroll': return 'scrolls';
      case 'Crafting Component': return 'crafting_components';
      case 'Trap': return 'traps';
      case 'Explosive': return 'explosives';
      case 'Throwable': return 'explosives';
      case 'Miscellaneous': return 'miscellaneous_items';
      default: return 'miscellaneous_items';
    }
  };

  const handleSave = async () => {
    if (!itemData.name || !itemData.itemType) {
      toast({ title: 'Error', description: 'Item Name and Type are required.', status: 'error' });
      return;
    }
    setIsLoading(true);
    const collectionName = getTargetCollection(itemData.itemType);
    const nowTimestamp = serverTimestamp();
    let dataToSave: any = { ...itemData, lastUpdated: nowTimestamp };

    // Ensure quantity is valid
    dataToSave.quantity = typeof dataToSave.quantity === 'number' && dataToSave.quantity >= 0 ? dataToSave.quantity : 1;

    // Data cleaning
    delete dataToSave.collectionName;
    delete dataToSave.id;

    ['statBonus', 'skillBonus'].forEach(key => {
      if (dataToSave[key] && Object.keys(dataToSave[key]).length === 0) {
        delete dataToSave[key];
      }
    });
    ['abilities', 'traits'].forEach(key => {
      if (Array.isArray(dataToSave[key]) && dataToSave[key].length === 0) {
        delete dataToSave[key];
      }
    });

    if (dataToSave.magicProperties) {
      const mp = dataToSave.magicProperties;
      mp.additionalEffects = mp.additionalEffects || [];
      mp.scaling = mp.scaling || [];
      mp.spellsGranted = mp.spellsGranted || [];

      if (mp.additionalEffects.length === 0) delete mp.additionalEffects;
      if (mp.scaling.length === 0) delete mp.scaling;
      if (mp.spellsGranted.length === 0) delete mp.spellsGranted;

      const isEmptyMagic = (
        !mp.castingTime && !mp.manaCost && !mp.cooldown &&
        (!mp.additionalEffects || mp.additionalEffects.length === 0) &&
        (!mp.scaling || mp.scaling.length === 0) &&
        (!mp.spellsGranted || mp.spellsGranted.length === 0)
      );
      if (isEmptyMagic) {
        delete dataToSave.magicProperties;
      }
    }

    Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key] === undefined) delete dataToSave[key];
    });

    console.log("Final data to save:", JSON.stringify(dataToSave, null, 2));

    try {
      if (itemToEdit?.id) {
        const itemRef = doc(db, collectionName, itemToEdit.id);
        await setDoc(itemRef, dataToSave, { merge: true });
        toast({ title: 'Item Updated', status: 'success' });
      } else {
        dataToSave.createdAt = nowTimestamp;
        await addDoc(collection(db, collectionName), dataToSave);
        toast({ title: 'Item Created', status: 'success' });
      }
      onSaveComplete();
    } catch (error) {
      console.error("Error saving item:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Error Saving Item', description: `Could not save item: ${errorMessage}`, status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Rendering Functions ---
  const renderCommonFields = () => (
    <>
      <FormControl isRequired>
        <FormLabel color="gray.300">Item Name</FormLabel>
        <Input name="name" value={itemData.name || ''} onChange={handleChange} bg="gray.700" borderColor="gray.600" />
      </FormControl>
      <FormControl>
        <FormLabel color="gray.300">Description</FormLabel>
        <Textarea name="description" value={itemData.description || ''} onChange={handleChange} bg="gray.700" borderColor="gray.600" />
      </FormControl>
      <HStack spacing={4}>
        <FormControl isRequired flex="1">
          <FormLabel color="gray.300">Item Type</FormLabel>
          <Select name="itemType" value={itemData.itemType || ''} onChange={handleChange} bg="gray.700" borderColor="gray.600" iconColor="gray.400">
            {ITEM_TYPES.map(type => (
              <option key={type} value={type} style={{ backgroundColor: "#2D3748", color: "#E2E8F0" }}>
                {type}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl isRequired flex="1">
          <FormLabel color="gray.300">Rarity</FormLabel>
          <Select name="rarity" value={itemData.rarity || 'Common'} onChange={handleChange} bg="gray.700" borderColor="gray.600" iconColor="gray.400">
            {RARITIES.map(rarity => (
              <option key={rarity} value={rarity} style={{ backgroundColor: "#2D3748", color: "#E2E8F0" }}>
                {rarity}
              </option>
            ))}
          </Select>
        </FormControl>
      </HStack>
      <HStack spacing={4}>
        <FormControl>
          <FormLabel color="gray.300">HP Bonus</FormLabel>
          <NumberInput name="hpBonus" value={itemData.hpBonus || 0} onChange={(valStr, valNum) => handleNumberChange('hpBonus', valStr, valNum)} min={0} bg="gray.700" borderColor="gray.600">
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
        <FormControl>
          <FormLabel color="gray.300">MP Bonus</FormLabel>
          <NumberInput name="mpBonus" value={itemData.mpBonus || 0} onChange={(valStr, valNum) => handleNumberChange('mpBonus', valStr, valNum)} min={0} bg="gray.700" borderColor="gray.600">
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
        <FormControl>
          <FormLabel color="gray.300">Quantity</FormLabel>
          <NumberInput name="quantity" value={itemData.quantity ?? 1} onChange={(valStr, valNum) => handleNumberChange('quantity', valStr, valNum)} min={0} bg="gray.700" borderColor="gray.600">
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
      </HStack>
      <Divider borderColor="gray.600" my={4} />
      <Box>
        <Heading size="sm" mb={3} color="gray.300">Stat Bonuses</Heading>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
          {COMMON_STATS.map(stat => (
            <FormControl key={stat}>
              <FormLabel fontSize="sm" color="gray.400" textTransform="capitalize">{stat}</FormLabel>
              <NumberInput size="sm" value={itemData.statBonus?.[stat] || 0} onChange={(_: string, valNum: number) => handleNestedNumberChange('statBonus', stat, valNum)} bg="gray.700" borderColor="gray.600">
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          ))}
        </SimpleGrid>
      </Box>
      <Box>
        <Heading size="sm" mb={3} color="gray.300">Skill Bonuses</Heading>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
          {COMMON_SKILLS.map(skill => (
            <FormControl key={skill}>
              <FormLabel fontSize="sm" color="gray.400" textTransform="capitalize">{skill}</FormLabel>
              <NumberInput size="sm" value={itemData.skillBonus?.[skill] || 0} onChange={(_: string, valNum: number) => handleNestedNumberChange('skillBonus', skill, valNum)} bg="gray.700" borderColor="gray.600">
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          ))}
        </SimpleGrid>
      </Box>
      <HStack spacing={4} align="start">
        <FormControl>
          <FormLabel color="gray.300">Abilities (Comma-separated)</FormLabel>
          <Textarea name="abilities_input" value={(itemData.abilities || []).join(', ')} onChange={handleChange} placeholder="AbilityOne, AbilityTwo" bg="gray.700" borderColor="gray.600" rows={2} />
          <Wrap mt={2}>
            {(itemData.abilities || []).map(ab => ab && (
              <Tag size="sm" key={ab} variant="subtle" colorScheme="cyan" mr={1} mb={1}>
                <TagLabel>{ab}</TagLabel>
              </Tag>
            ))}
          </Wrap>
        </FormControl>
        <FormControl>
          <FormLabel color="gray.300">Traits (Comma-separated)</FormLabel>
          <Textarea name="traits_input" value={(itemData.traits || []).join(', ')} onChange={handleChange} placeholder="TraitOne, TraitTwo" bg="gray.700" borderColor="gray.600" rows={2} />
          <Wrap mt={2}>
            {(itemData.traits || []).map(tr => tr && (
              <Tag size="sm" key={tr} variant="subtle" colorScheme="purple" mr={1} mb={1}>
                <TagLabel>{tr}</TagLabel>
              </Tag>
            ))}
          </Wrap>
        </FormControl>
      </HStack>
    </>
  );

  // Placeholder functions for type-specific fields (implement as needed)
  const renderWeaponFields = () => ( null );
  const renderArmorFields = () => ( null );
  const renderCombatFields = () => ( null );

  // --- Render Magical Properties with full UI implementation ---
  const renderMagicFields = () => (
    <Box mt={4} pt={4} borderTop="1px" borderColor="gray.600">
      <Heading size="sm" mb={3} color="gray.300">Magical Properties</Heading>
      <FormControl mb={3}>
        <FormLabel color="gray.300">Primary Effect</FormLabel>
        <Textarea name="effect" value={itemData.effect || ''} onChange={handleChange} placeholder="Describe the item's primary effect" bg="gray.700" borderColor="gray.600" />
      </FormControl>
      <HStack spacing={4} mb={3}>
        <FormControl>
          <FormLabel color="gray.300">Duration (Optional)</FormLabel>
          <Input name="duration" value={itemData.duration?.toString() || ''} onChange={handleChange} placeholder="e.g., 1 minute" bg="gray.700" borderColor="gray.600" />
        </FormControl>
        <FormControl>
          <FormLabel color="gray.300">Range (Optional)</FormLabel>
          <Input name="range" value={itemData.range?.toString() || ''} onChange={handleChange} placeholder="e.g., Touch, 30 ft" bg="gray.700" borderColor="gray.600" />
        </FormControl>
      </HStack>
      <HStack spacing={4} mb={4}>
        <FormControl>
          <FormLabel color="gray.300">Casting Time (Optional)</FormLabel>
          <Input name="castingTime" value={itemData.magicProperties?.castingTime || ''} onChange={(e) => handleNestedChange('magicProperties', 'castingTime', e.target.value)} placeholder="e.g., 1 Action" bg="gray.700" borderColor="gray.600" />
        </FormControl>
        <FormControl>
          <FormLabel color="gray.300">Mana Cost (Optional)</FormLabel>
          <NumberInput name="manaCost" value={itemData.magicProperties?.manaCost || 0} onChange={(valStr, valNum) => handleNestedNumberChange('magicProperties', 'manaCost', valNum)} min={0} bg="gray.700" borderColor="gray.600">
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
        <FormControl>
          <FormLabel color="gray.300">Cooldown (Optional)</FormLabel>
          <Input name="cooldown" value={itemData.magicProperties?.cooldown || ''} onChange={(e) => handleNestedChange('magicProperties', 'cooldown', e.target.value)} placeholder="e.g., 1 turn, 1 hour" bg="gray.700" borderColor="gray.600" />
        </FormControl>
      </HStack>
      <Divider borderColor="gray.700" my={4} />
      <FormControl mb={4}>
        <FormLabel color="gray.300">Spells Granted (Comma-separated)</FormLabel>
        <Textarea
          name="spellsGranted_input"
          value={(itemData.magicProperties?.spellsGranted || []).join(', ')}
          onChange={handleChange}
          placeholder="e.g., Fireball, Heal Minor Wounds"
          bg="gray.700" borderColor="gray.600" rows={2}
        />
        <Wrap mt={2}>
          {(itemData.magicProperties?.spellsGranted || []).map((spell: string) => spell && (
            <Tag size="sm" key={spell} variant="subtle" colorScheme="green" mr={1} mb={1}>
              <TagLabel>{spell}</TagLabel>
            </Tag>
          ))}
        </Wrap>
      </FormControl>
      <Divider borderColor="gray.700" my={4} />
      <Box mb={4}>
        <Heading size="xs" mb={2} color="gray.400">Additional Effects</Heading>
        <VStack spacing={2} align="stretch" mb={3} p={2} bg="gray.750" borderRadius="md">
          {(itemData.magicProperties?.additionalEffects || []).map((effect: { name: string; description: string }, index: number) => (
            <HStack key={index} justify="space-between">
              <Box>
                <Text fontWeight="medium" color="gray.200">{effect.name}</Text>
                <Text fontSize="xs" color="gray.400">{effect.description}</Text>
              </Box>
              <IconButton
                aria-label="Remove effect" icon={<Trash size={14} />}
                size="xs" colorScheme="red" variant="ghost"
                onClick={() => handleRemoveAdditionalEffect(index)}
              />
            </HStack>
          ))}
          {(!itemData.magicProperties?.additionalEffects || itemData.magicProperties.additionalEffects.length === 0) && (
            <Text color="gray.500" fontSize="sm" textAlign="center">No additional effects.</Text>
          )}
        </VStack>
        <HStack spacing={2}>
          <Input size="sm" placeholder="Effect Name" value={newEffectName} onChange={(e) => setNewEffectName(e.target.value)} bg="gray.700" />
          <Input size="sm" placeholder="Effect Description" value={newEffectDesc} onChange={(e) => setNewEffectDesc(e.target.value)} bg="gray.700" />
          <Button size="sm" leftIcon={<Plus size={16} />} colorScheme="blue" onClick={handleAddAdditionalEffect} isDisabled={!newEffectName || !newEffectDesc}>
            Add Effect
          </Button>
        </HStack>
      </Box>
      <Divider borderColor="gray.700" my={4} />
      <Box>
        <Heading size="xs" mb={2} color="gray.400">Scaling Rules</Heading>
        <VStack spacing={2} align="stretch" mb={3} p={2} bg="gray.750" borderRadius="md">
          {(itemData.magicProperties?.scaling || []).map((rule: { level: number; effect: string }, index: number) => (
            <HStack key={index} justify="space-between">
              <Box>
                <Text fontWeight="medium" color="gray.200">Level {rule.level}:</Text>
                <Text fontSize="xs" color="gray.400">{rule.effect}</Text>
              </Box>
              <IconButton
                aria-label="Remove scaling rule" icon={<Trash size={14} />}
                size="xs" colorScheme="red" variant="ghost"
                onClick={() => handleRemoveScaling(index)}
              />
            </HStack>
          ))}
          {(!itemData.magicProperties?.scaling || itemData.magicProperties.scaling.length === 0) && (
            <Text color="gray.500" fontSize="sm" textAlign="center">No scaling rules.</Text>
          )}
        </VStack>
        <HStack spacing={2}>
          <NumberInput size="sm" min={1} value={newScalingLevel} onChange={(valStr, valNum) => setNewScalingLevel(isNaN(valNum) ? '' : valNum)} bg="gray.700" w="100px">
            <NumberInputField placeholder="Level" />
          </NumberInput>
          <Input size="sm" placeholder="Scaling Effect Description" value={newScalingEffect} onChange={(e) => setNewScalingEffect(e.target.value)} bg="gray.700" />
          <Button size="sm" leftIcon={<Plus size={16} />} colorScheme="blue" onClick={handleAddScaling} isDisabled={!newScalingLevel || !newScalingEffect}>
            Add Rule
          </Button>
        </HStack>
      </Box>
    </Box>
  );

  return (
    <Box p={5} bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700">
      <Heading size="md" mb={4} color="gray.200">
        {itemToEdit ? `Edit Item: ${itemData.name || itemToEdit.name || 'Unnamed'}` : 'Create New Item'}
      </Heading>
      <VStack spacing={4} align="stretch">
        {renderCommonFields()}
        {itemData.itemType === 'Weapon' && renderWeaponFields()}
        {itemData.itemType === 'Armor' && renderArmorFields()}
        {['Scroll', 'Potion', 'Weapon', 'Armor', 'Wand'].includes(itemData.itemType || '') && renderMagicFields()}
        {['Explosive', 'Throwable', 'Trap', 'Ammunition'].includes(itemData.itemType || '') && renderCombatFields()}
        <HStack justifyContent="flex-end" mt={5} pt={4} borderTop="1px" borderColor="gray.600">
          <Button leftIcon={<X size={18} />} variant="ghost" onClick={onCancel} color="gray.400" _hover={{ bg: "gray.700" }}>
            Cancel
          </Button>
          <Button leftIcon={<Save size={18} />} colorScheme="brand" onClick={handleSave} isLoading={isLoading} loadingText="Saving...">
            {itemToEdit ? 'Save Changes' : 'Create Item'}
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default DMItemEditor;