import { Attachment } from './attachment.model';

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string; // html / delta (for quill)
  tags: string[]; // tag ids or names
  notebookId?: string;
  pinned?: boolean;
  archived?: boolean;
  trashed?: boolean;
  createdAt: string;
  updatedAt: string;
  version?: number;
  attachments?: Attachment[];
  synced?: boolean; // for offline sync
  lastModified?: string; // for conflict resolution
}
