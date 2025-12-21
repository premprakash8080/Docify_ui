import { Injectable, inject } from '@angular/core';
import { ConfigService } from '../../../@vex/config/config.service';
import { SettingsService } from '../../pages/settings/services/settings.service';
import { UserSetting } from '../models/userSetting.model';
import { VexConfigName } from '../../../@vex/config/config-name.model';
import { ColorSchemeName } from '../../../@vex/config/colorSchemeName';
import { ColorVariable, colorVariables } from '../../../@vex/components/config-panel/color-variables';
import { CSSValue } from '../../../@vex/interfaces/css-value.type';
import { firstValueFrom } from 'rxjs';

/**
 * Service to load and apply user settings on app initialization
 * This ensures user preferences are restored when they log in or revisit the app
 */
@Injectable({
  providedIn: 'root'
})
export class UserSettingsInitService {
  private configService = inject(ConfigService);
  private settingsService = inject(SettingsService);
  
  // Track if settings have been loaded to avoid reloading on every page visit
  private settingsLoaded = false;
  private loadedUserId: string | null = null;
  
  // Check authentication state directly to avoid circular dependency
  private isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('ACCESS_TOKEN');
    const userStr = localStorage.getItem('current_user');
    return !!(token && token !== 'null' && token !== 'undefined' && userStr);
  }

  /**
   * Get current user ID from localStorage
   */
  private getCurrentUserId(): string | null {
    try {
      const userStr = localStorage.getItem('current_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user?.id || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  // Rounded corner values matching SettingsComponent
  private readonly roundedCornerValues: CSSValue[] = [
    { value: 0, unit: 'rem' },
    { value: 0.25, unit: 'rem' },
    { value: 0.5, unit: 'rem' },
    { value: 0.75, unit: 'rem' },
    { value: 1, unit: 'rem' },
    { value: 1.25, unit: 'rem' },
    { value: 1.5, unit: 'rem' },
    { value: 1.75, unit: 'rem' }
  ];

  /**
   * Load and apply user settings from the database
   * Should be called after user authentication
   * This method ensures settings are only loaded once per user session
   */
  async loadAndApplySettings(forceReload: boolean = false): Promise<void> {
    // Only load settings if user is authenticated
    if (!this.isAuthenticated()) {
      this.settingsLoaded = false;
      this.loadedUserId = null;
      return;
    }

    const currentUserId = this.getCurrentUserId();
    
    // Skip if settings already loaded for this user (unless force reload)
    if (!forceReload && this.settingsLoaded && this.loadedUserId === currentUserId) {
      return;
    }

    // If user changed, reset the loaded state
    if (this.loadedUserId !== null && this.loadedUserId !== currentUserId) {
      this.settingsLoaded = false;
    }

    try {
      const settings = await firstValueFrom(this.settingsService.loadSettings());

      if (settings) {
        this.applySettings(settings);
        this.settingsLoaded = true;
        this.loadedUserId = currentUserId;
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
      // Don't throw - app should continue even if settings fail to load
      // Don't mark as loaded on error, so it can retry later if needed
    }
  }

  /**
   * Reset the loaded state (useful when user logs out)
   */
  resetLoadedState(): void {
    this.settingsLoaded = false;
    this.loadedUserId = null;
  }

  /**
   * Apply user settings to the UI configuration
   */
  private applySettings(settings: UserSetting): void {
    // Apply theme layout (color scheme: dark/light/default)
    // theme_layout stores the color scheme (vex-style-default, vex-style-dark, etc.)
    if (settings.themeLayout) {
      try {
        if (settings.themeLayout.startsWith('vex-style-')) {
          // It's a color scheme value (e.g. vex-style-default, vex-style-dark)
          this.configService.updateConfig({
            style: { colorScheme: settings.themeLayout as ColorSchemeName }
          });
        } else if (settings.themeLayout.startsWith('vex-layout-')) {
          // Legacy: it's a layout name, apply it
          this.configService.setConfig(settings.themeLayout as VexConfigName);
        }
      } catch (error) {
        console.warn('Failed to apply theme layout:', settings.themeLayout, error);
      }
    }

    // Apply theme color (primary color: blue, red, etc.)
    // theme_color stores the primary color key (blue, red, etc.)
    if (settings.themeColor) {
      const color = colorVariables[settings.themeColor];
      if (color) {
        try {
          this.configService.updateConfig({
            style: {
              colors: {
                primary: {
                  default: color.default,
                  contrast: color.contrast
                }
              }
            }
          });
        } catch (error) {
          console.warn('Failed to apply primary color:', settings.themeColor, error);
        }
      } else if (settings.themeColor.startsWith('vex-style-')) {
        // Legacy: it's a color scheme, apply it
        try {
          this.configService.updateConfig({
            style: { colorScheme: settings.themeColor as ColorSchemeName }
          });
        } catch (error) {
          console.warn('Failed to apply color scheme:', settings.themeColor, error);
        }
      }
    }

    // Apply border radius (corners)
    if (settings.corners) {
      const radius = this.roundedCornerValues.find(
        r => `${r.value}${r.unit}` === settings.corners
      );
      if (radius) {
        try {
          this.configService.updateConfig({
            style: { borderRadius: radius }
          });
        } catch (error) {
          console.warn('Failed to apply border radius:', settings.corners, error);
        }
      }
    }

    // Apply button border radius style
    if (settings.buttonStyle) {
      const radius = this.roundedCornerValues.find(
        r => `${r.value}${r.unit}` === settings.buttonStyle
      );
      if (radius) {
        try {
          this.configService.updateConfig({
            style: {
              button: { borderRadius: radius }
            }
          });
        } catch (error) {
          console.warn('Failed to apply button style:', settings.buttonStyle, error);
        }
      } else if (settings.buttonStyle === 'undefined' || settings.buttonStyle === 'null') {
        // Handle undefined button style (inherit)
        try {
          this.configService.updateConfig({
            style: {
              button: { borderRadius: undefined }
            }
          });
        } catch (error) {
          console.warn('Failed to apply button style (inherit):', error);
        }
      }
    }
  }
}

