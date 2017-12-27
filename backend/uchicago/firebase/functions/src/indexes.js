'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions');

module.exports = functions.firestore
  .document('institutions/uchicago/offerings/{id}')
  .onWrite(event => {
    const { course, period, year, sections} = data;
    const cardinality = Object.keys(sections).length;
    // Update the cardinality tables.
    const uchicago = db.collection('institutions').doc('uchicago');
    const cardinalityTableRef = uchicago.collection('indexes').doc('cardinality');
    return db.runTransaction(transaction => {
      transaction.get(cardinalityTableRef).then(doc => {
        const { courses, periods, years } = doc.data();
        let table = reshape(doc.data().data, [courses.length, periods.length, years.length]);
        function findOrInsert(arr, value) {
          let index = binarySearch(arr, value);
          if (index < 0) {
            index = ~index;
            arr.splice(index, 0, value);
          }
          return index;
        }
        // TODO: Splice in the inserted blocks.
        const coursesIndex = findOrInsert(courses, course);
        const periodsIndex = findOrInsert(periods, period);
        const yearsIndex = findOrInsert(years, year);
        doc.update(cardinalityTableRef, {
          courses, periods, years, data: reshape(table),
        });
      })
    });
  });
