'use strict';

const admin = require('firebase-admin');

module.exports = (req, res, next) => {
  admin.database().ref('grades/raw').once('value', data => {
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
