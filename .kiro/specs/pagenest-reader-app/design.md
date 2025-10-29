# Design Document

## Overview

PageNest is architected as a layered React Native application with a clear separation between domain logic, data persistence, services, and UI. The design emphasizes offline-first functionality, performance at scale, and gesture-driven interactions. All data is stored locally using SQLite for structured data and the file system for HTML/assets, with no backend dependencies.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     UI Layer (React)                     │
│  Screens, Components, Gesture Handlers, Animations      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  State Management (Zustand)              │
│     Article Store, UI Store, Settings Store, IAP Store  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                     Service Layer                        │
│  SavePageService, ReadabilityService, DownloadQueue,    │
│  HtmlRewriter, SearchService, ExportService, IapService │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Repository Layer                       │
│  ArticleRepo, AssetRepo, TagRepo, CollectionRepo,       │
│  AnnotationRepo, SearchRepo                             │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│  SQLite (quick-sqlite) + FTS5 | MMKV | File System      │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: React Native 0.75+ with New Architecture
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand with MMKV persistence
- **Database**: react-native-quick-sqlite with FTS5
- **File System**: react-native-fs (RNFS)
- **Networking**: react-native-blob-util for downloads
- **WebView**: react-native-webview
- **Animations**: Reanimated 3 + @shopify/react-native-skia
- **Gestures**: react-native-gesture-handler
- **Haptics**: react-native-haptic-feedback
- **IAP**: react-native-iap (StoreKit 2)
- **HTML Parsing**: cheerio + @mozilla/readability
- **Icons**: react-native-vector-icons

## Components and Interfaces

### Domain Models

#### Article

```typescript
interface Article {
  id: string;
  title: string;
  url: string;
  domain: string;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
  favorite: boolean;
  readProgress: number; // 0-1
  readingTime: number; // minutes
  coverAssetId?: string;
  lang?: string;
  wordCount: number;
  hasAssets: boolean;
}
```

#### ArticleContent

```typescript
interface ArticleContent {
  articleId: string;
  htmlPath: string;
  stylesheetPath?: string;
  meta: ArticleMeta;
}

interface ArticleMeta {
  author?: string;
  excerpt?: string;
  ogImage?: string;
  publishedDate?: string;
}
```

#### Asset

```typescript
interface Asset {
  id: string;
  articleId: string;
  type: 'image' | 'css' | 'font' | 'other';
  srcUrl: string;
  localPath: string;
  byteSize: number;
  mime: string;
  status: 'queued' | 'downloading' | 'done' | 'failed';
  hash: string;
}
```

#### Tag

```typescript
interface Tag {
  id: string;
  name: string;
  color: string;
}
```

#### Collection

```typescript
interface Collection {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
}
```

#### Annotation

```typescript
interface Annotation {
  id: string;
  articleId: string;
  range: TextRange;
  text?: string;
  createdAt: number;
  color: string;
}

interface TextRange {
  startContainer: string;
  startOffset: number;
  endContainer: string;
  endOffset: number;
}
```

### Repository Layer

#### ArticleRepository

```typescript
interface ArticleRepository {
  create(article: Omit<Article, 'id'>): Promise<string>;
  findById(id: string): Promise<Article | null>;
  findAll(filters?: ArticleFilters): Promise<Article[]>;
  update(id: string, updates: Partial<Article>): Promise<void>;
  delete(id: string): Promise<void>;
  updateReadProgress(id: string, progress: number): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
  toggleArchive(id: string): Promise<void>;
}

interface ArticleFilters {
  archived?: boolean;
  favorite?: boolean;
  tags?: string[];
  collections?: string[];
  hasErrors?: boolean;
  minReadProgress?: number;
  maxReadProgress?: number;
}
```

#### SearchRepository

```typescript
interface SearchRepository {
  search(query: string, filters?: ArticleFilters): Promise<SearchResult[]>;
  reindex(): Promise<void>;
  updateArticleIndex(
    articleId: string,
    content: IndexableContent,
  ): Promise<void>;
}

interface SearchResult {
  article: Article;
  highlights: string[];
  score: number;
}

interface IndexableContent {
  title: string;
  plainText: string;
  tags: string[];
  annotations: string[];
}
```

#### AssetRepository

```typescript
interface AssetRepository {
  create(asset: Omit<Asset, 'id'>): Promise<string>;
  findByArticleId(articleId: string): Promise<Asset[]>;
  updateStatus(id: string, status: Asset['status']): Promise<void>;
  deleteByArticleId(articleId: string): Promise<void>;
  findOrphanedAssets(): Promise<Asset[]>;
}
```

### Service Layer

#### SavePageService

```typescript
interface SavePageService {
  saveFromUrl(url: string, options: SaveOptions): Promise<string>;
  saveFromHtml(
    html: string,
    url: string,
    options: SaveOptions,
  ): Promise<string>;
  retryFailedAssets(articleId: string): Promise<void>;
}

interface SaveOptions {
  tags?: string[];
  collections?: string[];
  downloadAssets?: boolean;
  downloadImages?: boolean;
  downloadStyles?: boolean;
  downloadFonts?: boolean;
}
```

**Save Pipeline:**

1. Fetch HTML from URL
2. Parse with Cheerio for normalization
3. Extract content with Readability
4. Identify assets (images, CSS, fonts)
5. Create article record in database
6. Queue assets for download
7. Rewrite HTML with local paths
8. Save HTML to file system
9. Update FTS5 index
10. Return article ID

#### DownloadQueue

```typescript
interface DownloadQueue {
  enqueue(asset: Asset): void;
  start(): void;
  pause(): void;
  getProgress(): QueueProgress;
  onProgress(callback: (progress: QueueProgress) => void): void;
}

interface QueueProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
}
```

**Download Strategy:**

- Maximum 3 concurrent downloads
- Exponential backoff for retries (1s, 2s, 4s)
- Maximum 3 retry attempts per asset
- Timeout: 30 seconds per asset
- Size limit: configurable (default 10MB per asset)
- MIME validation before saving

#### ReadabilityService

```typescript
interface ReadabilityService {
  extract(html: string, url: string): Promise<ReadableContent>;
}

interface ReadableContent {
  title: string;
  byline?: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  siteName?: string;
}
```

#### HtmlRewriter

```typescript
interface HtmlRewriter {
  rewrite(html: string, articleId: string, assets: Asset[]): Promise<string>;
  injectTheme(html: string, theme: Theme): string;
  injectBridge(html: string): string;
}
```

**Rewriting Process:**

1. Parse HTML with Cheerio
2. Replace `<img src>` and `srcset` with local paths
3. Replace `<link rel="stylesheet">` with local paths
4. Replace `@font-face` URLs with local paths
5. Remove all `<script>` tags
6. Remove `<iframe>` tags
7. Add base reader CSS
8. Add theme placeholder `<style id="pn-theme">`
9. Add JavaScript bridge for RN communication
10. Serialize back to HTML string

#### ExportService

```typescript
interface ExportService {
  exportLibrary(options: ExportOptions): Promise<string>;
  importLibrary(zipPath: string, options: ImportOptions): Promise<ImportResult>;
}

interface ExportOptions {
  articleIds?: string[];
  includeAssets: boolean;
  includeArchived: boolean;
}

interface ImportOptions {
  onDuplicate: 'merge' | 'replace' | 'skip';
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}
```

## Data Models

### SQLite Schema

```sql
-- Articles table
CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  archived INTEGER DEFAULT 0,
  favorite INTEGER DEFAULT 0,
  read_progress REAL DEFAULT 0,
  reading_time INTEGER DEFAULT 0,
  cover_asset_id TEXT,
  lang TEXT,
  word_count INTEGER DEFAULT 0,
  has_assets INTEGER DEFAULT 0
);

CREATE INDEX idx_articles_created ON articles(created_at DESC);
CREATE INDEX idx_articles_domain ON articles(domain);
CREATE INDEX idx_articles_archived ON articles(archived);
CREATE INDEX idx_articles_favorite ON articles(favorite);

-- Article content table
CREATE TABLE article_content (
  article_id TEXT PRIMARY KEY,
  html_path TEXT NOT NULL,
  stylesheet_path TEXT,
  meta_json TEXT,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

-- Assets table
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  type TEXT NOT NULL,
  src_url TEXT NOT NULL,
  local_path TEXT NOT NULL,
  byte_size INTEGER DEFAULT 0,
  mime TEXT,
  status TEXT DEFAULT 'queued',
  hash TEXT NOT NULL,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX idx_assets_article ON assets(article_id);
CREATE INDEX idx_assets_status ON assets(status);

-- Tags table
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL
);

-- Article-Tag junction
CREATE TABLE article_tags (
  article_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Collections table
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Article-Collection junction
CREATE TABLE article_collections (
  article_id TEXT NOT NULL,
  collection_id TEXT NOT NULL,
  order_in_collection INTEGER DEFAULT 0,
  PRIMARY KEY (article_id, collection_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

-- Annotations table
CREATE TABLE annotations (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  range_json TEXT NOT NULL,
  text TEXT,
  created_at INTEGER NOT NULL,
  color TEXT NOT NULL,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX idx_annotations_article ON annotations(article_id);

-- Reading sessions table
CREATE TABLE reading_sessions (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  last_position_selector TEXT,
  last_scroll_y REAL DEFAULT 0,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE fts_articles USING fts5(
  article_id UNINDEXED,
  title,
  plain_text,
  tags_cached,
  annotations_cached
);
```

### File System Structure

```
/Documents/PageNest/
├── articles/
│   ├── {article-id-1}/
│   │   ├── index.html
│   │   ├── meta.json
│   │   └── assets/
│   │       ├── {hash1}.jpg
│   │       ├── {hash2}.css
│   │       └── {hash3}.woff2
│   ├── {article-id-2}/
│   │   └── ...
│   └── ...
└── database.db
```

## UI Architecture

### Screen Structure

```
App
├── SplashScreen (Skia animation)
├── OnboardingFlow (first launch only)
│   ├── OnboardingScreen1
│   ├── OnboardingScreen2
│   └── OnboardingScreen3
└── MainNavigator
    ├── HomeScreen (Library)
    │   ├── AppBar
    │   ├── SmartTabs
    │   ├── ArticleList (FlashList)
    │   │   └── ArticleCard (swipeable)
    │   ├── FAB (Speed Dial)
    │   └── PullToSearch
    ├── ReaderScreen
    │   ├── AppBar (auto-hide)
    │   ├── WebView (local HTML)
    │   ├── ReaderToolbar
    │   ├── TOCPanel (slide-over)
    │   └── ProgressIndicator
    ├── AddScreen
    │   ├── URLInput
    │   ├── MiniBrowser (WebView)
    │   └── SaveOptions
    ├── SearchScreen
    │   ├── SearchBar
    │   ├── FilterChips
    │   └── ResultsList
    ├── CollectionsScreen
    │   └── CollectionGrid
    ├── TagsScreen
    │   └── TagCloud
    └── SettingsScreen
        ├── ReaderDefaults
        ├── DownloadSettings
        ├── StorageManagement
        ├── IAPSection
        └── AboutSection
```

### Key Components

#### ArticleCard

- Displays: favicon, domain, title, cover image, tags (max 3), reading time, progress
- Gestures: swipe left/right, long-press
- Animations: swipe reveal, scale on select
- Props: article, onArchive, onFavorite, onSelect, onPress

#### SwipeableCard (Reanimated)

- PanGestureHandler for horizontal swipes
- Animated background with icons
- Threshold detection (25% short, 60% full)
- Spring animations on release
- Haptic feedback on actions

#### ReaderWebView

- Loads local HTML with allowingReadAccessToURL
- Injects theme CSS dynamically
- JavaScript bridge for:
  - Scroll position tracking
  - Text selection handling
  - Font size changes
  - Annotation creation
- Message passing between RN and WebView

#### AnimatedSplash (Skia)

- Scene 1: Logo drop with gravity (Reanimated)
- Scene 2: Particle explosion (Skia Particles)
- Scene 3: Liquid metal morph (Skia shaders)
- Scene 4: Shared element transition to Home
- Haptic feedback at key moments

## State Management

### Zustand Stores

#### ArticleStore

```typescript
interface ArticleStore {
  articles: Article[];
  loading: boolean;
  error: string | null;

  fetchArticles: (filters?: ArticleFilters) => Promise<void>;
  addArticle: (article: Article) => void;
  updateArticle: (id: string, updates: Partial<Article>) => void;
  deleteArticle: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  toggleArchive: (id: string) => Promise<void>;
}
```

#### SearchStore

```typescript
interface SearchStore {
  query: string;
  results: SearchResult[];
  filters: ArticleFilters;
  history: string[];

  setQuery: (query: string) => void;
  search: () => Promise<void>;
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  setFilters: (filters: ArticleFilters) => void;
}
```

#### DownloadStore

```typescript
interface DownloadStore {
  queue: Asset[];
  progress: QueueProgress;

  addToQueue: (assets: Asset[]) => void;
  updateAssetStatus: (id: string, status: Asset['status']) => void;
  retryFailed: (articleId: string) => Promise<void>;
}
```

#### SettingsStore

```typescript
interface SettingsStore {
  readerDefaults: ReaderSettings;
  downloadSettings: DownloadSettings;

  updateReaderDefaults: (settings: Partial<ReaderSettings>) => void;
  updateDownloadSettings: (settings: Partial<DownloadSettings>) => void;
}

interface ReaderSettings {
  theme: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  margins: number;
}

interface DownloadSettings {
  maxConcurrent: number;
  maxAssetSize: number;
  wifiOnly: boolean;
  downloadImages: boolean;
  downloadStyles: boolean;
  downloadFonts: boolean;
}
```

#### IAPStore

```typescript
interface IAPStore {
  isPro: boolean;
  products: Product[];

  loadProducts: () => Promise<void>;
  purchase: (productId: string) => Promise<void>;
  restore: () => Promise<void>;
}
```

### MMKV Storage

Used for lightweight key-value storage:

- Last selected filters
- Search history
- Onboarding completion status
- Last read positions (cache)
- UI preferences (theme, tab selection)

## Animation System

### Gesture Animations (Reanimated)

#### Swipe Gesture

```typescript
const useSwipeGesture = (onSwipeLeft: () => void, onSwipeRight: () => void) => {
  const translateX = useSharedValue(0);
  const gestureHandler = useAnimatedGestureHandler({
    onActive: event => {
      translateX.value = event.translationX;
    },
    onEnd: event => {
      const threshold = SCREEN_WIDTH * 0.6;
      if (Math.abs(event.translationX) > threshold) {
        // Full swipe - trigger action
        runOnJS(event.translationX > 0 ? onSwipeRight : onSwipeLeft)();
        translateX.value = withSpring(
          event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
        );
      } else {
        // Return to center
        translateX.value = withSpring(0);
      }
    },
  });

  return { gestureHandler, translateX };
};
```

#### Pinch to Zoom Font

```typescript
const usePinchFontSize = (initialSize: number) => {
  const scale = useSharedValue(1);
  const fontSize = useDerivedValue(() => initialSize * scale.value);

  const pinchHandler = useAnimatedGestureHandler({
    onActive: event => {
      scale.value = Math.max(0.75, Math.min(1.5, event.scale));
    },
    onEnd: () => {
      // Snap to nearest 0.1
      scale.value = withSpring(Math.round(scale.value * 10) / 10);
    },
  });

  return { pinchHandler, fontSize };
};
```

### Skia Animations

#### Splash Screen Particles

```typescript
interface Particle {
  x: SharedValue<number>;
  y: SharedValue<number>;
  vx: SharedValue<number>;
  vy: SharedValue<number>;
  alpha: SharedValue<number>;
}

const createParticles = (count: number): Particle[] => {
  return Array.from({ length: count }, () => ({
    x: useSharedValue(SCREEN_WIDTH / 2),
    y: useSharedValue(SCREEN_HEIGHT / 2),
    vx: useSharedValue(Math.random() * 10 - 5),
    vy: useSharedValue(Math.random() * 10 - 5),
    alpha: useSharedValue(1),
  }));
};
```

#### Liquid Metal Shader

```glsl
uniform float time;
uniform vec2 resolution;

float metaball(vec2 p, vec2 center, float radius) {
  return radius / length(p - center);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  float sum = 0.0;

  // Multiple metaballs
  for (int i = 0; i < 8; i++) {
    vec2 center = vec2(
      0.5 + 0.3 * sin(time + float(i)),
      0.5 + 0.3 * cos(time + float(i) * 1.3)
    );
    sum += metaball(uv, center, 0.1);
  }

  // Threshold for blob effect
  float alpha = smoothstep(0.9, 1.1, sum);
  gl_FragColor = vec4(0.8, 0.85, 0.9, alpha);
}
```

## Reader Engine

### WebView Bridge

#### JavaScript Injection

```javascript
// Injected into article HTML
window.PageNestBridge = {
  // Send scroll position to React Native
  reportScroll: () => {
    const scrollPercent =
      window.scrollY / (document.body.scrollHeight - window.innerHeight);
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: 'scroll',
        progress: scrollPercent,
        scrollY: window.scrollY,
      }),
    );
  },

  // Handle text selection
  reportSelection: () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: 'selection',
          text: selection.toString(),
          range: {
            startContainer: getNodePath(range.startContainer),
            startOffset: range.startOffset,
            endContainer: getNodePath(range.endContainer),
            endOffset: range.endOffset,
          },
        }),
      );
    }
  },

  // Apply theme
  setTheme: css => {
    const style = document.getElementById('pn-theme');
    if (style) style.textContent = css;
  },

  // Scroll to annotation
  scrollToAnnotation: rangeJson => {
    const range = restoreRange(rangeJson);
    if (range) {
      range.startContainer.parentElement.scrollIntoView({ behavior: 'smooth' });
    }
  },
};

// Auto-report scroll
window.addEventListener(
  'scroll',
  throttle(window.PageNestBridge.reportScroll, 100),
);
```

#### React Native Message Handler

```typescript
const handleWebViewMessage = (event: WebViewMessageEvent) => {
  const message = JSON.parse(event.nativeEvent.data);

  switch (message.type) {
    case 'scroll':
      updateReadProgress(articleId, message.progress);
      break;
    case 'selection':
      showAnnotationMenu(message.text, message.range);
      break;
  }
};
```

### Theme System

#### Theme Definition

```typescript
interface Theme {
  id: string;
  name: string;
  colors: {
    background: string;
    text: string;
    secondary: string;
    accent: string;
    highlight: string;
  };
  fonts: {
    body: string;
    heading: string;
  };
}

const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  colors: {
    background: '#FAFAFA',
    text: '#111111',
    secondary: '#616161',
    accent: '#3A84F7',
    highlight: '#FFF59D',
  },
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "San Francisco"',
    heading: '-apple-system, BlinkMacSystemFont, "San Francisco"',
  },
};
```

#### CSS Generation

```typescript
const generateThemeCSS = (theme: Theme, settings: ReaderSettings): string => {
  return `
    body {
      background-color: ${theme.colors.background};
      color: ${theme.colors.text};
      font-family: ${theme.fonts.body};
      font-size: ${settings.fontSize}pt;
      line-height: ${settings.lineHeight};
      padding: ${settings.margins}pt;
      max-width: 680px;
      margin: 0 auto;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: ${theme.fonts.heading};
      color: ${theme.colors.text};
    }
    
    a {
      color: ${theme.colors.accent};
    }
    
    mark, .highlight {
      background-color: ${theme.colors.highlight};
    }
    
    img {
      max-width: 100%;
      height: auto;
    }
  `;
};
```

## Error Handling

### Error Types

```typescript
enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  ASSET_DOWNLOAD_ERROR = 'ASSET_DOWNLOAD_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  IAP_ERROR = 'IAP_ERROR',
}

interface AppError {
  type: ErrorType;
  message: string;
  recoverable: boolean;
  retryable: boolean;
  context?: Record<string, any>;
}
```

### Error Handling Strategy

#### Network Errors

- Display user-friendly message
- Mark article as incomplete
- Offer retry button
- Queue for background retry when online

#### Parse Errors

- Fall back to saving full HTML
- Mark with warning indicator
- Allow user to view raw content

#### Storage Errors

- Check available space
- Offer cleanup options
- Prevent new saves if space critical

#### Asset Download Errors

- Continue with partial content
- Mark failed assets
- Allow selective retry
- Don't block article reading

#### Database Errors

- Attempt recovery from WAL
- Notify user of corruption
- Offer export before recovery
- Log for debugging

### Retry Logic

```typescript
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
};
```

## Testing Strategy

### Unit Tests

#### Repository Layer

- CRUD operations for all entities
- Query filtering and sorting
- FTS5 search functionality
- Transaction handling
- Error scenarios

#### Service Layer

- SavePageService: HTML parsing, asset extraction, rewriting
- DownloadQueue: concurrency, retries, progress tracking
- ReadabilityService: content extraction accuracy
- HtmlRewriter: URL rewriting, script removal
- ExportService: ZIP creation, import validation

#### Utilities

- URL validation and normalization
- Hash generation
- Date formatting
- Text extraction

### Integration Tests

#### Save Pipeline

- End-to-end article saving
- Asset download and storage
- FTS5 index updates
- Error recovery

#### Search

- Query parsing
- Filter combinations
- Result ranking
- Highlight generation

#### Export/Import

- Full library export
- Selective export
- Import with duplicates
- Version compatibility

### Component Tests

#### ArticleCard

- Render with various states
- Swipe gesture handling
- Long-press activation
- Accessibility labels

#### ReaderWebView

- Local file loading
- Theme injection
- Bridge communication
- Scroll tracking

### Performance Tests

#### Benchmarks

- Article save time (target: <3s)
- Search response time (target: <500ms for 5k articles)
- List scroll performance (target: 60fps)
- Animation frame rate (target: 60fps)
- Memory usage with large libraries

#### Load Tests

- 5000+ articles in database
- 100+ concurrent asset downloads
- Large HTML files (>1MB)
- Many annotations per article

### Accessibility Tests

- VoiceOver navigation
- Dynamic Type scaling
- Color contrast ratios
- Touch target sizes
- Focus management

## Performance Optimizations

### List Rendering

- Use FlashList for virtualization
- Implement item height estimation
- Memoize card components
- Lazy load cover images
- Throttle scroll events

### Database

- Create indexes on frequently queried columns
- Use prepared statements
- Batch inserts for bulk operations
- Implement connection pooling
- Regular VACUUM operations

### Asset Management

- Implement LRU cache for images
- Progressive image loading
- Lazy load off-screen assets
- Compress images on save
- Clean up orphaned files

### Search

- Incremental FTS5 updates
- Query result caching
- Debounce search input
- Limit result count
- Paginate large result sets

### Memory Management

- Release WebView when not visible
- Clear image caches periodically
- Limit concurrent operations
- Use weak references where appropriate
- Monitor memory warnings

### Animation Performance

- Use native driver for Reanimated
- Limit particle count in Skia
- Optimize shader complexity
- Reduce overdraw
- Use transform instead of layout changes

## Security Considerations

### Data Protection

- Store sensitive data in iOS Keychain
- Optional encryption for article content
- Secure file permissions
- No data transmission to external servers

### Content Security

- Remove all JavaScript from saved pages
- Sanitize HTML input
- Validate MIME types
- Limit file sizes
- Sandbox WebView execution

### IAP Security

- Validate receipts with StoreKit
- Store purchase status locally
- Implement receipt refresh
- Handle edge cases (refunds, etc.)

## Localization

### Supported Languages

- English (en)
- Russian (ru)

### Implementation

- Use i18next for string management
- Separate translation files per language
- Format dates/numbers per locale
- Support RTL layouts (future)
- Translate error messages

### Translation Keys Structure

```typescript
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "home": {
    "title": "PageNest",
    "emptyState": "No articles yet"
  },
  "reader": {
    "fontSize": "Font Size",
    "theme": "Theme"
  }
}
```

## Platform-Specific Considerations

### iOS Specifics

#### Share Extension

- Native iOS App Extension
- Minimal UI for quick save
- Background processing limits
- Memory constraints (30MB)
- Execution time limits (30s)

#### File System

- Use DocumentDirectory for user data
- Respect iOS file protection
- Handle app backgrounding
- Implement file coordination
- Support Files app integration

#### WebView

- Use WKWebView
- Configure allowingReadAccessToURL
- Handle file:// URLs
- Implement navigation delegates
- Manage memory warnings

#### Permissions

- No special permissions required
- Optional photo library access (future)
- Files app access for import/export

### iPad Optimizations

#### Layout

- Three-panel split view
- Adaptive navigation
- Keyboard shortcuts
- Pointer interactions
- Drag and drop support

#### Multitasking

- Support Split View
- Support Slide Over
- Handle size class changes
- Optimize for external displays

## Deployment

### Build Configuration

#### Development

- Debug mode enabled
- Source maps included
- Hot reload enabled
- Flipper integration
- Debug menu accessible

#### Production

- Minification enabled
- Source maps uploaded
- Hermes enabled
- ProGuard/R8 (Android future)
- Code signing configured

### App Store Requirements

#### Metadata

- App name: PageNest
- Category: Productivity
- Age rating: 4+
- Privacy policy: No data collection
- Support URL

#### Screenshots

- iPhone (6.5", 5.5")
- iPad Pro (12.9", 11")
- Localized for EN, RU

#### App Review Notes

- Emphasize offline functionality
- Explain Share Extension usage
- Demonstrate IAP features
- Provide test account if needed

### Version Management

#### Semantic Versioning

- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

#### Migration Strategy

- Database schema versioning
- Migration scripts for upgrades
- Backward compatibility checks
- User data backup before migration
