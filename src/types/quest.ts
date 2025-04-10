// types/quest.ts

import { Timestamp } from 'firebase/firestore'; // Import Timestamp type if using Firestore timestamps

/**
 * Defines the structure for a single objective within a quest.
 */
export interface QuestObjective {
    id: string;             // Unique identifier for the objective within the quest (e.g., "obj-12345")
    description: string;    // Text describing what needs to be done.
    isOptional?: boolean;   // Flag indicating if this objective is optional for quest completion.
    target?: string;        // Optional identifier for the target (e.g., item ID, NPC name, location key).
    targetCount?: number;   // Optional count needed for the target (e.g., collect 5 herbs, kill 3 goblins).
    isHidden?: boolean;     // Optional flag if the objective is initially hidden from the player.
}

/**
 * Defines the possible types for quest rewards.
 */
export type QuestRewardType = 'xp' | 'gold' | 'item' | 'reputation' | 'ability' | 'other';

/**
 * Defines the structure for a reward given upon quest completion.
 */
export interface QuestReward {
    type: QuestRewardType;   // The type of reward.
    value: number | string;  // Amount for xp/gold, Item ID/Name for item, Faction ID/Name for reputation, Ability Name for ability, or description for 'other'.
    quantity?: number;       // Quantity, primarily used for 'item' rewards. Defaults to 1 if not specified for items.
    description?: string;    // Optional extra description, especially useful for 'other' or 'reputation'.
}

/**
 * Represents the main definition of a quest.
 * Stored typically in a 'quests' collection.
 */
export interface Quest {
    status: string | number | readonly string[] | undefined;
    type: string | number | readonly string[] | undefined;
    difficulty: string | number | readonly string[] | undefined;
    recommendedLevel: string | number | undefined;
    goldReward: string | number | undefined;
    xpReward: string | number | undefined;
    completionCriteria: string | number | readonly string[] | undefined;
    id?: string;               // Firestore document ID (optional until saved)
    title: string;             // The primary name of the quest.
    description: string;       // A longer description, providing context, story, and details.
    objectives: QuestObjective[]; // An array of objectives required to complete the quest.
    rewards: QuestReward[];    // An array of rewards granted upon successful completion.

    // Optional Fields
    giverNPC?: string;         // Name or ID of the NPC who gives the quest.
    XPrewards?: string;         // Name or ID of the NPC who gives the quest.
    itemRewards: string[]; // Array of item IDs or names that are rewards for completing the quest.
    assignedTo?: string[];     // Array of character IDs to whom the quest is assigned.
    assignedAt?: Timestamp | Date | number; // When the quest was assigned to the character.
    turnInNPC?: string;        // Name or ID of the NPC to whom the quest should be returned.
    location?: string;         // General location or region where the quest takes place.
    suggestedLevel?: number;   // Recommended character level for undertaking the quest.
    isRepeatable?: boolean;    // Can this quest be completed multiple times?
    isHidden?: boolean;        // Is the quest initially hidden or automatically available?
    prerequisites?: {          // Conditions required to start the quest.
        level?: number;        // Minimum character level.
        quests?: string[];     // Array of completed quest IDs.
        items?: string[];      // Array of required item IDs in inventory.
        reputation?: {         // Faction reputation requirements.
            factionId: string;
            minLevel: number;
        }[];
    };
    timeLimit?: number;        // Optional time limit in seconds/minutes/hours/days (define unit clearly or use a structure).
    failureConditions?: string[]; // Optional list describing conditions under which the quest fails.
    storyHooks?: string;       // Text field for DMs containing plot hooks or further story ideas related to the quest.

    // Timestamps (managed by Firestore ideally)
    createdAt?: Timestamp | Date | number;    // When the quest definition was created.
    lastUpdated?: Timestamp | Date | number;  // When the quest definition was last updated.
    deleted?: boolean;         // Soft delete flag
    deletedAt?: Timestamp | Date | number; // Timestamp for soft delete
    updatedAt?: Timestamp | Date | number; // Timestamp for last update
}

/**
 * Represents the status of a quest assigned to a player/character.
 */
export type QuestAssignmentStatus = 'active' | 'completed' | 'failed' | 'abandoned';

/**
 * Represents an instance of a quest assigned to a specific character.
 * Stored typically in a 'questAssignments' collection.
 */
export interface QuestAssignment {
    id?: string;               // Firestore document ID (optional until saved)
    questId: string;           // ID linking to the Quest definition in the 'quests' collection.
    characterId: string;       // ID of the character undertaking the quest.
    playerId: string;          // User ID of the player owning the character.
    status: QuestAssignmentStatus; // Current status of the quest for this character.
    assignedAt: Timestamp | Date | number; // When the quest was assigned.
    completedAt?: Timestamp | Date | number; // When the quest was successfully completed.
    failedAt?: Timestamp | Date | number; // When the quest was failed.
    abandonedAt?: Timestamp | Date | number; // When the player abandoned the quest.
    progress: {                // Tracks progress on individual objectives.
        [objectiveId: string]: number | boolean; // Key is QuestObjective.id, value is count or true/false for completion.
    };
    notes?: string;            // Optional player notes specific to this quest assignment.
    dmNotes?: string;          // Optional DM notes specific to this assignment (e.g., deviations, rulings).
}