import * as admin from 'firebase-admin';
import * as cheerio from 'cheerio';
import * as ldap from 'ldapjs';
import { CookieJar } from 'request';
import request from '../request';

type User = {
  uid: string;
  displayName: string;
  email: string;
};

export default class Users {
  static async getEmail(uid: string) {
    const record = await admin.auth().getUser('uchicago:' + uid);
    return record.email;
  }

  static async getToken({ uid, displayName, email }: User): Promise<string> {
    await admin
      .auth()
      .createUser({
        uid: 'uchicago:' + uid,
        displayName,
        email,
        emailVerified: true,
      })
      .catch(err => {
        if (err.message === 'The user with the provided uid already exists.') {
          return admin.auth().updateUser('uchicago:' + uid, {
            displayName,
            email,
            emailVerified: true,
          });
        }
        throw err;
      });
    return admin.auth().createCustomToken('uchicago:' + uid);
  }

  static async authenticateLdap(
    username: string,
    password: string,
  ): Promise<User> {
    const client = ldap.createClient({ url: 'ldaps://ldap.uchicago.edu/' });
    await new Promise((resolve, reject) => {
      client.bind(
        `uid=${username},ou=people,dc=uchicago,dc=edu`,
        password,
        err => {
          if (err) {
            client.destroy();
            reject(new Error('Either your username or password is incorrect.'));
          }
          resolve();
        },
      );
    });
    return new Promise<User>((resolve, reject) => {
      client.search(
        'dc=uchicago,dc=edu',
        {
          filter: `uid=${username}`,
          scope: 'sub',
          attributes: ['chicagoID', 'ucCurriculum', 'displayName'],
        },
        (err, res) => {
          if (err) {
            client.destroy();
            reject(err);
          }
          let resolved = false;
          res.on('searchEntry', entry => {
            resolved = true;
            const uid = entry.object['chicagoID'];
            const displayName = entry.object['displayName'];
            resolve({
              uid,
              displayName,
              email: `${username}@uchicago.edu`,
            });
          });
          res.on('error', error => {
            client.destroy();
            reject(error);
          });
          res.on('end', result => {
            client.destroy();
            if (!resolved) {
              reject(new Error('LDAP record not found.'));
            }
          });
        },
      );
    });
  }

  static async authenticateShibboleth(
    username: string,
    password: string,
    jar: CookieJar = undefined,
  ): Promise<string> {
    const html = await request.post(
      'https://shibboleth2.uchicago.edu/idp/profile/SAML2/Redirect/SSO?execution=e1s1',
      {
        jar,
        form: {
          j_username: username,
          j_password: password,
          _eventId_proceed: '',
        },
      },
    );
    const $ = cheerio.load(html);
    if ($('.form-error').length) {
      throw new Error($('.form-error').text());
    }
    const form = $('form');
    return request.post(form.attr('action'), {
      jar,
      form: {
        RelayState: form.find('input[name="RelayState"]').val(),
        SAMLResponse: form.find('input[name="SAMLResponse"]').val(),
      },
    });
  }

  static async create(uid, displayName, email) {
    await admin
      .auth()
      .createUser({
        uid,
        displayName,
        email,
        emailVerified: true,
      })
      .catch(err => {
        if (err.message === 'The user with the provided uid already exists.') {
          return admin.auth().updateUser(uid, {
            displayName,
            email,
            emailVerified: true,
          });
        }
        throw err;
      });
    return admin.auth().createCustomToken(uid);
  }
}
