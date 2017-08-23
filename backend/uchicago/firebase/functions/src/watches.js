'use strict';

const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const functions = require('firebase-functions');

const email = encodeURIComponent(functions.config().smtp.email);
const password = encodeURIComponent(functions.config().smtp.password);
const mailTransport = nodemailer.createTransport(
  `smtps://${email}:${password}@authsmtp.uchicago.edu`,
);

function enrollmentDiff(previous, current) {
  const change =
    previous.val()[0] != current.val()[0] ||
    previous.val()[1] != current.val()[1];
  return [
    change,
    previous.val().join('/') +
      ' -> ' +
      (change ? current.val().join('/') : '(no change)'),
  ];
}

function generateDiff(previous, current) {
  let [changed, sectionDiff] = enrollmentDiff(
    previous.child('enrollment'),
    current.child('enrollment'),
  );
  let output = 'Section enrollment: \n\t' + sectionDiff;
  const previousActivities = Object.keys(
    previous.child('secondaries').val() || {},
  );
  const currentActivities = Object.keys(
    current.child('secondaries').val() || {},
  );
  if (previousActivities.length > 0 || currentActivities.length > 0) {
    output += '\n\nActivity enrollment:\n';
    for (const activity of new Set([
      ...previousActivities,
      ...currentActivities,
    ])) {
      const [activityChanged, activityDiff] = enrollmentDiff(
        previous.child('secondaries').child(activity).child('enrollment'),
        current.child('secondaries').child(activity).child('enrollment'),
      );
      changed |= activityChanged;
      output += `\t${activity}:\t${activityDiff}`;
    }
  }
  return [changed, output];
}

module.exports = functions.database
  .ref('/schedules/{course}/{year}/{period}/{section}')
  .onWrite(event => {
    const { course, year, period, section } = event.params;
    const current = event.data.current;
    const previous = event.data.previous;
    admin.database().ref(`/watches`).once('value').then(watches => {
      for (const to in watches || {}) {
        for (const watch of watches[to]) {
          if (
            watch.course &&
            watch.course.toUpperCase() != course.toUpperCase()
          ) {
            continue;
          }
          if (
            watch.section &&
            watch.section.toUpperCase() != section.toUpperCase()
          ) {
            continue;
          }
          const term = `${period} ${year}`;
          if (watch.term && watch.term.toUpperCase() != term.toUpperCase()) {
            continue;
          }
          const [changed, diff] = generateDiff(previous, current);
          if (!changed) {
            continue;
          }
          const mailOptions = {
            from: '"Magister Mugit" <Magister.Mugit@uchicago.edu>',
            to: `${to}@uchicago.edu`,
            bcc: 'kdwang@uchicago.edu',
            subject: `${period} ${year} ${course} Enrollment Notification`,
            text: `Hi there! One of your watches on Can I Graduate? was triggered. Exciting!

Term:\t${period} ${year}
Course:\t${course}
Section:\t${section}

${diff}

Visit AIS to register for this class: https://aisweb.uchicago.edu/

Have fun!
Magister Mugit

Didn't expect this email? Questions or comments? Send it to Magister.Mugit@uchicago.edu! Want to unsubscribe? Remove your watch on http://canigraduate.uchicago.edu/`,
          };
          mailTransport.sendMail(mailOptions);
        }
      }
    });
  });
