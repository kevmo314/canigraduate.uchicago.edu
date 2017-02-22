import { UniversityOfChicago } from 'institutions/uchicago';

/** Development environment, can be set to whatever you want. */
export const environment = {
  production: false,
  backend: 'http://canigraduate.uchicago.edu:5000',
  pouchConfig: {
    remotePath: 'https://kevmo314.cloudant.com/uchicago',
    localPath: 'uchicago'
  },
  hmr: true,
  // The cookie name used to store credentials.
  cookieName: 'uchicago',
  institution: UniversityOfChicago
};
