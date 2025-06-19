import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC785SXPp6xdyedgW2l9yxxFb1cvoM1t5Q",
  authDomain: "construction-4f3ae.firebaseapp.com",
  projectId: "construction-4f3ae",
  storageBucket: "construction-4f3ae.appspot.com",
  messagingSenderId: "508738173721",
  appId: "1:508738173721:web:75bd442a2af74de331a388",
  measurementId: "G-QN467W2H7G"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 
export const storage = getStorage(app); 