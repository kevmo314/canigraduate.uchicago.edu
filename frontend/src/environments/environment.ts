import { UniversityOfChicago } from 'institutions/uchicago';

export const environment = {
  production: false,
  backend: 'http://canigraduate.uchicago.edu:5000',
  pouchConfig: {
    remotePath: 'https://kevmo314.cloudant.com/uchicago',
    localPath: 'uchicago'
  },
  firebaseConfig: {
    apiKey: 'AIzaSyCjBDyhwbXcp9kEIA2pMHLDGxmCM4Sn6Eg',
    authDomain: 'canigraduate-43286.firebaseapp.com',
    databaseURL: 'https://canigraduate-43286.firebaseio.com',
    storageBucket: 'canigraduate-43286.appspot.com',
    messagingSenderId: '916201625926'
  },
  hmr: true,
  // The cookie name used to store credentials.
  cookieName: 'uchicago',
  institution: UniversityOfChicago
};
