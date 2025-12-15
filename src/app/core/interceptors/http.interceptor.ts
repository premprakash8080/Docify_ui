import { NgxSpinnerService } from 'ngx-spinner';
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, finalize, Observable, retry, throwError } from 'rxjs';
import { SnackBarService } from 'src/app/shared/services/snackbar.service';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { AuthenticationService } from 'src/app/auth/service/auth.service';


@Injectable()

export class HttpResponseInterceptor implements HttpInterceptor {

  constructor(
    private ngxService: NgxSpinnerService, 
    private snackBarService: SnackBarService,
    private userSessionService:UserSessionService,
    private authenticationService: AuthenticationService,
    ) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

    let requestWithToken;
    if(this.userSessionService.accessToken!=undefined && this.userSessionService.accessToken!="")
    {
      requestWithToken = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${this.userSessionService.accessToken}`)
        .set('x-company', `${this.userSessionService.selectedUserCompany?.id || 0}`),
      });
    }

    // List of URLs to exclude from automatic spinner control
    
    // Check if the current request URL should be excluded from spinner
    // console.log('request.url',request.url);
    // Only show spinner if URL is not excluded
    if (request.reportProgress) {
       this.ngxService.show();
    }
    // Store the flag in a variable accessible to the finalize callback
    
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
          this.authenticationService.logout();
         }else {
          // handle server-side error
          message = `${error.status}: Something went wrong. Please report this issue.`;
        }
      } 
      if (error.status === 401) {
        this.authenticationService.logout();
       }      
      this.snackBarService.showError(message)
      return throwError(message);
    }),
      finalize(() => {
        // Only hide spinner if it was shown (i.e., URL was not excluded)
        if (request.reportProgress) {
          this.ngxService.hide();
        }
      }))
  }
}
