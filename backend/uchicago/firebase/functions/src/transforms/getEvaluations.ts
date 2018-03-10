import * as cheerio from 'cheerio';
import Users from '../firestore/Users';
import { CookieJar } from 'request';
import request from '../request';

export default async function getEvaluations(
  course: string,
  authenticator: (jar: CookieJar) => Promise<string>,
) {
  const jar = request.jar();
  const host = 'https://evaluations.uchicago.edu/';
  const match = course.match(/([A-Z]{4}) (\d{5})/);
  if (!match || match.length < 3) {
    throw Error('Invalid course id "' + course + '".');
  }
  const [department, courseNumber] = match.slice(1, 3);
  await request(
    host +
      '?EvalSearchType=option-number-search&CourseDepartment=' +
      department +
      '&CourseNumber=' +
      courseNumber,
    { jar },
  );
  const html = await authenticator(jar);
  const $ = cheerio.load(html);
  const error = $('.messages.error');
  if (error.length) {
    throw new Error(error.text());
  }
  return $('table#evalSearchResults > tbody > tr')
    .map((index, element) => {
      const cells = $(element).find('td');
      return {
        href:
          host +
          $(element)
            .find('a')
            .attr('href'),
        section: cells
          .eq(0)
          .text()
          .substring(11),
        instructor: cells.eq(2).text(),
        term: cells.eq(3).text(),
      };
    })
    .get();
}
