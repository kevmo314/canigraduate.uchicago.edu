import Grade from '../models/Grade';
import * as PubSub from '@google-cloud/pubsub';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';
import { CookieJar } from 'request';
import request from '../request';

export default async function getTranscript(
  authenticator: (jar: CookieJar) => Promise<string>,
) {
  const jar = request.jar();
  const host = 'https://aisweb.uchicago.edu/';
  await request(host + 'psp/ihprd/EMPLOYEE/EMPL/h/?tab=UC_STUDENT_TAB', {
    jar,
  });
  const html = await authenticator(jar);
  const $ = cheerio.load(html);
  if ($('#UCMPtab_UC_STU_GRADES').length === 0) {
    throw new Error(
      "AIS didn't return a valid response. Maybe my.uchicago.edu is down?",
    );
  }
  const gyears = new Map();
  $('select#gyear_id')
    .find('option')
    .each((i, el) => gyears.set($(el).attr('value'), $(el).text()));
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
            .trim() === 'Activity'
        );
      })
      .filter((i, row) => {
        return $(row)
          .text()
          .includes(course);
      });
    if (!matches.length) {
      return null;
    }
    const text = matches.text().trim();
    const start = text.indexOf(course);
    const newline = text.indexOf('\n', start);
    const bracket = text.indexOf(']', start);
    const end = Math.min(
      newline < 0 ? text.length : newline,
      bracket < 0 ? text.length : bracket,
    );
    return text.substring(start + course.length + section.length + 1, end);
  }
  return $('table.gyear')
    .map((i, table) => {
      const year = $(table)
        .attr('id')
        .substring('gyear'.length);
      const term = gyears.get(year);
      return $(table)
        .find('tr')
        .map((j, row) => {
          const cells = $(row).find('td');
          const complete = !cells
            .eq(2)
            .text()
            .includes('In Progress');
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
}
