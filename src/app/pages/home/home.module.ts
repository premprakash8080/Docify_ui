import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeComponent } from './home.component';
import { HomeRoutingModule } from './home-routing.module';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { StripHtmlModule } from '../../../@vex/pipes/strip-html/strip-html.module';
import { RelativeDateTimeModule } from '../../../@vex/pipes/relative-date-time/relative-date-time.module';

@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    FormsModule,
    HomeRoutingModule,
    PageLayoutModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    StripHtmlModule,
    RelativeDateTimeModule
  ]
})
export class HomeModule { }

