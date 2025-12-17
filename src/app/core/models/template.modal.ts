export interface Template {
    id: string;
    name: string;
    description?: string;
    content: string;
    contentType: 'tiptap' | 'html' | 'markdown';
    isSystem: boolean;
    userId?: number;
    createdAt: string;
  }
  