'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions');

module.exports = functions.firestore
  .document('institutions/uchicago/offerings/{id}')
  .onWrite(event => {
    const { course, period, year, sections } = data;
    const cardinality = Object.keys(sections).length;
    // Update the cardinality tables.
    const uchicago = db.collection('institutions').doc('uchicago');
    const cardinalityTableRef = uchicago
      .collection('indexes')
      .doc('cardinality');
    return db.runTransaction(transaction => {
      transaction.get(cardinalityTableRef).then(doc => {
        const { courses, periods, years } = doc.data();
        function findOrAppend(arr, value) {
          const index = arr.indexOf(value);
          if (index < 0) {
            arr.push(value);
            return arr.length - 1;
          }
          return index;
        }
        const courseIndex = findOrAppend(courses, course);
        const periodIndex = findOrAppend(periods, period);
        const yearIndex = findOrAppend(years, year);
        let inserted = false;
        for (let i = 0; i < data.length; i += 4) {
          if (
            data[i] == courseIndex &&
            data[i + 1] == periodIndex &&
            data[i + 2] == yearIndex
          ) {
            data[i + 3] = cardinality;
            inserted = true;
            break;
          }
        }
        if (!inserted) {
          data.push(courseIndex, periodIndex, yearIndex, cardinality);
        }
        doc.update(cardinalityTableRef, {
          courses,
          periods,
          years,
          data,
        });
      });
    });
  });
