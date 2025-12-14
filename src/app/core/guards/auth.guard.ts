import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authService.isAuthenticated && this.authService.currentUserValue) {
      return true;
    }

    // Clear any invalid auth data (token without user or vice versa)
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('current_user');
    if (token && !user) {
      // Token exists but no user - invalid state, clear token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }

    // Redirect to login page with return url
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}

