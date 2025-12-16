import { Injectable } from "@angular/core";
import { ACCESS_TOKEN } from "src/app/core/constants/global.constant";

// Temporary types for backward compatibility
interface UserCreds {
  email?: string;
  password?: string;
  [key: string]: unknown;
}

@Injectable({
    providedIn: "root"
})
export class UserSessionService {
    set accessToken(token: string) {
        if (token) {
            // Save to both locations for compatibility
            localStorage.setItem(ACCESS_TOKEN, token);
            localStorage.setItem('auth_token', token);
        } else {
            // Clear both locations
            localStorage.removeItem(ACCESS_TOKEN);
            localStorage.removeItem('auth_token');
        }
    }

    get accessToken(): string {
        // Check ACCESS_TOKEN first (set by UserSessionService)
        let token = localStorage.getItem(ACCESS_TOKEN);
        
        // If not found, check auth_token (set by AuthService for backward compatibility)
        if (!token || token === 'null' || token === 'undefined') {
            token = localStorage.getItem('auth_token');
    }

        if (token && token !== 'null' && token !== 'undefined') {
            // If it's a JSON string (from old SessionService), parse it
            if (token.startsWith('"') && token.endsWith('"')) {
                try {
                    return JSON.parse(token);
                } catch {
                    return token;
                }
            }
            return token;
    }

        return '';
    }
    
    set rememberMe(val: boolean) {
        localStorage.setItem('rememberMe', JSON.stringify(val));
    }

    get rememberMe(): boolean {
        const val = localStorage.getItem('rememberMe');
        if (val && val !== 'null') {
            try {
                return JSON.parse(val);
            } catch {
                return false;
            }
        }
        return false;
    }

    get userCredentials(): UserCreds | null {
        const val = localStorage.getItem("userCredentials");
        if (val && val !== 'null') {
            try {
                return JSON.parse(val);
            } catch {
                return null;
            }
        }
        return null;
    }

    set userCredentials(val: UserCreds) {
        if (val) {
            localStorage.setItem("userCredentials", JSON.stringify(val));
        } else {
            localStorage.removeItem("userCredentials");
    }    
    }

}