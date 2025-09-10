export interface Task {
    id: string; // custom-task-id
    name: string; // custom-task-name
    listId: string; // custom-task-list-id
    tags: string[]; // custom-task-tags
    dueDate?: string; // custom-task-duedate
    startDate?: string; // custom-task-startdate
    endDate?: string; // custom-task-enddate
    isCompleted: boolean; // custom-task-is-completed
    isDeleted: boolean; // custom-task-is-deleted
    createdAt: string; // custom-task-created-at
    updatedAt: string; // custom-task-updated-at
    parentId?: string; // custom-task-parent-id
    content: string; // The markdown content of the block
}

export interface TaskList {
    id: string;
    name: string;
    isDefault: boolean;
}

export interface PluginConfig {
    kimiApiKey: string;
}
