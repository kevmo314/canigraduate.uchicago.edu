import firebase from 'firebase/app';
import 'firebase/firestore';
import Institutions from './institutions';

firebase.initializeApp({
  apiKey: 'AIzaSyCjBDyhwbXcp9kEIA2pMHLDGxmCM4Sn6Eg',
  authDomain: 'canigraduate-43286.firebaseapp.com',
  projectId: 'canigraduate-43286',
});

export default firebase.firestore();
