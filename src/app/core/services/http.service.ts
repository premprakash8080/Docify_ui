import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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
        url: string, params?: any, showLoader: boolean = true, skipLoadingIndicator: boolean = false
    ): Observable<any> {
        const headers: { [key: string]: string } = {};
        if (skipLoadingIndicator) {
            headers['X-Skip-Loading'] = 'true';
        }

        // Build HttpParams, filtering out undefined/null values and handling arrays
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = params[key];
                if (value !== null && value !== undefined && value !== 'undefined') {
                    if (Array.isArray(value)) {
                        // For arrays, add each value separately (creates types=note&types=notebook)
                        value.forEach(item => {
                            if (item !== null && item !== undefined && item !== 'undefined') {
                                httpParams = httpParams.append(key, item.toString());
                            }
                        });
                    } else {
                        httpParams = httpParams.set(key, value.toString());
                    }
                }
            });
        }

        return this._http.get(this.API_URL + url, { 
            params: httpParams, 
            reportProgress: showLoader,
            headers: new HttpHeaders(headers)
        });
    }

    post(
        url: string, params?: any, showLoader: boolean = true, skipLoadingIndicator: boolean = false
    ): Observable<any> {
        const headers: { [key: string]: string } = {};
        if (skipLoadingIndicator) {
            headers['X-Skip-Loading'] = 'true';
        }
        return this._http.post(this.API_URL + url, params, { 
            reportProgress: showLoader,
            headers: new HttpHeaders(headers)
        });
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