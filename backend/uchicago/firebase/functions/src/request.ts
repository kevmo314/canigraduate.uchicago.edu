import * as requestPromiseNative from 'request-promise-native';

export default requestPromiseNative.defaults({
  followAllRedirects: true,
  removeRefererHeader: true,
  headers: {
    // Some of UChicago's websites require the user agent to be set. :|
    'User-Agent':
      'Mozilla/5.0 (compatible; canigraduate/2.0; +http://canigraduate.uchicago.edu/)',
  },
});
