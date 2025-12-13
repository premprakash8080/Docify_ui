import { Component, Inject, LOCALE_ID, Renderer2 } from '@angular/core';
import { ConfigService } from '../@vex/config/config.service';
import { Settings } from 'luxon';
import { DOCUMENT } from '@angular/common';
import { Platform } from '@angular/cdk/platform';
import { NavigationService } from '../@vex/services/navigation.service';
import { LayoutService } from '../@vex/services/layout.service';
import { ActivatedRoute } from '@angular/router';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { SplashScreenService } from '../@vex/services/splash-screen.service';
import { VexConfigName } from '../@vex/config/config-name.model';
import { ColorSchemeName } from '../@vex/config/colorSchemeName';
import { MatIconRegistry, SafeResourceUrlWithIconOptions } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ColorVariable, colorVariables } from '../@vex/components/config-panel/color-variables';
import { SIDEBAR_CONFIG } from './core/config/sidebar.config';

@Component({
  selector: 'vex-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent {
  constructor(private configService: ConfigService,
              private renderer: Renderer2,
              private platform: Platform,
              @Inject(DOCUMENT) private document: Document,
              @Inject(LOCALE_ID) private localeId: string,
              private layoutService: LayoutService,
              private route: ActivatedRoute,
              private navigationService: NavigationService,
              private splashScreenService: SplashScreenService,
              private readonly matIconRegistry: MatIconRegistry,
              private readonly domSanitizer: DomSanitizer) {
    Settings.defaultLocale = this.localeId;

    if (this.platform.BLINK) {
      this.renderer.addClass(this.document.body, 'is-blink');
    }

    this.matIconRegistry.addSvgIconResolver(
      (
        name: string,
        namespace: string
      ): SafeResourceUrl | SafeResourceUrlWithIconOptions | null => {
        switch (namespace) {
          case 'mat':
            return this.domSanitizer.bypassSecurityTrustResourceUrl(
              `assets/img/icons/material-design-icons/two-tone/${name}.svg`
            );

          case 'logo':
            return this.domSanitizer.bypassSecurityTrustResourceUrl(
              `assets/img/icons/logos/${name}.svg`
            );

          case 'flag':
            return this.domSanitizer.bypassSecurityTrustResourceUrl(
              `assets/img/icons/flags/${name}.svg`
            );
        }
      }
    );

    /**
     * Customize the template to your needs with the ConfigService
     * Example:
     *  this.configService.updateConfig({
     *    sidenav: {
     *      title: 'Custom App',
     *      imageUrl: '//placehold.it/100x100',
     *      showCollapsePin: false
     *    },
     *    footer: {
     *      visible: false
     *    }
     *  });
     */

    /**
     * Config Related Subscriptions
     * You can remove this if you don't need the functionality of being able to enable specific configs with queryParams
     * Example: example.com/?layout=apollo&style=default
     */
    this.route.queryParamMap.subscribe(queryParamMap => {
      if (queryParamMap.has('layout')) {
        this.configService.setConfig(queryParamMap.get('layout') as VexConfigName);
      }

      if (queryParamMap.has('style')) {
        this.configService.updateConfig({
          style: {
            colorScheme: queryParamMap.get('style') as ColorSchemeName
          }
        });
      }

      if (queryParamMap.has('primaryColor')) {
        const color: ColorVariable = colorVariables[queryParamMap.get('primaryColor')];

        if (color) {
          this.configService.updateConfig({
            style: {
              colors: {
                primary: color
              }
            }
          });
        }
      }

      if (queryParamMap.has('rtl')) {
        this.configService.updateConfig({
          direction: coerceBooleanProperty(queryParamMap.get('rtl')) ? 'rtl' : 'ltr'
        });
      }
    });

    /**
     * Load sidebar navigation from config
     * This allows easy updates via sidebar.config.ts without touching component code
     */
    this.navigationService.items = SIDEBAR_CONFIG.items;
    
    /**
     * Previous navigation configuration (kept for reference)
     * Uncomment and modify if needed for fallback
     */
    /*
    this.navigationService.items = [
      {
        type: 'subheading',
        label: 'Dashboards',
        children: [
          {
            type: 'link',
            label: 'Home',
            route: '/',
            icon: 'mat:insights',
            routerLinkActiveOptions: { exact: true }
          }
          // Finance link removed - uncomment if needed:
          // {
          //   type: 'link',
          //   label: 'Finance',
          //   route: '/',
          //   icon: icLayers,
          //   routerLinkActiveOptions: { exact: true }
          // }
        ]
      },
      {
        type: 'link',
        label: 'Notes',
        route: '/notes',
        icon: 'mat:note',
        routerLinkActiveOptions: { exact: false }
      },
      {
        type: 'subheading',
        label: 'Apps',
        children: [
          {
            type: 'link',
            label: 'All-In-One Table',
            route: '/apps/aio-table',
            icon: 'mat:assignment'
          },
          
          {
            type: 'link',
            label: 'Calendar',
            route: '/apps/calendar',
            icon: 'mat:date_range',
            badge: {
              value: '12',
              bgClass: 'bg-deep-purple',
              textClass: 'text-deep-purple-contrast',
            },
          },
          {
            type: 'link',
            label: 'Chat',
            route: '/apps/chat',
            icon: 'mat:chat',
            badge: {
              value: '16',
              bgClass: 'bg-cyan',
              textClass: 'text-cyan-contrast',
            },
          },
          {
            type: 'link',
            label: 'Mailbox',
            route: '/apps/mail',
            icon: 'mat:mail',
          },
          {
            type: 'dropdown',
            label: 'Social',
            icon: 'mat:person_outline',
            children: [
              {
                type: 'link',
                label: 'Profile',
                route: '/apps/social',
                routerLinkActiveOptions: { exact: true }
              },
              {
                type: 'link',
                label: 'Timeline',
                route: '/apps/social/timeline'
              },
            ]
          },
          {
            type: 'link',
            label: 'WYSIWYG Editor',
            route: '/apps/editor',
            icon: 'mat:chrome_reader_mode'
          },
          {
            type: 'dropdown',
            label: 'Contacts',
            icon: 'mat:contacts',
            children: [
              {
                type: 'link',
                label: 'List - Grid',
                route: '/apps/contacts/grid',
              },
              {
                type: 'link',
                label: 'List - Table',
                route: '/apps/contacts/table',
              }
            ]
          },
          {
            type: 'link',
            label: 'Scrumboard',
            route: '/apps/scrumboard',
            icon: 'mat:assessment',
            badge: {
              value: 'NEW',
              bgClass: 'bg-primary',
              textClass: 'text-primary-contrast',
            }
          },
        ]
      },
      {
        type: 'subheading',
        label: 'Pages',
        children: [
          {
            type: 'dropdown',
            label: 'Authentication',
            icon: 'mat:lock',
            children: [
              {
                type: 'link',
                label: 'Login',
                route: '/login'
              },
              {
                type: 'link',
                label: 'Register',
                route: '/register'
              },
              {
                type: 'link',
                label: 'Forgot Password',
                route: '/forgot-password'
              }
            ]
          },
          {
            type: 'link',
            label: 'Coming Soon',
            icon: 'mat:watch_later',
            route: '/coming-soon'
          },
          {
            type: 'dropdown',
            label: 'Errors',
            icon: 'mat:error',
            badge: {
              value: '4',
              bgClass: 'bg-green',
              textClass: 'text-green-contrast',
            },
            children: [
              {
                type: 'link',
                label: '404',
                route: '/pages/error-404'
              },
              {
                type: 'link',
                label: '500',
                route: '/pages/error-500'
              }
            ]
          },
          {
            type: 'link',
            label: 'Pricing',
            icon: 'mat:attach_money',
            route: '/pages/pricing'
          },
          {
            type: 'link',
            label: 'Invoice',
            icon: 'mat:receipt',
            route: '/pages/invoice'
          },
          {
            type: 'link',
            label: 'FAQ',
            icon: 'mat:help',
            route: '/pages/faq'
          },
          {
            type: 'link',
            label: 'Guides',
            icon: 'mat:book',
            route: '/pages/guides',
            badge: {
              value: '18',
              bgClass: 'bg-teal',
              textClass: 'text-teal-contrast',
            },
          },
        ]
      },
      {
        type: 'subheading',
        label: 'UI Elements',
        children: [
          {
            type: 'dropdown',
            label: 'Components',
            icon: 'mat:bubble_chart',
            children: [
              {
                type: 'link',
                label: 'Overview',
                route: '/ui/components/overview'
              },
              {
                type: 'link',
                label: 'Autocomplete',
                route: '/ui/components/autocomplete'
              },
              {
                type: 'link',
                label: 'Buttons',
                route: '/ui/components/buttons'
              },
              {
                type: 'link',
                label: 'Button Group',
                route: '/ui/components/button-group'
              },
              {
                type: 'link',
                label: 'Cards',
                route: '/ui/components/cards'
              },
              {
                type: 'link',
                label: 'Checkbox',
                route: '/ui/components/checkbox'
              },
              {
                type: 'link',
                label: 'Dialogs',
                route: '/ui/components/dialogs'
              },
              {
                type: 'link',
                label: 'Grid List',
                route: '/ui/components/grid-list'
              },
              {
                type: 'link',
                label: 'Input',
                route: '/ui/components/input'
              },
              {
                type: 'link',
                label: 'Lists',
                route: '/ui/components/lists'
              },
              {
                type: 'link',
                label: 'Menu',
                route: '/ui/components/menu'
              },
              {
                type: 'link',
                label: 'Progress',
                route: '/ui/components/progress'
              },
              {
                type: 'link',
                label: 'Progress Spinner',
                route: '/ui/components/progress-spinner'
              },
              {
                type: 'link',
                label: 'Radio',
                route: '/ui/components/radio'
              },
              {
                type: 'link',
                label: 'Slide Toggle',
                route: '/ui/components/slide-toggle'
              },
              {
                type: 'link',
                label: 'Slider',
                route: '/ui/components/slider'
              },
              {
                type: 'link',
                label: 'Snack Bar',
                route: '/ui/components/snack-bar'
              },
              {
                type: 'link',
                label: 'Tooltip',
                route: '/ui/components/tooltip'
              },
            ]
          },
          {
            type: 'dropdown',
            label: 'Forms',
            icon: 'mat:format_color_text',
            children: [
              {
                type: 'link',
                label: 'Form Elements',
                route: '/ui/forms/form-elements'
              },
              {
                type: 'link',
                label: 'Form Wizard',
                route: '/ui/forms/form-wizard'
              }
            ]
          },
          {
            type: 'dropdown',
            label: 'Icons',
            icon: 'mat:star',
            children: [
              {
                type: 'link',
                label: 'Material Icons',
                route: '/ui/icons/ic'
              },
              {
                type: 'link',
                label: 'FontAwesome Icons',
                route: '/ui/icons/fa'
              }
            ]
          },
          {
            type: 'dropdown',
            label: 'Page Layouts',
            icon: 'mat:view_compact',
            children: [
              {
                type: 'dropdown',
                label: 'Card',
                children: [
                  {
                    type: 'link',
                    label: 'Default',
                    route: '/ui/page-layouts/card',
                    routerLinkActiveOptions: { exact: true }
                  },
                  {
                    type: 'link',
                    label: 'Tabbed',
                    route: '/ui/page-layouts/card/tabbed',
                  },
                  {
                    type: 'link',
                    label: 'Large Header',
                    route: '/ui/page-layouts/card/large-header',
                    routerLinkActiveOptions: { exact: true }
                  },
                  {
                    type: 'link',
                    label: 'Tabbed & Large Header',
                    route: '/ui/page-layouts/card/large-header/tabbed'
                  }
                ]
              },
              {
                type: 'dropdown',
                label: 'Simple',
                children: [
                  {
                    type: 'link',
                    label: 'Default',
                    route: '/ui/page-layouts/simple',
                    routerLinkActiveOptions: { exact: true }
                  },
                  {
                    type: 'link',
                    label: 'Tabbed',
                    route: '/ui/page-layouts/simple/tabbed',
                  },
                  {
                    type: 'link',
                    label: 'Large Header',
                    route: '/ui/page-layouts/simple/large-header',
                    routerLinkActiveOptions: { exact: true }
                  },
                  {
                    type: 'link',
                    label: 'Tabbed & Large Header',
                    route: '/ui/page-layouts/simple/large-header/tabbed'
                  }
                ]
              },
              {
                type: 'link',
                label: 'Blank',
                icon: 'mat:picture_in_picture',
                route: '/ui/page-layouts/blank'
              },
            ]
          },
        ]
      },
      {
        type: 'subheading',
        label: 'Documentation',
        children: [
          {
            type: 'link',
            label: 'Changelog',
            route: '/documentation/changelog',
            icon: 'mat:update'
          },
          {
            type: 'dropdown',
            label: 'Getting Started',
            icon: 'mat:book',
            children: [
              {
                type: 'link',
                label: 'Introduction',
                route: '/documentation/introduction',
                fragment: 'introduction',
                routerLinkActiveOptions: { exact: true }
              },
              {
                type: 'link',
                label: 'Folder Structure',
                route: '/documentation/folder-structure',
                fragment: 'folder-structure',
                routerLinkActiveOptions: { exact: true }
              },
              {
                type: 'link',
                label: 'Installation',
                route: '/documentation/installation',
                fragment: 'installation',
                routerLinkActiveOptions: { exact: true }
              },
              {
                type: 'link',
                label: 'Development Server',
                route: '/documentation/start-development-server',
                fragment: 'start-development-server',
                routerLinkActiveOptions: { exact: true }
              },
              {
                type: 'link',
                label: 'Build for Production',
                route: '/documentation/build-for-production',
                fragment: 'build-for-production',
                routerLinkActiveOptions: { exact: true }
              }
            ]
          },
          {
            type: 'dropdown',
            label: 'Customization',
            icon: 'mat:book',
            children: [
              {
                type: 'link',
                label: 'Configuration',
                route: '/documentation/configuration',
                fragment: 'configuration',
                routerLinkActiveOptions: { exact: true }
              },
              {
                type: 'link',
                label: 'Changing Styling',
                route: '/documentation/changing-styling-and-css-variables',
                fragment: 'changing-styling-and-css-variables',
                routerLinkActiveOptions: { exact: true }
              },
              {
                type: 'link',
                label: 'Using Custom Colors',
                route: '/documentation/using-custom-colors-for-the-primarysecondarywarn-palettes',
                fragment: 'using-custom-colors-for-the-primarysecondarywarn-palettes',
                routerLinkActiveOptions: { exact: true }
              },
              {
                type: 'link',
                label: 'Adding Menu Items',
                route: '/documentation/adding-menu-items',
                fragment: 'adding-menu-items',
                routerLinkActiveOptions: { exact: true }
              },
            ]
          },
          {
            type: 'link',
            label: 'Further Help',
            icon: 'mat:book',
            route: '/documentation/further-help',
            fragment: 'further-help',
            routerLinkActiveOptions: { exact: true }
          },
        ]
      },
      {
        type: 'subheading',
        label: 'Customize',
        children: []
      },
      {
        type: 'link',
        label: 'Configuration',
        route: () => this.layoutService.openConfigpanel(),
        icon: 'mat:settings'
      }
    ];
    */
  }
}
