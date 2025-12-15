import { sampleFiles, FileAttachment } from './sample-data';

/**
 * Mock APIs for files/attachments.
 * These mirror backend-style responses so they can be swapped to HTTP later.
 */

export function getAllFiles(userId?: string): { data: FileAttachment[]; message: string } {
  const data = userId
    ? sampleFiles.filter(file => !file.userId || file.userId === userId)
    : [...sampleFiles];
  return { data, message: 'Files retrieved successfully (mock)' };
}

export function getFileById(id: string): { data: FileAttachment | null; message: string } {
  const file = sampleFiles.find(f => f.id === id) || null;
  return { data: file, message: file ? 'File retrieved successfully (mock)' : 'File not found' };
}

export function deleteFile(id: string): { data: boolean; message: string } {
  // Mock: do not mutate the in-memory sample; just return success if exists
  const exists = sampleFiles.some(f => f.id === id);
  return {
    data: exists,
    message: exists ? 'File deleted successfully (mock)' : 'File not found'
  };
}

export function updateFile(
  id: string,
  updates: Partial<FileAttachment>
): { data: FileAttachment | null; message: string } {
  const existing = sampleFiles.find(f => f.id === id);
  if (!existing) {
    return { data: null, message: 'File not found' };
  }
  const updated: FileAttachment = { ...existing, ...updates, id };
  // Mock: not mutating sampleFiles; return merged copy
  return { data: updated, message: 'File updated successfully (mock)' };
}

export function searchFiles(query: string): { data: FileAttachment[]; message: string } {
  const term = (query || '').trim().toLowerCase();
  if (!term) {
    return { data: [...sampleFiles], message: 'Files retrieved successfully (mock)' };
  }
  const data = sampleFiles.filter(file =>
    (file.filename || '').toLowerCase().includes(term) ||
    (file.description || '').toLowerCase().includes(term) ||
    (file.mimeType || '').toLowerCase().includes(term)
  );
  return { data, message: 'Files retrieved successfully (mock)' };
}

// Re-export for convenience
export { sampleFiles, FileAttachment };
