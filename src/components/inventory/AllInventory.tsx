import React, { useState } from 'react';
import {
  Box,
  Text,
  SimpleGrid,
  VStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  HStack,
  Badge,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { Search, Plus, Minus, Package } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WeaponCard } from '@/components/ItemCards/WeaponCard';
import { ArmorCard } from '@/components/ItemCards/ArmorCard';
import { AmmunitionCard } from '@/components/ItemCards/AmmunitionCard';
import { ExplosivesCard } from '@/components/ItemCards/ExplosivesCard';
import { ScrollCard } from '@/components/ItemCards/ScrollCard';
import { PotionCard } from '@/components/ItemCards/PotionCard';
import { TrapCard } from '@/components/ItemCards/TrapCard';
import { CraftingComponentCard } from '@/components/ItemCards/CraftingComponentCard';
import WeaponDetailModal from '@/components/Modals/WeaponDetailModal';
import ArmorDetailModal from '@/components/Modals/ArmorDetailModal';
import AmmunitionDetailModal from '@/components/Modals/AmmunitionDetailModal';
import ExplosivesDetailModal from '@/components/Modals/ExplosivesDetailModal'; 
import ScrollDetailModal from '@/components/Modals/ScrollDetailModal';
import PotionDetailModal from '@/components/Modals/PotionDetailModal';
import TrapDetailModal from '@/components/Modals/TrapDetailModal';
import CraftingComponentDetailModal from '@/components/Modals/CraftingComponentDetailModal';
import { WeaponItem } from '@/types/weapon';  
import { ArmorItem } from '@/types/armor';
import { AmmunitionItem } from '@/types/ammunition';
import { ExplosiveItem } from '@/types/explosives';
import { TrapItem } from '@/types/trap';
import { PotionItem } from '@/types/potion';
import { CraftingComponentItem } from '@/types/craftingcomponent';
import { ScrollItem } from '@/types/scroll';
import { useCharacter } from '@/context/CharacterContext';

interface BaseInventoryItem {
  id: string;
  name: string;
  description: string;
  rarity?: string;
  itemType: string;
  duration?: number;
}

type AllInventoryItem = 
  | (WeaponItem & BaseInventoryItem)
  | (ArmorItem & BaseInventoryItem)
  | (AmmunitionItem & BaseInventoryItem)
  | (ExplosiveItem & BaseInventoryItem)
  | (TrapItem & BaseInventoryItem)
  | (PotionItem & BaseInventoryItem)
  | (CraftingComponentItem & BaseInventoryItem)
  | (ScrollItem & BaseInventoryItem);

const AllInventory: React.FC = () => {
  const {
    inventory,
    addToInventory,
    removeFromInventory,
  } = useCharacter();

  const [selectedItem, setSelectedItem] = useState<AllInventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filteredInventory = inventory.filter((inventoryItem) => {
    const item = inventoryItem.item;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRarity = !rarityFilter || item.rarity === rarityFilter;
    const matchesType = !typeFilter || item.itemType === typeFilter;

    return matchesSearch && matchesRarity && matchesType;
  });

  return (
    <Box p={4}>
      <VStack spacing={4} mb={4}>
        <InputGroup>
          <InputLeftElement>
            <Search className="h-4 w-4 text-gray-400" />
          </InputLeftElement>
          <Input
            placeholder="Search all inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
      </VStack>
      {filteredInventory.length === 0 ? (
        <VStack py={8} spacing={4}>
          <Text color="gray.500">Your inventory is empty</Text>
        </VStack>
      ) : (
        <ScrollArea className="h-[600px]">
          <SimpleGrid columns={[1, 2, 3]} spacing={4}>
            {filteredInventory.map((inventoryItem) => (
              <Box key={inventoryItem.item.id}>
                <Text>{inventoryItem.item.name}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </ScrollArea>
      )}
    </Box>
  );
};

export default AllInventory;
