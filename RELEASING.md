# Releasing & Auto-Update — Setup Guide

The app has a built-in auto-updater. On launch it checks a GitHub Release for a
newer signed version and offers a one-click "Install & Restart". This document
covers the **one-time setup** and the **per-release** process.

---

## One-time setup (do this once)

### 1. Create the GitHub repository
Create a repo named **`subscription-tracker`** under your GitHub account/org,
then point this project at it:

```bash
git remote add origin https://github.com/<YOUR_USERNAME>/subscription-tracker.git
git push -u origin main
```

### 2. Replace the `OWNER` placeholder
In **`src-tauri/tauri.conf.json`**, update the updater endpoint — change `OWNER`
to your GitHub username/org:

```
"endpoints": [
  "https://github.com/<YOUR_USERNAME>/subscription-tracker/releases/latest/download/latest.json"
]
```

### 3. Add the signing key to GitHub Secrets
The update signing keypair was generated at:
- Private key: `C:\Users\MichaelMenozzi\.tauri\subtracker-updater.key`
- Public key:  already embedded in `tauri.conf.json` (`pubkey`)

In the GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**, add:

| Secret name | Value |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | The **entire contents** of `subtracker-updater.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Empty (the key was generated without a password) |

> ⚠️ **Back up the private key somewhere safe (e.g. a password manager).** If you
> lose it, existing installs can never auto-update again — users would have to
> reinstall manually.

### 4. (Optional but recommended for client distribution) Windows code-signing cert
Without an OS-level code-signing certificate, Windows SmartScreen shows an
"unknown publisher" warning on first install. This is **separate** from the
update signature above.
- For **internal MITS use**, you can skip this.
- For **client distribution**, buy an OV or EV code-signing certificate
  (~$200–400/yr from DigiCert, Sectigo, etc.), then add the cert + the
  `windows.signCommand` / certificate config to `tauri.conf.json` and the
  workflow. Ping me when you have the cert and I'll wire it in.

---

## Cutting a release (every time)

1. Bump the version in **`src-tauri/tauri.conf.json`** (`"version"`) — e.g. `0.1.1`.
2. Commit, then create and push a matching tag:
   ```bash
   git commit -am "Release v0.1.1"
   git tag v0.1.1
   git push && git push --tags
   ```
3. The **`.github/workflows/release.yml`** action runs automatically: it builds,
   signs, generates `latest.json`, and creates a **draft** GitHub Release.
4. Go to the repo's **Releases**, review the draft, and click **Publish**.
5. Done. Open apps will detect the update on next launch and offer to install it.

> The release is created as a **draft** so you can review before it goes live.
> If you'd rather publish automatically, set `releaseDraft: false` in the workflow.

---

## How it works (reference)

- **`createUpdaterArtifacts: true`** (in `tauri.conf.json`) tells Tauri to emit
  the signed update bundle + signature during the build.
- **`tauri-action`** uploads those plus a generated `latest.json` manifest to the
  GitHub Release.
- The app's updater plugin fetches `latest.json` from the `releases/latest`
  endpoint, verifies the signature against the embedded `pubkey`, downloads, and
  installs.
