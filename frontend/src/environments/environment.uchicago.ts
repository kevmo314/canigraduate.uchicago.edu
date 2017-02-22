import { UniversityOfChicago } from 'institutions/uchicago';

export const environment = {
  production: true,
  backend: 'http://canigraduate.uchicago.edu',
  pouchConfig: {
    remotePath: 'https://kevmo314.cloudant.com/uchicago',
    localPath: 'uchicago'
  },
  hmr: false,
  // The cookie name used to store the username.
  cookieName: 'uchicago',
  institution: UniversityOfChicago
};
