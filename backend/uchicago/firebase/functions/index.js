const admin = require('firebase-admin');
const cheerio = require('cheerio');
const functions = require('firebase-functions');
const request = require('request-promise-native').defaults({
  followAllRedirects: true,
  removeRefererHeader: true,
  headers: {
    // Some of UChicago's websites require the user agent to be set. :|
    'User-Agent':
        'Mozilla/5.0 (compatible; canigraduate/2.0; +http://canigraduate.uchicago.edu/)',
  }
});

const GPA_MAP = {
  'A+': 4.0,
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'F': 0.0
};

class Grade {
  constructor(grade) {
    this.grade = grade;
  }
  get gpa() {
    return GPA_MAP
        [this.grade.startsWith('I') ? this.grade.substring(1) : this.grade];
  }
  get quality() {
    return this.gpa !== undefined;
  }
  get credit() {
    return this.grade.endsWith('P') || (this.quality && this.gpa > 0);
  }
}

admin.initializeApp(functions.config().firebase);

function performShibbolethHandshake(host, jar, req) {
  const username = req.body.username;
  const password = req.body.password;
  if (!username || !password) {
    throw new Error('"username" and/or "password" missing in request body.');
  }
  return request
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
      });
}

exports.evaluations = functions.https.onRequest((req, res) => {
  const jar = request.jar();
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Content-Type', 'application/json');
  const host = 'https://evaluations.uchicago.edu/';
  Promise.resolve()
      .then(() => {
        if (!req.query.id) {
          throw new Error('Parameter "id" not specified.');
        }
        const match = req.query.id.match(/([A-Z]{4}) (\d{5})/);
        if (!match || match.length < 3) {
          throw Error('Invalid course id "' + req.query.id + '".');
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
                'id': $(element).find('a').attr('href').substring(
                    'evaluation.php?id='.length),
                'section': cells.eq(0).text().substring(11),
                'instructor': cells.eq(2).text(),
                'quarter': cells.eq(3).text(),
              };
            })
            .get();
      })
      .then(result => {
        res.status(200);
        res.send(JSON.stringify({'evaluations': result}));
      })
      .catch(err => {
        res.status(400);
        res.send(JSON.stringify({'error': err.message || err}))
      });
});

exports.transcript = functions.https.onRequest((req, res) => {
  const jar = request.jar();
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Content-Type', 'application/json');
  const host = 'https://aisweb.uchicago.edu/';
  request(host + 'psp/ihprd/EMPLOYEE/EMPL/h/?tab=UC_STUDENT_TAB', {jar})
      .then(() => performShibbolethHandshake(host, jar, req))
      .then(html => {
        const $ = cheerio.load(html);
        const gyears =
            new Map($('select#gyear_id')
                        .find('option')
                        .map((i, el) => [[$(el).attr('value'), $(el).text()]])
                        .get());
        return $('table.gyear')
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
      })
      .then(result => {
        res.status(200);
        res.send(JSON.stringify({'transcript': result}));
      })
      .catch(err => {
        res.status(400);
        res.send(JSON.stringify({'error': err.message || err}))
      });
});
