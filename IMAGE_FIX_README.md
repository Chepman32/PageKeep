# Image Display Fix for Saved Pages

## Problem

Images in saved pages were not displaying, showing placeholder icons instead of the actual images.

## Root Cause

The issue had multiple contributing factors:

1. **Mixed Content Security**: The WebView loads HTML from `file://` protocol, but images were still using `https://` URLs. Modern WebViews block mixed content for security.

2. **URL Mapping**: The HTML was being saved with remote URLs instead of local file paths, even though images were being downloaded.

3. **Timing Issue**: Images were downloaded asynchronously, but the HTML wasn't updated to reference the local files after download completed.

## Solution Implemented

### 1. Immediate URL Mapping

Modified `SavePageService.ts` to map image URLs to local paths immediately when saving:

- Images are now referenced as `./assets/{hash}.{ext}` in the HTML from the start
- This allows the WebView to load them from the local filesystem

### 2. Background Download

Images are downloaded in the background to the pre-mapped local paths:

- Download queue processes images concurrently
- Failed downloads are retried with exponential backoff
- Status is tracked in the database

### 3. Automatic HTML Update (Fallback)

After downloads complete, the HTML is updated to ensure all URLs are mapped:

- `DownloadQueue` triggers `updateHtmlWithLocalAssets()` after processing
- This catches any URLs that weren't mapped initially
- Uses safe string replacement (split/join) to avoid regex issues

### 4. Manual Fix for Existing Pages

Added a "Fix Images in Saved Pages" button in Settings:

- Scans all articles with assets
- Updates their HTML to use local paths
- Useful for fixing pages saved before this update

## Files Modified

1. **src/services/SavePageService.ts**

   - Changed to pass assets array to HtmlRewriter (line ~130)
   - Added `updateHtmlWithLocalAssets()` method
   - Added `fixAllSavedPagesImages()` method for batch fixing

2. **src/services/HtmlRewriter.ts**

   - Fixed regex escaping bug in URL replacement
   - Now properly maps asset URLs to local paths

3. **src/services/DownloadQueue.ts**

   - Added automatic HTML update after downloads complete
   - Tracks which articles had downloads

4. **src/data/repositories/ArticleRepository.ts**

   - Added `findArticlesWithAssets()` method

5. **src/ui/screens/SettingsScreen.tsx**

   - Added "Fix Images in Saved Pages" button
   - Calls `fixAllSavedPagesImages()` when clicked

6. **src/utils/debugAssets.ts** (new)
   - Debug utility to inspect asset status
   - Helps troubleshoot image issues

## How to Use

### For New Pages

Just save pages normally - images will now work automatically:

1. Images are mapped to local paths immediately
2. They download in the background
3. They appear as soon as downloads complete

### For Existing Pages with Broken Images

1. Open Settings
2. Scroll to "Maintenance" section
3. Tap "Fix Images in Saved Pages"
4. Wait for the process to complete
5. Reopen your saved pages - images should now display

## Debugging

If images still don't show, you can debug by:

1. Import the debug utility:

```typescript
import { debugArticleAssets } from '../utils/debugAssets';
```

2. Call it with an article ID:

```typescript
await debugArticleAssets('article_123456_abc');
```

This will show:

- Whether assets exist in the database
- Their download status
- Whether local files exist
- File sizes
- How many remote vs local URLs are in the HTML

## Technical Details

### File Structure

```
/Documents/PageNest/articles/{articleId}/
  ├── index.html          # Article HTML with local asset references
  ├── meta.json           # Article metadata
  └── assets/
      ├── {hash1}.jpg     # Downloaded images
      ├── {hash2}.png
      └── ...
```

### Asset Path Format

- Remote URL: `https://example.com/image.jpg`
- Local path: `./assets/{SHA1_hash}.jpg`
- The hash ensures unique filenames and prevents collisions

### WebView Configuration

The WebView is configured to allow local file access:

```typescript
<WebView
  source={{ uri: `file://${htmlPath}` }}
  allowingReadAccessToURL={`file://${articleDirectory}`}
  allowFileAccess={true}
  allowUniversalAccessFromFileURLs={true}
/>
```

This allows the HTML to load images from the `./assets/` subdirectory.

## Known Limitations

1. **Initial Display**: Images may not show immediately on first save if downloads are slow. They'll appear as downloads complete.

2. **Large Images**: Images larger than 10MB are skipped (configurable in DownloadQueue).

3. **Failed Downloads**: If an image fails to download after 3 retries, it won't display. You can retry failed assets using the retry method.

4. **Network Requirement**: Images need to be downloaded at least once. Offline-first viewing only works after successful download.

## Future Improvements

1. **Progressive Loading**: Show low-res placeholders while downloading
2. **Lazy Loading**: Only download images when article is opened
3. **Compression**: Optimize image sizes for storage
4. **CDN Fallback**: Try alternative CDN URLs if primary fails
5. **Better Readability**: Integrate actual Mozilla Readability library for better content extraction
