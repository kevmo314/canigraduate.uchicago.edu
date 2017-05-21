'use strict';

const cheerio = require('cheerio');
const {performShibbolethHandshake} = require('./authentication');
const {request} = require('./config');

module.exports = (req, res, next) => {
  const jar = request.jar();
  const host = 'https://evaluations.uchicago.edu/';
  Promise.resolve()
      .then(() => {
        if (!req.params.id) {
          throw new Error('Parameter "id" not specified.');
        }
        const match = req.params.id.match(/([A-Z]{4}) (\d{5})/);
        if (!match || match.length < 3) {
          throw Error('Invalid course id "' + req.params.id + '".');
        }
        const [department, courseNumber] = match.slice(1, 3);
        return request(
            host + '?EvalSearchType=option-number-search&CourseDepartment=' +
                department + '&CourseNumber=' + courseNumber,
            {jar});
      })
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
        const error = $('.messages.error');
        if (error.length) {
          throw new Error(error.text());
        }
        const evaluations =
            $('table#evalSearchResults > tbody > tr')
                .map((index, element) => {
                  const cells = $(element).find('td');
                  return {
                    'href': host + $(element).find('a').attr('href'),
                    'section': cells.eq(0).text().substring(11),
                    'instructor': cells.eq(2).text(),
                    'term': cells.eq(3).text(),
                  };
                })
                .get();
        return {
          'token': token,
          'evaluations': evaluations,
        };
      })
      .then(result => {
        res.status(200);
        res.json(result);
      })
      .catch(next);
};