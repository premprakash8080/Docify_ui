import { environment } from "src/environments/environment";

export const ENDPOINTS = {
  // Calendar CRUD
  getCalendarItems:environment.apiUrl + '/calendar/getCalendarItems',

  // Month / Week / Day view (query params: ?date=YYYY-MM-DD&view=month|week|day)
  getCalendarEventsByDate:environment.apiUrl + '/calendar/getCalendarEventsByDate',

  // Specific calendar event by ID (query param: ?id=...)
  getCalendarEventById:environment.apiUrl + '/calendar/getCalendarEventById',

  // Custom date range (query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD)
  getCalendarEventsByRange:environment.apiUrl + '/calendar/getCalendarEventsByRange',

  // Update calendar event (task) start/end dates (id in payload)
  updateCalendarEvent:environment.apiUrl + '/calendar/updateCalendarEvent',

  // Get calendar note details (query param: ?id=...)
  getCalendarNoteDetails:environment.apiUrl + '/calendar/getCalendarNoteDetails',

  // Get calendar task details (query param: ?id=...)
  getCalendarTaskDetails:environment.apiUrl + '/calendar/getCalendarTaskDetails',

};
