import * as firebase from 'firebase';
import 'firebase/firestore';

firebase.initializeApp({
  apiKey: 'AIzaSyCjBDyhwbXcp9kEIA2pMHLDGxmCM4Sn6Eg',
  authDomain: 'canigraduate-43286.firebaseapp.com',
  projectId: 'canigraduate-43286',
});

export const firestore = firebase.firestore();
firestore.settings({ timestampsInSnapshots: true });

export const auth = firebase.auth();
