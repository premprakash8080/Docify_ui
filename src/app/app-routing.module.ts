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
  // Coming soon - NOT USED in sidebar (commented out)
  // {
  //   path: 'coming-soon',
  //   loadChildren: () => import('./pages/pages/coming-soon/coming-soon.module').then(m => m.ComingSoonModule),
  // },
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
          // {
          //   path: 'contacts',
          //   loadChildren: () => import('./pages/apps/contacts/contacts.module').then(m => m.ContactsModule)
          // },
          // {
          //   path: 'aio-table',
          //   loadChildren: () => import('./pages/apps/aio-table/aio-table.module').then(m => m.AioTableModule),
          // },
          // {
          //   path: 'help-center',
          //   loadChildren: () => import('./pages/apps/help-center/help-center.module').then(m => m.HelpCenterModule),
          // },
          // {
          //   path: 'scrumboard',
          //   loadChildren: () => import('./pages/apps/scrumboard/scrumboard.module').then(m => m.ScrumboardModule),
          // },
          // {
          //   path: 'editor',
          //   loadChildren: () => import('./pages/apps/editor/editor.module').then(m => m.EditorModule),
          // },
        ]
      },
      // Main routes - USED in sidebar
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
          // Unused pages - commented out
          // {
          //   path: 'pricing',
          //   loadChildren: () => import('./pages/pages/pricing/pricing.module').then(m => m.PricingModule)
          // },
          // {
          //   path: 'faq',
          //   loadChildren: () => import('./pages/pages/faq/faq.module').then(m => m.FaqModule)
          // },
          // {
          //   path: 'guides',
          //   loadChildren: () => import('./pages/pages/guides/guides.module').then(m => m.GuidesModule)
          // },
          // {
          //   path: 'invoice',
          //   loadChildren: () => import('./pages/pages/invoice/invoice.module').then(m => m.InvoiceModule)
          // },
        ]
      },
      // Settings - USED in sidebar
      {
        path: 'settings',
        loadChildren: () => import('./pages/settings/settings.module').then(m => m.SettingsModule),
        data: {
          toolbarShadowEnabled: true
        }
      },
      // Unused UI routes - commented out
      // {
      //   path: 'ui',
      //   children: [
      //     {
      //       path: 'components',
      //       loadChildren: () => import('./pages/ui/components/components.module').then(m => m.ComponentsModule),
      //     },
      //     {
      //       path: 'forms/form-elements',
      //       loadChildren: () => import('./pages/ui/forms/form-elements/form-elements.module').then(m => m.FormElementsModule),
      //       data: {
      //         containerEnabled: true
      //       }
      //     },
      //     {
      //       path: 'forms/form-wizard',
      //       loadChildren: () => import('./pages/ui/forms/form-wizard/form-wizard.module').then(m => m.FormWizardModule),
      //       data: {
      //         containerEnabled: true
      //       }
      //     },
      //     {
      //       path: 'icons',
      //       loadChildren: () => import('./pages/ui/icons/icons.module').then(m => m.IconsModule)
      //     },
      //     {
      //       path: 'page-layouts',
      //       loadChildren: () => import('./pages/ui/page-layouts/page-layouts.module').then(m => m.PageLayoutsModule),
      //     },
      //   ]
      // },
      // {
      //   path: 'documentation',
      //   loadChildren: () => import('./pages/documentation/documentation.module').then(m => m.DocumentationModule),
      // },
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
