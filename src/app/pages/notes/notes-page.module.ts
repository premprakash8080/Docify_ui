import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotesPageComponent } from './notes-page.component';
import { NotesPageRoutingModule } from './notes-page-routing.module';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';

// Import NotesDashboardModule from components
import { NotesDashboardModule } from './components/notes-dashboard/notes-dashboard.module';

/**
 * Notes Page Module
 * 
 * This module provides the top-level page entry point for the Notes Application.
 * It serves as a shell/container that:
 * - Uses Vex layout components for page structure
 * - Imports and renders components from the pages/notes/components module
 * - Provides a cursor layer for collaborative editing support
 * 
 * Services remain in: src/app/features/notes/services/
 */
@NgModule({
  declarations: [NotesPageComponent],
  imports: [
    CommonModule,
    NotesPageRoutingModule,
    PageLayoutModule,
    // Import NotesDashboardModule to use the NotesDashboard component
    NotesDashboardModule
  ]
})
export class NotesPageModule { }

