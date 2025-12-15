import { Injectable } from "@angular/core";
import { HttpService } from "./http.service";
import { StorageService } from "./storage.service";
import { SessionService } from "./session.service";
import {  Company, User, UserCreds } from "src/app/core/models/core.models";
import { ACCESS_TOKEN, USER_COMPANY_SESSION, USER_SELECTED_COMPANY_SESSION, USER_SESSION, User_Permissions } from "src/app/core/constants/global.constant";

@Injectable({
    providedIn: "root"
})

export class UserSessionService {

    constructor(
        private httpService: HttpService,
        private storageService: StorageService,
        private sessionService: SessionService,
       
    ) {
       
    }

    set userPermissions(userPermissions: number[]) {
        this.sessionService.setItem(User_Permissions, userPermissions);
    }

    get userPermissions(): number[] {
        return this.sessionService.getItem(User_Permissions);
    }

    set userSession(userSession: User) {
        this.sessionService.setItem(USER_SESSION, userSession);
    }

    get userSession(): User {
        return this.sessionService.getItem(USER_SESSION);
    }

    set userCompanies(userCompanies: Company[]) {
        this.sessionService.setItem(USER_COMPANY_SESSION, userCompanies);
    }

    get userCompanies(): Company[] {
        return this.sessionService.getItem(USER_COMPANY_SESSION);
    }

     set selectedUserCompany(userCompany: Company) {
        this.sessionService.setItem(USER_SELECTED_COMPANY_SESSION, userCompany);
    }

    get selectedUserCompany(): Company{
        return this.sessionService.getItem(USER_SELECTED_COMPANY_SESSION);
    }

    set accessToken(token: string) {
        this.sessionService.setItem(ACCESS_TOKEN, token);
    }

    

    get accessToken(): string {
        return this.sessionService.getItem(ACCESS_TOKEN);
    }

    
    set rememberMe(val: boolean) {
        this.sessionService.setItem('rememberMe', val);
    }

    get rememberMe() {
        return this.sessionService.getItem('rememberMe');
    }

    get userCredentials() {
        return this.storageService.getItem("userCredentials");
    }

    set userCredentials(val: UserCreds) {
        this.storageService.setItem("userCredentials", val);
    }    
}