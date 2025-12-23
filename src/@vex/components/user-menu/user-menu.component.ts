import { Component, OnInit } from '@angular/core';
import { PopoverRef } from '../popover/popover-ref';
import { AuthService } from 'src/app/auth/service/auth.service';
@Component({
  standalone: false,
  selector: 'vex-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent implements OnInit {

  constructor(private readonly popoverRef: PopoverRef, private readonly authService: AuthService) { }

  ngOnInit(): void {
  }

  close(): void {
    /** Wait for animation to complete and then close */
    setTimeout(() => this.popoverRef.close(), 250);
  }
  logoutUser(): void {
    this.close();
    this.authService.logout();
  }
}
