import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, catchError, tap } from 'rxjs/operators';
import { User } from '../../core/models';
import { ENDPOINTS } from './api.collection';
import { UserSessionService } from '../../core/services/user-session.service';
import { UserSettingsInitService } from '../../core/services/user-settings-init.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// Backend API response format
interface BackendAuthResponse {
  success: boolean;
  msg: string;
  data: {
    user: {
      id: string;
      email: string;
      display_name?: string;
      avatar_url?: string;
      auth_provider?: string;
      is_active?: boolean;
      created_at?: string;
      last_login_at?: string;
    };
    token: string;
    expires?: string;
  };
}

interface BackendProfileResponse {
  success: boolean;
  msg: string;
  data: {
    user: {
      id: string;
      email: string;
      display_name?: string;
      avatar_url?: string;
      auth_provider?: string;
      is_active?: boolean;
      created_at?: string;
      last_login_at?: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'current_user';

  private userSessionService = inject(UserSessionService);
  private userSettingsInitService = inject(UserSettingsInitService);

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    this.loadUserFromStorage();
    // Load settings if user is already authenticated (using setTimeout to defer execution)
    setTimeout(() => {
      if (this.isAuthenticated) {
        this.userSettingsInitService.loadAndApplySettings();
      }
    }, 0);
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    // User is authenticated only if both token and user exist
    return !!this.getToken() && !!this.currentUserValue;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private loadUserFromStorage(): void {
    // Only load user from storage if token exists (user was properly authenticated)
    const token = localStorage.getItem(this.tokenKey);
    const userStr = localStorage.getItem(this.userKey);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch {
        // Invalid user data, clear everything
        this.logout();
      }
    } else if (!token && userStr) {
      // User data exists but no token (invalid state), clear everything
      this.logout();
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<BackendAuthResponse>(ENDPOINTS.login, credentials).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Login failed');
        }
        
        const authResponse: AuthResponse = {
          user: this.mapBackendUserToFrontendUser(response.data.user),
          token: response.data.token,
          };
          
        this.setAuthData(authResponse);
        // Load and apply user settings after login
        setTimeout(() => {
          this.userSettingsInitService.loadAndApplySettings();
        }, 0);
        return authResponse;
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Login failed';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    const payload = {
      email: data.email,
      password: data.password,
      display_name: data.display_name,
    };

    return this.http.post<BackendAuthResponse>(ENDPOINTS.register, payload).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Registration failed');
        }
        
        const authResponse: AuthResponse = {
          user: this.mapBackendUserToFrontendUser(response.data.user),
          token: response.data.token,
        };
        
        this.setAuthData(authResponse);
        // Load and apply user settings after registration
        setTimeout(() => {
          this.userSettingsInitService.loadAndApplySettings();
        }, 0);
        return authResponse;
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Registration failed';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  logout(): void {
    const token = this.getToken();
    
    // Clear local storage first
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    
    // Clear UserSessionService
    this.userSessionService.accessToken = '';
    
    this.currentUserSubject.next(null);
    
    // Call logout API if token exists (fire and forget)
    if (token) {
      this.http.post<void>(ENDPOINTS.logout, {}).subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: () => {
          // Even if API call fails, navigate to login
          this.router.navigate(['/login']);
        }
      });
    } else {
    this.router.navigate(['/login']);
    }
  }

  private setAuthData(response: AuthResponse): void {
    // Save token to both locations for compatibility
    localStorage.setItem(this.tokenKey, response.token);
    this.userSessionService.accessToken = response.token;
    
    if (response.refreshToken) {
      localStorage.setItem(this.refreshTokenKey, response.refreshToken);
    }
    
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    
    this.currentUserSubject.next(response.user);
  }

  /**
   * Set current user (for development/demo purposes)
   * In production, use login/register methods
   */
  setCurrentUser(user: User): void {
    // Set a dummy token for demo purposes
    localStorage.setItem(this.tokenKey, 'demo_token_' + user.id);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  refreshToken(): Observable<AuthResponse> {
    const currentUser = this.currentUserValue;
    if (!currentUser) {
      this.logout();
      return throwError(() => new Error('No user found'));
    }

    return this.http.post<BackendAuthResponse>(ENDPOINTS.refreshToken, {}).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Token refresh failed');
        }
        
        const authResponse: AuthResponse = {
          user: currentUser, // Keep current user, token is refreshed
          token: response.data.token,
        };
        
        // Update token in storage (both locations)
        localStorage.setItem(this.tokenKey, response.data.token);
        this.userSessionService.accessToken = response.data.token;
        return authResponse;
      }),
      catchError((error) => {
        // If refresh fails, logout user
        this.logout();
        const message = error?.error?.msg || error?.message || 'Token refresh failed';
        return throwError(() => ({ message, status: error?.status || 401 }));
      })
    );
  }

  /**
   * Get current user profile from API
   */
  getProfile(): Observable<User> {
    return this.http.get<BackendProfileResponse>(ENDPOINTS.getProfile).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to fetch profile');
        }
        
        const user = this.mapBackendUserToFrontendUser(response.data.user);
        this.currentUserSubject.next(user);
        localStorage.setItem(this.userKey, JSON.stringify(user));
        return user;
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to fetch profile';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Update user profile
   */
  updateProfile(data: { display_name?: string; avatar_url?: string }): Observable<User> {
    return this.http.put<BackendProfileResponse>(ENDPOINTS.updateProfile, data).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to update profile');
        }
        
        const user = this.mapBackendUserToFrontendUser(response.data.user);
        this.currentUserSubject.next(user);
        localStorage.setItem(this.userKey, JSON.stringify(user));
        return user;
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to update profile';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Change user password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<{ success: boolean; msg: string }>(
      ENDPOINTS.changePassword,
      { currentPassword, newPassword }
    ).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.msg || 'Failed to change password');
        }
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to change password';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Forgot password - send reset email
   */
  forgotPassword(email: string): Observable<void> {
    return this.http.post<{ success: boolean; msg: string }>(
      ENDPOINTS.forgotPassword,
      { email }
    ).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.msg || 'Failed to send reset email');
        }
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to send reset email';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Reset password using reset code
   */
  resetPassword(oobCode: string, newPassword: string): Observable<void> {
    return this.http.post<{ success: boolean; msg: string }>(
      ENDPOINTS.resetPassword,
      { oobCode, newPassword }
    ).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.msg || 'Failed to reset password');
        }
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to reset password';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Map backend user format to frontend User model
   */
  private mapBackendUserToFrontendUser(backendUser: BackendAuthResponse['data']['user'] | BackendProfileResponse['data']['user']): User {
    return {
      id: backendUser.id.toString(),
      email: backendUser.email,
      displayName: backendUser.display_name,
      avatarUrl: backendUser.avatar_url,
      createdAt: backendUser.created_at || new Date().toISOString(),
    };
  }
}

