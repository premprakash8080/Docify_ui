import { Injectable } from "@angular/core";
import { IsEmptyObject } from "src/app/core/utilities/common.function";

@Injectable({
    providedIn: 'root'
})

export class SessionService {
    public setItem(key: string, value: any): void {
        localStorage.setItem(key, JSON.stringify(value));
    }

    public getItem(key: string): any {
        try {
            if (localStorage.getItem(key) != "null") {
                const value = JSON.parse(localStorage.getItem(key) || '{}')
                return IsEmptyObject(value) ? null : value;
            }
            return null;
        } catch {
            return null;
        }
    }

    public removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    public clearSession(): void {
        localStorage.clear();
    }
}