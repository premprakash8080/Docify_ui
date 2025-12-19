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

  getCalendarItems(){
    return this.httpService.get(ENDPOINTS.getCalendarItems);
  }
}
