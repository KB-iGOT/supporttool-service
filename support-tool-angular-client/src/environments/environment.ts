// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// development
export const environment = {
  production: false,
  PLAY_URL: 'https://preprod.ntp.net.in/play/content/',
  base : 'https://preprod.ntp.net.in/api/',
  key_base : 'https://preprod.ntp.net.in/',
  LOCALHOST : 'http://localhost:5000/',
  RESOURCE: 'support-tool-local',
  PROGRESS_URL: 'https://preprodall.blob.core.windows.net/reports/course-progress-reports/'
};


// preproduction
// export const environment = {
//   production: true,
//   PLAY_URL: 'https://preprod.ntp.net.in/play/content/',
//   base : 'https://preprod.ntp.net.in/api/',
//   key_base : 'https://preprod.ntp.net.in/',
//   LOCALHOST : 'https://ops.ntp.net.in/api/',
//   RESOURCE: 'ntp-support-tool',
//   PROGRESS_URL: 'https://preprodall.blob.core.windows.net/reports/course-progress-reports/'
// };

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
