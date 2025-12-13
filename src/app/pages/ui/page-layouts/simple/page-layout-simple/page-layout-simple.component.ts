import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageLayoutModule } from '../../../../../../@vex/components/page-layout/page-layout.module';
import { PageLayoutDemoModule } from '../../page-layout-demo/page-layout-demo.module';
import { SecondaryToolbarModule } from '../../../../../../@vex/components/secondary-toolbar/secondary-toolbar.module';
import { MatButtonModule } from '@angular/material/button';
import { BreadcrumbsModule } from '../../../../../../@vex/components/breadcrumbs/breadcrumbs.module';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'vex-page-layout-simple',
  templateUrl: './page-layout-simple.component.html',
  styleUrls: ['./page-layout-simple.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    PageLayoutModule,
    PageLayoutDemoModule,
    SecondaryToolbarModule,
    MatButtonModule,
    BreadcrumbsModule,
    MatIconModule
  ]
})
export class PageLayoutSimpleComponent {
}
