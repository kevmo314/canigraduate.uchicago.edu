import { UniversityOfChicago } from 'institutions/uchicago';

/** Development environment, can be set to whatever you want. */
export const environment = {
  production: false,
  backend: 'http://canigraduate.uchicago.edu:5000',
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
