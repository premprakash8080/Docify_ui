import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotesPageComponent } from './notes-page.component';
import { NotesPageRoutingModule } from './notes-page-routing.module';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';

// Import Notes Module from features to get access to NotesDashboard
import { NotesDashboardModule } from '../../features/notes/containers/notes-dashboard/notes-dashboard.module';

/**
 * Notes Page Module
 * 
 * This module provides the top-level page entry point for the Notes Application.
 * It serves as a shell/container that:
 * - Uses Vex layout components for page structure
 * - Imports and renders components from the features/notes module
 * - Provides a cursor layer for collaborative editing support
 * 
 * All feature logic remains in: src/app/features/notes/
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

