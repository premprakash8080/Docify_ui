import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
    MatButtonToggleModule,
    MatMenuModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    PageLayoutModule,
    SecondaryToolbarModule,
    BreadcrumbsModule,
    TemplateCardsComponent
  ],
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateComponent implements OnInit, OnDestroy {

  /** -------------------------
   * Templates data
   * ------------------------ */
  systemTemplates: Template[] = [];
  userTemplates: Template[] = [];
  filteredSystemTemplates: Template[] = [];
  filteredUserTemplates: Template[] = [];

  /** -------------------------
   * UI state
   * ------------------------ */
  layoutCtrl = new FormControl('boxed');
  searchControl = new FormControl('');
  activeFilter: 'system' | 'user' | 'all' = 'all';

  private templateService = inject(TemplatesService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.getSystemTemplates();
    this.getUserTemplates();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.applySearchFilter(query || '');
      this.cdr.markForCheck();
    });
  }

  private applySearchFilter(query: string): void {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
      this.filteredSystemTemplates = [...this.systemTemplates];
      this.filteredUserTemplates = [...this.userTemplates];
      return;
    }

    this.filteredSystemTemplates = this.systemTemplates.filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      (template.description || '').toLowerCase().includes(searchTerm)
    );

    this.filteredUserTemplates = this.userTemplates.filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      (template.description || '').toLowerCase().includes(searchTerm)
    );
  }

  /** -------------------------
   * API calls (clean style)
   * ------------------------ */
  private getSystemTemplates(): void {
    this.templateService.getSystemTemplates().subscribe(res => {
      if (!res.success) return;

      this.systemTemplates = res.data.templates;
      this.applySearchFilter(this.searchControl.value || '');
      this.cdr.markForCheck();
    });
  }

  private getUserTemplates(): void {
    this.templateService.getUserTemplates().subscribe(res => {
      if (!res.success) return;
      this.userTemplates = res.data.templates;
      this.applySearchFilter(this.searchControl.value || '');
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

  onCreateTemplate(): void {
    this.router.navigate(['/templates/create']);
  }

  onFilterClick(filterType: 'system' | 'user' | 'all'): void {
    this.activeFilter = filterType;
    // Filter logic can be added here if needed
    this.cdr.markForCheck();
  }
}
