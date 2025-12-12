/**
 * Sample Data for Angular Notes Application
 * 
 * This file contains mock data that simulates backend API responses.
 * Use this data for development and testing. When the backend API is ready,
 * you can swap the service implementations without changing component code.
 * 
 * Structure matches the API response format:
 * { data: [...], message?: string, error?: string }
 */

import { User, Note, Tag, Notebook, Attachment } from '../models';

// ============================================================================
// Helper Functions for Data Generation
// ============================================================================

/**
 * Generates a random ID in the format: prefix_timestamp_randomstring
 */
export function randomId(prefix = 'item'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generates a random date between start and end dates (defaults to last 90 days)
 */
export function randomDate(start: Date = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), end: Date = new Date()): string {
  const timestamp = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(timestamp).toISOString();
}

/**
 * Generates a past date relative to now
 */
export function pastDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

/**
 * Generates a recent date (within last few hours)
 */
export function recentDate(hoursAgo = 0): string {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
}

/**
 * Generates lorem ipsum text
 */
export function loremParagraph(sentences = 3): string {
  const lorem = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.',
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.',
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem.',
    'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
    'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.',
    'Consectetur, adipisci velit, sed quia non numquam eius modi tempora.',
    'Ut labore et dolore magnam aliquam quaerat voluptatem.'
  ];
  
  const selected = lorem.slice(0, Math.min(sentences, lorem.length));
  return selected.join(' ');
}

/**
 * Generates rich HTML content for notes
 */
export function generateRichContent(title: string, paragraphs = 2): string {
  const content = Array.from({ length: paragraphs }, () => loremParagraph(3)).join('\n\n');
  return `<h1>${title}</h1><p>${content}</p>`;
}

// ============================================================================
// Sample Users
// ============================================================================

export const users: User[] = [
  {
    id: 'user_1',
    email: 'john.doe@example.com',
    displayName: 'John Doe',
    avatarUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=6366f1&color=fff',
    createdAt: pastDate(120)
  },
  {
    id: 'user_2',
    email: 'jane.smith@example.com',
    displayName: 'Jane Smith',
    avatarUrl: 'https://ui-avatars.com/api/?name=Jane+Smith&background=ec4899&color=fff',
    createdAt: pastDate(90)
  }
];

// ============================================================================
// Sample Tags
// ============================================================================

export const tags: Tag[] = [
  {
    id: 'tag_1',
    name: 'Important',
    color: '#ef4444',
    userId: 'user_1',
    createdAt: pastDate(100)
  },
  {
    id: 'tag_2',
    name: 'Work',
    color: '#3b82f6',
    userId: 'user_1',
    createdAt: pastDate(95)
  },
  {
    id: 'tag_3',
    name: 'Personal',
    color: '#10b981',
    userId: 'user_1',
    createdAt: pastDate(90)
  },
  {
    id: 'tag_4',
    name: 'Ideas',
    color: '#f59e0b',
    userId: 'user_1',
    createdAt: pastDate(85)
  },
  {
    id: 'tag_5',
    name: 'Travel',
    color: '#8b5cf6',
    userId: 'user_1',
    createdAt: pastDate(80)
  },
  {
    id: 'tag_6',
    name: 'Project',
    color: '#06b6d4',
    userId: 'user_1',
    createdAt: pastDate(75)
  },
  {
    id: 'tag_7',
    name: 'Meeting Notes',
    color: '#ec4899',
    userId: 'user_2',
    createdAt: pastDate(70)
  },
  {
    id: 'tag_8',
    name: 'Shopping',
    color: '#f97316',
    userId: 'user_2',
    createdAt: pastDate(65)
  },
  {
    id: 'tag_9',
    name: 'Recipes',
    color: '#84cc16',
    userId: 'user_2',
    createdAt: pastDate(60)
  },
  {
    id: 'tag_10',
    name: 'Health',
    color: '#14b8a6',
    userId: 'user_2',
    createdAt: pastDate(55)
  }
];

// ============================================================================
// Sample Notebooks
// ============================================================================

export const notebooks: Notebook[] = [
  {
    id: 'notebook_1',
    userId: 'user_1',
    name: 'Work Notes',
    description: 'All work-related notes and meeting minutes',
    color: '#3b82f6',
    createdAt: pastDate(100),
    updatedAt: recentDate(2)
  },
  {
    id: 'notebook_2',
    userId: 'user_1',
    name: 'Personal Journal',
    description: 'Personal thoughts and daily reflections',
    color: '#10b981',
    createdAt: pastDate(95),
    updatedAt: recentDate(5)
  },
  {
    id: 'notebook_3',
    userId: 'user_1',
    name: 'Project Ideas',
    description: 'Brainstorming and project planning',
    color: '#f59e0b',
    createdAt: pastDate(85),
    updatedAt: recentDate(1)
  },
  {
    id: 'notebook_4',
    userId: 'user_2',
    name: 'Meetings',
    description: 'Meeting notes and action items',
    color: '#ec4899',
    createdAt: pastDate(70),
    updatedAt: recentDate(3)
  },
  {
    id: 'notebook_5',
    userId: 'user_2',
    name: 'Recipes',
    description: 'Favorite recipes and cooking tips',
    color: '#84cc16',
    createdAt: pastDate(60),
    updatedAt: pastDate(10)
  }
];

// ============================================================================
// Sample Notes
// ============================================================================

export const notes: Note[] = [
  // User 1 - Pinned Notes
  {
    id: 'note_1',
    userId: 'user_1',
    title: 'Quarterly Planning Session',
    content: generateRichContent('Quarterly Planning Session', 3),
    tags: ['tag_1', 'tag_2', 'tag_6'],
    notebookId: 'notebook_1',
    pinned: true,
    archived: false,
    trashed: false,
    version: 3,
    createdAt: pastDate(45),
    updatedAt: recentDate(2),
    attachments: []
  },
  {
    id: 'note_2',
    userId: 'user_1',
    title: 'Product Launch Checklist',
    content: generateRichContent('Product Launch Checklist', 2),
    tags: ['tag_2', 'tag_6'],
    notebookId: 'notebook_1',
    pinned: true,
    archived: false,
    trashed: false,
    version: 5,
    createdAt: pastDate(40),
    updatedAt: recentDate(1)
  },
  // User 1 - Regular Notes
  {
    id: 'note_3',
    userId: 'user_1',
    title: 'Team Standup Notes',
    content: generateRichContent('Team Standup Notes', 2),
    tags: ['tag_2', 'tag_7'],
    notebookId: 'notebook_1',
    pinned: false,
    archived: false,
    trashed: false,
    version: 2,
    createdAt: pastDate(35),
    updatedAt: pastDate(1)
  },
  {
    id: 'note_4',
    userId: 'user_1',
    title: 'Weekend Trip Ideas',
    content: generateRichContent('Weekend Trip Ideas', 3),
    tags: ['tag_3', 'tag_5'],
    notebookId: 'notebook_2',
    pinned: false,
    archived: false,
    trashed: false,
    version: 1,
    createdAt: pastDate(30),
    updatedAt: pastDate(25)
  },
  {
    id: 'note_5',
    userId: 'user_1',
    title: 'Mobile App Feature Ideas',
    content: generateRichContent('Mobile App Feature Ideas', 4),
    tags: ['tag_4', 'tag_6'],
    notebookId: 'notebook_3',
    pinned: false,
    archived: false,
    trashed: false,
    version: 4,
    createdAt: pastDate(28),
    updatedAt: recentDate(5)
  },
  {
    id: 'note_6',
    userId: 'user_1',
    title: 'Morning Reflection',
    content: generateRichContent('Morning Reflection', 2),
    tags: ['tag_3'],
    notebookId: 'notebook_2',
    pinned: false,
    archived: false,
    trashed: false,
    version: 1,
    createdAt: pastDate(25),
    updatedAt: pastDate(25)
  },
  {
    id: 'note_7',
    userId: 'user_1',
    title: 'API Integration Notes',
    content: generateRichContent('API Integration Notes', 3),
    tags: ['tag_2', 'tag_6'],
    notebookId: 'notebook_1',
    pinned: false,
    archived: false,
    trashed: false,
    version: 2,
    createdAt: pastDate(20),
    updatedAt: pastDate(15)
  },
  {
    id: 'note_8',
    userId: 'user_1',
    title: 'Vacation Planning',
    content: generateRichContent('Vacation Planning', 4),
    tags: ['tag_3', 'tag_5'],
    notebookId: 'notebook_2',
    pinned: false,
    archived: false,
    trashed: false,
    version: 3,
    createdAt: pastDate(18),
    updatedAt: recentDate(8)
  },
  {
    id: 'note_9',
    userId: 'user_1',
    title: 'New Feature Brainstorming',
    content: generateRichContent('New Feature Brainstorming', 3),
    tags: ['tag_4'],
    notebookId: 'notebook_3',
    pinned: false,
    archived: false,
    trashed: false,
    version: 2,
    createdAt: pastDate(15),
    updatedAt: pastDate(12)
  },
  {
    id: 'note_10',
    userId: 'user_1',
    title: 'Client Meeting Summary',
    content: generateRichContent('Client Meeting Summary', 2),
    tags: ['tag_1', 'tag_2'],
    notebookId: 'notebook_1',
    pinned: false,
    archived: false,
    trashed: false,
    version: 1,
    createdAt: pastDate(12),
    updatedAt: pastDate(12)
  },
  // User 1 - Archived Note
  {
    id: 'note_11',
    userId: 'user_1',
    title: 'Old Project Documentation',
    content: generateRichContent('Old Project Documentation', 2),
    tags: ['tag_6'],
    notebookId: 'notebook_1',
    pinned: false,
    archived: true,
    trashed: false,
    version: 1,
    createdAt: pastDate(60),
    updatedAt: pastDate(55)
  },
  // User 2 - Notes
  {
    id: 'note_12',
    userId: 'user_2',
    title: 'Sprint Planning Meeting',
    content: generateRichContent('Sprint Planning Meeting', 3),
    tags: ['tag_7'],
    notebookId: 'notebook_4',
    pinned: true,
    archived: false,
    trashed: false,
    version: 2,
    createdAt: pastDate(32),
    updatedAt: recentDate(3)
  },
  {
    id: 'note_13',
    userId: 'user_2',
    title: 'Chocolate Chip Cookie Recipe',
    content: generateRichContent('Chocolate Chip Cookie Recipe', 2),
    tags: ['tag_9'],
    notebookId: 'notebook_5',
    pinned: false,
    archived: false,
    trashed: false,
    version: 1,
    createdAt: pastDate(28),
    updatedAt: pastDate(25)
  },
  {
    id: 'note_14',
    userId: 'user_2',
    title: 'Weekly Team Sync',
    content: generateRichContent('Weekly Team Sync', 2),
    tags: ['tag_7'],
    notebookId: 'notebook_4',
    pinned: false,
    archived: false,
    trashed: false,
    version: 3,
    createdAt: pastDate(22),
    updatedAt: recentDate(4)
  },
  {
    id: 'note_15',
    userId: 'user_2',
    title: 'Grocery Shopping List',
    content: generateRichContent('Grocery Shopping List', 1),
    tags: ['tag_8'],
    notebookId: undefined,
    pinned: false,
    archived: false,
    trashed: false,
    version: 5,
    createdAt: pastDate(20),
    updatedAt: recentDate(1)
  },
  {
    id: 'note_16',
    userId: 'user_2',
    title: 'Mediterranean Diet Plan',
    content: generateRichContent('Mediterranean Diet Plan', 3),
    tags: ['tag_9', 'tag_10'],
    notebookId: 'notebook_5',
    pinned: false,
    archived: false,
    trashed: false,
    version: 2,
    createdAt: pastDate(18),
    updatedAt: pastDate(15)
  },
  {
    id: 'note_17',
    userId: 'user_2',
    title: 'One-on-One with Manager',
    content: generateRichContent('One-on-One with Manager', 2),
    tags: ['tag_7'],
    notebookId: 'notebook_4',
    pinned: false,
    archived: false,
    trashed: false,
    version: 1,
    createdAt: pastDate(14),
    updatedAt: pastDate(14)
  },
  {
    id: 'note_18',
    userId: 'user_2',
    title: 'Weekly Meal Prep',
    content: generateRichContent('Weekly Meal Prep', 2),
    tags: ['tag_9', 'tag_10'],
    notebookId: 'notebook_5',
    pinned: false,
    archived: false,
    trashed: false,
    version: 4,
    createdAt: pastDate(10),
    updatedAt: recentDate(6)
  },
  // User 2 - Trashed Note
  {
    id: 'note_19',
    userId: 'user_2',
    title: 'Old Shopping List',
    content: generateRichContent('Old Shopping List', 1),
    tags: ['tag_8'],
    notebookId: undefined,
    pinned: false,
    archived: false,
    trashed: true,
    version: 1,
    createdAt: pastDate(50),
    updatedAt: pastDate(45)
  },
  // Recent Note
  {
    id: 'note_20',
    userId: 'user_1',
    title: 'Quick Ideas',
    content: generateRichContent('Quick Ideas', 2),
    tags: ['tag_4'],
    notebookId: 'notebook_3',
    pinned: false,
    archived: false,
    trashed: false,
    version: 1,
    createdAt: recentDate(1),
    updatedAt: recentDate(1)
  }
];

// ============================================================================
// Sample Attachments (Optional - for future use)
// ============================================================================

export const attachments: Attachment[] = [
  // Can be added when attachment feature is implemented
  // {
  //   id: 'attachment_1',
  //   noteId: 'note_1',
  //   filename: 'screenshot.png',
  //   mimeType: 'image/png',
  //   size: 245678,
  //   url: 'https://example.com/attachments/screenshot.png',
  //   createdAt: pastDate(45),
  //   updatedAt: pastDate(45)
  // }
];

// ============================================================================
// Main Export - API-Ready Structure
// ============================================================================

/**
 * Main sample data export
 * Structure matches API response format for easy swapping
 */
export const SAMPLE_DATA = {
  users,
  notes,
  tags,
  notebooks,
  attachments
};

/**
 * Helper function to simulate API response format
 * Usage: getSampleNotes() returns { data: Note[], message?: string }
 */
export function getSampleNotes(): { data: Note[]; message?: string } {
  return {
    data: notes,
    message: 'Notes retrieved successfully'
  };
}

export function getSampleTags(): { data: Tag[]; message?: string } {
  return {
    data: tags,
    message: 'Tags retrieved successfully'
  };
}

export function getSampleNotebooks(): { data: Notebook[]; message?: string } {
  return {
    data: notebooks,
    message: 'Notebooks retrieved successfully'
  };
}

export function getSampleUsers(): { data: User[]; message?: string } {
  return {
    data: users,
    message: 'Users retrieved successfully'
  };
}

/**
 * Get notes by user ID
 */
export function getNotesByUserId(userId: string): Note[] {
  return notes.filter(note => note.userId === userId);
}

/**
 * Get tags by user ID
 */
export function getTagsByUserId(userId: string): Tag[] {
  return tags.filter(tag => tag.userId === userId);
}

/**
 * Get notebooks by user ID
 */
export function getNotebooksByUserId(userId: string): Notebook[] {
  return notebooks.filter(notebook => notebook.userId === userId);
}

/**
 * Get note by ID
 */
export function getNoteById(id: string): Note | undefined {
  return notes.find(note => note.id === id);
}

/**
 * Get tag by ID
 */
export function getTagById(id: string): Tag | undefined {
  return tags.find(tag => tag.id === id);
}

/**
 * Get notebook by ID
 */
export function getNotebookById(id: string): Notebook | undefined {
  return notebooks.find(notebook => notebook.id === id);
}

