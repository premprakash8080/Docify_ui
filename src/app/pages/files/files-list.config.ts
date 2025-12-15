import { SideListDisplayConfig, SideListBadgeConfig } from '../notes/components/side-list/side-list-item.interface';
import { FileAttachment } from './services/files.service';

/**
 * Display configuration for files in the side list
 */
export const FILES_LIST_DISPLAY_CONFIG: SideListDisplayConfig = {
  titleField: (file: FileAttachment) => file.filename || 'Unnamed file',
  subtitleField: (file: FileAttachment) => file.description || null,
  dateField: (file: FileAttachment) => file.createdAt || file.updatedAt || new Date().toISOString(),
  icon: (file: FileAttachment) => {
    if (!file.mimeType) return 'insert_drive_file';
    if (file.mimeType.startsWith('image/')) return 'image';
    if (file.mimeType.startsWith('video/')) return 'videocam';
    if (file.mimeType.startsWith('audio/')) return 'audiotrack';
    if (file.mimeType.includes('pdf')) return 'picture_as_pdf';
    if (file.mimeType.includes('word') || file.mimeType.includes('document')) return 'description';
    if (file.mimeType.includes('spreadsheet') || file.mimeType.includes('excel')) return 'table_chart';
    return 'insert_drive_file';
  },
  badges: [
    {
      label: '',
      value: (file: FileAttachment) => {
        if (!file.size) return '';
        if (file.size < 1024) return file.size + ' B';
        if (file.size < 1024 * 1024) return (file.size / 1024).toFixed(1) + ' KB';
        return (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      },
      icon: () => '',
      color: () => 'var(--text-secondary)',
      condition: () => true
    } as SideListBadgeConfig
  ]
};

/**
 * Helper function to get files list display config
 */
export function getFilesListDisplayConfig(): SideListDisplayConfig {
  return FILES_LIST_DISPLAY_CONFIG;
}
