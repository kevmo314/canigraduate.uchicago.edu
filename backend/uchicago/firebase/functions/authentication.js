'use strict';

const admin = require('firebase-admin');
const cheerio = require('cheerio');
const ldap = require('ldapjs');
const {request} = require('./config');

/**
 * Authenticates against UChicago LDAP.
 * @param {string} username
 * @param {string} password
 * @returns {!Promise<string>} The customToken to authenticate against Firebase.
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
                  const uid = entry.object['chicagoID'];
                  admin.auth()
                      .createUser({
                        uid,
                        email: `${username}@uchicago.edu`,
                        emailVerified: true,
                      })
                      .catch(err => {
                        if (err.message !=
                            'The user with the provided uid already exists.') {
                          throw err;
                        }
                      })
                      .then(() => admin.auth().createCustomToken(uid))
                      .then(resolve)
                      .catch(reject);
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
 * @param {string} username
 * @param {string} password
 * @returns {!Promise<!Array<string>>} A promise for an array of [token, html].
 */
module.exports.performShibbolethHandshake = (host, jar, username, password) => {
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