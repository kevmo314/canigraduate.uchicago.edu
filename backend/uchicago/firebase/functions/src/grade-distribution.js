'use strict';

const admin = require('firebase-admin');

const ref = admin.database().ref('grades/raw');

module.exports = (req, res, next) => {
  ref.once('value', data => {
    const results = {};
    data.forEach(record => {
      const course = record.child('course').val();
      const gpa = record.child('gpa').val();
      if (!results[course]) {
        results[course] = {};
      }
      results[course][gpa] = (results[course][gpa] || 0) + 1;
    });
    res.status(200);
    res.json(results);
  });
};
