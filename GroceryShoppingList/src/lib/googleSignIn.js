// src/lib/googleSignIn.js
//
// Google sign-in for web + the Capacitor iOS/Android apps.
// - Web: Firebase popup. The resolver is passed explicitly because firebase.js
//   uses initializeAuth (which omits it so the native WebView doesn't hang).
// - Native: Google blocks OAuth popups inside WebViews, so the
//   @capacitor-firebase/authentication plugin shows the native Google sheet
//   (skipNativeAuth: true in capacitor.config.ts) and we hand its ID token to the
//   Firebase JS SDK. The JS SDK session is what Firestore rules see.

import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import {
  GoogleAuthProvider, signInWithCredential, signInWithPopup, browserPopupRedirectResolver,
} from "firebase/auth";
import { auth } from "../firebase";

export async function signInWithGoogle() {
  if (!Capacitor.isNativePlatform()) {
    return signInWithPopup(auth, new GoogleAuthProvider(), browserPopupRedirectResolver);
  }
  const result = await FirebaseAuthentication.signInWithGoogle();
  const idToken = result.credential?.idToken;
  if (!idToken) throw new Error("Google sign-in returned no ID token");
  return signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
}
