export interface Notebook {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  description?: string;
  color?: string;
}

export interface NotebookRow {
  title: string;
  space: string;
  createdBy: string;
  updated: string;
  sharedWith: string;
  noteCount?: number; // For stacks (notebook count) and notebooks (note count)
  rowType: 'stack' | 'notebook' | 'note';
  isStack?: boolean;
  isNotebook?: boolean;
  isNote?: boolean;
  stackName?: string;
  stackId?: string; // ID for routing (slug-based)
  notebookId?: string; // ID from sample data for routing
  noteId?: string; // ID for note
  notebooks?: NotebookRow[]; // For stacks: child notebooks
  notes?: NotebookRow[]; // For notebooks: child notes
  expanded?: boolean; // For stacks and notebooks
  level?: number; // Indentation level (0=stack, 1=notebook, 2=note)
}