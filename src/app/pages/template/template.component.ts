import { Component, ChangeDetectionStrategy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';

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
  image_url?: string;
  is_system: boolean;
  created_at: string;
  updated_at?: string;
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
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

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
      this.cdr.markForCheck();
    });
  }

  private getUserTemplates(): void {
    this.templateService.getUserTemplates().subscribe(res => {
      if (!res.success) return;
      this.userTemplates = res.data.templates;
      this.cdr.markForCheck();
    });
  }

  /** -------------------------
   * Card actions
   * ------------------------ */
  onPreview(template: Template): void {
    this.router.navigate(['/templates', template.id]);
  }

  onClone(template: Template): void {
    this.templateService.cloneTemplate(template.id).subscribe(res => {
      const noteId = res?.data?.note?.id;
      if (noteId) {
        this.router.navigate(['/users/notes', noteId]);
      }
    });
  }

  onDelete(templateId: string): void {
    if (!templateId) return;
    if (!confirm('Delete this template?')) return;

    this.templateService.deleteTemplate(templateId).subscribe(() => {
      this.getUserTemplates();
      this.getSystemTemplates();
    });
  }
}
