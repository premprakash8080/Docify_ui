import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { ConfigService } from '../../../@vex/config/config.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { map, shareReplay } from 'rxjs/operators';
import { LayoutService } from '../../../@vex/services/layout.service';
import { MatRadioChange } from '@angular/material/radio';
import { VexConfigName } from '../../../@vex/config/config-name.model';
import { ColorVariable, colorVariables } from '../../../@vex/components/config-panel/color-variables';
import { DOCUMENT } from '@angular/common';
import { ColorSchemeName } from '../../../@vex/config/colorSchemeName';
import { Observable } from 'rxjs';
import { VexConfig } from '../../../@vex/config/vex-config.interface';
import { CSSValue } from '../../../@vex/interfaces/css-value.type';
import { isNil } from '../../../@vex/utils/isNil';
import { defaultRoundedButtonBorderRadius } from '../../../@vex/config/constants';

@Component({
  selector: 'vex-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {

  configs: VexConfig[] = this.configService.configs;
  colorVariables: Record<string, ColorVariable> = colorVariables;

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

  ConfigName = VexConfigName;
  ColorSchemeName = ColorSchemeName;
  selectedColor = colorVariables.blue;

  roundedCornerValues: CSSValue[] = [
    {
      value: 0,
      unit: 'rem'
    },
    {
      value: 0.25,
      unit: 'rem'
    },
    {
      value: 0.5,
      unit: 'rem'
    },
    {
      value: 0.75,
      unit: 'rem'
    },
    {
      value: 1,
      unit: 'rem'
    },
    {
      value: 1.25,
      unit: 'rem'
    },
    {
      value: 1.5,
      unit: 'rem'
    },
    {
      value: 1.75,
      unit: 'rem'
    }
  ];

  roundedButtonValue: CSSValue = defaultRoundedButtonBorderRadius;

  constructor(private configService: ConfigService,
              private layoutService: LayoutService,
              @Inject(DOCUMENT) private document: Document) { }

  setConfig(layout: VexConfigName, colorScheme: ColorSchemeName): void {
    this.configService.setConfig(layout);
    this.configService.updateConfig({
      style: {
        colorScheme
      }
    });
  }

  selectColor(color: ColorVariable): void {
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
  }

  isSelectedColor(color: ColorVariable): boolean {
    return color === this.selectedColor;
  }

  enableDarkMode(): void {
    this.configService.updateConfig({
      style: {
        colorScheme: ColorSchemeName.dark
      }
    });
  }

  disableDarkMode(): void {
    this.configService.updateConfig({
      style: {
        colorScheme: ColorSchemeName.default
      }
    });
  }

  layoutRTLChange(change: MatSlideToggleChange): void {
    this.configService.updateConfig({
      direction: change.checked ? 'rtl' : 'ltr'
    });
  }

  toolbarPositionChange(change: MatRadioChange): void {
    this.configService.updateConfig({
      toolbar: {
        fixed: change.value === 'fixed'
      }
    });
  }

  footerVisibleChange(change: MatSlideToggleChange): void {
    this.configService.updateConfig({
      footer: {
        visible: change.checked
      }
    });
  }

  footerPositionChange(change: MatRadioChange): void {
    this.configService.updateConfig({
      footer: {
        fixed: change.value === 'fixed'
      }
    });
  }

  isSelectedBorderRadius(borderRadius: CSSValue, config: VexConfig): boolean {
    return borderRadius.value === config.style.borderRadius.value && borderRadius.unit === config.style.borderRadius.unit;
  }

  selectBorderRadius(borderRadius: CSSValue): void {
    this.configService.updateConfig({
      style: {
        borderRadius: borderRadius
      }
    });
  }

  isSelectedButtonStyle(buttonStyle: CSSValue | undefined, config: VexConfig): boolean {
    if (isNil(config.style.button.borderRadius) && isNil(buttonStyle)) {
      return true;
    }

    return buttonStyle?.value === config.style.button.borderRadius?.value;
  }

  selectButtonStyle(borderRadius: CSSValue | undefined): void {
    this.configService.updateConfig({
      style: {
        button: {
          borderRadius: borderRadius
        }
      }
    });
  }

  isDark(colorScheme: ColorSchemeName): boolean {
    return colorScheme === ColorSchemeName.dark;
  }
}

