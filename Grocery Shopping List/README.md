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
| **Add item** | Type name + optional qty → click Add (or press Enter) |
| **Check off** | Click the checkbox when you buy something |
| **Edit item** | Click the ✏️ pencil icon |
| **Delete item** | Click the 🗑️ trash icon |
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
- Version: `1.0.0` (build `1`)

---

## Testing

```bash
CI=true npm test         # run all tests once (non-watch)
npm test                 # interactive watch mode
```

- **`src/lib/listLogic.test.js`** — unit tests for the pure list logic
  (search filter, section ordering, drag-reorder reindexing, reset/pin rules).
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
│   └── index.html         ← viewport-fit=cover for iOS safe areas
├── src/
│   ├── firebase.js        ← Firebase config (from env vars)
│   ├── App.jsx            ← Main app UI + Firestore wiring
│   ├── index.js           ← Entry point (+ native status bar / splash)
│   ├── lib/
│   │   ├── listLogic.js   ← Pure list logic (filter, order, reorder, reset)
│   │   └── listLogic.test.js
│   ├── App.test.jsx       ← Integration tests (Firestore mocked)
│   └── setupTests.js
├── ios/                   ← Native iOS app (Capacitor) — see TESTFLIGHT.md
├── resources/
│   └── icon.png           ← 1024×1024 app icon source
├── capacitor.config.ts    ← Capacitor config (bundle id, app name, webDir)
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
- **Capacitor 7** — Wraps the web build into a native iOS app (see `TESTFLIGHT.md`)
- **Jest + React Testing Library** — Unit & integration tests
