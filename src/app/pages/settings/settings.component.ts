import {Component,Inject,ChangeDetectionStrategy, OnInit} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Observable } from 'rxjs';
import { map, shareReplay, take } from 'rxjs/operators';

import { ConfigService } from '../../../@vex/config/config.service';
import { LayoutService } from '../../../@vex/services/layout.service';
import { VexConfig } from '../../../@vex/config/vex-config.interface';
import { VexConfigName } from '../../../@vex/config/config-name.model';
import { ColorSchemeName } from '../../../@vex/config/colorSchemeName';

import { ColorVariable, colorVariables } from '../../../@vex/components/config-panel/color-variables';
import { CSSValue } from '../../../@vex/interfaces/css-value.type';
import { isNil } from '../../../@vex/utils/isNil';
import { defaultRoundedButtonBorderRadius } from '../../../@vex/config/constants';

import { SettingsService } from './services/settings.service';
import { UserSetting } from '../../core/models/userSetting.model';

import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatRadioChange } from '@angular/material/radio';

@Component({
  selector: 'vex-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class SettingsComponent implements OnInit {

  // -----------------------------
  // Vex / UI Config
  // -----------------------------
  configs: VexConfig[] = this.configService.configs;
  ConfigName = VexConfigName;
  ColorSchemeName = ColorSchemeName;

  colorVariables: Record<string, ColorVariable> = colorVariables;
  selectedColor: ColorVariable = colorVariables.blue;

  config$: Observable<VexConfig> = this.configService.config$.pipe(
    shareReplay(1)
  );

  isRTL$: Observable<boolean> = this.config$.pipe(
    map(config => config.direction === 'rtl'),
    shareReplay(1)
  );

  colorScheme$: Observable<ColorSchemeName> = this.config$.pipe(
    map(config => config.style.colorScheme),
    shareReplay(1)
  );

  borderRadius$: Observable<number> = this.config$.pipe(
    map(config => config.style.borderRadius.value),
    shareReplay(1)
  );

  // -----------------------------
  // UI Options
  // -----------------------------
  roundedCornerValues: CSSValue[] = [
    { value: 0, unit: 'rem' },
    { value: 0.25, unit: 'rem' },
    { value: 0.5, unit: 'rem' },
    { value: 0.75, unit: 'rem' },
    { value: 1, unit: 'rem' },
    { value: 1.25, unit: 'rem' },
    { value: 1.5, unit: 'rem' },
    { value: 1.75, unit: 'rem' }
  ];

  roundedButtonValue: CSSValue = defaultRoundedButtonBorderRadius;

  constructor(
    private configService: ConfigService,
    private layoutService: LayoutService,
    private settingsService: SettingsService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  // -----------------------------
  // Init
  // -----------------------------
  ngOnInit(): void {
    // Load settings from API and apply to UI on init
    this.settingsService.loadSettings()
      .pipe(take(1))
      .subscribe(settings => {
        if (settings) {
          this.applyUserSettings(settings);
        }
      });
  }

  // -----------------------------
  // Apply Backend → UI
  // -----------------------------
  private applyUserSettings(settings: UserSetting): void {
    // Apply theme layout from DB
    if (settings.themeLayout) {
      this.configService.setConfig(settings.themeLayout as VexConfigName);
    }

    // Apply theme color from DB
    if (settings.themeColor && this.colorVariables[settings.themeColor]) {
      this.selectColor(this.colorVariables[settings.themeColor], false);
    }

    // Apply border radius (corners) from DB
    if (settings.corners) {
      const radius = this.roundedCornerValues.find(
        r => `${r.value}${r.unit}` === settings.corners
      );
      if (radius) {
        this.selectBorderRadius(radius, false);
      }
    }

    // Apply button border radius style from DB
    if (settings.buttonStyle) {
      const radius = this.roundedCornerValues.find(
        r => `${r.value}${r.unit}` === settings.buttonStyle
      );
      if (radius) {
        this.selectButtonStyle(radius, false);
      }
    }
  }

  // -----------------------------
  // Persist Settings
  // -----------------------------
  private saveSettings(payload: Partial<UserSetting>): void {
    // Save all setting changes to the API (database)
    this.settingsService.updateSettings(payload)
      .pipe(take(1))
      .subscribe(updatedSettings => {
        // Optionally re-apply updated settings if needed (e.g., id, timestamps)
        if (updatedSettings) {
          this.applyUserSettings(updatedSettings);
        }
      });
  }

  private getLayoutKey(layout: VexConfigName): string {
    // If enum already contains full key, return as is
    if (layout.startsWith('vex-layout-')) {
      return layout;
    }
  
    // Otherwise normalize it
    return `vex-layout-${layout}`;
  }

  
  // -----------------------------
  // Layout & Theme
  // -----------------------------
  setConfig(layout: VexConfigName, colorScheme: ColorSchemeName): void {
    // Apply to UI
    this.configService.setConfig(layout);
    this.configService.updateConfig({
      style: { colorScheme }
    });
  
    // ✅ ALWAYS send correct backend value
    this.saveSettings({
      themeLayout: this.getLayoutKey(layout),
      themeColor: `vex-style-${colorScheme}`
    });
  }
  
  

  selectColor(color: ColorVariable, persist = true): void {
    this.selectedColor = color;

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

    if (persist) {
      this.saveSettings({
        themeColor: this.getColorKey(color)
      });
    }
  }

  isSelectedColor(color: ColorVariable): boolean {
    return color === this.selectedColor;
  }

  // -----------------------------
  // Dark Mode
  // -----------------------------
  enableDarkMode(): void {
    this.configService.updateConfig({
      style: { colorScheme: ColorSchemeName.dark }
    });
  
    this.saveSettings({
      themeColor: 'vex-style-dark'
    });
  }
  
  disableDarkMode(): void {
    this.configService.updateConfig({
      style: { colorScheme: ColorSchemeName.default }
    });
  
    this.saveSettings({
      themeColor: 'vex-style-default'
    });
  }
  

  // -----------------------------
  // Direction / Footer / Toolbar
  // -----------------------------
  layoutRTLChange(change: MatSlideToggleChange): void {
    this.configService.updateConfig({
      direction: change.checked ? 'rtl' : 'ltr'
    });
  }

  toolbarPositionChange(change: MatRadioChange): void {
    this.configService.updateConfig({
      toolbar: { fixed: change.value === 'fixed' }
    });
  }

  footerVisibleChange(change: MatSlideToggleChange): void {
    this.configService.updateConfig({
      footer: { visible: change.checked }
    });
  }

  footerPositionChange(change: MatRadioChange): void {
    this.configService.updateConfig({
      footer: { fixed: change.value === 'fixed' }
    });
  }

  // -----------------------------
  // Corners & Buttons
  // -----------------------------
  isSelectedBorderRadius(borderRadius: CSSValue, config: VexConfig): boolean {
    return (
      borderRadius.value === config.style.borderRadius.value &&
      borderRadius.unit === config.style.borderRadius.unit
    );
  }

  selectBorderRadius(borderRadius: CSSValue, persist = true): void {
    this.configService.updateConfig({
      style: { borderRadius }
    });

    if (persist) {
      this.saveSettings({
        corners: `${borderRadius.value}${borderRadius.unit}`
      });
    }
  }

  isSelectedButtonStyle(buttonStyle: CSSValue | undefined, config: VexConfig): boolean {
    if (isNil(config.style.button.borderRadius) && isNil(buttonStyle)) {
      return true;
    }
    return buttonStyle?.value === config.style.button.borderRadius?.value;
  }

  selectButtonStyle(borderRadius: CSSValue | undefined, persist = true): void {
    this.configService.updateConfig({
      style: {
        button: { borderRadius }
      }
    });

    if (persist && borderRadius) {
      this.saveSettings({
        buttonStyle: `${borderRadius.value}${borderRadius.unit}`
      });
    }
  }

  // -----------------------------
  // Helpers
  // -----------------------------
  private getColorKey(color: ColorVariable): string {
    return Object.keys(this.colorVariables)
      .find(key => this.colorVariables[key] === color) || 'blue';
  }

  isDark(colorScheme: ColorSchemeName): boolean {
    return colorScheme === ColorSchemeName.dark;
  }
}
