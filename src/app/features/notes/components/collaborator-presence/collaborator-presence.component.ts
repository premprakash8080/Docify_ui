import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { PresenceService, Collaborator } from '../../../../core/services/presence.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-collaborator-presence',
  templateUrl: './collaborator-presence.component.html',
  styleUrls: ['./collaborator-presence.component.scss']
})
export class CollaboratorPresenceComponent implements OnInit, OnDestroy {
  @Input() showInSidebar: boolean = false;
  @Input() showInEditor: boolean = false;

  collaborators$: Observable<Collaborator[]>;
  private destroy$ = new Subject<void>();

  constructor(private presenceService: PresenceService) {
    this.collaborators$ = this.presenceService.getOnlineCollaborators();
  }

  ngOnInit(): void {
    // For development: initialize sample collaborators
    // Remove this in production or replace with real WebSocket connection
    this.presenceService.initializeSampleCollaborators();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get tooltip text for a collaborator
   */
  getTooltipText(collaborator: Collaborator): string {
    const action = collaborator.isEditing ? 'Editing' : 'Viewing';
    const location = collaborator.currentSubSection 
      ? `${collaborator.currentSection} / ${collaborator.currentSubSection}`
      : collaborator.currentSection || 'Unknown';
    
    let tooltip = `${collaborator.displayName} — ${action}: ${location}`;
    
    if (collaborator.isIdle) {
      tooltip += ' (idle)';
    }

    return tooltip;
  }

  /**
   * Get ARIA label for accessibility
   */
  getAriaLabel(collaborator: Collaborator): string {
    return this.getTooltipText(collaborator);
  }

  /**
   * Get initials from display name
   */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}

