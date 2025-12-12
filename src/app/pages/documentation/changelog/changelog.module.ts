import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChangelogRoutingModule } from './changelog-routing.module';
import { ChangelogComponent } from './changelog.component';
import { MarkdownModule } from '../markdown.module';
import { SecondaryToolbarModule } from '../../../../@vex/components/secondary-toolbar/secondary-toolbar.module';
import { BreadcrumbsModule } from '../../../../@vex/components/breadcrumbs/breadcrumbs.module';
import { PageLayoutModule } from '../../../../@vex/components/page-layout/page-layout.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [ChangelogComponent],
  imports: [
    CommonModule,
    ChangelogRoutingModule,
    MarkdownModule,
    SecondaryToolbarModule,
    BreadcrumbsModule,
    PageLayoutModule,
    MatIconModule,

    MatButtonModule
  ]
})
export class ChangelogModule {
}
