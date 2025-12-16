import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

const routes: Routes = [
  {
    path: "",
    redirectTo: "login",
    pathMatch: "full",
  },
  {
    path: "login",
    loadChildren: () => import("./login/login.module").then(m => m.LoginModule),
  },
  {
    path: "register",
    loadChildren: () => import("./register/register.module").then(m => m.RegisterModule),
  },
  {
    path: "forgot-password",
    loadChildren: () => import("./forgot-password/forgot-password.module").then(m => m.ForgotPasswordModule),
  },
  // Additional auth routes can be added here when components are created
  // {
  //   path: "password-reset",
  //   loadChildren: () => import("./password-reset/password-reset.module").then(m => m.PasswordResetModule),
  // },
  // {
  //   path: "complete-profile",
  //   loadChildren: () => import("./complete-profile/complete-profile.module").then(m => m.CompleteProfileModule),
  // },
  // {
  //   path: "otp-verification",
  //   loadChildren: () => import("./otp-verification/otp-verification.module").then(m => m.OtpVerificationModule),
  // },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
