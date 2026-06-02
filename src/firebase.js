// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDQDbVPZB55nq4SnOuLDC7-gieFJOckCQA",
  authDomain: "volleyballlive-abfaa.firebaseapp.com",
  projectId: "volleyballlive-abfaa",
  storageBucket: "volleyballlive-abfaa.firebasestorage.app",
  messagingSenderId: "247638603103",
  appId: "1:247638603103:web:dd6c41ff1ce1a6e7b0f2ea",
  measurementId: "G-1WKZZDM162"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);