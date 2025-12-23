import { SideListDisplayConfig, SideListBadgeConfig } from '../side-list/side-list-item.interface';
import { Note } from '../../../../core/models';

/**
 * Display configuration for notes in the side list
 */
export const NOTES_LIST_DISPLAY_CONFIG: SideListDisplayConfig = {
  titleField: (note: Note) => note.title || 'Untitled',
  dateField: (note: Note) => note.updatedAt,
  badges: [
    {
      label: '',
      value: (note: Note) => {
        if (!note.tasks || note.tasks.length === 0) return '';
        const completed = note.tasks.filter(t => t.completed).length;
        return `${completed}/${note.tasks.length}`;
      },
      icon: (note: Note) => {
        return note.tasks && note.tasks.length > 0 ? 'checklist' : '';
      },
      color: () => 'var(--color-primary)',
      condition: (note: Note) => note.tasks && note.tasks.length > 0
    } as SideListBadgeConfig
  ]
};

/**
 * Helper function to get notes list display config
 */
export function getNotesListDisplayConfig(): SideListDisplayConfig {
  return NOTES_LIST_DISPLAY_CONFIG;
}

