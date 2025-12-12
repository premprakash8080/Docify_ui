/**
 * Sidebar Configuration
 * 
 * Centralized configuration for the notes app sidebar navigation.
 * Modify this file to update sidebar items without touching templates.
 */

import { NavigationItem } from '../../../@vex/interfaces/navigation-item.interface';

export interface SidebarConfig {
  items: NavigationItem[];
  showDownloadApp?: boolean;
  showUpgrade?: boolean;
}

export const SIDEBAR_CONFIG: SidebarConfig = {
  showDownloadApp: false,
  showUpgrade: false,
  items: [
    {
      type: 'subheading',
      label: 'Main',
      children: [
        {
          type: 'link',
          label: 'Home',
          route: '/',
          icon: 'mat:home',
          routerLinkActiveOptions: { exact: true }
        },
        {
          type: 'link',
          label: 'Notes',
          route: '/notes',
          icon: 'mat:note',
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
          route: '/templates',
          icon: 'mat:description',
          routerLinkActiveOptions: { exact: false }
        }
      ]
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
          route: '/shared',
          icon: 'mat:people',
          routerLinkActiveOptions: { exact: false }
        },
        {
          type: 'link',
          label: 'Spaces',
          route: '/spaces',
          icon: 'mat:workspaces',
          routerLinkActiveOptions: { exact: false }
        }
      ]
    },
    {
      type: 'subheading',
      label: 'More',
      children: [
        {
          type: 'link',
          label: 'Settings',
          route: '/settings',
          icon: 'mat:settings',
          routerLinkActiveOptions: { exact: false }
        },
        {
          type: 'link',
          label: 'Help',
          route: '/help',
          icon: 'mat:help',
          routerLinkActiveOptions: { exact: false }
        }
      ]
    }
  ]
};

