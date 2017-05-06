import {UniversityOfChicago} from 'institutions/uchicago';

/** Development environment, can be set to whatever you want. */
export const environment = {
  production: false,
  backend: 'https://us-central1-canigraduate-43286.cloudfunctions.net',
  hmr: true,
  firebaseConfig: {
    apiKey: 'AIzaSyCjBDyhwbXcp9kEIA2pMHLDGxmCM4Sn6Eg',
    authDomain: 'canigraduate-43286.firebaseapp.com',
    databaseURL: 'https://canigraduate-43286.firebaseio.com',
    storageBucket: 'canigraduate-43286.appspot.com',
    messagingSenderId: '916201625926'
  },
  // The cookie name used to store credentials.
  cookieName: 'uchicago',
  institution: UniversityOfChicago
};
