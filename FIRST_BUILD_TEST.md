# First Build Test Guide
## Testing GitHub Actions Automated Build

---

## 📋 Prerequisites

Before testing the first build, ensure:

- ✅ GitHub Actions secrets configured (KEYSTORE_FILE, KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD)
- ✅ Workflow file exists: `.github/workflows/build-release.yml`
- ✅ Git repository up to date
- ✅ Version updated in `app.config.ts` (currently: 1.0.0)

---

## 🚀 Step 1: Prepare for First Build

### Update Version (if needed)

Edit `app.config.ts`:

```typescript
export default config: ExpoConfig = {
  version: "1.0.0",  // ← Ensure this matches your tag
  // ... rest of config
};
```

### Commit Changes

```bash
git add app.config.ts
git commit -m "Prepare v1.0.0 release"
git push origin main
```

---

## 🏷️ Step 2: Create Version Tag

### Create and Push Tag

```bash
# Create tag for version 1.0.0
git tag v1.0.0

# Push tag to GitHub
git push origin v1.0.0
```

This triggers the GitHub Actions workflow automatically!

---

## 📊 Step 3: Monitor the Build

### Watch Workflow in Real-Time

1. **Go to GitHub:**
   - https://github.com/cedyson8-creator/traffic-booster-app

2. **Click "Actions" tab**

3. **You'll see the workflow running:**
   - "Build & Release Android App" workflow
   - Shows progress of each step

4. **Wait for completion:**
   - Checkout code
   - Setup Node.js
   - Setup pnpm
   - Install dependencies
   - Setup Java
   - Setup Android SDK
   - Decode Keystore
   - Prebuild Android
   - Build AAB
   - Build APK
   - Run tests
   - Create Release

**Estimated time:** 15-20 minutes for first build

---

## ✅ Step 4: Verify Build Success

### Check Workflow Status

1. **Go to Actions tab**
2. **Find the workflow run** (should show ✅ green checkmark)
3. **Click on the run** to see details
4. **Scroll to bottom** to see artifacts

### Expected Output

```
✅ Checkout code
✅ Setup Node.js
✅ Setup pnpm
✅ Install dependencies
✅ Setup Java
✅ Setup Android SDK
✅ Decode Keystore
✅ Prebuild Android
✅ Build Android App Bundle (AAB)
✅ Build Android APK
✅ Run tests
✅ Create Release
```

---

## 📥 Step 5: Download Build Artifacts

### From GitHub Releases

1. **Go to Releases tab:**
   - https://github.com/cedyson8-creator/traffic-booster-app/releases

2. **Find v1.0.0 release**

3. **Download artifacts:**
   - `app-release.aab` ← For Google Play Store
   - `app-release.apk` ← For direct installation

### From GitHub Actions

1. **Go to Actions tab**
2. **Click on the workflow run**
3. **Scroll to "Artifacts" section**
4. **Download files**

---

## 🧪 Step 6: Test the APK (Optional)

### Install on Android Device

1. **Download `app-release.apk`**

2. **Transfer to Android device:**
   ```bash
   adb push app-release.apk /sdcard/Download/
   ```

3. **Install on device:**
   ```bash
   adb install app-release.apk
   ```

4. **Or manually:**
   - Copy APK to device
   - Open file manager
   - Tap APK to install
   - Grant permissions

5. **Test the app:**
   - Open app
   - Sign in
   - Connect Google Analytics
   - Verify dashboard loads

---

## 🔍 Troubleshooting First Build

### Build Fails - Keystore Error

**Error:** "Keystore not found" or "Invalid keystore"

**Solution:**
1. Verify KEYSTORE_FILE secret is set correctly
2. Check base64 encoding is correct
3. Verify KEYSTORE_PASSWORD is exactly: `Cdtbp@22`
4. Verify KEY_ALIAS is exactly: `traffic_booster_key`
5. Update secrets and retry

### Build Fails - Java Error

**Error:** "Java version mismatch" or "Java not found"

**Solution:**
1. Workflow uses Java 11 (correct for Android)
2. Check workflow logs for specific error
3. Try manual trigger from Actions tab
4. Contact support if persists

### Build Fails - Out of Memory

**Error:** "Out of memory" or "Gradle heap space"

**Solution:**
1. Increase JVM memory in workflow
2. Edit `.github/workflows/build-release.yml`
3. Change `GRADLE_OPTS` to `-Xmx4096m`
4. Retry build

### Build Succeeds but No Artifacts

**Problem:** Workflow shows ✅ but no APK/AAB files

**Solution:**
1. Check build output logs
2. Verify build directory: `android/app/build/outputs/`
3. Check file permissions
4. Try manual rebuild

### Can't Download Artifacts

**Problem:** Download button not showing

**Solution:**
1. Wait for workflow to complete
2. Refresh Actions page
3. Try downloading from Releases tab instead
4. Check GitHub storage quota

---

## 📋 Build Verification Checklist

After first successful build:

- [ ] Workflow shows ✅ green checkmark
- [ ] All build steps completed
- [ ] Tests passed
- [ ] Release created on GitHub
- [ ] app-release.aab available for download
- [ ] app-release.apk available for download
- [ ] File sizes reasonable (AAB ~50-100MB, APK ~80-150MB)
- [ ] Can extract and inspect APK contents
- [ ] APK installs on test device
- [ ] App runs without crashes

---

## 🎯 Next Steps After Successful Build

### 1. Upload to Google Play Store

1. **Go to Google Play Console:**
   - https://play.google.com/console

2. **Select your app**

3. **Go to Release → Production**

4. **Create new release**

5. **Upload `app-release.aab`**

6. **Review and submit**

### 2. Test on Real Device

1. **Install APK on Android device**
2. **Test all features:**
   - Sign in
   - Connect Google Analytics
   - View dashboards
   - Check notifications
   - Test export
3. **Report any issues**

### 3. Monitor Deployment

1. **Check Google Play Console**
2. **Wait for review (24-48 hours)**
3. **Monitor app performance**
4. **Respond to user reviews**

---

## 🔄 Future Builds

For future releases:

1. **Update version in `app.config.ts`:**
   ```typescript
   version: "1.0.1"
   ```

2. **Commit changes:**
   ```bash
   git add app.config.ts
   git commit -m "Bump version to 1.0.1"
   git push origin main
   ```

3. **Create tag:**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

4. **GitHub Actions builds automatically**

5. **Download and upload to Play Store**

---

## 📞 Support

### If Build Fails

1. **Check workflow logs** for specific error
2. **Review troubleshooting section** above
3. **Check GitHub Actions documentation**
4. **Email:** trafficboostercd@gmail.com

### Common Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Android Gradle Build](https://developer.android.com/build)
- [Expo Build Documentation](https://docs.expo.dev/build/)

---

## ✨ Success!

Once your first build completes successfully:

✅ Automated build pipeline is working
✅ APK/AAB ready for Google Play Store
✅ Future releases will be automatic
✅ You can focus on app development

**Congratulations! Your CI/CD pipeline is live! 🎉**

---

## 📊 Build Statistics

**First Build Time:** 15-20 minutes
**Subsequent Builds:** 10-15 minutes
**Build Frequency:** On every version tag push
**Artifact Storage:** GitHub Releases (unlimited)
**Cost:** Free (GitHub Actions free tier)

---

**Ready to test? Push your first tag!**

```bash
git tag v1.0.0
git push origin v1.0.0
```

Then monitor at: https://github.com/cedyson8-creator/traffic-booster-app/actions
