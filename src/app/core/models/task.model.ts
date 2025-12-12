export interface Task {
  id: string;
  noteId: string;
  content: string;
  completed: boolean;
  dueDate?: string;
  assigneeId?: string;
  priority?: 'low' | 'medium' | 'high';
  reminder?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

