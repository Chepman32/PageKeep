# Implementation Plan

- [ ] 1. Project setup and dependencies

  - Initialize React Native 0.75+ project with TypeScript
  - Configure New Architecture
  - Install and configure core dependencies: Zustand, react-native-quick-sqlite, MMKV, RNFS, react-native-webview, Reanimated 3, Skia, gesture-handler, haptic-feedback, react-native-iap
  - Set up project structure with domain, data, services, and UI layers
  - Configure TypeScript strict mode and ESLint
  - _Requirements: 1.5, 2.1, 3.1, 4.1_

- [x] 2. Database schema and repository layer

  - [x] 2.1 Create SQLite database initialization

    - Write SQL schema for all tables (articles, article_content, assets, tags, article_tags, collections, article_collections, annotations, reading_sessions)
    - Create indexes for performance
    - Implement FTS5 virtual table for full-text search
    - Write database migration system
    - _Requirements: 1.5, 6.5_

  - [x] 2.2 Implement repository interfaces and implementations
    - Create ArticleRepository with CRUD operations
    - Create AssetRepository for asset management
    - Create TagRepository and CollectionRepository
    - Create AnnotationRepository
    - Create SearchRepository with FTS5 integration
    - _Requirements: 1.5, 3.6, 6.1, 7.1, 7.2, 7.3, 7.4, 9.2_

- [x] 3. File system and storage layer

  - [x] 3.1 Implement file system utilities

    - Create directory structure management (/Documents/PageNest/articles/)
    - Implement file path generation with article IDs
    - Create asset storage with hash-based filenames
    - Implement file cleanup for orphaned assets
    - _Requirements: 1.5, 3.4, 13.4_

  - [ ] 3.2 Set up MMKV for key-value storage
    - Configure MMKV instance
    - Create utilities for storing UI preferences, search history, and cache
    - _Requirements: 6.2_

- [ ] 4. Content extraction and parsing services

  - [x] 4.1 Implement ReadabilityService

    - Integrate @mozilla/readability library
    - Create content extraction wrapper
    - Extract title, byline, content, text content, excerpt
    - Handle edge cases (pages without article tags)
    - _Requirements: 2.2, 2.4_

  - [x] 4.2 Implement HtmlRewriter service

    - Parse HTML with Cheerio
    - Remove script tags, iframes, and tracking elements
    - Rewrite image src and srcset to local paths
    - Rewrite CSS link hrefs to local paths
    - Rewrite font-face URLs to local paths
    - Inject theme placeholder and JavaScript bridge
    - _Requirements: 2.1, 2.3, 4.2, 14.3_

  - [x] 4.3 Create asset extraction logic
    - Extract image URLs from img tags and srcset attributes
    - Extract CSS URLs from link tags
    - Extract font URLs from @font-face rules
    - Generate asset metadata (type, source URL)
    - _Requirements: 1.4, 3.1_

- [ ] 5. Download queue and asset management

  - [x] 5.1 Implement DownloadQueue service

    - Create queue data structure with priority
    - Implement concurrent download limiter (max 3)
    - Add exponential backoff retry logic
    - Implement progress tracking and callbacks
    - Handle download timeouts (30s per asset)
    - _Requirements: 3.2, 3.5_

  - [x] 5.2 Implement asset download and validation
    - Download assets using react-native-blob-util
    - Validate MIME types
    - Validate file sizes against limits
    - Generate SHA1 hashes for filenames
    - Save to article assets directory
    - Update asset status in database
    - _Requirements: 3.3, 3.4, 3.5_

- [ ] 6. SavePageService implementation

  - [x] 6.1 Create main save pipeline

    - Implement saveFromUrl method
    - Fetch HTML from URL
    - Call ReadabilityService for content extraction
    - Extract assets and add to queue
    - Create article record in database
    - Rewrite HTML with local paths
    - Save HTML to file system
    - Update FTS5 index
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 6.2 Implement error handling and recovery
    - Handle network errors with retry options
    - Mark incomplete articles
    - Handle partial asset failures
    - Implement retryFailedAssets method
    - _Requirements: 3.5, 21.1, 21.2_

- [ ] 7. State management with Zustand

  - [x] 7.1 Create ArticleStore

    - Implement article state management
    - Create actions: fetchArticles, addArticle, updateArticle, deleteArticle
    - Implement toggleFavorite and toggleArchive
    - Add loading and error states
    - _Requirements: 1.5, 8.2_

  - [x] 7.2 Create SearchStore

    - Implement search query and results state
    - Create search action with FTS5 integration
    - Manage search history in MMKV
    - Implement filter state management
    - _Requirements: 6.1, 6.2, 18.1, 18.2, 18.3, 18.4_

  - [x] 7.3 Create DownloadStore

    - Manage download queue state
    - Track progress for UI updates
    - Implement asset status updates
    - _Requirements: 3.2_

  - [x] 7.4 Create SettingsStore

    - Manage reader defaults (theme, font, size, line height, margins)
    - Manage download settings (concurrent limit, size limit, Wi-Fi only)
    - Persist settings to MMKV
    - _Requirements: 5.2, 5.3, 5.4, 22.2, 22.3, 22.4_

  - [x] 7.5 Create IAPStore
    - Manage Pro purchase status
    - Load products from StoreKit
    - Implement purchase and restore methods
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 8. Search functionality

  - [x] 8.1 Implement FTS5 search

    - Create search queries with FTS5 syntax
    - Implement prefix matching
    - Generate highlight snippets
    - Combine with SQL filters for tags/collections
    - _Requirements: 6.1, 6.4_

  - [x] 8.2 Implement search indexing
    - Extract plain text from HTML content
    - Update FTS5 index on article save
    - Update index when tags or annotations change
    - Implement reindex functionality
    - _Requirements: 6.5, 9.5, 22.5_

- [ ] 9. Reader engine and WebView integration

  - [x] 9.1 Create ReaderWebView component

    - Load local HTML files with allowingReadAccessToURL
    - Configure WebView for offline content
    - Implement message passing bridge
    - Handle WebView lifecycle
    - _Requirements: 4.1, 4.3_

  - [x] 9.2 Implement JavaScript bridge injection

    - Create bridge script for scroll tracking
    - Implement text selection reporting
    - Add theme CSS injection method
    - Add scroll-to-annotation method
    - Throttle scroll events
    - _Requirements: 4.4, 9.1, 13.5_

  - [x] 9.3 Create theme system

    - Define theme interfaces and default themes (light, dark)
    - Implement CSS generation from theme objects
    - Create theme injection into WebView
    - Persist theme selection
    - _Requirements: 5.2_

  - [x] 9.4 Implement reading progress tracking
    - Calculate progress from scroll position
    - Update database with progress
    - Create or update reading session records
    - Restore scroll position on article open
    - _Requirements: 4.4, 4.5, 19.1, 19.2, 19.4_

- [ ] 10. Annotations and highlights

  - [x] 10.1 Implement annotation creation

    - Handle text selection from WebView bridge
    - Show context menu for highlight/note/copy
    - Store annotation with text range in database
    - Update FTS5 index with annotation text
    - _Requirements: 9.1, 9.2, 9.5_

  - [x] 10.2 Implement annotation rendering
    - Apply highlight styling to marked ranges in WebView
    - Handle tap on highlighted text to show note
    - Implement scroll to annotation
    - _Requirements: 9.3, 9.4_

- [ ] 11. UI components and screens

  - [x] 11.1 Create ArticleCard component

    - Display article metadata (title, domain, cover, tags, reading time)
    - Show progress indicator
    - Implement swipeable wrapper with Reanimated
    - Add long-press gesture for multi-select
    - _Requirements: 8.1, 8.4, 19.3, 25.1, 25.2, 25.3, 25.4, 25.5_

  - [x] 11.2 Create SwipeableCard with gesture handling

    - Implement PanGestureHandler for swipes
    - Create animated background with icons
    - Detect short (25%) and full (60%) swipe thresholds
    - Trigger archive/favorite actions
    - Add haptic feedback
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 11.3 Create HomeScreen with article list

    - Implement AppBar with search and filter buttons
    - Create Smart Tabs (All, Favorites, Archived, Unread, Errors)
    - Use FlashList for article list rendering
    - Implement pull-to-search gesture
    - Add FAB with Speed Dial for add options
    - Handle empty state
    - _Requirements: 8.5, 13.1, 18.1_

  - [x] 11.4 Create ReaderScreen

    - Integrate ReaderWebView component
    - Create auto-hiding AppBar on scroll
    - Implement reader toolbar with font controls
    - Add pinch gesture for font size
    - Create progress indicator at top
    - _Requirements: 5.1, 5.3, 5.4, 19.5_

  - [x] 11.5 Create AddScreen

    - Implement URL input with validation
    - Create mini-browser with WebView
    - Add save options (tags, collections, asset types)
    - Show progress during save
    - Display success banner with actions
    - _Requirements: 1.2_

  - [x] 11.6 Create SearchScreen

    - Implement search bar with history suggestions
    - Create filter chips for tags, collections, status
    - Display results list with highlights
    - Implement sort options
    - _Requirements: 6.1, 6.2, 18.2, 18.3, 18.4_

  - [x] 11.7 Create CollectionsScreen and TagsScreen

    - Display collections in grid with icons
    - Show tags as cloud with frequency
    - Implement navigation to filtered article lists
    - Support drag-sort on iPad
    - _Requirements: 7.5, 20.2, 20.3, 20.5_

  - [x] 11.8 Create SettingsScreen
    - Create sections for reader defaults, download settings, storage, IAP
    - Implement storage usage display
    - Add cleanup and reindex actions
    - Show Pro status and purchase options
    - _Requirements: 11.3, 22.1, 22.2, 22.3, 22.4, 22.5_

- [ ] 12. Animations and visual effects

  - [x] 12.1 Create animated splash screen with Skia

    - Implement logo drop animation with Reanimated
    - Create particle explosion effect with Skia Particles
    - Implement liquid metal shader effect
    - Add shared element transition to home
    - Integrate haptic feedback at key moments
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 12.2 Implement gesture animations

    - Create reusable swipe animation hook
    - Implement pinch-to-zoom font size animation
    - Add spring animations for UI transitions
    - Create pull-to-search stretch animation
    - _Requirements: 5.1, 8.5_

  - [ ] 12.3 Create micro-interactions
    - Add scale animation for multi-select mode
    - Implement shimmer progress indicator
    - Create theme transition fade effect
    - Add highlight flash animation
    - _Requirements: 17.1, 17.2_

- [ ] 13. Multi-select and bulk actions

  - [x] 13.1 Implement multi-select mode

    - Activate on long-press with animated checkboxes
    - Toggle selection on tap with haptic feedback
    - Show bottom action bar
    - _Requirements: 17.1, 17.2_

  - [x] 13.2 Implement bulk actions
    - Create actions for add tags, move to collection, archive, delete, export
    - Show confirmation dialog for destructive actions
    - Update UI after bulk operations
    - Exit multi-select mode on completion
    - _Requirements: 17.3, 17.4, 17.5_

- [ ] 14. Tags and collections management

  - [x] 14.1 Implement tag operations

    - Create tag with name and color
    - Apply tags to articles
    - Remove tags from articles
    - Delete tags
    - _Requirements: 7.1, 7.2_

  - [x] 14.2 Implement collection operations
    - Create collection with name and icon
    - Add articles to collections with order
    - Remove articles from collections
    - Reorder articles within collections
    - Delete collections
    - _Requirements: 7.3, 7.4, 7.5_

- [ ] 15. Export and import functionality

  - [x] 15.1 Implement export service

    - Create ZIP with articles, database, and manifest
    - Support selective export (specific articles)
    - Option to include/exclude assets
    - Generate manifest with version info
    - _Requirements: 10.1, 10.2_

  - [x] 15.2 Implement import service
    - Validate ZIP structure and manifest
    - Check schema compatibility
    - Detect duplicates by URL/title/hash
    - Handle conflicts with user choice (merge/replace/skip)
    - Import articles and update database
    - _Requirements: 10.3, 10.4, 10.5_

- [ ] 16. In-app purchases

  - [ ] 16.1 Implement IAP service

    - Configure react-native-iap with StoreKit 2
    - Load products from App Store
    - Implement purchase flow
    - Verify transactions
    - Persist purchase status locally
    - _Requirements: 11.1, 11.2_

  - [ ] 16.2 Create paywall UI

    - Display Pro features and benefits
    - Show purchase button with price
    - Implement restore purchases button
    - Handle purchase states (loading, success, error)
    - _Requirements: 11.3, 11.4_

  - [ ] 16.3 Implement Pro feature gating
    - Check Pro status before accessing premium features
    - Limit article count to 50 for free users
    - Gate premium themes and fonts
    - Gate export/import functionality
    - Gate saved search queries
    - _Requirements: 11.5, 5.5, 18.5_

- [ ] 17. Table of contents

  - [ ] 17.1 Implement TOC extraction

    - Parse article HTML for h2/h3 headings
    - Build hierarchical TOC structure
    - Store TOC in memory for quick access
    - _Requirements: 24.1_

  - [ ] 17.2 Create TOC UI
    - Display TOC as slide-over panel on iPhone
    - Show TOC as persistent side panel on iPad
    - Implement scroll-to-heading on tap
    - Highlight current section during scroll
    - _Requirements: 24.2, 24.3, 24.4, 24.5_

- [ ] 18. Onboarding experience

  - [ ] 18.1 Create onboarding screens

    - Design three-screen carousel
    - Screen 1: Offline saving demo
    - Screen 2: Reader mode and themes
    - Screen 3: Gesture tutorial
    - _Requirements: 16.1, 16.2_

  - [ ] 18.2 Implement onboarding flow

    - Show on first launch only
    - Add swipe navigation between screens
    - Create Share Extension setup instructions
    - Persist completion status in MMKV
    - _Requirements: 16.3, 16.5_

  - [ ] 18.3 Add animations to onboarding
    - Animate screen transitions with Skia
    - Create interactive gesture trainer
    - _Requirements: 16.4_

- [ ] 19. iPad-specific features

  - [ ] 19.1 Implement three-panel layout

    - Create split view with collections/tags, list, and reader
    - Handle size class changes
    - Support multitasking (Split View, Slide Over)
    - _Requirements: 20.1, 20.4_

  - [ ] 19.2 Implement drag-and-drop
    - Create drag ghost visual for articles
    - Support dropping on collections and tags
    - Update database on drop
    - Provide haptic feedback
    - _Requirements: 20.2, 20.3, 20.5_

- [ ] 20. Accessibility implementation

  - [ ] 20.1 Add VoiceOver support

    - Add accessibility labels to all interactive elements
    - Define accessibility hints for gestures
    - Implement proper focus order
    - Use semantic HTML in Reader
    - _Requirements: 15.1, 15.3, 15.4_

  - [ ] 20.2 Implement Dynamic Type support
    - Scale UI text with system settings
    - Maintain minimum touch target sizes (44x44pt)
    - Test with various text size settings
    - _Requirements: 15.2, 15.5_

- [ ] 21. Localization

  - [x] 21.1 Set up i18next

    - Configure i18next for React Native
    - Create translation files for English and Russian
    - Implement language detection
    - _Requirements: 23.1, 23.2_

  - [x] 21.2 Translate all UI strings
    - Translate screen titles and labels
    - Translate error messages
    - Translate settings and options
    - Format dates and numbers per locale
    - _Requirements: 23.3, 23.4, 23.5_

- [ ] 22. Error handling and recovery

  - [x] 22.1 Implement error boundaries

    - Create React error boundaries for UI
    - Log errors for debugging
    - Show user-friendly error screens
    - _Requirements: 21.1, 21.2, 21.3_

  - [x] 22.2 Add storage monitoring

    - Check available storage space
    - Warn when space is low
    - Suggest cleanup options
    - Prevent saves when critical
    - _Requirements: 21.5_

  - [x] 22.3 Implement database recovery
    - Detect database corruption
    - Attempt recovery from WAL
    - Offer export before recovery
    - _Requirements: 21.4_

- [ ] 23. Share Extension (iOS)

  - [ ] 23.1 Create Share Extension target

    - Set up iOS App Extension in Xcode
    - Configure extension Info.plist
    - Set up App Groups for data sharing
    - _Requirements: 1.1_

  - [ ] 23.2 Implement Share Extension UI

    - Create minimal save form
    - Add tag and collection pickers
    - Show save progress
    - Handle memory and time constraints
    - _Requirements: 1.1_

  - [ ] 23.3 Integrate with main app
    - Queue articles for processing in main app
    - Notify main app of new saves
    - Handle background processing
    - _Requirements: 1.1_

- [ ] 24. Performance optimizations

  - [ ] 24.1 Optimize list rendering

    - Configure FlashList with proper item heights
    - Memoize ArticleCard components
    - Implement lazy loading for cover images
    - Throttle scroll event handlers
    - _Requirements: 13.1, 13.5_

  - [ ] 24.2 Optimize database queries

    - Add indexes to frequently queried columns
    - Use prepared statements
    - Implement batch operations
    - _Requirements: 13.2_

  - [ ] 24.3 Implement asset cleanup

    - Find orphaned assets
    - Provide manual cleanup option
    - Schedule periodic cleanup
    - _Requirements: 13.4_

  - [ ] 24.4 Optimize animations
    - Use native driver for Reanimated
    - Limit Skia particle count
    - Reduce shader complexity
    - Profile animation performance
    - _Requirements: 13.5_

- [ ] 25. Security and privacy

  - [ ] 25.1 Implement content sanitization

    - Remove all scripts from saved HTML
    - Remove iframes and tracking pixels
    - Validate and sanitize URLs
    - _Requirements: 14.3_

  - [ ] 25.2 Implement optional encryption

    - Add encryption toggle in Pro settings
    - Encrypt article HTML and assets with iOS Keychain key
    - Maintain unencrypted FTS5 for search
    - Implement migration when enabling encryption
    - _Requirements: 14.4, 14.5_

  - [ ] 25.3 Ensure no data transmission
    - Verify no analytics or tracking SDKs
    - Ensure all data stays local
    - Document privacy in settings
    - _Requirements: 14.1, 14.2_

- [ ] 26. Testing and quality assurance

  - [ ] 26.1 Write unit tests for services

    - Test SavePageService pipeline
    - Test DownloadQueue logic
    - Test ReadabilityService extraction
    - Test HtmlRewriter transformations
    - Test SearchRepository FTS5 queries
    - _Requirements: All_

  - [ ] 26.2 Write integration tests

    - Test end-to-end save flow
    - Test search with filters
    - Test export and import
    - _Requirements: All_

  - [ ] 26.3 Perform performance testing

    - Benchmark save time (target <3s)
    - Benchmark search time (target <500ms for 5k articles)
    - Test with large libraries (5000+ articles)
    - Profile memory usage
    - _Requirements: 13.1, 13.2, 13.3_

  - [ ] 26.4 Conduct accessibility testing
    - Test with VoiceOver enabled
    - Test with various Dynamic Type sizes
    - Verify touch target sizes
    - Check color contrast ratios
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 27. Polish and final integration

  - [ ] 27.1 Implement haptic feedback

    - Add haptics for swipe actions
    - Add haptics for selection
    - Add haptics for splash animation
    - Add haptics for successful operations
    - _Requirements: 8.2, 12.5_

  - [ ] 27.2 Add loading states and skeletons

    - Create skeleton loaders for article cards
    - Add loading indicators for async operations
    - Implement shimmer effects
    - _Requirements: All_

  - [ ] 27.3 Implement error messages and toasts

    - Create toast notification system
    - Add user-friendly error messages
    - Implement retry actions
    - _Requirements: 21.1, 21.2, 21.3_

  - [ ] 27.4 Final UI polish

    - Refine spacing and typography
    - Ensure consistent color usage
    - Add smooth transitions between screens
    - Test on various screen sizes
    - _Requirements: All_

  - [ ] 27.5 Integration testing
    - Test complete user flows
    - Verify all gestures work correctly
    - Test offline functionality
    - Verify IAP flow
    - Test Share Extension integration
    - _Requirements: All_

- [ ] 28. App Store preparation

  - [ ] 28.1 Configure build settings

    - Set up code signing
    - Configure app icons and launch screen
    - Set bundle identifier and version
    - Enable Hermes engine
    - _Requirements: All_

  - [ ] 28.2 Create App Store assets

    - Design app icon
    - Create screenshots for iPhone and iPad
    - Write app description in English and Russian
    - Prepare privacy policy
    - _Requirements: All_

  - [ ] 28.3 Final testing and submission
    - Test on physical devices
    - Verify all features work as expected
    - Submit for App Store review
    - _Requirements: All_
