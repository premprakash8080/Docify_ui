import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
// import { ApiService } from './api.service'; // Uncomment when switching to real API
import { User } from '../models';
import { authenticateUser, users, generateUUID } from '../data/sample-data';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
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

  constructor(
    private router: Router
    // private apiService: ApiService, // Commented out for mock implementation, uncomment when switching to real API
  ) {
    this.loadUserFromStorage();
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
      } catch (e) {
        // Invalid user data, clear everything
        this.logout();
      }
    } else if (!token && userStr) {
      // User data exists but no token (invalid state), clear everything
      this.logout();
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    // Use mock data for now
    // In production, replace with: return this.apiService.post<AuthResponse>('/auth/login', credentials)...
    
    return new Observable(observer => {
      // Simulate API delay
      setTimeout(() => {
        const user = authenticateUser(credentials.email, credentials.password);
        
        if (user) {
          const token = this.generateMockToken(user.id);
          const response: AuthResponse = {
            user,
            token,
            refreshToken: token + '_refresh'
          };
          
          this.setAuthData(response);
          observer.next(response);
          observer.complete();
        } else {
          observer.error({
            message: 'Invalid email or password',
            status: 401
          });
        }
      }, 500); // Simulate network delay
    });
  }

  /**
   * Generate a mock JWT token for development
   * In production, the backend would provide this
   */
  private generateMockToken(userId: string): string {
    // Simple mock token format: mock_token_{userId}_{timestamp}
    return `mock_token_${userId}_${Date.now()}`;
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    // Use mock data for now
    // In production, replace with: return this.apiService.post<AuthResponse>('/auth/register', data)...
    
    return new Observable(observer => {
      // Simulate API delay
      setTimeout(() => {
        // Check if user already exists
        const existingUser = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
        
        if (existingUser) {
          observer.error({
            message: 'User with this email already exists',
            status: 409
          });
          return;
        }

        // Create new user
        const newUser: User = {
          id: generateUUID(),
          email: data.email,
          displayName: data.displayName || data.email.split('@')[0],
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.displayName || data.email)}&background=6366f1&color=fff`,
          createdAt: new Date().toISOString()
        };

        // Add to mock users array (in production, backend would handle this)
        users.push(newUser);

        const token = this.generateMockToken(newUser.id);
        const response: AuthResponse = {
          user: newUser,
          token,
          refreshToken: token + '_refresh'
        };

        this.setAuthData(response);
        observer.next(response);
        observer.complete();
      }, 500); // Simulate network delay
    });
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private setAuthData(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
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
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const currentUser = this.currentUserValue;
    if (!currentUser) {
      this.logout();
      return throwError(() => new Error('No user found'));
    }

    // Use mock data for now
    // In production, replace with API call
    return new Observable(observer => {
      setTimeout(() => {
        const token = this.generateMockToken(currentUser.id);
        const response: AuthResponse = {
          user: currentUser,
          token,
          refreshToken: token + '_refresh'
        };
        
        this.setAuthData(response);
        observer.next(response);
        observer.complete();
      }, 300);
    });
  }
}

