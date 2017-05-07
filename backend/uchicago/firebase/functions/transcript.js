'use strict';

const Grade = require('./grade');
const cheerio = require('cheerio');
const {performShibbolethHandshake} = require('./authentication');
const {request} = require('./config');

module.exports = (req, res) => {
  const jar = request.jar();
  const host = 'https://aisweb.uchicago.edu/';
  request(host + 'psp/ihprd/EMPLOYEE/EMPL/h/?tab=UC_STUDENT_TAB', {jar})
      .then(() => {
        const {username, password} = req.body;
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
                          'id': cells.eq(0).text().substring(0, 10),
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
      })
      .catch(err => {
        console.error(err);
        res.status(400);
        res.json({'error': err.message || err});
      });
};