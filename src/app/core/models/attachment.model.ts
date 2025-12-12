export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string; // for remote
  localBlobId?: string; // for local storage
  noteId?: string; // reference to parent note
  createdAt?: string;
  updatedAt?: string;
}

