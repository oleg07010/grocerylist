// src/firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com/
// 2. Click "Add project" → give it a name (e.g. "grocery-app")
// 3. In the left sidebar: Build → Firestore Database → "Create database"
//    • Choose "Start in test mode" (you can add security rules later)
//    • Pick a location close to you
// 4. In the left sidebar: Project Settings (gear icon) → "Your apps" → </>  (Web)
//    • Register app, then copy the firebaseConfig values below
// 5. Replace the placeholder values below with your real config
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDWnn6hk2yEODKrgGkW9LNFd1zVu5mrdu8",
  authDomain: "grocery-shopping-list-ff7b5.firebaseapp.com",
  projectId: "grocery-shopping-list-ff7b5",
  storageBucket: "grocery-shopping-list-ff7b5.firebasestorage.app",
  messagingSenderId: "681935409933",
  appId: "1:681935409933:web:9db551d4238f64e4b85644",
  measurementId: "G-5NJBDFHR3J"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
