'use strict';

const {request} = require('./config');
const cheerio = require('cheerio');

module.exports.performShibbolethHandshake = (host, jar, req) => {
  const {username, password} = req.body;
  if (!username || !password) {
    throw new Error('"username" and/or "password" missing in request body.');
  }
  return request
      .post(
          'https://shibboleth2.uchicago.edu/idp/profile/SAML2/Redirect/SSO?execution=e1s1',
          {
            jar,
            form: {
              'j_username': username,
              'j_password': password,
              '_eventId_proceed': '',
            },
          })
      .then(html => {
        const $ = cheerio.load(html);
        if ($('.form-element.form-error').length) {
          throw new Error($('.form-element.form-error').text());
        }
        const form = $('form');
        return request.post(form.attr('action'), {
          jar,
          form: {
            'RelayState': form.find('input[name="RelayState"]').val(),
            'SAMLResponse': form.find('input[name="SAMLResponse"]').val(),
          },
        });
      });
};