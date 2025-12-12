import { Component } from '@angular/core';

/**
 * Notes Page Component
 * 
 * Top-level page component that serves as the shell/container for the Notes Application.
 * This component does NOT contain feature logic - it only provides the page layout
 * and renders components from the features module.
 * 
 * All notes functionality is implemented in:
 *   src/app/features/notes/
 */
@Component({
  selector: 'vex-notes-page',
  templateUrl: './notes-page.component.html',
  styleUrls: ['./notes-page.component.scss']
})
export class NotesPageComponent {
  constructor() {
    // This is a shell component - no logic here
    // All functionality is in the NotesDashboard component from features module
  }
}

