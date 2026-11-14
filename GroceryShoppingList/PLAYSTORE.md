# 🤖 Shipping GrocerySync to Google Play

This guide gets the app onto Android via the **Google Play Store**. The project is
wrapped as a native Android app with **Capacitor** — the `android/` folder is a
ready Gradle project. You sign it with your own **upload key** and upload a signed
**Android App Bundle (`.aab`)**.

**Facts you'll reuse below**

| Thing | Value |
|---|---|
| App name (Play listing) | **GrocerySync** |
| Package name (applicationId) | **`com.appassov.grocerysync`** ⚠️ permanent, never changes |
| versionName | **1.2.0** (mirrors `package.json`) |
| versionCode | **3** (integer — **must increase on every upload**; 1 = first internal release, 2 = the bundle Play's protection refused) |
| Target / compile API | **36 (Android 16)** — required for new Play submissions |
| Min SDK | **24 (Android 7.0)** — Play's automatic protection refuses bundles below 24 (`android/variables.gradle`) |
| Build JDK | **21** (Capacitor 7.6 requires it) — Homebrew `openjdk@21`; Android Studio now bundles JDK **25**, not 21 |
| Signed bundle output | `android/app/build/outputs/bundle/release/app-release.aab` |
| Firebase project | **`grocery-shopping-list-ff7b5`** |
| Firebase Android app ID | **`1:681935409933:android:0d2711b5e749650fb85644`** |

> **The Android app needs two pieces of Firebase config — both at build time.**
> - **The list (Firestore)** runs on the Firebase **web** SDK inside the WebView,
>   configured from `REACT_APP_*` env vars (`.env.local`), exactly like the web/iOS
>   builds — so the app talks to the same Firestore as the website and iOS app.
>   ⚠️ **If those env vars are missing when you run `npm run build`, the app ships
>   with an empty Firebase config and silently won't sync.** Build on a machine
>   that has `.env.local` (or the vars exported).
> - **Google sign-in** uses the native Google sheet from
>   `@capacitor-firebase/authentication`, which reads the web client ID
>   (`default_web_client_id`) from **`android/app/google-services.json`**. Without
>   that file the plugin keeps its placeholder (`WILL_BE_OVERRIDDEN`) and **Google
>   sign-in fails on every Android build** — and since every read needs a signed-in,
>   allowlisted account, nothing loads. The file is gitignored; get it in **A3**.

---

## Part A — One-time setup

### A1. Prerequisites (local machine)
- **Android Studio** installed (bundles the Android SDK).
- **Android SDK Platform 36** installed (Android Studio → *Settings → Languages &
  Frameworks → Android SDK → SDK Platforms → Android 16 / API 36*).
- Builds must run on **JDK 21**. Android Studio's bundled JDK is now **25**, and this Mac's default `java` is
  17, so point Gradle at Homebrew's JDK 21 (`brew install openjdk@21` if it's missing):
  ```bash
  export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
  ```
  Verified 2026-11-14: `./gradlew bundleRelease` builds on it (Gradle 8.11.1, AGP 8.7.2). To build from
  *inside* Android Studio instead, set the same JDK 21 under *Settings → Build, Execution, Deployment → Build
  Tools → Gradle → Gradle JDK*.

### A2. Create the app in Play Console
Google Play Console → **Create app**:
- App name: **GrocerySync**
- Package name: **`com.appassov.grocerysync`** — ⚠️ **permanent**, and must match
  `applicationId` in `android/app/build.gradle` and `appId` in `capacitor.config.ts`.
- App or game: **App** · Free or paid: **Free** (⚠️ a free app can't become paid later)

### A3. Download `google-services.json` (once)
The Firebase Android app (package `com.appassov.grocerysync`) is already registered;
download its config into the Android project:
```bash
firebase apps:sdkconfig ANDROID 1:681935409933:android:0d2711b5e749650fb85644 \
  --project grocery-shopping-list-ff7b5 > android/app/google-services.json
```
It's gitignored — keep it out of git. The Gradle build applies the Google Services
plugin only when this file exists (`android/app/build.gradle`), and that plugin is
what puts the sign-in client ID into the app.

### A4. Generate your upload keystore (once)
Create the upload key and wire it into `android/keystore.properties`. Full
step-by-step (every `keytool` prompt explained, backup + troubleshooting) is in
**[`KEYSTORE.md`](./KEYSTORE.md)**. In short:
```bash
keytool -genkeypair -v -keystore ~/keys/grocerysync-upload.jks \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000
cp android/keystore.properties.example android/keystore.properties   # then fill it in
```
**Back up the `.jks` file and its password** — you sign every future update with
it. `keystore.properties` and `*.jks` are gitignored; never commit them.

### A5. Play App Signing — and its fingerprint in Firebase
New apps auto-enroll in **Play App Signing**: you hold the **upload key** (above);
Google holds and manages the actual **app signing key**. If you ever lose the
upload key, you can reset it in Play Console without losing the app.

⚠️ **Google sign-in checks which key signed the app.** Every key that signs a build
you install must be registered as a **SHA-1 fingerprint** on the Firebase Android
app, or Google sign-in fails on that build. A copy installed **from Play** is
re-signed by Google with the **app signing key**, so that is the fingerprint your
testers need. As of 14 Nov 2026 only the **debug** key (`28:8C:BB:1A:…:67:C4:71:99`,
Android Studio's *Run*) is registered.

| Key | Signs | Where to read its SHA-1 |
|---|---|---|
| Debug | Android Studio *Run* / debug builds | already registered |
| Upload | your locally built release | `keytool -list -v -keystore ~/keys/grocerysync-upload.jks -alias upload` |
| **App signing** | **every copy installed from Play** | Play Console → **Test and release → Setup → App integrity → App signing** → *App signing key certificate* (appears after your **first upload**) |

Add each one — in the Firebase console (**Project settings → General → Your apps →
GrocerySync (Android) → Add fingerprint**), or from the CLI with the SHA-1 **without
colons**:
```bash
firebase apps:android:sha:create 1:681935409933:android:0d2711b5e749650fb85644 \
  <SHA1_WITHOUT_COLONS> --project grocery-shopping-list-ff7b5
firebase apps:android:sha:list 1:681935409933:android:0d2711b5e749650fb85644 \
  --project grocery-shopping-list-ff7b5          # check what's registered
```
No rebuild needed — Google checks the fingerprint at sign-in; allow a few minutes.

---

## Part B — Build the signed bundle (repeatable)

From the project folder (the one with `package.json`):
```bash
ls android/app/google-services.json   # must exist (A3), or Google sign-in won't work
npm run build                    # web bundle (needs REACT_APP_* env vars!)
LANG=en_US.UTF-8 npx cap sync android   # copy web bundle + config into android/ (the path has spaces)
cd android
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home   # JDK 21 (A1)
./gradlew bundleRelease          # signed .aab (uses keystore.properties)
```
Output: **`android/app/build/outputs/bundle/release/app-release.aab`** — upload this.

> Prefer Android Studio? `npx cap open android` (with its Gradle JDK set to 21 — A1), then **Build → Generate
> Signed App Bundle** (or just **Build → Build Bundle(s)** once `keystore.properties` is set), and grab the same
> `.aab`.
>
> Check the bundle is signed before uploading: `keytool -printcert -jarfile
> app/build/outputs/bundle/release/app-release.aab` prints your upload certificate (the name you gave `keytool`);
> an unsigned bundle prints nothing.

---

## Part C — Testing tracks & the production gate

⚠️ **Personal developer accounts created after 13 Nov 2023 must complete closed
testing before they can publish to production**: at least **12 testers opted in
for 14 continuous days** on a **Closed** track. Internal testing does **not**
count. Plan for ~2+ weeks, and line up 12 real testers (real Google accounts)
early — this, not the code, is the long pole.

### Who can use a test build — two lists
A tester must be on **both**:
1. **Play's tester list** (Play Console, below) — who can install the app.
2. **The allowlist in `firestore.rules`** — who can see the list once signed in.
   Today it holds `oleg.appassov@gmail.com` and `csgambellone@gmail.com`. Add the
   tester's Google email there, then deploy:
   ```bash
   firebase deploy --only firestore:rules --project grocery-shopping-list-ff7b5
   ```
   A Google account that isn't on it signs in fine, but every read is denied — the
   list just stays empty.

⚠️ **There is one shared household list.** Everyone on the allowlist sees and edits
the same items, so a tester outside your household would see your real groceries.

### Recommended sequence
1. **Internal testing** — up to **100 testers**, **no Google review**, usually live
   within minutes:
   - Play Console → **Test and release → Testing → Internal testing → Testers** →
     **Create email list** (a name + emails, comma-separated or a CSV) → **Save
     changes** → tick the list, add a feedback email → **Save changes**.
   - Create a release on the internal track, upload `app-release.aab` (the first
     upload enrolls Play App Signing), and roll it out.
   - **Before anyone signs in:** register the Play **app signing** key's SHA-1 with
     Firebase (A5) — without it Google sign-in fails on every Play install.
   - Send testers the **join link** (Testers tab → **Copy link**). Each tester opens
     it signed in with the listed Google account, accepts, then installs from Play.
     The app is **not searchable** on Play while in testing, and after the first
     release the link can take a few hours to start working.
   - *Does not count toward the 12/14 gate.*
2. **Closed testing**: create a closed track, add **≥12 testers** (on both lists
   above), have them opt in and install, and keep them opted in for **14 continuous
   days**. Google reviews closed releases — finish Part D first.
3. **Apply for production access** (unlocks after the 14-day window) → get granted →
   create the **Production** release.

---

## Part D — Store listing & required declarations (App content)

Google reviews **closed, open and production** releases and needs these first.
Internal testing isn't reviewed, but Play Console may ask for some of them before
your first internal release too — fill in whatever it flags.

- **Privacy policy URL** — `public/privacy.html` on the live site:
  **`https://grocerylist-virid.vercel.app/privacy.html`** (the Vercel project
  `grocerylist`'s production domain — it must stay live; never a per-deployment preview
  URL). It describes Google sign-in (updated 14 Nov 2026); the Data safety answers below
  must match it, so redeploy the site whenever it changes.
- **Data safety** form — answers that match this app:
  | Question | Answer |
  |---|---|
  | Does the app collect/share user data? | **Yes** (collect only) |
  | Shared? | **No** (Firebase/Google is a service provider, not a third party) |
  | **Personal info → Email address** | Collected · **required** · **App functionality** (the allowlist checks it) + **Account management** · **linked** to the user |
  | **Personal info → Name** | Collected (Firebase Authentication keeps the Google profile name with the account) · required · **Account management** · **linked** |
  | **Personal info → User IDs** | Collected (the Firebase account ID) · required · **Account management** · **linked** |
  | **App activity → Other user-generated content** | Collected (the grocery text) · required · **App functionality** · **not linked** (items carry no user field) |
  | Used for tracking? | **No** |
  | Encrypted in transit? | **Yes** |
  | Can users request deletion? | **Yes** — items in-app (··· → Delete); account and data by email (`privacy.html#delete`) |
- **Account deletion** — Google requires an in-app path **and** a web link when an
  app lets users create an account; its policy lists single sign-on among account
  methods, and signing in with Google creates a Firebase account, so treat it as in
  scope:
  - **Web link** (Data safety form): `https://grocerylist-virid.vercel.app/privacy.html#delete`
    — the privacy policy's "Deleting your account and data" section (an email request).
  - **In-app path:** the header's **⋮** menu → **Delete account…** opens that page
    (`src/components/AccountMenu.jsx`; **Privacy policy** sits beside it). In the
    Android/iOS apps it opens in the phone's browser — Capacitor hands every URL outside
    the app to the system — and on the web in a new tab.
- **App access** — "**All or some functionality is restricted**": every screen needs
  Google sign-in with an allowlisted email. Give reviewers a way in: create a demo
  Google account, add it to `firestore.rules` and deploy, then enter its email,
  password and the steps ("Sign in with Google") under App access. It will see the
  shared household list.
- **Ads** — **No ads.**
- **Content rating** (IARC questionnaire) — answer honestly (it stores/transmits
  user-generated content, shared/social nature); rates **Everyone**.
- **Target audience** — not directed at children.
- **Category** — Productivity (or Lifestyle). Short (≤80) + full (≤4000) description
  (drafts in [`play-assets/store-listing.md`](./play-assets/store-listing.md)).
  Support email required.
- **Graphics** — app icon **512×512** PNG · feature graphic **1024×500** (both in
  `play-assets/`) · **≥2** phone screenshots (e.g. 1080×1920; still to capture).

---

## Re-uploading a new build

Play rejects a duplicate or lower `versionCode`. Each new upload:
1. Bump **`versionCode`** in `android/app/build.gradle` (`1` → `2` → …). Update
   `versionName` only for a real release (keep it in sync with `package.json`).
   *(`versionCode` is an Android-only integer — it is not a semver version bump.)*
2. `npm run build && npx cap sync android`, then `./gradlew bundleRelease`, and upload.

Testers get the new version as a normal Play update.

---

## Regenerating icons / splash

Launcher icons (incl. Android adaptive) and splash screens are generated from
`resources/icon.png`. If the icon changes:
```bash
node scripts/generate-android-icon-sources.mjs   # derives adaptive + splash sources
npx @capacitor/assets@latest generate --android  # writes android/.../res/*
npx cap sync android
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `error: invalid source release: 21` | Gradle is on JDK 17. Use JDK 21: `export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home` (A1). Android Studio's own JDK is 25 now, so it no longer stands in for 21. |
| Upload rejected: target API too low | `variables.gradle` must have `targetSdkVersion = 36` (and `compileSdkVersion = 36`). |
| Content hidden under the status/nav bar | Edge-to-edge insets come from `@capawesome/capacitor-android-edge-to-edge-support` + `plugins.EdgeToEdge.backgroundColor` (`#FFFFFF`, matching the header/compose bar) in `capacitor.config.ts`. Re-run `npx cap sync android`. |
| Release build is unsigned | `android/keystore.properties` is missing/incorrect (the signing config is skipped when absent). See A4. |
| "Sign-in failed. Please try again." on every Android build | `android/app/google-services.json` was missing at build time, so the plugin kept its placeholder client ID. Do A3, then rebuild. |
| Sign-in works from Android Studio but fails on the copy installed from Play | Play's **app signing** key isn't registered in Firebase. Add its SHA-1 (A5) — no rebuild needed. |
| Signed in, but the list stays empty and nothing saves | That Google account isn't on the `firestore.rules` allowlist, or the rules weren't deployed (Part C). |
| App runs but list is empty / won't sync | `REACT_APP_*` Firebase env vars weren't present at `npm run build`. Rebuild with `.env.local`. |
| A tester can't find the app on Play | Testing builds aren't searchable — send them the join link (Part C). |
| `versionCode` already used | Bump it (see "Re-uploading"). |
| "Play automatic protection requires a minimum SDK version of 24 or higher" | `minSdkVersion` must be ≥ 24 in `android/variables.gradle` (it is since versionCode 3). Rebuild with a new versionCode and upload again. |
| `cap sync` UTF-8 error (path has spaces) | Prefix with `LANG=en_US.UTF-8`. |
