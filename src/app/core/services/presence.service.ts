import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, timer } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Collaborator {
  id: string;
  displayName: string;
  avatarUrl?: string;
  color?: string;
  isOnline: boolean;
  isIdle: boolean;
  isEditing: boolean;
  currentSection?: string;
  currentSubSection?: string;
  lastActivity: Date;
  cursorPosition?: {
    x: number;
    y: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
  private collaboratorsSubject = new BehaviorSubject<Collaborator[]>([]);
  public collaborators$ = this.collaboratorsSubject.asObservable();

  private idleThresholdMs = 30000; // 30 seconds

  constructor() {
    // Check for idle collaborators every second
    interval(1000).subscribe(() => {
      this.updateIdleStatus();
    });
  }

  /**
   * Get all online collaborators
   */
  getOnlineCollaborators(): Observable<Collaborator[]> {
    return this.collaborators$.pipe(
      map(collabs => collabs.filter(c => c.isOnline))
    );
  }

  /**
   * Get collaborator by ID
   */
  getCollaborator(id: string): Observable<Collaborator | undefined> {
    return this.collaborators$.pipe(
      map(collabs => collabs.find(c => c.id === id))
    );
  }

  /**
   * Update collaborator activity
   */
  updateActivity(collaboratorId: string, activity: Partial<Collaborator>): void {
    const current = this.collaboratorsSubject.value;
    const index = current.findIndex(c => c.id === collaboratorId);
    
    if (index >= 0) {
      const updated = {
        ...current[index],
        ...activity,
        lastActivity: new Date(),
        isIdle: false
      };
      current[index] = updated;
    } else {
      // New collaborator
      const newCollaborator: Collaborator = {
        id: collaboratorId,
        displayName: activity.displayName || 'Unknown',
        avatarUrl: activity.avatarUrl,
        color: activity.color || this.generateColor(collaboratorId),
        isOnline: true,
        isIdle: false,
        isEditing: activity.isEditing || false,
        currentSection: activity.currentSection,
        currentSubSection: activity.currentSubSection,
        lastActivity: new Date(),
        cursorPosition: activity.cursorPosition
      };
      current.push(newCollaborator);
    }

    this.collaboratorsSubject.next([...current]);
  }

  /**
   * Set collaborator as offline
   */
  setOffline(collaboratorId: string): void {
    const current = this.collaboratorsSubject.value;
    const index = current.findIndex(c => c.id === collaboratorId);
    
    if (index >= 0) {
      current[index] = {
        ...current[index],
        isOnline: false,
        isIdle: false
      };
      this.collaboratorsSubject.next([...current]);
    }
  }

  /**
   * Update cursor position for a collaborator
   */
  updateCursor(collaboratorId: string, x: number, y: number): void {
    this.updateActivity(collaboratorId, {
      cursorPosition: { x, y }
    });
  }

  /**
   * Update current section/subsection for a collaborator
   */
  updateLocation(collaboratorId: string, section: string, subSection?: string): void {
    this.updateActivity(collaboratorId, {
      currentSection: section,
      currentSubSection: subSection
    });
  }

  /**
   * Set editing state for a collaborator
   */
  setEditing(collaboratorId: string, isEditing: boolean): void {
    this.updateActivity(collaboratorId, {
      isEditing
    });
  }

  /**
   * Generate a consistent color for a collaborator based on their ID
   */
  private generateColor(id: string): string {
    const colors = [
      '#3b82f6', // blue
      '#ef4444', // red
      '#10b981', // green
      '#f59e0b', // amber
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#f97316'  // orange
    ];
    
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Update idle status for all collaborators
   */
  private updateIdleStatus(): void {
    const now = new Date();
    const current = this.collaboratorsSubject.value;
    let updated = false;

    const updatedCollabs = current.map(collab => {
      if (!collab.isOnline) {
        return collab;
      }

      const timeSinceActivity = now.getTime() - collab.lastActivity.getTime();
      const shouldBeIdle = timeSinceActivity > this.idleThresholdMs;

      if (collab.isIdle !== shouldBeIdle) {
        updated = true;
        return {
          ...collab,
          isIdle: shouldBeIdle
        };
      }

      return collab;
    });

    if (updated) {
      this.collaboratorsSubject.next(updatedCollabs);
    }
  }

  /**
   * Initialize with sample collaborators (for development/demo)
   */
  initializeSampleCollaborators(): void {
    const sampleCollaborators: Collaborator[] = [
      {
        id: 'collab_1',
        displayName: 'Anita Sharma',
        color: '#3b82f6',
        isOnline: true,
        isIdle: false,
        isEditing: false,
        currentSection: 'Notes',
        currentSubSection: 'Your Home',
        lastActivity: new Date(),
      },
      {
        id: 'collab_2',
        displayName: 'Mark Lee',
        color: '#ef4444',
        isOnline: true,
        isIdle: false,
        isEditing: true,
        currentSection: 'Notes',
        currentSubSection: 'Untitled',
        lastActivity: new Date(),
      }
    ];

    this.collaboratorsSubject.next(sampleCollaborators);
  }
}

