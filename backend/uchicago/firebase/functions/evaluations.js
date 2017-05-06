'use strict';

const cheerio = require('cheerio');
const {performShibbolethHandshake} = require('./shibboleth');
const {request} = require('./config');

module.exports = (req, res) => {
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
      .then(() => performShibbolethHandshake(host, jar, req))
      .then(html => {
        const $ = cheerio.load(html);
        const error = $('.messages.error');
        if (error.length) {
          throw new Error(error.text());
        }
        return $('table#evalSearchResults > tbody > tr')
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
      })
      .then(result => {
        res.status(200);
        res.json({'evaluations': result});
      })
      .catch(err => {
        res.status(400);
        res.json({'error': err.message || err});
      });
};