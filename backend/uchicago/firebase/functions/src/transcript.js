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

const canned =
  '{"token":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI3MDM0MDIyOFIiLCJpYXQiOjE1MDY0ODMwOTUsImV4cCI6MTUwNjQ4NjY5NSwiYXVkIjoiaHR0cHM6Ly9pZGVudGl0eXRvb2xraXQuZ29vZ2xlYXBpcy5jb20vZ29vZ2xlLmlkZW50aXR5LmlkZW50aXR5dG9vbGtpdC52MS5JZGVudGl0eVRvb2xraXQiLCJpc3MiOiI5MTYyMDE2MjU5MjYtY29tcHV0ZUBkZXZlbG9wZXIuZ3NlcnZpY2VhY2NvdW50LmNvbSIsInN1YiI6IjkxNjIwMTYyNTkyNi1jb21wdXRlQGRldmVsb3Blci5nc2VydmljZWFjY291bnQuY29tIn0.NwjEVAwV-AlxZhlnQ1MDe0nGVoh6LfmRX5Pnlfk0VkBGdsu6iRosIG1AmMj_3dMU__VfLg7XORa5hdsyiyYhZ3Nv13-UtPf-oh0UVjZaLP0ISNGnmqQrnXD3mHaO7EslMYxJyIe3kUUW4NNBiqUUdedYIoUxOqAq7jcrfVqZ3SXEBQvuv9zbVKSk1eKqoJfzpQbJHc_QRiNvEAt6Sh1yBEfPt1ld-A_XrXAbvpp56SnRV9zCMrscwjT7xHWm9HFB9i_yxvgFDjiL4Rij0zoOOyEs3ZUGKuSk5uV2LMCK15qNxlsXcDq9QSiAl-7a7DuLtQXo7hPJT-BN64rpcU5v4g","transcript":[{"term":"Autumn 2010","course":"ECON 19800","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B","gpa":3,"tenure":0},{"term":"Autumn 2010","course":"HUMA 17000","section":"03","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B","gpa":3,"tenure":0},{"term":"Autumn 2010","course":"HUMA 19100","section":"80","activity":"03","complete":true,"quality":false,"credit":true,"grade":"P","tenure":0},{"term":"Autumn 2010","course":"MATH 19900","section":"51","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B-","gpa":2.7,"tenure":0},{"term":"Autumn 2010","course":"PHYS 15400","section":"00","activity":"03","complete":true,"quality":true,"credit":true,"grade":"B+","gpa":3.3,"tenure":0},{"term":"Winter 2011","course":"BIOS 15115","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B-","gpa":2.7,"tenure":1},{"term":"Winter 2011","course":"HUMA 17100","section":"03","activity":null,"complete":true,"quality":true,"credit":true,"grade":"A-","gpa":3.7,"tenure":1},{"term":"Winter 2011","course":"HUMA 19100","section":"82","activity":"03","complete":true,"quality":false,"credit":true,"grade":"P","tenure":1},{"term":"Winter 2011","course":"JAPN 10200","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B+","gpa":3.3,"tenure":1},{"term":"Winter 2011","course":"MATH 20300","section":"55","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B+","gpa":3.3,"tenure":1},{"term":"Winter 2011","course":"PHYS 18500","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B","gpa":3,"tenure":1},{"term":"Spring 2011","course":"ECON 20000","section":"02","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B","gpa":3,"tenure":2},{"term":"Spring 2011","course":"JAPN 10300","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B+","gpa":3.3,"tenure":2},{"term":"Spring 2011","course":"MATH 20400","section":"55","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B","gpa":3,"tenure":2},{"term":"Spring 2011","course":"PHYS 23400","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B","gpa":3,"tenure":2},{"term":"Summer 2011","course":"ECON 20100","section":"91","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B+","gpa":3.3,"tenure":3},{"term":"Summer 2011","course":"SOSC 11100","section":"91","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B+","gpa":3.3,"tenure":3},{"term":"Autumn 2011","course":"MATH 20500","section":"45","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B+","gpa":3.3,"tenure":4},{"term":"Autumn 2011","course":"MATH 25400","section":"33","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B","gpa":3,"tenure":4},{"term":"Autumn 2011","course":"PHYS 23500","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B-","gpa":2.7,"tenure":4},{"term":"Autumn 2011","course":"PHYS 26400","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B+","gpa":3.3,"tenure":4},{"term":"Winter 2012","course":"ECON 20200","section":"02","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B+","gpa":3.3,"tenure":5},{"term":"Winter 2012","course":"MATH 25500","section":"33","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B","gpa":3,"tenure":5},{"term":"Winter 2012","course":"PHYS 14200","section":"00","activity":"01","complete":true,"quality":true,"credit":true,"grade":"A-","gpa":3.7,"tenure":5},{"term":"Winter 2012","course":"SOSC 11200","section":"11","activity":null,"complete":true,"quality":true,"credit":true,"grade":"A-","gpa":3.7,"tenure":5},{"term":"Spring 2012","course":"ECON 20300","section":"02","activity":null,"complete":true,"quality":true,"credit":true,"grade":"A-","gpa":3.7,"tenure":6},{"term":"Spring 2012","course":"MATH 25600","section":"31","activity":null,"complete":true,"quality":true,"credit":true,"grade":"C+","gpa":2.3,"tenure":6},{"term":"Spring 2012","course":"PHYS 14300","section":"00","activity":"01","complete":true,"quality":true,"credit":true,"grade":"B+","gpa":3.3,"tenure":6},{"term":"Spring 2012","course":"SOSC 11300","section":"04","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B+","gpa":3.3,"tenure":6},{"term":"Autumn 2012","course":"ARTH 16100","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B+","gpa":3.3,"tenure":7},{"term":"Autumn 2012","course":"ECON 20710","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B+","gpa":3.3,"tenure":7},{"term":"Autumn 2012","course":"PHYS 19700","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"A","gpa":4,"tenure":7},{"term":"Autumn 2012","course":"PHYS 21101","section":"01","activity":null,"complete":true,"quality":false,"credit":true,"grade":"P","tenure":7},{"term":"Autumn 2012","course":"STAT 24400","section":"02","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B+","gpa":3.3,"tenure":7},{"term":"Winter 2013","course":"ECON 20900","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B+","gpa":3.3,"tenure":8},{"term":"Winter 2013","course":"MATH 26200","section":"51","activity":null,"complete":true,"quality":true,"credit":true,"grade":"C-","gpa":1.7,"tenure":8},{"term":"Winter 2013","course":"PHYS 21102","section":"01","activity":null,"complete":true,"quality":false,"credit":true,"grade":"P","tenure":8},{"term":"Winter 2013","course":"PHYS 22500","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B+","gpa":3.3,"tenure":8},{"term":"Winter 2013","course":"STAT 24500","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B-","gpa":2.7,"tenure":8},{"term":"Spring 2013","course":"ECON 25100","section":"01","activity":null,"complete":true,"quality":false,"credit":false,"grade":"W","tenure":9},{"term":"Spring 2013","course":"PHYS 21103","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"IA","gpa":4,"tenure":9},{"term":"Spring 2013","course":"PHYS 22700","section":"01","activity":null,"complete":true,"quality":false,"credit":false,"grade":"W","tenure":9},{"term":"Spring 2013","course":"STAT 25100","section":"01","activity":null,"complete":true,"quality":false,"credit":false,"grade":"W","tenure":9},{"term":"Winter 2014","course":"EALC 10900","section":"00","activity":"04","complete":true,"quality":true,"credit":true,"grade":"C-","gpa":1.7,"tenure":10},{"term":"Winter 2014","course":"ECON 24400","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B","gpa":3,"tenure":10},{"term":"Winter 2014","course":"MATH 27300","section":"30","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B","gpa":3,"tenure":10},{"term":"Winter 2014","course":"STAT 22400","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B-","gpa":2.7,"tenure":10},{"term":"Spring 2014","course":"EALC 11000","section":"00","activity":"04","complete":true,"quality":true,"credit":true,"grade":"B","gpa":3,"tenure":11},{"term":"Spring 2014","course":"ECON 21350","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"C","gpa":2,"tenure":11},{"term":"Spring 2014","course":"PHYS 22700","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"B+","gpa":3.3,"tenure":11},{"term":"Autumn 2014","course":"ARTH 10100","section":"02","activity":null,"complete":true,"quality":true,"credit":true,"grade":"A","gpa":4,"tenure":12},{"term":"Autumn 2014","course":"LING 20001","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"A","gpa":4,"tenure":12},{"term":"Autumn 2014","course":"PHYS 24500","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"A-","gpa":3.7,"tenure":12},{"term":"Autumn 2014","course":"STAT 27400","section":"01","activity":null,"complete":true,"quality":true,"credit":true,"grade":"A-","gpa":3.7,"tenure":12}]}';

module.exports = (req, res, next) => {
  const jar = request.jar();
  const host = 'https://aisweb.uchicago.edu/';
  if (req.username == 'test' && req.password == 'test') {
    res.status(200);
    res.json(JSON.parse(canned));
    return;
  }
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
              labels.length > 0 &&
              labels
                .eq(0)
                .text()
                .trim() == 'Activity'
            );
          })
          .filter(
            (i, row) =>
              $(row)
                .text()
                .indexOf(course) > -1,
          );
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
          const year = $(table)
            .attr('id')
            .substring('gyear'.length);
          const term = gyears.get(year);
          return $(table)
            .find('tr')
            .map((j, row) => {
              const cells = $(row).find('td');
              const complete =
                cells
                  .eq(2)
                  .text()
                  .indexOf('In Progress') == -1;
              const grade = complete ? new Grade(cells.eq(2).text()) : null;
              const course = cells
                .eq(0)
                .text()
                .substring(0, 10);
              const section = cells
                .eq(0)
                .text()
                .substring(11);
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
