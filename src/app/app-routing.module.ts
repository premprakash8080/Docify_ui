import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CustomLayoutComponent } from './custom-layout/custom-layout.component';
import { VexRoutes } from '../@vex/interfaces/vex-route.interface';
import { QuicklinkModule, QuicklinkStrategy } from 'ngx-quicklink';
import { AuthGuard } from './core/guards';

const routes: VexRoutes = [
  // Auth routes - KEEP (needed for authentication, not in sidebar)
  {
    path: 'login',
    loadChildren: () => import('./auth/login/login.module').then(m => m.LoginModule),
  },
  {
    path: 'register',
    loadChildren: () => import('./auth/register/register.module').then(m => m.RegisterModule),
  },
  {
    path: 'forgot-password',
    loadChildren: () => import('./auth/forgot-password/forgot-password.module').then(m => m.ForgotPasswordModule),
  },
  {
    path: '',
    component: CustomLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      // Home route - USED in sidebar
      {
        path: 'home',
        loadChildren: () => import('./pages/home/home.module').then(m => m.HomeModule),
        data: {
          toolbarShadowEnabled: false
        }
      },
      // Root path redirects to home
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      // Dashboard Analytics - NOT USED in sidebar (commented out)
      // {
      //   path: 'dashboards/analytics',
      //   redirectTo: '/',
      //   pathMatch: 'full'
      // },
      {
        path: 'dashboards/analytics',
        loadChildren: () => import('./pages/dashboards/dashboard-analytics/dashboard-analytics.module').then(m => m.DashboardAnalyticsModule),
      },
      {
        path: 'apps',
        children: [
          // Calendar - USED in sidebar
          {
            path: 'calendar',
            loadChildren: () => import('./pages/apps/calendar/calendar.module').then(m => m.CalendarModule),
            data: {
              toolbarShadowEnabled: true
            }
          },
          // Unused app routes - commented out
          {
            path: 'chat',
            loadChildren: () => import('./pages/apps/chat/chat.module').then(m => m.ChatModule),
            data: {
              toolbarShadowEnabled: true
            }
          },
          {
            path: 'mail',
            loadChildren: () => import('./pages/apps/mail/mail.module').then(m => m.MailModule),
            data: {
              toolbarShadowEnabled: true,
              scrollDisabled: true
            }
          },
          {
            path: 'social',
            loadChildren: () => import('./pages/apps/social/social.module').then(m => m.SocialModule)
          },
          {
            path: 'aio-table',
            loadChildren: () => import('./pages/apps/aio-table/aio-table.module').then(m => m.AioTableModule),
          },
        ]
      },
      // Main routes - USED in sidebar
      {
        path: 'profile',
        loadChildren: () => import('./pages/profile/profile.module').then(m => m.ProfileModule),
      },
      {
        path: 'notes',
        loadChildren: () => import('./pages/notes/notes-page.module').then(m => m.NotesPageModule),
        data: {
          toolbarShadowEnabled: false
        }
      },
      {
        path: 'tasks',
        loadChildren: () => import('./pages/tasks/tasks.module').then(m => m.TasksModule),
      },
      {
        path: 'files',
        loadChildren: () => import('./pages/files/files.module').then(m => m.FilesModule),
      },
      {
        path: 'notebooks',
        loadChildren: () => import('./pages/notebooks/notebooks.module').then(m => m.NotebooksModule),
      },
      {
        path: 'tags',
        loadChildren: () => import('./pages/tags/tags.module').then(m => m.TagsModule),
      },
      {
        path: 'templates',
        loadChildren: () => import('./pages/template/template.module').then(m => m.TemplatePageModule),
      },
      // Calendar redirect - sidebar uses /calendar but route is at /apps/calendar
      {
        path: 'calendar',
        redirectTo: '/apps/calendar',
        pathMatch: 'full'
      },
      {
        path: 'pages',
        children: [
          // Error pages - KEEP (needed for error handling)
          {
            path: 'error-404',
            loadChildren: () => import('./pages/pages/errors/error-404/error-404.module').then(m => m.Error404Module)
          },
          {
            path: 'error-500',
            loadChildren: () => import('./pages/pages/errors/error-500/error-500.module').then(m => m.Error500Module)
          }
        ]
      },
      {
        path: 'settings',
        loadChildren: () => import('./pages/settings/settings.module').then(m => m.SettingsModule),
        data: {
          toolbarShadowEnabled: true
        }
      },
     
      {
        path: '**',
        loadChildren: () => import('./pages/pages/errors/error-404/error-404.module').then(m => m.Error404Module)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: QuicklinkStrategy,
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled'
  })],
  exports: [RouterModule, QuicklinkModule]
})
export class AppRoutingModule {
}
