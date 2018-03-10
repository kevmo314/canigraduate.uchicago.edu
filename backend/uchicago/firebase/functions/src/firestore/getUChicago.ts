import * as admin from 'firebase-admin';

export function getUChicago() {
  return admin
    .firestore()
    .collection('institutions')
    .doc('uchicago');
}
