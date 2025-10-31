# Fix "Readonly Database" Error

## Problem
Error: `attempt to write a readonly database`

This happens when the SQLite database was created in a location that doesn't have write permissions (like the app bundle directory).

## Solution

### Step 1: Delete the App Completely
**For iOS Simulator:**
```bash
# Long press the app icon and delete it
# OR use this command:
xcrun simctl uninstall booted com.yourapp.bundleid
```

**For iOS Device:**
- Long press the app icon
- Tap the X to delete
- Confirm deletion

### Step 2: Clean Build Artifacts
```bash
# Clean React Native cache
npx react-native start --reset-cache

# Clean iOS build
cd ios
rm -rf build
rm -rf Pods
rm Podfile.lock
pod install
cd ..
```

### Step 3: Rebuild and Install
```bash
# For iOS
npx react-native run-ios

# For Android
npx react-native run-android
```

## What Changed in the Code

The database initialization now:

1. **Uses proper location:**
```typescript
open({
  name: 'pagenest.db',
  location: 'default' // Documents directory (writable)
})
```

2. **Has fallback for iOS:**
```typescript
// If default fails, try Library directory
if (Platform.OS === 'ios') {
  open({
    name: 'pagenest.db',
    location: 'Library'
  })
}
```

3. **Tests writability:**
```typescript
db.execute('PRAGMA journal_mode = WAL;');
// WAL mode requires write access
```

4. **Better logging:**
- "Database is writable" = Success ✅
- "Database might be readonly" = Problem ❌

## After Reinstalling

When you run the app again, check the console logs:

**Success looks like:**
```
Database opened successfully at default location
Database is writable (WAL mode enabled)
Foreign keys enabled
Tables created
Indexes created
FTS table created
✅ Database initialized successfully
```

**If still failing:**
```
Failed to open database: [error]
Trying Library directory for iOS...
Database opened in Library directory
```

## Why This Happens

React Native SQLite libraries sometimes default to:
- **iOS:** App bundle (readonly) ❌
- **Should use:** Documents or Library directory (writable) ✅

The code now explicitly requests a writable location.

## Verify It's Fixed

After reinstalling, try to save an article. You should see:
```
Saving article from URL: https://...
Created article: article_1234567890_abc
Found 5 images to download
Downloading image 1/5: https://...
Saved image: image_0.jpg
...
Article saved successfully: article_1234567890_abc
```

No database errors! 🎉
