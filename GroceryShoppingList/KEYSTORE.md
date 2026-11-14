# 🔑 Creating the GrocerySync upload keystore (Android)

Step-by-step guide to generating the **upload key** used to sign the Android
`.aab` for Google Play. You do this **once** and reuse it for every update.

## What this is (and where it comes from)
The upload key lives in a **keystore** — a single encrypted `.jks`/`.p12` file
you create locally. You sign every `.aab` with it; Google verifies it's you, then
re-signs the app with the **app signing key** that Google holds (Play App Signing).

- You **don't download it** — you **generate it** with `keytool` (ships with the
  JDK / Android Studio; already on this machine at `/usr/bin/keytool`).
- You **own it and must back it up**. If lost, Play can reset the upload key, but
  don't rely on that.
- It is **not** the same as Google's app signing key (you never see that one).

---

## Step 1 — Pick a safe home for it (outside the repo)
In **Terminal**:
```bash
mkdir -p ~/keys
```

## Step 2 — Generate the keystore
Run this in **your own Terminal app** (it prompts for passwords with hidden input):
```bash
keytool -genkeypair -v \
  -keystore ~/keys/grocerysync-upload.jks \
  -alias upload \
  -keyalg RSA -keysize 2048 -validity 10000
```
`-validity 10000` ≈ 27 years (must outlive the app). `-alias upload` names the key.

You'll be asked a series of questions — what each means:

| Prompt | What to enter |
|---|---|
| `Enter keystore password:` | **Choose a strong password**, type it (nothing shows), remember it. |
| `Re-enter new password:` | Same password again. |
| `What is your first and last name?` | Your name, e.g. `Oleg Appassov` (or `GrocerySync`). Not important. |
| `...organizational unit?` | Press Enter to skip, or type anything. |
| `...organization?` | Your name or `Appassov`. |
| `...City or Locality?` | Your city. |
| `...State or Province?` | Your state/province. |
| `...two-letter country code?` | e.g. `US`. |
| `Is CN=... correct? [no]:` | Type **`yes`** and press Enter. |
| `Enter key password for <upload>` (if asked) | Press **Enter** to reuse the keystore password. |

> **Important:** modern `keytool` creates a **PKCS12** keystore (even with a `.jks`
> name), where the **key password must equal the keystore password**. Use one
> password for both — it keeps Step 4 simple.

## Step 3 — Verify it, then back it up
Confirm the key exists:
```bash
keytool -list -v -keystore ~/keys/grocerysync-upload.jks -alias upload
```
Then **back up two things** (a password manager is ideal):
1. the file `~/keys/grocerysync-upload.jks`
2. the password you chose

⚠️ Lose either and you can't ship updates under the same upload key without a Play reset.

## Step 4 — Wire it into the project
```bash
cd "/Users/olegappassov/Documents/Claude Experiments/Grocery Shopping List/GroceryShoppingList"
cp android/keystore.properties.example android/keystore.properties
```
Edit `android/keystore.properties` (this file is **gitignored** — never committed):
```properties
storeFile=/Users/olegappassov/keys/grocerysync-upload.jks
storePassword=YOUR_PASSWORD
keyAlias=upload
keyPassword=YOUR_PASSWORD
```
- `storePassword` and `keyPassword` are the **same** value (PKCS12, from Step 2).
- Use the **absolute path** for `storeFile`.

## Step 5 — Build the signed bundle
```bash
npm run build && LANG=en_US.UTF-8 npx cap sync android
cd android && export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
./gradlew bundleRelease
```
→ signed bundle at `android/app/build/outputs/bundle/release/app-release.aab` — upload this to Play.

> `export JAVA_HOME=...` is needed because builds require **JDK 21** — Homebrew's `openjdk@21` (`brew install
> openjdk@21` if missing). Android Studio's bundled JDK is now 25 and this Mac's default `java` is 17, so neither
> stands in for it (see [`PLAYSTORE.md`](./PLAYSTORE.md) A1).

---

## Play App Signing (nothing to configure)
You don't pre-register anything. When you upload your first signed `.aab` to a
release track, Play auto-enrolls you: your key becomes the **upload key**, Google
generates and holds the **app signing key**.

## If you ever lose the upload key
Play Console → **Test and release → Setup → App integrity → App signing** →
request an **upload key reset**. Google keeps the app signing key, so your app and
its existing installs are safe; you just register a new upload certificate.

## Troubleshooting
| Symptom | Fix |
|---|---|
| `keystore password was incorrect` on build | `storePassword`/`keyPassword` in `keystore.properties` don't match Step 2. |
| `Cannot recover key` | Key password ≠ store password. For PKCS12 they must be equal — set both the same. |
| Release build is unsigned | `android/keystore.properties` missing or `storeFile` path wrong (use absolute path). |
| `keytool: command not found` | Use the JDK 21's own: `/opt/homebrew/opt/openjdk@21/bin/keytool` (any JDK's `keytool` works for this step). |

See **[`PLAYSTORE.md`](./PLAYSTORE.md)** for the full Play Store submission flow.
