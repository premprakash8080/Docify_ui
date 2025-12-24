import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, ChangeDetectorRef, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, Observable, combineLatest, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, startWith, map, catchError, switchMap } from 'rxjs/operators';

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
    MatDialogModule,
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
   * Templates data (Observables)
   * ------------------------ */
  systemTemplates$: Observable<Template[]>;
  userTemplates$: Observable<Template[]>;
  filteredSystemTemplates$: Observable<Template[]>;
  filteredUserTemplates$: Observable<Template[]>;

  /** -------------------------
   * UI state
   * ------------------------ */
  layoutCtrl = new FormControl('boxed');
  searchControl = new FormControl('');
  activeFilter: 'system' | 'user' | 'all' = 'all';
  isLoading$ = new Subject<boolean>();
  error$ = new Subject<string | null>();

  private templateService = inject(TemplatesService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadTemplates();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTemplates(): void {
    this.isLoading$.next(true);
    this.error$.next(null);

    const searchQuery$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value || ''),
      debounceTime(300),
      distinctUntilChanged()
    );

    this.systemTemplates$ = this.templateService.getSystemTemplates().pipe(
      map(res => res.success ? res.data.templates : []),
      catchError((error) => {
        this.error$.next(error?.message || 'Failed to load system templates');
        this.isLoading$.next(false);
        return of([]);
      })
    );

    this.userTemplates$ = this.templateService.getUserTemplates().pipe(
      map(res => res.success ? res.data.templates : []),
      catchError((error) => {
        this.error$.next(error?.message || 'Failed to load user templates');
        this.isLoading$.next(false);
        return of([]);
      })
    );

    this.filteredSystemTemplates$ = combineLatest([
      this.systemTemplates$,
      searchQuery$
    ]).pipe(
      map(([templates, query]) => this.applySearchFilter(templates, query || ''))
    );

    this.filteredUserTemplates$ = combineLatest([
      this.userTemplates$,
      searchQuery$
    ]).pipe(
      map(([templates, query]) => this.applySearchFilter(templates, query || ''))
    );

    combineLatest([this.systemTemplates$, this.userTemplates$]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading$.next(false);
      this.cdr.markForCheck();
    });
  }

  private setupSearch(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  private applySearchFilter(templates: Template[], query: string): Template[] {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
      return templates;
    }

    return templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      (template.description || '').toLowerCase().includes(searchTerm)
    );
  }

  /** -------------------------
   * Card actions
   * ------------------------ */
  onPreview(template: Template): void {
    this.router.navigate(['/templates', template.id]);
  }

  onClone(template: Template): void {
    this.isLoading$.next(true);
    this.templateService.cloneTemplate(template.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res) => {
        const noteId = res?.data?.note?.id;
        if (noteId) {
          this.router.navigate(['/users/notes', noteId]);
        }
        this.isLoading$.next(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.error$.next(error?.message || 'Failed to clone template');
        this.isLoading$.next(false);
        this.cdr.markForCheck();
      }
    });
  }

  onDelete(templateId: string): void {
    if (!templateId) return;

    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Template',
        message: 'Are you sure you want to delete this template? This action cannot be undone.'
      }
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result) {
        this.deleteTemplateOptimistically(templateId);
      }
    });
  }

  private deleteTemplateOptimistically(templateId: string): void {
    this.isLoading$.next(true);
    
    // Optimistic update - remove from UI immediately
    this.systemTemplates$ = this.systemTemplates$.pipe(
      map(templates => templates.filter(t => t.id !== templateId))
    );
    this.userTemplates$ = this.userTemplates$.pipe(
      map(templates => templates.filter(t => t.id !== templateId))
    );
    this.cdr.markForCheck();

    // Then call API
    this.templateService.deleteTemplate(templateId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.templateService.clearCache();
        this.loadTemplates();
        this.isLoading$.next(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        // Revert optimistic update on error
        this.loadTemplates();
        this.error$.next(error?.message || 'Failed to delete template');
        this.isLoading$.next(false);
        this.cdr.markForCheck();
      }
    });
  }

  onCreateTemplate(): void {
    this.router.navigate(['/templates/create']);
  }

  onFilterClick(filterType: 'system' | 'user' | 'all'): void {
    this.activeFilter = filterType;
    this.cdr.markForCheck();
  }

  trackByTemplateId(index: number, template: Template): string {
    return template.id;
  }
}

@Component({
  selector: 'vex-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">Delete</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDeleteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDeleteDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
