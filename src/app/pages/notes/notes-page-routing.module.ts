import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NotesPageComponent } from './notes-page.component';
import { VexRoutes } from '../../../@vex/interfaces/vex-route.interface';

const routes: VexRoutes = [
  {
    path: '',
    component: NotesPageComponent,
    children: [
      // Static routes first to avoid conflicts with dynamic params
      
      // Dashboard - All notes list (default route)
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./components/notes-dashboard/notes-dashboard.module').then(m => m.NotesDashboardModule),
        data: {
          toolbarShadowEnabled: false
        }
      },
      
      // New note creation
      {
        path: 'new',
        loadChildren: () => import('./components/note-page/note-page.module').then(m => m.NotePageModule),
        data: {
          toolbarShadowEnabled: false
        }
      },
      
      // Tag filtering
      {
        path: 'tags/:tagId',
        loadChildren: () => import('./components/notes-dashboard/notes-dashboard.module').then(m => m.NotesDashboardModule),
        data: {
          toolbarShadowEnabled: false
        }
      },
      
      // Stack routes - must come before notebook routes to avoid conflicts
      {
        path: 'stack/:stackId',
        children: [
          // Stack notebooks list
          {
            path: 'notebooks',
            loadChildren: () => import('./components/notes-dashboard/notes-dashboard.module').then(m => m.NotesDashboardModule),
            data: {
              toolbarShadowEnabled: false
            }
          },
          // Stack notebook notes list
          {
            path: 'notebook/:notebookId/notes',
            loadChildren: () => import('./components/notes-dashboard/notes-dashboard.module').then(m => m.NotesDashboardModule),
            data: {
              toolbarShadowEnabled: false
            }
          },
          // Stack notebook single note
          {
            path: 'notebook/:notebookId/note/:noteId',
            loadChildren: () => import('./components/note-page/note-page.module').then(m => m.NotePageModule),
            data: {
              toolbarShadowEnabled: false
            }
          }
        ]
      },
      
      // Notebook routes - must come after stack routes
      {
        path: 'notebook/:notebookId',
        children: [
          // Notebook notes list
          {
            path: 'notes',
            loadChildren: () => import('./components/notes-dashboard/notes-dashboard.module').then(m => m.NotesDashboardModule),
            data: {
              toolbarShadowEnabled: false
            }
          },
          // Notebook single note
          {
            path: 'note/:noteId',
            loadChildren: () => import('./components/note-page/note-page.module').then(m => m.NotePageModule),
            data: {
              toolbarShadowEnabled: false
            }
          }
        ]
      },
      
      // Single note detail (must be last to avoid conflicts)
      {
        path: ':noteId',
        loadChildren: () => import('./components/note-page/note-page.module').then(m => m.NotePageModule),
        data: {
          toolbarShadowEnabled: false
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotesPageRoutingModule { }
