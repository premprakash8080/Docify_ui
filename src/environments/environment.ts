// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:2018/api',
  firebase: {
    apiKey: "AIzaSyBS5_2jF3D3fuUXWfabNPV1IEbhY3MMQi4",
    authDomain: "docify-847b2.firebaseapp.com",
    projectId: "docify-847b2",
    storageBucket: "docify-847b2.firebasestorage.app",
    messagingSenderId: "471002756564",
    appId: "1:471002756564:web:a11ffcf7279f209fa4d241"
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
