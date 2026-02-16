# GitHub Actions Setup Guide
## Automated APK/AAB Build & Release

---

## 🎯 Overview

This guide sets up automated Android app builds using GitHub Actions. Every time you push a version tag (e.g., `v1.0.1`), the workflow will:

1. Build the Android App Bundle (AAB)
2. Build the Android APK
3. Run tests and type checking
4. Create a GitHub Release with build artifacts
5. Optionally upload to Google Play Console

---

## 📋 Prerequisites

- GitHub repository with Traffic Booster Pro code
- Android signing keystore (`traffic-booster-release.keystore`)
- Google Play Console service account (optional, for auto-upload)

---

## 🔐 Step 1: Add Secrets to GitHub

GitHub Actions uses secrets to securely store sensitive information.

### 1.1 Encode Your Keystore

Convert your keystore to base64:

```bash
# On macOS
base64 -i traffic-booster-release.keystore | tr -d '\n' | pbcopy

# On Linux
base64 -w 0 traffic-booster-release.keystore | xclip -selection clipboard

# On Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("traffic-booster-release.keystore")) | Set-Clipboard
```

### 1.2 Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

| Secret Name | Value |
|------------|-------|
| `KEYSTORE_FILE` | Base64 encoded keystore (from step 1.1) |
| `KEYSTORE_PASSWORD` | `Cdtbp@22` |
| `KEY_ALIAS` | `traffic_booster_key` |
| `KEY_PASSWORD` | `Cdtbp@22` |

**Optional - For auto-upload to Google Play:**

| Secret Name | Value |
|------------|-------|
| `GOOGLE_PLAY_KEY` | Service account JSON key (see below) |

---

## 📱 Step 2: Create Google Play Service Account (Optional)

If you want to automatically upload to Google Play Console:

### 2.1 Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **Service Account**
5. Fill in details:
   - Service account name: `github-actions-traffic-booster`
   - Grant roles: `Editor`
6. Create JSON key and download

### 2.2 Add to GitHub Secrets

1. Copy the JSON key content
2. Go to GitHub repository settings
3. Add secret: `GOOGLE_PLAY_KEY` with JSON content

### 2.3 Grant Play Console Access

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Settings** → **Users and permissions**
3. Click **Invite user**
4. Enter service account email (from JSON key)
5. Grant **Release manager** role

---

## 🚀 Step 3: Trigger Builds

### Option A: Push a Version Tag (Recommended)

```bash
# Increment version in app.config.ts first
# Then create and push a tag

git tag v1.0.1
git push origin v1.0.1
```

This will:
- Build the app
- Run tests
- Create a GitHub Release with artifacts
- Optionally upload to Google Play Console

### Option B: Manual Trigger

1. Go to GitHub repository
2. Click **Actions** tab
3. Select **Build & Release Android App** workflow
4. Click **Run workflow**
5. Enter version number (e.g., `1.0.1`)
6. Click **Run workflow**

---

## 📊 Workflow Details

### Build Process

The workflow performs these steps:

1. **Checkout Code** - Clone repository
2. **Setup Environment** - Node.js, pnpm, Java, Android SDK
3. **Decode Keystore** - Convert base64 keystore to file
4. **Prebuild Android** - Generate Android native code
5. **Build AAB** - Create Android App Bundle for Play Store
6. **Build APK** - Create APK for direct installation
7. **Run Tests** - Execute test suite
8. **Create Release** - Upload artifacts to GitHub Releases
9. **Upload to Play Store** - Optional auto-upload

### Estimated Build Time

- First build: 15-20 minutes
- Subsequent builds: 10-15 minutes

---

## 📥 Accessing Build Artifacts

### From GitHub Releases

1. Go to repository **Releases** tab
2. Find the version release (e.g., v1.0.1)
3. Download artifacts:
   - `app-release.aab` - For Google Play Store
   - `app-release.apk` - For direct installation

### From GitHub Actions

1. Go to **Actions** tab
2. Find the workflow run
3. Click the run
4. Scroll to **Artifacts** section
5. Download files

---

## 🔄 Workflow File Location

The workflow is defined in:
```
.github/workflows/build-release.yml
```

You can edit this file to customize the build process.

---

## 🛠️ Customization

### Change Build Trigger

Edit `.github/workflows/build-release.yml`:

```yaml
on:
  push:
    tags:
      - 'v*'           # Trigger on version tags
  workflow_dispatch:   # Allow manual trigger
```

### Add Slack Notifications

Add to workflow after build step:

```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Build ${{ job.status }}: ${{ github.ref_name }}"
      }
```

### Upload to Multiple Stores

Add steps to upload to Amazon Appstore, Samsung Galaxy Store, etc.

---

## 🐛 Troubleshooting

### Build Fails - "Keystore not found"

**Problem:** Base64 keystore wasn't decoded correctly

**Solution:**
1. Verify keystore secret is set correctly
2. Re-encode keystore: `base64 -w 0 traffic-booster-release.keystore`
3. Update GitHub secret with new value

### Build Fails - "Java version mismatch"

**Problem:** Java version incompatible with Android SDK

**Solution:**
Edit workflow to use Java 11:
```yaml
- uses: actions/setup-java@v3
  with:
    distribution: 'temurin'
    java-version: '11'
```

### Build Fails - "Out of memory"

**Problem:** Gradle runs out of memory during build

**Solution:**
Increase JVM memory in workflow:
```yaml
- run: ./gradlew bundleRelease
  env:
    GRADLE_OPTS: "-Xmx4096m"
```

### Build Succeeds but Upload Fails

**Problem:** Google Play service account doesn't have permissions

**Solution:**
1. Verify service account email is added to Play Console
2. Grant "Release manager" role
3. Check service account JSON key is valid

---

## 📝 Version Management

### Semantic Versioning

Use semantic versioning for releases:

```
v1.0.0  - Major.Minor.Patch
  ↑       Major: Breaking changes
   ↑      Minor: New features
    ↑     Patch: Bug fixes
```

### Updating Version

1. Edit `app.config.ts`:
   ```typescript
   version: "1.0.1"
   ```

2. Commit changes:
   ```bash
   git add app.config.ts
   git commit -m "Bump version to 1.0.1"
   ```

3. Create tag:
   ```bash
   git tag v1.0.1
   git push origin main
   git push origin v1.0.1
   ```

---

## 🔐 Security Best Practices

### Protect Secrets

- ✅ Never commit keystore to Git
- ✅ Use GitHub Secrets for sensitive data
- ✅ Rotate secrets periodically
- ✅ Use service accounts (not personal accounts)
- ✅ Grant minimal required permissions

### Audit Logs

Check GitHub Actions audit logs:
1. Go to **Settings** → **Audit log**
2. Review secret access and workflow runs

### Revoke Access

If keystore is compromised:
1. Create new keystore
2. Update GitHub secrets
3. Create new app on Play Store (if necessary)

---

## 📊 Monitoring Builds

### View Build Status

1. Go to repository **Actions** tab
2. See all workflow runs
3. Click run to see details

### Set Up Notifications

GitHub can notify you of:
- Workflow failures
- Workflow completions
- Pull request checks

Enable in **Settings** → **Notifications**

---

## 🚀 Next Steps

### After First Successful Build

1. Download `app-release.aab` from GitHub Releases
2. Upload to Google Play Console
3. Submit for review
4. Monitor app performance

### For Future Updates

1. Make code changes
2. Update version in `app.config.ts`
3. Commit and push
4. Create version tag
5. GitHub Actions builds automatically
6. Download and upload to Play Store

---

## 📞 Support

### Common Issues

- **Keystore errors:** Check base64 encoding
- **Build timeouts:** Increase timeout in workflow
- **Permission errors:** Verify service account setup

### Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Android Gradle Build Guide](https://developer.android.com/build)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)

---

## ✅ Checklist

Before using GitHub Actions:

- [ ] Keystore file ready
- [ ] GitHub secrets configured
- [ ] Workflow file in `.github/workflows/build-release.yml`
- [ ] Version updated in `app.config.ts`
- [ ] Tests passing locally
- [ ] Git repository up to date
- [ ] Ready to push version tag

---

**Your automated build pipeline is ready! 🎉**

Push a version tag to get started:
```bash
git tag v1.0.0
git push origin v1.0.0
```
