import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';
import { ChangeDetectionStrategy } from '@angular/core';
import { SecondaryToolbarModule } from "src/@vex/components/secondary-toolbar/secondary-toolbar.module";
import { BreadcrumbsModule } from "src/@vex/components/breadcrumbs/breadcrumbs.module";
import { MatTabsModule } from '@angular/material/tabs';
@Component({
  selector: 'vex-template',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageLayoutModule,
    SecondaryToolbarModule,
    BreadcrumbsModule,
    MatTabsModule
],
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateComponent {
}
