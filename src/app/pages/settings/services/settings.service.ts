import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ENDPOINTS } from './api.collection';
import { UserSetting } from '../../../core/models/userSetting.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor(private http: HttpClient) {}

  // -----------------------------
  // Get settings
  // -----------------------------
  loadSettings(): Observable<UserSetting | null> {
    return this.http.get<any>(ENDPOINTS.getUserSettings).pipe(
      map(res => {
        if (!res?.success || !res?.data?.settings) {
          return null;
        }

        const s = res.data.settings;

        // Map API → UI
        return {
          themeLayout: s.theme_layout,
          themeColor: s.theme_color,
          corners: s.corners,
          buttonStyle: s.button_style
        } as UserSetting;
      })
    );
  }

  // -----------------------------
  // Update settings
  // -----------------------------
  updateSettings(payload: Partial<UserSetting>): Observable<UserSetting> {

    // Map UI → API (VERY IMPORTANT)
    const settings: any = {};

    if (payload.themeLayout) {
      settings.theme_layout = payload.themeLayout;
    }

    if (payload.themeColor) {
      settings.theme_color = payload.themeColor;
    }

    if (payload.corners) {
      settings.corners = payload.corners;
    }

    if (payload.buttonStyle) {
      settings.button_style = payload.buttonStyle;
    }

    return this.http.put<any>(ENDPOINTS.updateUserSettings, { settings }).pipe(
      map(res => {
        const s = res.data.settings;
        return {
          themeLayout: s.theme_layout,
          themeColor: s.theme_color,
          corners: s.corners,
          buttonStyle: s.button_style
        } as UserSetting;
      })
    );
  }
}
