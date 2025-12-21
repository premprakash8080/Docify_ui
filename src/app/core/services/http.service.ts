import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: "root"
})

export class HttpService {

    public API_URL: string = ''; 

    constructor(
        private _http: HttpClient
    ) {
        
     }

    get(
        url: string, params?: any,showLoader:boolean=true
    ): Observable<any> {
        return this._http.get(this.API_URL + url, { params,reportProgress: showLoader});
    }

    post(
        url: string, params?: any,showLoader:boolean=true
    ): Observable<any> {
        return this._http.post(this.API_URL + url,params, {reportProgress: showLoader});
    }

    put(
        url: string, params?: any, showLoader: boolean = true, skipLoadingIndicator: boolean = false
    ): Observable<any> {
        const headers: { [key: string]: string } = {};
        if (skipLoadingIndicator) {
            headers['X-Skip-Loading'] = 'true';
        }
        return this._http.put(this.API_URL + url, params, { 
            reportProgress: showLoader,
            headers: new HttpHeaders(headers)
        });
    }

    delete(
        url: string, params?: any,showLoader:boolean=true
    ): Observable<any> {
        const options = {
            headers: new HttpHeaders({
              'Content-Type': 'application/json',
            }),
            body: params, reportProgress: showLoader,
          };
        return this._http.delete(this.API_URL + url, options);
    }

}