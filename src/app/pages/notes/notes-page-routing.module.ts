import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NotesPageComponent } from './notes-page.component';
import { VexRoutes } from '../../../@vex/interfaces/vex-route.interface';

const routes: VexRoutes = [
  {
    path: '',
    component: NotesPageComponent,
    children: [
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
      {
        path: ':id',
        loadChildren: () => import('./components/note-page/note-page.module').then(m => m.NotePageModule),
        data: {
          toolbarShadowEnabled: false
        }
      },
      {
        path: 'new',
        loadChildren: () => import('./components/note-page/note-page.module').then(m => m.NotePageModule),
        data: {
          toolbarShadowEnabled: false
        }
      },
      {
        path: 'tags/:tagId',
        loadChildren: () => import('./components/notes-dashboard/notes-dashboard.module').then(m => m.NotesDashboardModule),
        data: {
          toolbarShadowEnabled: false
        }
      },
      {
        path: 'notebooks/:notebookId',
        loadChildren: () => import('./components/notes-dashboard/notes-dashboard.module').then(m => m.NotesDashboardModule),
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

