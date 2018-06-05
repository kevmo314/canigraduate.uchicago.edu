import Config from '../firestore/Config';
import Users from '../firestore/Users';
import Watches from '../firestore/Watches';

function toEnrollmentString(data) {
  const enrolled =
    data.enrollment.enrolled === undefined ? '??' : data.enrollment.enrolled;
  const maximum =
    data.enrollment.maximum === undefined ? '??' : data.enrollment.maximum;
  return `${enrolled}/${maximum}`;
}

function toEnrollmentDiff(previous, current): [boolean, string] {
  const previousEnrollment = previous ? toEnrollmentString(previous) : 'null';
  const currentEnrollment = current ? toEnrollmentString(current) : 'null';
  if (previousEnrollment === currentEnrollment) {
    return [false, `${previousEnrollment} -> ${currentEnrollment} (no change)`];
  }
  return [true, `${previousEnrollment} -> ${currentEnrollment}`];
}

function generateDiff(previous, current): [boolean, string] {
  const [sectionChanged, sectionDiff] = toEnrollmentDiff(previous, current);
  let changed = sectionChanged;
  let output = `Section enrollment: \n\t${sectionDiff}`;
  const activityIds = new Set([
    ...previous.secondaries.map(secondary => secondary.id),
    ...current.secondaries.map(secondary => secondary.id),
  ]);
  if (activityIds.size > 0) {
    output += '\n\nActivity enrollment:\n';
    for (const activity of activityIds) {
      const previousActivity = previous.secondaries.find(
        s => s.id === activity,
      );
      const currentActivity = current.secondaries.find(s => s.id === activity);
      const [activityChanged, diff] = toEnrollmentDiff(
        previousActivity,
        currentActivity,
      );
      changed = changed || activityChanged;
      output += `\t${activity}:\t${diff}`;
    }
  }
  return [changed, output];
}

/** Sends relevant emails for a given database change event. */
export default async function(
  { course, term, section }: { course: string; term: string; section: string },
  previous,
  current,
) {
  if(!previous) {
    return Promise.resolve();
  }
  const [changed, diff] = generateDiff(previous, current);
  if (!changed) {
    // Could be due to ther fields changing.
    return Promise.resolve();
  }
  const watches = await Watches.find(term, course, section);
  const emails = await Promise.all(
    watches.map(({ data }) => Users.getEmail(data.uid.split(':')[1])),
  );
  return Promise.all(
    [...new Set(emails)].map(to => {
      return Config.sendEmail({
        from: '"Magister Mugit" <Magister.Mugit@uchicago.edu>',
        to,
        bcc: 'kdwang@uchicago.edu',
        subject: `${term} ${course} Enrollment Notification`,
        text: `Hi there! One of your watches on Can I Graduate? was triggered. Exciting!

Term:\t${term}
Course:\t${course}
Section:\t${section}

${diff}

Visit AIS to register for this class: https://aisweb.uchicago.edu/

Have fun!
Magister Mugit

Didn't expect this email? Questions or comments? Send it to Magister.Mugit@uchicago.edu! Want to unsubscribe? Remove your watch on http://canigraduate.uchicago.edu/`,
      });
    }),
  );
}
