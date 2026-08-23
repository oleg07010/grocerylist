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
| versionCode | **1** (integer — **must increase by 1 on every upload**) |
| Target / compile API | **36 (Android 16)** — required for new Play submissions |
| Build JDK | **21** (Capacitor 7.6 requires it; Android Studio bundles it) |
| Signed bundle output | `android/app/build/outputs/bundle/release/app-release.aab` |

> **Firebase is baked into the web bundle at build time** from `REACT_APP_*` env
> vars (`.env.local`), exactly like the web/iOS builds. There is **no**
> `google-services.json` — GrocerySync uses the Firebase **web** SDK inside the
> WebView, so the app talks to the same Firestore as the website and iOS app.
> ⚠️ **If those env vars are missing when you run `npm run build`, the app ships
> with an empty Firebase config and silently won't sync.** Build on a machine
> that has `.env.local` (or the vars exported).

---

## Part A — One-time setup

### A1. Prerequisites (local machine)
- **Android Studio** installed (bundles the Android SDK + a **JDK 21** JBR).
- **Android SDK Platform 36** installed (Android Studio → *Settings → Languages &
  Frameworks → Android SDK → SDK Platforms → Android 16 / API 36*).
- Command-line builds must run on **JDK 21**. If your shell `java -version` is not
  21, point Gradle at Android Studio's bundled JDK for the build commands:
  ```bash
  export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  ```
  (Building from *inside* Android Studio uses its JDK 21 automatically.)

### A2. Create the app in Play Console
Google Play Console → **Create app**:
- App name: **GrocerySync**
- Package name: **`com.appassov.grocerysync`** — ⚠️ **permanent**, and must match
  `applicationId` in `android/app/build.gradle` and `appId` in `capacitor.config.ts`.
- App or game: **App** · Free or paid: **Free** (⚠️ a free app can't become paid later)

### A3. Generate your upload keystore (once)
```bash
keytool -genkey -v -keystore grocerysync-upload.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```
It prompts for a **keystore password**, a **key password**, and name fields.
**Back up the `.jks` file and both passwords somewhere safe** — you sign every
future update with it.

Then create `android/keystore.properties` from the template and fill it in:
```bash
cp android/keystore.properties.example android/keystore.properties
# edit android/keystore.properties: storeFile (absolute path), passwords, alias
```
`keystore.properties` and `*.jks` are gitignored — never commit them.

### A4. Play App Signing
New apps auto-enroll in **Play App Signing**: you hold the **upload key** (above);
Google holds and manages the actual **app signing key**. If you ever lose the
upload key, you can reset it in Play Console without losing the app.

---

## Part B — Build the signed bundle (repeatable)

From the project folder (the one with `package.json`):
```bash
npm run build                    # web bundle (needs REACT_APP_* env vars!)
npx cap sync android             # copy web bundle + config into android/
cd android
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"  # if needed
./gradlew bundleRelease          # signed .aab (uses keystore.properties)
```
Output: **`android/app/build/outputs/bundle/release/app-release.aab`** — upload this.

> Prefer Android Studio? `npx cap open android`, then **Build → Generate Signed
> App Bundle** (or just **Build → Build Bundle(s)** once `keystore.properties` is
> set), and grab the same `.aab`.

---

## Part C — Testing tracks & the production gate

⚠️ **Personal developer accounts created after 13 Nov 2023 must complete closed
testing before they can publish to production**: at least **12 testers opted in
for 14 continuous days** on a **Closed** track. Internal testing does **not**
count. Plan for ~2+ weeks, and line up 12 real testers (real Google accounts)
early — this, not the code, is the long pole.

Recommended sequence:
1. **Internal testing** (instant): upload the `.aab`, add yourself + spouse, smoke-test
   the real signed build on a device. *Does not count toward the 12/14 gate.*
2. **Closed testing**: create a closed track, add **≥12 testers**, have them opt in
   and install, and keep them opted in for **14 continuous days**.
3. **Apply for production access** (unlocks after the 14-day window) → get granted →
   create the **Production** release.

---

## Part D — Store listing & required declarations (App content)

All required before a release can be reviewed:

- **Privacy policy URL** — host `public/privacy.html` on your live site and enter
  `https://<your-domain>/privacy.html` (must stay live indefinitely; use a stable
  production domain, not a rotating preview URL).
- **Data safety** form — answers that match this app:
  | Question | Answer |
  |---|---|
  | Does the app collect/share user data? | **Yes** (collect only) |
  | Data type | **App activity → Other user-generated content** (the grocery text) |
  | Collected? | **Yes** · Shared? **No** (Firebase is a service provider, not a third party) |
  | Purpose | **App functionality** only |
  | Linked to the user's identity? | **No** (no accounts/identifiers) |
  | Used for tracking? | **No** |
  | Encrypted in transit? | **Yes** |
  | Can users request deletion? | **Yes** (in-app item delete + contact email) |
- **App access** — "All functionality is available without special access" (no login).
- **Ads** — **No ads.**
- **Content rating** (IARC questionnaire) — answer honestly (it stores/transmits
  user-generated content, shared/social nature); rates **Everyone**.
- **Target audience** — not directed at children.
- **Category** — Productivity (or Lifestyle). Short (≤80) + full (≤4000) description.
  Support email required.
- **Graphics** — app icon **512×512** PNG · feature graphic **1024×500** · **≥2**
  phone screenshots (e.g. 1080×1920).

---

## Re-uploading a new build

Play rejects a duplicate or lower `versionCode`. Each new upload:
1. Bump **`versionCode`** in `android/app/build.gradle` (`1` → `2` → …). Update
   `versionName` only for a real release (keep it in sync with `package.json`).
   *(`versionCode` is an Android-only integer — it is not a semver version bump.)*
2. `npm run build && npx cap sync android`, then `./gradlew bundleRelease`, and upload.

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
| `error: invalid source release: 21` | Gradle is on JDK 17. Use JDK 21 (`export JAVA_HOME=".../Android Studio.app/Contents/jbr/Contents/Home"`) or build from Android Studio. |
| Upload rejected: target API too low | `variables.gradle` must have `targetSdkVersion = 36` (and `compileSdkVersion = 36`). |
| Content hidden under the status/nav bar | Edge-to-edge insets come from `@capawesome/capacitor-android-edge-to-edge-support` + `plugins.EdgeToEdge.backgroundColor` (`#FFFFFF`, matching the header/compose bar) in `capacitor.config.ts`. Re-run `npx cap sync android`. |
| Release build is unsigned | `android/keystore.properties` is missing/incorrect (the signing config is skipped when absent). See A3. |
| App runs but list is empty / won't sync | `REACT_APP_*` Firebase env vars weren't present at `npm run build`. Rebuild with `.env.local`. |
| `versionCode` already used | Bump it (see "Re-uploading"). |
| `cap sync` UTF-8 error (path has spaces) | Prefix with `LANG=en_US.UTF-8`. |
