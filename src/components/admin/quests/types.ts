import { QuestReward } from '@/types/quest';
import { Timestamp } from 'firebase/firestore';

export interface QuestObjective {
    id: string;
    description: string;
    completed?: boolean;
}

export interface Quest {
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
    status?: "available" | "active" | "completed" | "failed"; // Status of the quest
}