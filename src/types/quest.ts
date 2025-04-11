// Create a file at src/types/quest.ts (replacing the existing one)

import { Timestamp } from 'firebase/firestore';

/**
 * Defines the structure for a single objective within a quest.
 */
export interface QuestObjective {
    id: string;              // Unique identifier for the objective
    description: string;     // Text describing what needs to be done
    completed?: boolean;     // Whether the objective has been completed
    type?: string;           // Type of objective (fetch, kill, etc.)
    target?: string;         // Target of the objective (item, monster, etc.)
    targetCount?: number;    // Number of targets needed
    currentCount?: number;   // Current progress count
    isOptional?: boolean;    // Whether the objective is optional
    isPreview?: boolean;     // UI state for preview mode
}

/**
 * Defines the structure for quest rewards
 */
export interface RewardItem {
    id: string;
    name: string;
    quantity: number;
    [key: string]: any;      // Allow additional properties
}

export interface QuestReward {
    experience?: number;
    gold?: number;
    items?: RewardItem[];
    reputation?: { faction: string; amount: number }[];
    other?: string;
}

/**
 * Defines the quest status type
 * Making sure "undefined" isn't a possible value, just a possible type
 */
export type QuestStatus = 'available' | 'active' | 'completed' | 'failed';

/**
 * Represents the main definition of a quest.
 */
export interface Quest {
    id?: string;               // Firestore document ID (optional until saved)
    title: string;             // The primary name of the quest
    description: string;       // Full description with story and details
    status: QuestStatus;       // Current status of the quest
    objectives: QuestObjective[]; // Required objectives to complete
    rewards: QuestReward;      // Rewards for completion
    
    // Optional fields
    giver?: string;            // NPC who gives the quest
    location?: string;         // Quest location
    requiredLevel?: number;    // Minimum level to accept quest
    createdBy?: string;        // User ID of creator
    createdAt?: Timestamp | any; // Creation timestamp
    updatedAt?: Timestamp | any; // Last update timestamp
}