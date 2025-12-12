import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuicklinkModule } from 'ngx-quicklink';
import { VexRoutes } from '../../../@vex/interfaces/vex-route.interface';

const routes: VexRoutes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./containers/notes-dashboard/notes-dashboard.module').then(m => m.NotesDashboardModule),
    data: {
      toolbarShadowEnabled: false
    }
  },
  {
    path: 'list',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: ':id',
    loadChildren: () => import('./containers/note-page/note-page.module').then(m => m.NotePageModule),
    data: {
      toolbarShadowEnabled: false
    }
  },
  {
    path: 'new',
    loadChildren: () => import('./containers/note-page/note-page.module').then(m => m.NotePageModule),
    data: {
      toolbarShadowEnabled: false
    }
  },
  {
    path: 'tags/:tagId',
    loadChildren: () => import('./containers/notes-dashboard/notes-dashboard.module').then(m => m.NotesDashboardModule),
    data: {
      toolbarShadowEnabled: false
    }
  },
  {
    path: 'notebooks/:notebookId',
    loadChildren: () => import('./containers/notes-dashboard/notes-dashboard.module').then(m => m.NotesDashboardModule),
    data: {
      toolbarShadowEnabled: false
    }
  },
  {
    path: 'shortcuts',
    loadChildren: () => import('./containers/notes-dashboard/notes-dashboard.module').then(m => m.NotesDashboardModule),
    data: {
      toolbarShadowEnabled: false
    }
  },
  {
    path: 'shared',
    loadChildren: () => import('./containers/notes-dashboard/notes-dashboard.module').then(m => m.NotesDashboardModule),
    data: {
      toolbarShadowEnabled: false
    }
  },
  {
    path: 'spaces',
    loadChildren: () => import('./containers/notes-dashboard/notes-dashboard.module').then(m => m.NotesDashboardModule),
    data: {
      toolbarShadowEnabled: false
    }
  },
  {
    path: 'templates',
    loadChildren: () => import('./containers/notes-dashboard/notes-dashboard.module').then(m => m.NotesDashboardModule),
    data: {
      toolbarShadowEnabled: false
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule, QuicklinkModule]
})
export class NotesRoutingModule { }
