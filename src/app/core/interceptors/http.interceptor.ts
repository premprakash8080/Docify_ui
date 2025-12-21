import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, finalize, Observable, retry, throwError } from 'rxjs';
import { SnackBarService } from 'src/app/core/services/snackbar.service';
import { UserSessionService } from 'src/app/core/services/user-session.service';
import { AuthService } from '../../auth/service/auth.service';
import { LoadingService } from '../services/loading.service';

@Injectable({
  providedIn: 'root'
})
export class HttpResponseInterceptor implements HttpInterceptor {
  private userSessionService = inject(UserSessionService);
  private authService = inject(AuthService);
  private snackBarService = inject(SnackBarService);
  private loadingService = inject(LoadingService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get token from UserSessionService (which checks both ACCESS_TOKEN and auth_token)
    let token = this.userSessionService.accessToken;
    
    // Fallback to direct localStorage check if UserSessionService returns empty
    if (!token || token === '' || token === 'null') {
      token = localStorage.getItem('auth_token');
    }
    
    // Clean up token if it's a JSON string (legacy support)
    if (token && typeof token === 'string' && token.startsWith('"') && token.endsWith('"')) {
      try {
        token = JSON.parse(token);
      } catch {
        // If parsing fails, use as-is
      }
    }
    
    // Check if request should skip loading indicator (for autosave, background operations)
    const skipLoading = request.headers.has('X-Skip-Loading');
    
    // Clone request and add Authorization header if token exists
    // Preserve existing headers including X-Skip-Loading
    let requestWithToken = request;
    if (token && token !== '' && token !== 'null' && token !== 'undefined') {
      const headers: { [key: string]: string } = {
        'Authorization': `Bearer ${token}`
      };
      // Preserve X-Skip-Loading header if it exists
      if (skipLoading) {
        headers['X-Skip-Loading'] = 'true';
      }
      requestWithToken = request.clone({
        setHeaders: headers
      });
    }

    // Only show loading indicator if not explicitly skipped
    if (!skipLoading) {
      this.loadingService.show();
    }
    
    return next.handle(requestWithToken || request).pipe(retry(0), catchError((error: HttpErrorResponse) => {
      let message = '';
      if (error?.error?.msg) {
        message = error.error.msg;
      }
      if(message==''){
        if (error.error instanceof ErrorEvent) {
          // handle client-side error
          message = `Error1: ${error.error.message}`;
        } else if (error.status === 0 || error.status === 400) {
          message = 'Something went wrong. Please try again later.';
        } else if (error.status === 403) {
          message = 'Forbidden Error! You do not have permission to view this resource.';
        } else if (error.status === 404) {
          message = 'Service not found';
        } else if (error.status === 503) {
          message = 'Service Unavailable! Sorry, we are under maintenance!';
        } else if (error.status === 500) {
          message = 'Something went wrong. Please try again later.';
        }  else if (error.status === 401) {
          // Handle 401 unauthorized - token expired or invalid
          this.authService.logout();
          message = 'Your session has expired. Please login again.';
        } else {
          // handle server-side error
          message = `${error.status}: Something went wrong. Please report this issue.`;
        }
      } 
      if (error.status === 401) {
        // Ensure logout is called for 401 errors
        this.authService.logout();
       }      
      this.snackBarService.showError(message)
      return throwError(message);
    }),
      finalize(() => {
        // Only hide loading indicator if it was shown
        if (!skipLoading) {
          this.loadingService.hide();
        }
      }))
  }
}
