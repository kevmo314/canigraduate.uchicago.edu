module.exports.request = require('request-promise-native').defaults({
  followAllRedirects: true,
  removeRefererHeader: true,
  headers: {
    // Some of UChicago's websites require the user agent to be set. :|
    'User-Agent':
      'Mozilla/5.0 (compatible; canigraduate/2.0; +http://canigraduate.uchicago.edu/)',
  },
});
