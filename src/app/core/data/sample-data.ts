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
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Helper Functions for Data Generation
// ============================================================================

/**
 * Generates a UUID v4
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Generates a random ID in the format: prefix_timestamp_randomstring
 * @deprecated Use generateUUID() instead for UUID-based IDs
 */
export function randomId(prefix = 'item'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${prefix}_${timestamp}_${random}`;
}

// ============================================================================
// Fixed UUIDs for Sample Data (for consistency and reference integrity)
// ============================================================================

// User IDs
const USER_1_UUID = '550e8400-e29b-41d4-a716-446655440001';
const USER_2_UUID = '550e8400-e29b-41d4-a716-446655440002';

// Notebook IDs (exported for use in components)
export const NOTEBOOK_1_UUID = '660e8400-e29b-41d4-a716-446655440001'; // Work Notes
export const NOTEBOOK_2_UUID = '660e8400-e29b-41d4-a716-446655440002'; // Personal Journal
export const NOTEBOOK_3_UUID = '660e8400-e29b-41d4-a716-446655440003'; // Project Ideas
export const NOTEBOOK_4_UUID = '660e8400-e29b-41d4-a716-446655440004'; // Meetings
export const NOTEBOOK_5_UUID = '660e8400-e29b-41d4-a716-446655440005'; // Recipes

// Tag IDs
const TAG_1_UUID = '770e8400-e29b-41d4-a716-446655440001'; // Important
const TAG_2_UUID = '770e8400-e29b-41d4-a716-446655440002'; // Work
const TAG_3_UUID = '770e8400-e29b-41d4-a716-446655440003'; // Personal
const TAG_4_UUID = '770e8400-e29b-41d4-a716-446655440004'; // Ideas
const TAG_5_UUID = '770e8400-e29b-41d4-a716-446655440005'; // Travel
const TAG_6_UUID = '770e8400-e29b-41d4-a716-446655440006'; // Project
const TAG_7_UUID = '770e8400-e29b-41d4-a716-446655440007'; // Meeting Notes
const TAG_8_UUID = '770e8400-e29b-41d4-a716-446655440008'; // Shopping
const TAG_9_UUID = '770e8400-e29b-41d4-a716-446655440009'; // Recipes
const TAG_10_UUID = '770e8400-e29b-41d4-a716-446655440010'; // Health

// Note IDs (generating UUIDs for all notes)
const NOTE_1_UUID = '880e8400-e29b-41d4-a716-446655440001';
const NOTE_2_UUID = '880e8400-e29b-41d4-a716-446655440002';
const NOTE_3_UUID = '880e8400-e29b-41d4-a716-446655440003';
const NOTE_4_UUID = '880e8400-e29b-41d4-a716-446655440004';
const NOTE_5_UUID = '880e8400-e29b-41d4-a716-446655440005';
const NOTE_6_UUID = '880e8400-e29b-41d4-a716-446655440006';
const NOTE_7_UUID = '880e8400-e29b-41d4-a716-446655440007';
const NOTE_8_UUID = '880e8400-e29b-41d4-a716-446655440008';
const NOTE_9_UUID = '880e8400-e29b-41d4-a716-446655440009';
const NOTE_10_UUID = '880e8400-e29b-41d4-a716-446655440010';
const NOTE_11_UUID = '880e8400-e29b-41d4-a716-446655440011';
const NOTE_12_UUID = '880e8400-e29b-41d4-a716-446655440012';
const NOTE_13_UUID = '880e8400-e29b-41d4-a716-446655440013';
const NOTE_14_UUID = '880e8400-e29b-41d4-a716-446655440014';
const NOTE_15_UUID = '880e8400-e29b-41d4-a716-446655440015';
const NOTE_16_UUID = '880e8400-e29b-41d4-a716-446655440016';
const NOTE_17_UUID = '880e8400-e29b-41d4-a716-446655440017';
const NOTE_18_UUID = '880e8400-e29b-41d4-a716-446655440018';
const NOTE_19_UUID = '880e8400-e29b-41d4-a716-446655440019';
const NOTE_20_UUID = '880e8400-e29b-41d4-a716-446655440020';

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
    id: USER_1_UUID,
    email: 'john.doe@example.com',
    displayName: 'John Doe',
    avatarUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=6366f1&color=fff',
    createdAt: pastDate(120)
  },
  {
    id: USER_2_UUID,
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
    id: TAG_1_UUID,
    name: 'Important',
    color: '#ef4444',
    userId: USER_1_UUID,
    createdAt: pastDate(100)
  },
  {
    id: TAG_2_UUID,
    name: 'Work',
    color: '#3b82f6',
    userId: USER_1_UUID,
    createdAt: pastDate(95)
  },
  {
    id: TAG_3_UUID,
    name: 'Personal',
    color: '#10b981',
    userId: USER_1_UUID,
    createdAt: pastDate(90)
  },
  {
    id: TAG_4_UUID,
    name: 'Ideas',
    color: '#f59e0b',
    userId: USER_1_UUID,
    createdAt: pastDate(85)
  },
  {
    id: TAG_5_UUID,
    name: 'Travel',
    color: '#8b5cf6',
    userId: USER_1_UUID,
    createdAt: pastDate(80)
  },
  {
    id: TAG_6_UUID,
    name: 'Project',
    color: '#06b6d4',
    userId: USER_1_UUID,
    createdAt: pastDate(75)
  },
  {
    id: TAG_7_UUID,
    name: 'Meeting Notes',
    color: '#ec4899',
    userId: USER_2_UUID,
    createdAt: pastDate(70)
  },
  {
    id: TAG_8_UUID,
    name: 'Shopping',
    color: '#f97316',
    userId: USER_2_UUID,
    createdAt: pastDate(65)
  },
  {
    id: TAG_9_UUID,
    name: 'Recipes',
    color: '#84cc16',
    userId: USER_2_UUID,
    createdAt: pastDate(60)
  },
  {
    id: TAG_10_UUID,
    name: 'Health',
    color: '#14b8a6',
    userId: USER_2_UUID,
    createdAt: pastDate(55)
  }
];

// ============================================================================
// Sample Notebooks
// ============================================================================

export const notebooks: Notebook[] = [
  {
    id: NOTEBOOK_1_UUID,
    userId: USER_1_UUID,
    name: 'Work Notes',
    description: 'All work-related notes and meeting minutes',
    color: '#3b82f6',
    createdAt: pastDate(100),
    updatedAt: recentDate(2)
  },
  {
    id: NOTEBOOK_2_UUID,
    userId: USER_1_UUID,
    name: 'Personal Journal',
    description: 'Personal thoughts and daily reflections',
    color: '#10b981',
    createdAt: pastDate(95),
    updatedAt: recentDate(5)
  },
  {
    id: NOTEBOOK_3_UUID,
    userId: USER_1_UUID,
    name: 'Project Ideas',
    description: 'Brainstorming and project planning',
    color: '#f59e0b',
    createdAt: pastDate(85),
    updatedAt: recentDate(1)
  },
  {
    id: NOTEBOOK_4_UUID,
    userId: USER_2_UUID,
    name: 'Meetings',
    description: 'Meeting notes and action items',
    color: '#ec4899',
    createdAt: pastDate(70),
    updatedAt: recentDate(3)
  },
  {
    id: NOTEBOOK_5_UUID,
    userId: USER_2_UUID,
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
    id: NOTE_1_UUID,
    userId: USER_1_UUID,
    title: 'Quarterly Planning Session',
    content: generateRichContent('Quarterly Planning Session', 3),
    tags: [TAG_1_UUID, TAG_2_UUID, TAG_6_UUID],
    notebookId: NOTEBOOK_1_UUID,
    pinned: true,
    archived: false,
    trashed: false,
    version: 3,
    createdAt: pastDate(45),
    updatedAt: recentDate(2),
    attachments: []
  },
  {
    id: NOTE_2_UUID,
    userId: USER_1_UUID,
    title: 'Product Launch Checklist',
    content: generateRichContent('Product Launch Checklist', 2),
    tags: [TAG_2_UUID, TAG_6_UUID],
    notebookId: NOTEBOOK_1_UUID,
    pinned: true,
    archived: false,
    trashed: false,
    version: 5,
    createdAt: pastDate(40),
    updatedAt: recentDate(1),
    tasks: [
      {
        id: generateUUID(),
        noteId: NOTE_2_UUID,
        content: 'Finalize product requirements',
        completed: true,
        dueDate: pastDate(5),
        priority: 'high',
        order: 1,
        createdAt: pastDate(30),
        updatedAt: pastDate(5)
      },
      {
        id: generateUUID(),
        noteId: NOTE_2_UUID,
        content: 'Prepare marketing materials',
        completed: false,
        dueDate: recentDate(0),
        priority: 'medium',
        order: 2,
        createdAt: pastDate(25),
        updatedAt: pastDate(25)
      },
      {
        id: generateUUID(),
        noteId: NOTE_2_UUID,
        content: 'Schedule launch date',
        completed: false,
        dueDate: recentDate(-2),
        priority: 'high',
        order: 3,
        createdAt: pastDate(20),
        updatedAt: pastDate(20)
      }
    ]
  },
  // User 1 - Regular Notes
  {
    id: NOTE_3_UUID,
    userId: USER_1_UUID,
    title: 'Team Standup Notes',
    content: generateRichContent('Team Standup Notes', 2),
    tags: [TAG_2_UUID, TAG_7_UUID],
    notebookId: NOTEBOOK_1_UUID,
    pinned: false,
    archived: false,
    trashed: false,
    version: 2,
    createdAt: pastDate(35),
    updatedAt: pastDate(1)
  },
  {
    id: NOTE_4_UUID,
    userId: USER_1_UUID,
    title: 'Weekend Trip Ideas',
    content: generateRichContent('Weekend Trip Ideas', 3),
    tags: [TAG_3_UUID, TAG_5_UUID],
    notebookId: NOTEBOOK_2_UUID,
    pinned: false,
    archived: false,
    trashed: false,
    version: 1,
    createdAt: pastDate(30),
    updatedAt: pastDate(25)
  },
  {
    id: NOTE_5_UUID,
    userId: USER_1_UUID,
    title: 'Mobile App Feature Ideas',
    content: generateRichContent('Mobile App Feature Ideas', 4),
    tags: [TAG_4_UUID, TAG_6_UUID],
    notebookId: NOTEBOOK_3_UUID,
    pinned: false,
    archived: false,
    trashed: false,
    version: 4,
    createdAt: pastDate(28),
    updatedAt: recentDate(5)
  },
  {
    id: NOTE_6_UUID,
    userId: USER_1_UUID,
    title: 'Morning Reflection',
    content: generateRichContent('Morning Reflection', 2),
    tags: [TAG_3_UUID],
    notebookId: NOTEBOOK_2_UUID,
    pinned: false,
    archived: false,
    trashed: false,
    version: 1,
    createdAt: pastDate(25),
    updatedAt: pastDate(25)
  },
  {
    id: NOTE_7_UUID,
    userId: USER_1_UUID,
    title: 'API Integration Notes',
    content: generateRichContent('API Integration Notes', 3),
    tags: [TAG_2_UUID, TAG_6_UUID],
    notebookId: NOTEBOOK_1_UUID,
    pinned: false,
    archived: false,
    trashed: false,
    version: 2,
    createdAt: pastDate(20),
    updatedAt: pastDate(15)
  },
  {
    id: NOTE_8_UUID,
    userId: USER_1_UUID,
    title: 'Vacation Planning',
    content: generateRichContent('Vacation Planning', 4),
    tags: [TAG_3_UUID, TAG_5_UUID],
    notebookId: NOTEBOOK_2_UUID,
    pinned: false,
    archived: false,
    trashed: false,
    version: 3,
    createdAt: pastDate(18),
    updatedAt: recentDate(8)
  },
  {
    id: NOTE_9_UUID,
    userId: USER_1_UUID,
    title: 'New Feature Brainstorming',
    content: generateRichContent('New Feature Brainstorming', 3),
    tags: [TAG_4_UUID],
    notebookId: NOTEBOOK_3_UUID,
    pinned: false,
    archived: false,
    trashed: false,
    version: 2,
    createdAt: pastDate(15),
    updatedAt: pastDate(12)
  },
  {
    id: NOTE_10_UUID,
    userId: USER_1_UUID,
    title: 'Client Meeting Summary',
    content: generateRichContent('Client Meeting Summary', 2),
    tags: [TAG_1_UUID, TAG_2_UUID],
    notebookId: NOTEBOOK_1_UUID,
    pinned: false,
    archived: false,
    trashed: false,
    version: 1,
    createdAt: pastDate(12),
    updatedAt: pastDate(12)
  },
  // User 1 - Archived Note
  {
    id: NOTE_11_UUID,
    userId: USER_1_UUID,
    title: 'Old Project Documentation',
    content: generateRichContent('Old Project Documentation', 2),
    tags: [TAG_6_UUID],
    notebookId: NOTEBOOK_1_UUID,
    pinned: false,
    archived: true,
    trashed: false,
    version: 1,
    createdAt: pastDate(60),
    updatedAt: pastDate(55)
  },
  // User 2 - Notes
  {
    id: NOTE_12_UUID,
    userId: USER_2_UUID,
    title: 'Sprint Planning Meeting',
    content: generateRichContent('Sprint Planning Meeting', 3),
    tags: [TAG_7_UUID],
    notebookId: NOTEBOOK_4_UUID,
    pinned: true,
    archived: false,
    trashed: false,
    version: 2,
    createdAt: pastDate(32),
    updatedAt: recentDate(3)
  },
  {
    id: NOTE_13_UUID,
    userId: USER_2_UUID,
    title: 'Chocolate Chip Cookie Recipe',
    content: generateRichContent('Chocolate Chip Cookie Recipe', 2),
    tags: [TAG_9_UUID],
    notebookId: NOTEBOOK_5_UUID,
    pinned: false,
    archived: false,
    trashed: false,
    version: 1,
    createdAt: pastDate(28),
    updatedAt: pastDate(25)
  },
  {
    id: NOTE_14_UUID,
    userId: USER_2_UUID,
    title: 'Weekly Team Sync',
    content: generateRichContent('Weekly Team Sync', 2),
    tags: [TAG_7_UUID],
    notebookId: NOTEBOOK_4_UUID,
    pinned: false,
    archived: false,
    trashed: false,
    version: 3,
    createdAt: pastDate(22),
    updatedAt: recentDate(4)
  },
  {
    id: NOTE_15_UUID,
    userId: USER_2_UUID,
    title: 'Grocery Shopping List',
    content: generateRichContent('Grocery Shopping List', 1),
    tags: [TAG_8_UUID],
    notebookId: undefined,
    pinned: false,
    archived: false,
    trashed: false,
    version: 5,
    createdAt: pastDate(20),
    updatedAt: recentDate(1)
  },
  {
    id: NOTE_16_UUID,
    userId: USER_2_UUID,
    title: 'Mediterranean Diet Plan',
    content: generateRichContent('Mediterranean Diet Plan', 3),
    tags: [TAG_9_UUID, TAG_10_UUID],
    notebookId: NOTEBOOK_5_UUID,
    pinned: false,
    archived: false,
    trashed: false,
    version: 2,
    createdAt: pastDate(18),
    updatedAt: pastDate(15)
  },
  {
    id: NOTE_17_UUID,
    userId: USER_2_UUID,
    title: 'One-on-One with Manager',
    content: generateRichContent('One-on-One with Manager', 2),
    tags: [TAG_7_UUID],
    notebookId: NOTEBOOK_4_UUID,
    pinned: false,
    archived: false,
    trashed: false,
    version: 1,
    createdAt: pastDate(14),
    updatedAt: pastDate(14)
  },
  {
    id: NOTE_18_UUID,
    userId: USER_2_UUID,
    title: 'Weekly Meal Prep',
    content: generateRichContent('Weekly Meal Prep', 2),
    tags: [TAG_9_UUID, TAG_10_UUID],
    notebookId: NOTEBOOK_5_UUID,
    pinned: false,
    archived: false,
    trashed: false,
    version: 4,
    createdAt: pastDate(10),
    updatedAt: recentDate(6)
  },
  // User 2 - Trashed Note
  {
    id: NOTE_19_UUID,
    userId: USER_2_UUID,
    title: 'Old Shopping List',
    content: generateRichContent('Old Shopping List', 1),
    tags: [TAG_8_UUID],
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
    id: NOTE_20_UUID,
    userId: USER_1_UUID,
    title: 'Quick Ideas',
    content: generateRichContent('Quick Ideas', 2),
    tags: [TAG_4_UUID],
    notebookId: NOTEBOOK_3_UUID,
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

