import { SideListDisplayConfig, SideListBadgeConfig } from '../side-list/side-list-item.interface';
import { Note } from '../../../../core/models';

/**
 * Display configuration for notes in the side list
 */
export const NOTES_LIST_DISPLAY_CONFIG: SideListDisplayConfig = {
  titleField: (note: Note) => note.title || 'Untitled',
  dateField: (note: Note) => note.updatedAt,
  icon: (note: Note) => {
    return note.pinned ? 'push_pin' : '';
  },
  iconColor: (note: Note) => {
    return note.pinned ? 'var(--color-primary)' : '';
  },
  tagsField: (note: Note) => {
    return note.tags || [];
  },
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
    } as SideListBadgeConfig,
    {
      label: '',
      value: (note: Note) => {
        const tagCount = (note as any).tag_count;
        if (tagCount && tagCount > 0) {
          return `${tagCount}`;
        }
        if (note.tags && note.tags.length > 0) {
          return `${note.tags.length}`;
        }
        return '';
      },
      icon: (note: Note) => {
        const tagCount = (note as any).tag_count;
        if (tagCount && tagCount > 0) return 'label';
        if (note.tags && note.tags.length > 0) return 'label';
        return '';
      },
      color: () => 'var(--text-secondary)',
      condition: (note: Note) => {
        const tagCount = (note as any).tag_count;
        return (tagCount && tagCount > 0) || (note.tags && note.tags.length > 0);
      }
    } as SideListBadgeConfig
  ]
};

/**
 * Helper function to get notes list display config with notebook highlighting
 */
export function getNotesListDisplayConfig(selectedNotebookId?: string | null): SideListDisplayConfig {
  return {
    ...NOTES_LIST_DISPLAY_CONFIG,
    itemClass: (note: Note) => {
      const classes: string[] = [];
      if (selectedNotebookId && note.notebookId === selectedNotebookId) {
        classes.push('notebook-highlighted');
      }
      return classes.join(' ');
    }
  };
}

