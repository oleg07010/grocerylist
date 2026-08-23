# 🛒 GrocerySync — Setup Guide

A real-time shared grocery list built with React + Material UI + Firebase, deployed on Vercel for free.

---

## What You'll Need
- A free [Firebase](https://firebase.google.com/) account
- A free [Vercel](https://vercel.com/) account
- A free [GitHub](https://github.com/) account (Vercel deploys from GitHub)
- [Node.js](https://nodejs.org/) installed on your computer (for local testing)

---

## Step 1 — Set Up Firebase (5 minutes)

### 1a. Create a Firebase project
1. Go to [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Name it something like `grocery-app` → Continue → Continue → Create project

### 1b. Create a Firestore database
1. In the left sidebar, click **Build → Firestore Database**
2. Click **"Create database"**
3. Select **"Start in test mode"** → Next
4. Choose a location near you → **Enable**

### 1c. Get your Firebase config
1. Click the **gear icon ⚙️** next to "Project Overview" → **Project settings**
2. Scroll down to **"Your apps"** → click the **`</>`** (Web) icon
3. Give the app a nickname (e.g. `grocery-web`) → **Register app**
4. You'll see a `firebaseConfig` object — **copy all the values**

### 1d. Paste your config into the app
Open `src/firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← paste your real values
  authDomain: "grocery-app-xxxx.firebaseapp.com",
  projectId: "grocery-app-xxxx",
  storageBucket: "grocery-app-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

---

## Step 2 — Test Locally (optional but recommended)

```bash
# In the grocery-app folder:
npm install
npm start
# → Opens at http://localhost:3000
```

Make sure items can be added, checked, edited, and deleted before deploying.

---

## Step 3 — Push to GitHub

```bash
# In the grocery-app folder:
git init
git add .
git commit -m "Initial commit"

# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/grocery-app.git
git branch -M main
git push -u origin main
```

---

## Step 4 — Deploy to Vercel (2 minutes)

1. Go to [https://vercel.com/](https://vercel.com/) and sign in with GitHub
2. Click **"Add New → Project"**
3. Import your `grocery-app` GitHub repository
4. Vercel auto-detects it as a React app — **click Deploy**
5. In ~60 seconds you'll get a live URL like:
   `https://grocery-app-yourname.vercel.app`

**Share that URL with your wife — you're both on the same live list! 🎉**

---

## How to Use the App

| Feature | How |
|---|---|
| **Add item** | Type name + optional details → click Add (or press Enter) |
| **Check off** | Click the checkbox when you buy something |
| **Edit / Delete item** | Open the item's **⋯** menu → Edit or Delete |
| **Pin item** | Click the 📌 pin to keep it checked through a reset |
| **Reset for new week** | Click **Reset** button — unchecks all items (nothing deleted) |
| **Search** | Type in the search box to filter the list |

---

## Sharing With Your Wife

Just send her the Vercel URL. Both of you can:
- Add/edit/delete items
- Check items off in real time
- See each other's changes instantly (no refresh needed)

---

## 📱 iOS App (TestFlight)

The same web app can run as a native iOS app via **Capacitor** — it wraps the
production web build (`build/`) in a native shell. The iOS app reads the **same
Firebase project**, so it shares one live list with the web version.

**Prerequisites:** macOS with Xcode, CocoaPods, and a **paid Apple Developer
Program** membership.

Rebuild-and-open loop when you change the app:

```bash
npm run build          # rebuild the web bundle
npx cap sync ios       # copy it into the iOS project + refresh plugins/pods
npx cap open ios       # open ios/App/App.xcworkspace in Xcode
```

Then use Xcode to **Archive → Distribute → App Store Connect** and add testers.
Full step-by-step (Apple account setup, signing, uploading, adding your wife as
an internal tester) is in **[`TESTFLIGHT.md`](./TESTFLIGHT.md)**.

- Bundle ID: `com.appassov.grocerysync`
- Version: `1.1.0` (build `2`)

---

## 🤖 Android App (Google Play)

The same web app also runs as a native **Android** app via **Capacitor** (the
`android/` Gradle project), sharing the same Firebase project as the web and iOS
apps. It targets **API 36 (Android 16)** as required by Google Play.

Rebuild-and-open loop when you change the app:

```bash
npm run build          # rebuild the web bundle (needs REACT_APP_* env vars)
npx cap sync android   # copy it into the Android project + refresh plugins
npx cap open android   # open the project in Android Studio
```

Command-line builds need **JDK 21** (Capacitor 7.6). If your shell isn't on 21,
point Gradle at Android Studio's bundled JDK:

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
cd android && ./gradlew bundleRelease   # → app/build/outputs/bundle/release/app-release.aab
```

Full step-by-step (upload keystore, Play App Signing, closed-testing gate, data
safety, store listing) is in **[`PLAYSTORE.md`](./PLAYSTORE.md)**.

- Package name: `com.appassov.grocerysync`
- Version: `1.2.0` (versionCode `1`)

> **Edge-to-edge:** Android draws behind the system bars at API 36, so
> `@capawesome/capacitor-android-edge-to-edge-support` applies the insets and
> paints the bar areas white (`plugins.EdgeToEdge.backgroundColor` in
> `capacitor.config.ts`), matching the header/compose bar.

---

## Testing

```bash
CI=true npm test         # run all tests once (non-watch)
npm test                 # interactive watch mode
```

- **`src/lib/listLogic.test.js`** — unit tests for the pure list logic
  (search filter, section ordering, drag-reorder reindexing, reset/pin rules).
- **`src/lib/nativeSetup.test.js`** — unit tests for the native startup setup
  (no-op on web; sets dark status-bar content + hides the splash on native;
  still hides the splash if status-bar styling fails).
- **`src/App.test.jsx`** — integration tests that render `<App/>` with Firestore
  mocked and verify add / toggle / delete / search and the reset button state.

---

## Optional: Secure Your Database (Recommended After Testing)

By default Firebase is in "test mode" (anyone with the URL can read/write).
To lock it down, go to **Firestore → Rules** and replace the rules with:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /groceries/{docId} {
      allow read, write: if true; // Keep open, or add auth later
    }
  }
}
```

For a family app this is fine. If you ever want login-based access, let me know and I can add Firebase Authentication.

---

## Project Structure

```
grocery-app/
├── public/
│   ├── index.html         ← viewport-fit=cover for iOS safe areas
│   └── privacy.html       ← privacy policy (hosted at /privacy.html for Play)
├── src/
│   ├── firebase.js        ← Firebase config (from env vars)
│   ├── App.jsx            ← Main app UI + Firestore wiring
│   ├── index.js           ← Entry point (calls configureNativeUI())
│   ├── lib/
│   │   ├── listLogic.js   ← Pure list logic (filter, order, reorder, reset)
│   │   ├── listLogic.test.js
│   │   ├── haptics.js     ← Light haptic tap on native, no-op on web
│   │   ├── nativeSetup.js ← Native status bar + splash setup (no-op on web)
│   │   └── nativeSetup.test.js
│   ├── App.test.jsx       ← Integration tests (Firestore mocked)
│   └── setupTests.js
├── ios/                   ← Native iOS app (Capacitor) — see TESTFLIGHT.md
├── android/               ← Native Android app (Capacitor) — see PLAYSTORE.md
├── resources/
│   ├── icon.png           ← 1024×1024 app icon source
│   └── icon-*/splash*.png ← adaptive-icon + splash sources (generated)
├── scripts/
│   └── generate-android-icon-sources.mjs  ← derives adaptive/splash sources
├── capacitor.config.ts    ← Capacitor config (bundle id, app name, webDir, plugins)
├── vercel.json            ← Vercel routing config
├── package.json
└── .gitignore
```

---

## Tech Stack

- **React 18** — UI framework
- **Material UI v5** — Components & styling
- **Firebase Firestore** — Real-time database (free tier: 50k reads + 20k writes/day)
- **Vercel** — Web hosting (free, unlimited)
- **Capacitor 7** — Wraps the web build into native iOS (`TESTFLIGHT.md`) and Android (`PLAYSTORE.md`) apps
- **Jest + React Testing Library** — Unit & integration tests
