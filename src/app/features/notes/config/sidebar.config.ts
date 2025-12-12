/**
 * Notes Sidebar Configuration
 * Specific sidebar config for the notes feature area
 * Extends the main sidebar config with notes-specific items
 */

import { NavigationItem } from '../../../../@vex/interfaces/navigation-item.interface';

export const NOTES_SIDEBAR_CONFIG: NavigationItem[] = [
  {
    type: 'link',
    label: 'All Notes',
    route: '/notes',
    icon: 'mat:note',
    routerLinkActiveOptions: { exact: false }
  },
  {
    type: 'link',
    label: 'Shortcuts',
    route: '/notes/shortcuts',
    icon: 'mat:star',
    routerLinkActiveOptions: { exact: false }
  },
  {
    type: 'link',
    label: 'Notes',
    route: '/notes/list',
    icon: 'mat:sticky_note_2',
    routerLinkActiveOptions: { exact: false }
  },
  {
    type: 'link',
    label: 'Tasks',
    route: '/tasks',
    icon: 'mat:check_circle',
    routerLinkActiveOptions: { exact: false }
  },
  {
    type: 'link',
    label: 'Files',
    route: '/files',
    icon: 'mat:folder',
    routerLinkActiveOptions: { exact: false }
  },
  {
    type: 'link',
    label: 'Calendar',
    route: '/calendar',
    icon: 'mat:calendar_today',
    routerLinkActiveOptions: { exact: false }
  },
  {
    type: 'link',
    label: 'Templates',
    route: '/notes/templates',
    icon: 'mat:description',
    routerLinkActiveOptions: { exact: false }
  },
  {
    type: 'subheading',
    label: 'Organize',
    children: [
      {
        type: 'link',
        label: 'Notebooks',
        route: '/notebooks',
        icon: 'mat:book',
        routerLinkActiveOptions: { exact: false }
      },
      {
        type: 'link',
        label: 'Tags',
        route: '/tags',
        icon: 'mat:label',
        routerLinkActiveOptions: { exact: false }
      }
    ]
  },
  {
    type: 'subheading',
    label: 'Collaboration',
    children: [
      {
        type: 'link',
        label: 'Shared with me',
        route: '/notes/shared',
        icon: 'mat:people',
        routerLinkActiveOptions: { exact: false }
      },
      {
        type: 'link',
        label: 'Spaces',
        route: '/notes/spaces',
        icon: 'mat:workspaces',
        routerLinkActiveOptions: { exact: false }
      }
    ]
  }
];

