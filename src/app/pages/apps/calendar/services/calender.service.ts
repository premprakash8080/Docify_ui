import { Injectable } from '@angular/core';
import { HttpService } from '../../../../core/services/http.service';
import { ENDPOINTS } from './api.collection';

/**
 * Calendar model (frontend)
 */


@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  constructor(
    private httpService: HttpService,
  ) { }

  // Get all calendar items
  getCalendarItems() {
    return this.httpService.get(ENDPOINTS.getCalendarItems);
  }

  // Month / Week / Day view
  getCalendarEventsByDate(payload: { date: string; view: 'month' | 'week' | 'day'; }) {
    return this.httpService.get(ENDPOINTS.getCalendarEventsByDate, payload);
  }

  // Get calendar event by ID
  getCalendarEventById(id: string | number) {
    return this.httpService.get(ENDPOINTS.getCalendarEventById, { id });
  }

  // Get calendar events by custom date range
  getCalendarEventsByRange(payload: { startDate: string; endDate: string; }) {
    return this.httpService.get(ENDPOINTS.getCalendarEventsByRange, payload);
  }

  // Update calendar event (task)
  updateCalendarEvent(id: string | number, payload: { 
    start?: string; 
    end?: string; 
    allDay?: boolean;
    start_date?: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
  }) {
    return this.httpService.put(ENDPOINTS.updateCalendarEvent, { id, ...payload });
  }

  // Get calendar note details
  getCalendarNoteDetails(id: string | number) {
    return this.httpService.get(ENDPOINTS.getCalendarNoteDetails, { id }, true, true);
  }

  // Get calendar task details
  getCalendarTaskDetails(id: string | number) {
    return this.httpService.get(ENDPOINTS.getCalendarTaskDetails, { id }, true, true);
  }
  
}
