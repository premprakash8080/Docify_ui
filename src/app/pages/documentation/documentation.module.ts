import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DocumentationRoutingModule } from './documentation-routing.module';
import { DocumentationComponent } from './documentation.component';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';
import { SecondaryToolbarModule } from '../../../@vex/components/secondary-toolbar/secondary-toolbar.module';
import { BreadcrumbsModule } from '../../../@vex/components/breadcrumbs/breadcrumbs.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MarkdownModule } from './markdown.module';

@NgModule({
  declarations: [DocumentationComponent],
  imports: [
    CommonModule,
    DocumentationRoutingModule,
    PageLayoutModule,
    SecondaryToolbarModule,
    BreadcrumbsModule,
    MatIconModule,

    MatButtonModule,
    MarkdownModule
  ]
})
export class DocumentationModule {
}
