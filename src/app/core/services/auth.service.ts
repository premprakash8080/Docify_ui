import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { User } from '../models';

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
    private apiService: ApiService,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem(this.userKey);
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return new Observable(observer => {
      this.apiService.post<AuthResponse>('/auth/login', credentials).subscribe({
        next: (apiResponse) => {
          // Handle both ApiResponse wrapper and direct AuthResponse
          const response: AuthResponse = 'data' in apiResponse 
            ? (apiResponse.data as AuthResponse)
            : (apiResponse as unknown as AuthResponse);
          this.setAuthData(response);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return new Observable(observer => {
      this.apiService.post<AuthResponse>('/auth/register', data).subscribe({
        next: (apiResponse) => {
          // Handle both ApiResponse wrapper and direct AuthResponse
          const response: AuthResponse = 'data' in apiResponse 
            ? (apiResponse.data as AuthResponse)
            : (apiResponse as unknown as AuthResponse);
          this.setAuthData(response);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
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

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return new Observable(observer => {
      this.apiService.post<AuthResponse>('/auth/refresh', { refreshToken }).subscribe({
        next: (apiResponse) => {
          // Handle both ApiResponse wrapper and direct AuthResponse
          const response: AuthResponse = 'data' in apiResponse 
            ? (apiResponse.data as AuthResponse)
            : (apiResponse as unknown as AuthResponse);
          this.setAuthData(response);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          this.logout();
          observer.error(error);
        }
      });
    });
  }
}

