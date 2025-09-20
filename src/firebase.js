// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAl7a65qBwbqropQ9MYCD6CB63om2OrAlU",
  authDomain: "mlb-showdown-2.firebaseapp.com",
  projectId: "mlb-showdown-2",
  storageBucket: "mlb-showdown-2.firebasestorage.app",
  messagingSenderId: "585134791430",
  appId: "1:585134791430:web:fffa879c1c233f88f5dc87"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;