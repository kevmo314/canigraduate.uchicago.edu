'use strict';

const admin = require('firebase-admin');
const Grade = require('./grade');
const base64url = require('base64url');
const cheerio = require('cheerio');
const crypto = require('crypto');
const {performShibbolethHandshake, getChicagoId} = require('./authentication');
const {request} = require('./config');

function saveTranscript(chicagoId, transcript) {
  for (const record of transcript.filter(record => record['complete'])) {
    new Promise((resolve, reject) => {
      crypto.pbkdf2(
          [record['term'], record['course'], record['section']].join(),
          chicagoId, 2000000, 20, 'sha512', (err, key) => {
            if (err) {
              reject(err);
            } else {
              resolve(base64url(key));
            }
          });
    }).then(key => {
      admin.database().ref(`/grades/raw/${key}/`).set({
        'course': record['course'],
        'section': record['section'],
        'term': record['term'],
        'gpa': record['gpa'],
      });
    });
  }
}

module.exports = (req, res) => {
  const jar = request.jar();
  const host = 'https://aisweb.uchicago.edu/';
  const {username, password} = req.body;
  request(host + 'psp/ihprd/EMPLOYEE/EMPL/h/?tab=UC_STUDENT_TAB', {jar})
      .then(() => {
        if (!username || !password) {
          throw new Error(
              '"username" and/or "password" missing in request body.');
        }
        return performShibbolethHandshake(host, jar, username, password);
      })
      .then(([token, html]) => {
        const $ = cheerio.load(html);
        const gyears =
            new Map($('select#gyear_id')
                        .find('option')
                        .map((i, el) => [[$(el).attr('value'), $(el).text()]])
                        .get());
        const transcript =
            $('table.gyear')
                .map((i, table) => {
                  const term =
                      gyears.get($(table).attr('id').substring('gyear'.length));
                  return $(table)
                      .find('tr')
                      .map((j, row) => {
                        const cells = $(row).find('td');
                        const complete =
                            cells.eq(2).text().indexOf('In Progress') == -1;
                        const grade =
                            complete ? new Grade(cells.eq(2).text()) : null;
                        return {
                          'term': term,
                          'course': cells.eq(0).text().substring(0, 10),
                          'section': cells.eq(0).text().substring(11),
                          'complete': complete,
                          'quality': complete ? grade.quality : null,
                          'credit': complete ? grade.credit : null,
                          'grade': complete ? grade.grade : null,
                          'gpa': complete ? grade.gpa : null,
                        };
                      })
                      .get();
                })
                .get();
        return {
          'token': token, 'transcript': transcript,
        }
      })
      .then(result => {
        res.status(200);
        res.json(result);
        saveTranscript(getChicagoId(username), result['transcript']);
      })
      .catch(err => {
        console.error(err);
        res.status(400);
        res.json({'error': err.message || err});
      });
};