// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

export const environment = {
  production: false,
  backend: 'http://canigraduate.uchicago.edu:5000',
  firebaseConfig: {
    apiKey: "AIzaSyCjBDyhwbXcp9kEIA2pMHLDGxmCM4Sn6Eg",
    authDomain: "canigraduate-43286.firebaseapp.com",
    databaseURL: "https://canigraduate-43286.firebaseio.com",
    storageBucket: "canigraduate-43286.appspot.com",
    messagingSenderId: "916201625926"
  },
  hmr: true
};
