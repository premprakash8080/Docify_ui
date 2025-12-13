import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsComponent } from './settings.component';
import { SettingsRoutingModule } from './settings-routing.module';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';

@NgModule({
  declarations: [SettingsComponent],
  imports: [
    CommonModule,
    SettingsRoutingModule,
    PageLayoutModule,
    MatIconModule,
    MatSlideToggleModule,
    MatRadioModule,
    MatButtonModule,
    MatRippleModule
  ]
})
export class SettingsModule { }

