'use strict';

const {request} = require('./config');
const cheerio = require('cheerio');
const ldap = require('ldapjs');

/**
 * Authenticates against UChicago LDAP.
 * @param {string} username
 * @param {string} password
 * @returns {!Promise<!Object<string>>} The LDAP result with keys chicagoID and ucCurriculum.
 */
module.exports.authenticate = (username, password) => {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({url: 'ldaps://ldap.uchicago.edu/'});
    client.bind(
        `uid=${username},ou=people,dc=uchicago,dc=edu`, password, err => {
          if (err) {
            reject(new Error('Either your username or password is incorrect.'));
          }
          client.search(
              'dc=uchicago,dc=edu', {
                filter: `uid=${username}`,
                scope: 'sub',
                attributes: ['chicagoID', 'ucCurriculum'],
              },
              (err, res) => {
                if (err) {
                  reject(err);
                }
                let resolved = false;
                res.on('searchEntry', entry => {
                  resolved = true;
                  resolve({
                    chicagoID: entry.object['chicagoID'],
                    ucCurriculum: entry.object['ucCurriculum'],
                  });
                });
                res.on('error', reject);
                res.on('end', result => {
                  if (!resolved) {
                    reject(new Error('LDAP record not found.'));
                  }
                });
              });
        });
  });
};

/**
 * Performs a shibboleth handshake for a given cookie jar.
 * @param {string} host The base url to authenticate against, eg https://evaluations.uchicago.edu/
 * @param {!request.CookieJar} jar The cookie jar to store authentication tokens into.
 * @param {!Request} req The request object to extract the username/password from.
 * @returns {!Promise<!Array<!Object>>} A promise for an array of [ldapResult, html].
 */
module.exports.performShibbolethHandshake = (host, jar, req) => {
  const {username, password} = req.body;
  if (!username || !password) {
    throw new Error('"username" and/or "password" missing in request body.');
  }
  return Promise.all([
    module.exports.authenticate(username, password),
    request
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
        })
  ]);
};