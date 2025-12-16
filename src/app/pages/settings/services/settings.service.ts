import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ENDPOINTS } from './api.collection';
import { UserSetting } from '../../../core/models/userSetting.model';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private http = inject(HttpClient);

  // Single settings object (one row per user)
  private settingsSubject = new BehaviorSubject<UserSetting | null>(null);
  settings$ = this.settingsSubject.asObservable();

  /**
   * Fetch user settings from API
   */
  loadSettings(): Observable<UserSetting> {
    return this.http.get<UserSetting>(ENDPOINTS.userSettings).pipe(
      tap((settings) => this.settingsSubject.next(settings)),
      catchError((error) => {
        this.settingsSubject.next(null);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update user settings
   */
  updateSettings(payload: Partial<UserSetting>): Observable<UserSetting> {
    return this.http.put<UserSetting>(ENDPOINTS.userSettings, payload).pipe(
      tap((settings) => this.settingsSubject.next(settings)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Get current cached settings (sync)
   */
  getCurrentSettings(): UserSetting | null {
    return this.settingsSubject.value;
  }
}
