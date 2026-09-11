import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "mls-betting-app",
  appId: "1:961250275287:web:0f1a67501e34aa6b1aa592",
  storageBucket: "mls-betting-app.firebasestorage.app",
  apiKey: "AIzaSyDzObXgfQwA7OXMtUDVbZthKfr5t62Y17U",
  authDomain: "mls-betting-app.firebaseapp.com",
  messagingSenderId: "961250275287",
  measurementId: "G-G230J909QY"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
