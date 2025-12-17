import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';
import { SecondaryToolbarModule } from 'src/@vex/components/secondary-toolbar/secondary-toolbar.module';
import { BreadcrumbsModule } from 'src/@vex/components/breadcrumbs/breadcrumbs.module';

import { TemplateCardsComponent } from './components/template-cards/template-cards.component';
import { TemplatesService } from './services/template.service';

/**
 * Template Model (frontend)
 */
export interface Template {
  id: string;
  name: string;
  description?: string;
  content: string;
  content_type: 'tiptap' | 'html' | 'markdown';
  thumbnail?: string;
  is_system: boolean;
  created_at: string;
}

@Component({
  selector: 'vex-template',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    PageLayoutModule,
    SecondaryToolbarModule,
    BreadcrumbsModule,
    TemplateCardsComponent
  ],
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateComponent implements OnInit {

  /** -------------------------
   * Templates data
   * ------------------------ */
  systemTemplates: Template[] = [];
  userTemplates: Template[] = [];

  private templateService = inject(TemplatesService);

  ngOnInit(): void {
    this.getSystemTemplates();
    this.getUserTemplates();
  }

  /** -------------------------
   * API calls (clean style)
   * ------------------------ */
  private getSystemTemplates(): void {
    this.templateService.getSystemTemplates().subscribe(res => {
      if (!res.success) return;

      this.systemTemplates = res.data.templates;
    });
  }

  private getUserTemplates(): void {
    this.templateService.getUserTemplates().subscribe(res => {
      if (!res.success) return;
      this.userTemplates = res.data.templates;
    });
  }

  /** -------------------------
   * Card actions
   * ------------------------ */
  onPreview(template: Template): void {
    console.log('Preview template:', template);
  }

  onClone(template: Template): void {
    console.log('Clone template:', template);
  }

  onDelete(templateId: string): void {
  }
}
