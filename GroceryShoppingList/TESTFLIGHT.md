# 📱 Shipping GrocerySync to TestFlight

This guide gets the app onto your wife's iPhone via **TestFlight**. The project
is already wrapped as a native iOS app with **Capacitor** — the `ios/` folder is
a ready Xcode project. You just need to sign it with your Apple account and
upload it.

**Facts you'll reuse below**

| Thing | Value |
|---|---|
| App Store Connect name | **AppassovGrocerySync** (must be globally unique) |
| Home-screen name | **GrocerySync** (from the Xcode project — can differ from the store name) |
| Bundle ID | **`com.appassov.grocerysync`** |
| Marketing version | **1.1.0** |
| Build number | **2** (increment on every re-upload) |

> The Firebase config is baked into the app at build time (from `.env.local`).
> That's expected and safe — the Firebase **web API key is not a secret**; access
> is controlled by your Firestore rules. The iOS app talks to the same Firebase
> project as the website, so both share one live list.

---

## Part A — One-time Apple setup (only you can do these)

These need your Apple ID / 2FA, so they can't be automated.

- [ ] **1. Active paid Apple Developer Program.** ~$99/yr at
  <https://developer.apple.com/programs/>. An App Store Connect login alone is
  **not** enough — TestFlight requires the paid membership.
- [ ] **2. Accept agreements.** <https://appstoreconnect.apple.com> →
  **Business** / **Agreements** → accept any pending **Program License Agreement**.
- [ ] **3. Sign in to Xcode.** Xcode → **Settings → Accounts → +** → add your
  Apple ID. This gives Xcode your **Team** for signing. Note your **Team ID**
  from <https://developer.apple.com/account> → **Membership** (10 characters).
- [ ] **4. Create the app record.** App Store Connect → **Apps → + → New App**:
  - Platform: **iOS**
  - Name: **AppassovGrocerySync** (App Store names must be globally unique; this
    is the store/dashboard name only — the home-screen label stays "GrocerySync")
  - Primary language: your choice
  - Bundle ID: **`com.appassov.grocerysync`** (if it's not listed, create it at
    <https://developer.apple.com/account/resources/identifiers> first)
  - SKU: any string, e.g. `grocerysync`

---

## Part B — Build & upload (do this in Xcode)

From the project folder (the one with `package.json`):

```bash
npm run build          # produce a fresh web bundle
npx cap sync ios       # copy it into the iOS project
npx cap open ios       # opens ios/App/App.xcworkspace in Xcode
```

In Xcode:

1. Select the **App** target → **Signing & Capabilities**.
2. Check **Automatically manage signing** and pick your **Team**.
   - Confirm **Bundle Identifier** reads `com.appassov.grocerysync`.
3. Set the run destination to **Any iOS Device (arm64)** (top bar — not a
   simulator; you can't archive for a simulator).
4. Menu **Product → Archive**. Wait for the build.
5. When the **Organizer** opens: **Distribute App → App Store Connect →
   Upload** → keep the defaults → **Upload**.
6. Wait ~10–30 min. In App Store Connect → your app → **TestFlight**, the build
   moves from *Processing* to ready.

---

## Part C — Add your wife as a tester (Internal Testing = no review)

1. App Store Connect → **Users and Access → +** → invite your wife's **Apple ID
   email** (role: **Developer** or **Marketing** is fine). She accepts the email
   invite.
2. Your app → **TestFlight → Internal Testing** → open (or create) a group →
   **+** testers → add her.
3. She installs Apple's **TestFlight** app from the App Store, opens the invite,
   and taps **Install**. Done — she's on the same shared list as the website.

> Internal testing needs **no Apple review** and is available as soon as the
> build finishes processing. (External testing — inviting by email without an
> App Store Connect role — is also possible but requires a one-time Beta App
> Review, usually under a day.)

---

## Re-uploading a new build

Apple rejects a duplicate build number. Each time you upload again:

1. Xcode → **App** target → **General** → bump **Build** (`1` → `2` → …).
   Keep **Version** at `1.0.0` unless you're doing a real release.
2. `npm run build && npx cap sync ios`, then Archive → Distribute again.

---

## Smoke-test in the Simulator first (optional, no Apple account needed)

```bash
npm run build && npx cap sync ios && npx cap open ios
```
Pick a notched simulator (e.g. **iPhone 16 Pro**) and press **Run** (▶). Check:
the app icon appears, the teal header clears the status bar (white status-bar
text), and add / check / edit / delete / reset / search all work.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Upload rejected: bundle ID mismatch | Make `com.appassov.grocerysync` match in **all three**: `capacitor.config.ts`, the Xcode target's Bundle Identifier, and the App Store Connect record. |
| Upload rejected: invalid icon / alpha channel | The icon must be an opaque 1024×1024 PNG. Regenerate from `resources/icon.png` (already opaque). |
| "Redundant/duplicate build" | Bump the **Build** number (see above). |
| `pod install` fails with a UTF-8 error | The folder path has spaces; run `LANG=en_US.UTF-8 npx cap sync ios`. |
| Archive is greyed out | Set the destination to **Any iOS Device**, not a simulator. |
| Signing errors | Make sure you're signed into Xcode (Part A step 3) and a Team is selected under Signing & Capabilities. |
