import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageLayoutModule } from '../../../../../../@vex/components/page-layout/page-layout.module';
import { PageLayoutDemoModule } from '../../page-layout-demo/page-layout-demo.module';
import { SecondaryToolbarModule } from '../../../../../../@vex/components/secondary-toolbar/secondary-toolbar.module';
import { MatButtonModule } from '@angular/material/button';
import { BreadcrumbsModule } from '../../../../../../@vex/components/breadcrumbs/breadcrumbs.module';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'vex-page-layout-simple-tabbed',
  templateUrl: './page-layout-simple-tabbed.component.html',
  styleUrls: ['./page-layout-simple-tabbed.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    PageLayoutModule,
    PageLayoutDemoModule,
    SecondaryToolbarModule,
    MatButtonModule,
    BreadcrumbsModule,
    MatIconModule,
    MatTabsModule
  ]
})
export class PageLayoutSimpleTabbedComponent {
}
