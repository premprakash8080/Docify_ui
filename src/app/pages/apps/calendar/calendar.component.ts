import { Component, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import {
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarView,
} from 'angular-calendar';
import {
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  endOfDay,
  isValid,
  format,
} from 'date-fns';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CalendarEditComponent } from './calendar-edit/calendar-edit.component';
import { CalendarService } from './services/calender.service';

interface CalendarItem {
  id: string;          // e.g., "task_1" or "note_aad09f09-8e26-4ea1-a9c2-b2ef372d4a28"
  type: 'task' | 'note';
  title: string;
  start: string;       // ISO date or datetime
  end: string | null;
  allDay: boolean;
  completed?: boolean;
  color: string;
  sourceId: number | string;  // number for tasks, string (UUID) for notes
}

@Component({
  selector: 'vex-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  standalone: false,
  encapsulation: ViewEncapsulation.None,
})
export class CalendarComponent implements OnInit {
  @ViewChild('modalContent', { static: true }) modalContent!: TemplateRef<any>;

  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;
  private _viewDate: Date = new Date();
  refresh = new Subject<void>();

  events: CalendarEvent[] = [];

  get viewDate(): Date {
    return this._viewDate;
  }

  set viewDate(value: Date) {
    if (this._viewDate.getTime() !== value.getTime()) {
      this._viewDate = value;
      this.loadCalendarEvents();
    }
  }

  activeDayIsOpen = true;

  actions: CalendarEventAction[] = [
    {
      label: '<i class="fa fa-fw fa-pencil"></i>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.handleEvent('Edited', event);
      },
    },
    {
      label: '<i class="fa fa-fw fa-times"></i>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.events = this.events.filter((iEvent) => iEvent !== event);
        this.snackbar.open('Event deleted', 'Close', { duration: 3000 });
        this.refresh.next();
      },
    },
  ];

  constructor(
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private calendarService: CalendarService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCalendarEvents();
  }

  private loadCalendarEvents(): void {
    const dateStr = format(this.viewDate, 'yyyy-MM-dd');
    const viewStr = this.view === CalendarView.Month ? 'month' : 
                   this.view === CalendarView.Week ? 'week' : 'day';

    this.calendarService.getCalendarEventsByDate({ date: dateStr, view: viewStr }).subscribe({
      next: (response) => {
        if (!response?.success || !response.data?.items) {
          this.snackbar.open('No calendar data available', 'Close', {
            duration: 3000,
          });
          this.events = [];
          this.refresh.next();
          return;
        }

        const items = Array.isArray(response.data.items) ? response.data.items : [];
        const validItems = this.validateAndDeduplicateItems(items);
        this.events = validItems.map((item: CalendarItem) =>
          this.mapToCalendarEvent(item)
        );
        this.refresh.next();
      },
      error: (err) => {
        console.error('Failed to load calendar events', err);
        this.snackbar.open('Failed to load calendar data', 'Close', {
          duration: 5000,
        });
        this.events = [];
        this.refresh.next();
      },
    });
  }

  private validateAndDeduplicateItems(items: CalendarItem[]): CalendarItem[] {
    const seen = new Set<string>();
    const valid: CalendarItem[] = [];

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      if (!item.id || typeof item.id !== 'string') continue;
      if (!item.title || typeof item.title !== 'string') continue;
      if (!item.start || typeof item.start !== 'string') continue;
      if (item.type !== 'task' && item.type !== 'note') continue;
      if (typeof item.allDay !== 'boolean') continue;
      if (!item.color || typeof item.color !== 'string') continue;
      // sourceId can be number (tasks) or string (notes with UUID)
      if (!item.sourceId || (typeof item.sourceId !== 'number' && typeof item.sourceId !== 'string')) continue;

      if (seen.has(item.id)) continue;
      seen.add(item.id);

      valid.push(item);
    }

    return valid;
  }

  private mapToCalendarEvent(item: CalendarItem): CalendarEvent {
    const startDate = this.parseSafeDate(item.start);
    const endDate = item.end ? this.parseSafeDate(item.end) : undefined;
    const isCompleted = item.completed === true;
    const canDragResize = !isCompleted;

    if (!isValid(startDate)) {
      console.warn('Invalid start date for item:', item.id, item.start);
      return this.createFallbackEvent(item);
    }

    return {
      id: item.id,
      title: item.type === 'task' && isCompleted ? `✓ ${item.title}` : item.title,
      start: startDate,
      end: endDate && isValid(endDate) ? endDate : undefined,
      color: {
        primary: item.color,
        secondary: this.lightenColor(item.color),
      },
      allDay: item.allDay,
      resizable: {
        beforeStart: canDragResize,
        afterEnd: canDragResize,
      },
      draggable: canDragResize,
      actions: this.actions,
      meta: {
        type: item.type,
        sourceId: item.sourceId,
        completed: isCompleted,
      },
    };
  }

  private parseSafeDate(dateString: string): Date {
    if (!dateString || typeof dateString !== 'string') {
      return new Date();
    }

    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }

    const fallback = new Date(dateString);
    return isValid(fallback) ? fallback : new Date();
  }

  private createFallbackEvent(item: CalendarItem): CalendarEvent {
    return {
      id: item.id,
      title: item.title,
      start: new Date(),
      color: {
        primary: item.color,
        secondary: this.lightenColor(item.color),
      },
      allDay: item.allDay,
      resizable: {
        beforeStart: false,
        afterEnd: false,
      },
      draggable: false,
      actions: this.actions,
      meta: {
        type: item.type,
        sourceId: item.sourceId,
        completed: item.completed || false,
      },
    };
  }

  // Optional: helper to create a lighter secondary color
  private lightenColor(hex: string): string {
    return hex + '40'; // adds 25% opacity (e.g., #ff000040)
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
      }
      this.viewDate = date; // This will trigger loadCalendarEvents via setter
    }
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    if (!event.meta || !event.id) return;

    const isCompleted = event.meta.completed === true;
    if (isCompleted) {
      this.snackbar.open('Cannot modify completed items', 'Close', {
        duration: 3000,
      });
      this.refresh.next();
      return;
    }

    if (!event.draggable || !event.resizable) {
      this.snackbar.open('This item cannot be moved or resized', 'Close', {
        duration: 3000,
      });
      this.refresh.next();
      return;
    }

    // Optimistically update UI
    this.events = this.events.map((iEvent) => {
      if (iEvent === event) {
        return {
          ...event,
          start: newStart,
          end: newEnd,
        };
      }
      return iEvent;
    });
    this.refresh.next();

    // Update on server
    const payload: { start?: string; end?: string; allDay?: boolean } = {
      start: newStart.toISOString(),
      allDay: event.allDay || false,
    };

    if (newEnd) {
      payload.end = newEnd.toISOString();
    }

    this.calendarService.updateCalendarEvent(event.id, payload).subscribe({
      next: (response) => {
        if (response?.success && response?.data?.item) {
          // Update event with server response
          const updatedItem = response.data.item;
          this.events = this.events.map((iEvent) => {
            if (iEvent.id === event.id) {
              return this.mapToCalendarEvent(updatedItem);
            }
            return iEvent;
          });
          this.refresh.next();
          this.snackbar.open('Event updated successfully', 'Close', { duration: 3000 });
        } else {
          // Revert on failure
          this.loadCalendarEvents();
          this.snackbar.open('Failed to update event', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        console.error('Failed to update calendar event', err);
        // Revert on error
        this.loadCalendarEvents();
        this.snackbar.open('Failed to update event', 'Close', { duration: 3000 });
      },
    });
  }

  // handleEvent(action: string, event: CalendarEvent): void {
  //   const dialogRef = this.dialog.open(CalendarEditComponent, {
  //     data: { event, action },
  //     width: '500px',
  //   });

  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result) {
  //       // If edit component returns updated event
  //       const index = this.events.findIndex((e) => e.id === event.id);
  //       if (index > -1) {
  //         this.events[index] = result;
  //         this.events = [...this.events]; // trigger change detection
  //       }
  //       this.snackbar.open(`Event ${action.toLowerCase()}: ${result.title}`, 'Close', {
  //         duration: 4000,
  //       });
  //       this.refresh.next();
  //     }
  //   });
  // }

  handleEvent(action: string, event: CalendarEvent): void {
    this.dialog.open(CalendarEditComponent, {
      data: { event },
      width: '500px',
      maxWidth: '90vw',
      panelClass: 'calendar-event-dialog'
    });
  }

  setView(view: CalendarView): void {
    this.view = view;
    this.loadCalendarEvents();
  }

  closeOpenMonthViewDay(): void {
    this.activeDayIsOpen = false;
  }
}