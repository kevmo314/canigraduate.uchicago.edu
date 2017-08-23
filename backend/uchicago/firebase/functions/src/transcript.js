'use strict';

const admin = require('firebase-admin');
const Grade = require('./grade');
const PubSub = require('@google-cloud/pubsub');
const base64url = require('base64url');
const cheerio = require('cheerio');
const crypto = require('crypto');
const {
  performShibbolethHandshake,
  getChicagoId,
} = require('./authentication');
const { request } = require('./config');

module.exports = (req, res, next) => {
  const jar = request.jar();
  const host = 'https://aisweb.uchicago.edu/';
  request(host + 'psp/ihprd/EMPLOYEE/EMPL/h/?tab=UC_STUDENT_TAB', { jar })
    .then(() => {
      if (!req.username || !req.password) {
        res.set('WWW-Authenticate', 'Basic realm="UChicago CNetID"');
        res.status(401);
        throw new Error(
          '"username" and/or "password" missing in request body.',
        );
      }
      return performShibbolethHandshake(
        host,
        jar,
        req.username,
        req.password,
      ).catch(err => {
        res.set('WWW-Authenticate', 'Basic realm="UChicago CNetID"');
        res.status(401);
        throw err;
      });
    })
    .then(([token, html]) => {
      const $ = cheerio.load(html);
      if ($('#UCMPtab_UC_STU_GRADES').length === 0) {
        throw new Error(
          "AIS didn't return a valid response. Maybe my.uchicago.edu is down?",
        );
      }
      const gyears = new Map(
        $('select#gyear_id')
          .find('option')
          .map((i, el) => [[$(el).attr('value'), $(el).text()]])
          .get(),
      );
      function findActivity(year, course, section) {
        const matches = $('table.year#year' + year)
          .find('tr')
          .filter((i, row) => {
            const labels = $(row).find('.label');
            return (
              labels.length > 0 && labels.eq(0).text().trim() == 'Activity'
            );
          })
          .filter((i, row) => $(row).text().indexOf(course) > -1);
        if (matches.length == 0) {
          return null;
        }
        const text = matches.text().trim();
        const start = text.indexOf(course);
        const newline = text.indexOf('\n', start);
        const bracket = text.indexOf(']', start);
        const end = Math.min(
          newline == -1 ? text.length : newline,
          bracket == -1 ? text.length : bracket,
        );
        return text.substring(start + course.length + section.length + 1, end);
      }
      const transcript = $('table.gyear')
        .map((i, table) => {
          const year = $(table).attr('id').substring('gyear'.length);
          const term = gyears.get(year);
          return $(table)
            .find('tr')
            .map((j, row) => {
              const cells = $(row).find('td');
              const complete = cells.eq(2).text().indexOf('In Progress') == -1;
              const grade = complete ? new Grade(cells.eq(2).text()) : null;
              const course = cells.eq(0).text().substring(0, 10);
              const section = cells.eq(0).text().substring(11);
              return {
                term,
                course,
                section,
                activity: findActivity(year, course, section),
                complete,
                quality: complete ? grade.quality : null,
                credit: complete ? grade.credit : null,
                grade: complete ? grade.grade : null,
                gpa: complete ? grade.gpa : null,
                tenure: i,
              };
            })
            .get();
        })
        .get();
      return { token, transcript };
    })
    .then(result => {
      const chicagoId = getChicagoId(req.username);
      return PubSub({ projectId: 'canigraduate-43286' })
        .topic('grades')
        .publish(
          result['transcript']
            .filter(record => record['quality'])
            .map(record => ({
              chicagoId,
              record,
            })),
        )
        .then(() => {
          res.status(200);
          res.json(result);
        });
    })
    .catch(next);
};
