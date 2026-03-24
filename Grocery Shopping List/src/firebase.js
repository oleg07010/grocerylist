// src/firebase.js
// Copy .env.example → .env.local and fill in values from Firebase Console
// (Project settings → Your apps → Web app config). Never commit .env.local.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const required = {
  REACT_APP_FIREBASE_API_KEY: process.env.REACT_APP_FIREBASE_API_KEY,
  REACT_APP_FIREBASE_AUTH_DOMAIN: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  REACT_APP_FIREBASE_PROJECT_ID: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  REACT_APP_FIREBASE_STORAGE_BUCKET: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  REACT_APP_FIREBASE_APP_ID: process.env.REACT_APP_FIREBASE_APP_ID,
};

const missing = Object.entries(required)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length > 0) {
  throw new Error(
    `Firebase env vars missing: ${missing.join(", ")}. Copy .env.example to .env.local and set them.`
  );
}

const firebaseConfig = {
  apiKey: required.REACT_APP_FIREBASE_API_KEY,
  authDomain: required.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: required.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: required.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: required.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: required.REACT_APP_FIREBASE_APP_ID,
};

if (process.env.REACT_APP_FIREBASE_MEASUREMENT_ID) {
  firebaseConfig.measurementId = process.env.REACT_APP_FIREBASE_MEASUREMENT_ID;
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
