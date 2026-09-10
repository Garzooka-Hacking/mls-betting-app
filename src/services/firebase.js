import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDzObXgfQwA70XMtUDVbZthKfr5t62Y17U",
  authDomain: "mls-betting-app.firebaseapp.com",
  projectId: "mls-betting-app",
  storageBucket: "mls-betting-app.firebasestorage.app",
  messagingSenderId: "961250275287",
  appId: "1:961250275287:web:f4cf7ed577f68c471aa592",
  measurementId: "G-P17JGTSMLN"
};

let app = null;
let db = null;
let auth = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error("Error inicializando Firebase", error);
}

export { db, auth };
