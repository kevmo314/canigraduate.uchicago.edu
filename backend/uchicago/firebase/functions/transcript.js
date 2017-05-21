'use strict';

const admin = require('firebase-admin');
const Grade = require('./grade');
const PubSub = require('@google-cloud/pubsub');
const base64url = require('base64url');
const cheerio = require('cheerio');
const crypto = require('crypto');
const {performShibbolethHandshake, getChicagoId} = require('./authentication');
const {request} = require('./config');

module.exports = (req, res, next) => {
  const jar = request.jar();
  const host = 'https://aisweb.uchicago.edu/';
  request(host + 'psp/ihprd/EMPLOYEE/EMPL/h/?tab=UC_STUDENT_TAB', {jar})
      .then(() => {
        if (!req.username || !req.password) {
          res.set('WWW-Authenticate', 'Basic realm=\"UChicago CNetID\"');
          res.status(401);
          throw new Error(
              '"username" and/or "password" missing in request body.');
        }
        return performShibbolethHandshake(host, jar, req.username, req.password)
            .catch(err => {
              res.set('WWW-Authenticate', 'Basic realm=\"UChicago CNetID\"');
              res.status(401);
              throw err;
            });
      })
      .then(([token, html]) => {
        const $ = cheerio.load(html);
        if ($('#UCMPtab_UC_STU_GRADES').length === 0) {
          throw new Error(
              'AIS didn\'t return a valid response. Maybe my.uchicago.edu is down?');
        }
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
                          'tenure': i,
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
        const chicagoId = getChicagoId(req.username);
        return PubSub({projectId: 'canigraduate-43286'})
            .topic('grades')
            .publish(result['transcript']
                         .filter(record => record['quality'])
                         .map(record => ({
                                chicagoId,
                                record,
                              })))
            .then(() => {
              res.status(200);
              res.json(result);
            });
      })
      .catch(next);
};
