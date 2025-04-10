export interface QuestObjective {
    id: string;
    description: string;
    completed?: boolean;
}

export interface Quest {
    id?: string;
    title: string;
    description: string;
    objectives: QuestObjective[];
    rewards: any; // Replace 'any' with the specific type for rewards if known
}