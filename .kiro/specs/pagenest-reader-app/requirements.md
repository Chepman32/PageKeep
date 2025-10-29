# Requirements Document

## Introduction

PageNest is an offline-first mobile application for iOS that enables users to save web pages for later reading without requiring an internet connection. The application provides a clean reader mode with customizable typography, full-text search capabilities, and gesture-based navigation. All data and assets are stored locally on the device, ensuring complete privacy and offline functionality.

## Glossary

- **PageNest System**: The complete iOS application including UI, data storage, and processing components
- **Article**: A saved web page with extracted content, metadata, and associated assets
- **Asset**: A resource file (image, CSS, font) associated with an article
- **Reader Mode**: A clean, distraction-free view of article content with customizable typography
- **FTS5**: SQLite Full-Text Search version 5, used for fast text searching
- **Share Extension**: iOS system extension allowing users to save pages from Safari/other browsers
- **Collection**: A user-created group for organizing articles
- **Tag**: A label applied to articles for categorization
- **Annotation**: A user-created highlight or note within an article
- **Download Queue**: A managed system for downloading and processing article assets
- **WebView**: A component that renders HTML content within the application
- **Readability**: Mozilla's algorithm for extracting main content from web pages
- **Pro Version**: Premium features unlocked via in-app purchase

## Requirements

### Requirement 1: Article Saving

**User Story:** As a user, I want to save web pages from Safari or other browsers, so that I can read them later without an internet connection.

#### Acceptance Criteria

1. WHEN the user shares a URL from Safari using the Share Extension, THE PageNest System SHALL accept the URL and initiate the save process.
2. WHEN the user enters a URL in the built-in add screen, THE PageNest System SHALL validate the URL format and fetch the page content.
3. WHEN the PageNest System fetches a web page, THE PageNest System SHALL extract the main content using the Readability algorithm.
4. WHEN the PageNest System processes a web page, THE PageNest System SHALL identify and queue all images, stylesheets, and fonts for download.
5. WHEN the PageNest System completes saving an article, THE PageNest System SHALL store the article metadata in the SQLite database and create a local directory with the HTML file and assets.

### Requirement 2: Content Extraction and Cleaning

**User Story:** As a user, I want saved pages to be clean and readable, so that I can focus on the content without distractions.

#### Acceptance Criteria

1. WHEN the PageNest System processes a web page, THE PageNest System SHALL remove all script tags, iframes, and tracking elements from the HTML.
2. WHEN the PageNest System extracts content, THE PageNest System SHALL identify the article title, author, and main content body.
3. WHEN the PageNest System rewrites HTML, THE PageNest System SHALL convert all external resource URLs to local file paths.
4. WHEN the PageNest System saves an article, THE PageNest System SHALL preserve the semantic structure of headings, paragraphs, lists, and images.
5. IF the PageNest System cannot extract clean content using Readability, THEN THE PageNest System SHALL save the full page with a warning indicator.

### Requirement 3: Asset Management

**User Story:** As a user, I want images and styles to be saved with articles, so that I can view the complete content offline.

#### Acceptance Criteria

1. WHEN the PageNest System identifies assets in an article, THE PageNest System SHALL add each asset to the Download Queue with its source URL and type.
2. WHILE the Download Queue processes assets, THE PageNest System SHALL limit concurrent downloads to three simultaneous connections.
3. WHEN the PageNest System downloads an asset, THE PageNest System SHALL validate the MIME type and file size against configured limits.
4. WHEN the PageNest System saves an asset, THE PageNest System SHALL generate a SHA1 hash filename and store the file in the article's assets directory.
5. IF an asset download fails after three retry attempts, THEN THE PageNest System SHALL mark the asset status as failed and continue processing other assets.
6. WHEN the PageNest System completes asset downloads, THE PageNest System SHALL update the article's has_assets flag to indicate completion status.

### Requirement 4: Offline Reading

**User Story:** As a user, I want to read saved articles without an internet connection, so that I can access content anywhere.

#### Acceptance Criteria

1. WHEN the user opens an article, THE PageNest System SHALL load the local HTML file in a WebView component.
2. WHEN the WebView loads an article, THE PageNest System SHALL apply the user's selected theme CSS to the content.
3. WHEN the WebView renders an article, THE PageNest System SHALL load all assets from local file paths without network requests.
4. WHILE the user reads an article, THE PageNest System SHALL track the scroll position and update the read progress percentage.
5. WHEN the user returns to a previously read article, THE PageNest System SHALL restore the last scroll position.

### Requirement 5: Reader Customization

**User Story:** As a user, I want to customize the reading experience with different fonts, sizes, and themes, so that I can read comfortably in any environment.

#### Acceptance Criteria

1. WHEN the user adjusts font size using pinch gesture in Reader Mode, THE PageNest System SHALL scale the text between 15 and 20 points with spring animation.
2. WHEN the user selects a theme, THE PageNest System SHALL inject the theme CSS into the WebView and persist the preference.
3. WHEN the user changes line spacing, THE PageNest System SHALL update the CSS line-height property between 1.35 and 1.6.
4. WHEN the user adjusts margins, THE PageNest System SHALL modify the content padding between 8 and 24 points.
5. WHERE the user has Pro Version, THE PageNest System SHALL provide access to premium fonts including Georgia, Charter, Source Serif, Inter, and IBM Plex Sans.

### Requirement 6: Full-Text Search

**User Story:** As a user, I want to search through all my saved articles instantly, so that I can find specific content quickly.

#### Acceptance Criteria

1. WHEN the user enters a search query, THE PageNest System SHALL query the FTS5 virtual table for matches in titles, content, tags, and annotations.
2. WHEN the PageNest System returns search results, THE PageNest System SHALL highlight matching text fragments in the result list.
3. WHEN the PageNest System performs a search, THE PageNest System SHALL return results within 500 milliseconds for libraries up to 5000 articles.
4. WHEN the user applies filters to search, THE PageNest System SHALL combine FTS5 queries with SQL WHERE clauses for tags, collections, and status.
5. WHEN the PageNest System saves or updates an article, THE PageNest System SHALL update the FTS5 index with the article's searchable content.

### Requirement 7: Organization with Tags and Collections

**User Story:** As a user, I want to organize articles with tags and collections, so that I can categorize and find related content easily.

#### Acceptance Criteria

1. WHEN the user creates a tag, THE PageNest System SHALL store the tag with a unique name and color in the tags table.
2. WHEN the user applies a tag to an article, THE PageNest System SHALL create an association in the article_tags table.
3. WHEN the user creates a collection, THE PageNest System SHALL store the collection with a name, icon, and sort order.
4. WHEN the user adds an article to a collection, THE PageNest System SHALL record the association with an order_in_collection value.
5. WHEN the user reorders articles within a collection on iPad, THE PageNest System SHALL update the order_in_collection values for affected articles.

### Requirement 8: Gesture-Based Navigation

**User Story:** As a user, I want to use gestures to quickly perform common actions, so that I can manage articles efficiently without navigating through menus.

#### Acceptance Criteria

1. WHEN the user swipes an article card left beyond 60 percent of the card width, THE PageNest System SHALL archive the article and animate the card off screen.
2. WHEN the user swipes an article card right beyond 60 percent of the card width, THE PageNest System SHALL toggle the favorite status and provide haptic feedback.
3. WHEN the user performs a short swipe left (25 percent of card width), THE PageNest System SHALL reveal a menu with additional actions.
4. WHEN the user performs a long press on an article card, THE PageNest System SHALL enter multi-select mode with animated checkboxes.
5. WHEN the user pulls down on the article list, THE PageNest System SHALL reveal the search interface with a stretch animation.

### Requirement 9: Annotations and Highlights

**User Story:** As a user, I want to highlight text and add notes to articles, so that I can mark important passages and add my thoughts.

#### Acceptance Criteria

1. WHEN the user long-presses text in Reader Mode, THE PageNest System SHALL display a context menu with options to highlight, add note, or copy.
2. WHEN the user creates a highlight, THE PageNest System SHALL store the text range, color, and timestamp in the annotations table.
3. WHEN the WebView renders an article with annotations, THE PageNest System SHALL apply highlight styling to the marked text ranges.
4. WHEN the user taps a highlighted section, THE PageNest System SHALL display the associated note if one exists.
5. WHEN the user creates an annotation, THE PageNest System SHALL update the FTS5 index to include the annotation text for searching.

### Requirement 10: Export and Import

**User Story:** As a user, I want to export my entire library to a file and import it later, so that I can backup my data or transfer it to another device.

#### Acceptance Criteria

1. WHERE the user has Pro Version, WHEN the user initiates an export, THE PageNest System SHALL create a ZIP file containing all article directories, the SQLite database, and a manifest JSON file.
2. WHEN the PageNest System creates an export, THE PageNest System SHALL allow the user to choose whether to include or exclude asset files.
3. WHEN the user imports a ZIP file, THE PageNest System SHALL validate the manifest version and database schema compatibility.
4. WHEN the PageNest System imports articles, THE PageNest System SHALL detect duplicates by comparing URL, title, and content hash.
5. IF the PageNest System detects duplicate articles during import, THEN THE PageNest System SHALL present options to merge, replace, or skip each duplicate.

### Requirement 11: In-App Purchases

**User Story:** As a user, I want to unlock premium features with a one-time purchase, so that I can access advanced functionality without a subscription.

#### Acceptance Criteria

1. WHEN the user purchases Pro Version, THE PageNest System SHALL unlock unlimited article storage, premium themes, additional fonts, and export/import functionality.
2. WHEN the PageNest System processes a purchase, THE PageNest System SHALL verify the transaction with StoreKit 2 and persist the purchase status locally.
3. WHEN the user attempts to access a Pro feature without purchasing, THE PageNest System SHALL display a paywall screen with feature descriptions and purchase options.
4. WHEN the user initiates a purchase restoration, THE PageNest System SHALL query StoreKit for previous purchases and update the local purchase status.
5. WHILE the user has not purchased Pro Version, THE PageNest System SHALL limit the article library to 50 saved articles.

### Requirement 12: Animated Splash Screen

**User Story:** As a user, I want to see an engaging animation when the app launches, so that the loading experience feels polished and premium.

#### Acceptance Criteria

1. WHEN the PageNest System launches, THE PageNest System SHALL display the logo falling with gravity animation using Reanimated.
2. WHEN the logo impacts the bottom, THE PageNest System SHALL fragment it into 24 glass particles using Skia Particles.
3. WHEN the particles animate, THE PageNest System SHALL morph them into liquid metal using Skia shaders and blend them into the PageNest wordmark.
4. WHEN the splash animation completes, THE PageNest System SHALL transition to the home screen using a shared element animation for the logo icon.
5. WHEN key animation events occur, THE PageNest System SHALL trigger haptic feedback for impact and success moments.

### Requirement 13: Performance and Scalability

**User Story:** As a user, I want the app to remain fast and responsive even with thousands of saved articles, so that I can build a large library without performance degradation.

#### Acceptance Criteria

1. WHEN the PageNest System displays the article list, THE PageNest System SHALL use FlashList or RecyclerListView for efficient rendering of large datasets.
2. WHEN the PageNest System performs FTS5 searches, THE PageNest System SHALL return results within 500 milliseconds for libraries containing up to 5000 articles.
3. WHEN the PageNest System saves an article, THE PageNest System SHALL complete the save operation (excluding asset downloads) within 3 seconds on average.
4. WHEN the PageNest System detects orphaned asset files, THE PageNest System SHALL provide a cleanup function to reclaim storage space.
5. WHEN the PageNest System handles scroll events in Reader Mode, THE PageNest System SHALL throttle event processing to maintain 60 frames per second.

### Requirement 14: Privacy and Security

**User Story:** As a user, I want my reading data to remain completely private, so that no one can track what I read or access my saved content.

#### Acceptance Criteria

1. THE PageNest System SHALL store all article data, assets, and metadata locally on the device without transmitting any data to external servers.
2. THE PageNest System SHALL NOT include any analytics, tracking, or telemetry SDKs.
3. WHEN the PageNest System saves article content, THE PageNest System SHALL remove all external scripts, tracking pixels, and third-party iframes.
4. WHERE the user has Pro Version and enables encryption, THE PageNest System SHALL encrypt article HTML and assets using a key stored in iOS Keychain.
5. WHEN the user enables encryption, THE PageNest System SHALL maintain FTS5 metadata unencrypted to preserve search functionality.

### Requirement 15: Accessibility

**User Story:** As a user with accessibility needs, I want the app to work with VoiceOver and Dynamic Type, so that I can use the app comfortably.

#### Acceptance Criteria

1. WHEN VoiceOver is enabled, THE PageNest System SHALL provide descriptive labels for all interactive elements including buttons, cards, and gestures.
2. WHEN the user adjusts system text size with Dynamic Type, THE PageNest System SHALL scale UI text accordingly while respecting minimum touch target sizes.
3. WHEN the PageNest System displays article content in Reader Mode, THE PageNest System SHALL use semantic HTML landmarks for proper VoiceOver navigation.
4. WHEN the user navigates with VoiceOver, THE PageNest System SHALL maintain logical focus order through screens and components.
5. WHEN the PageNest System displays interactive elements, THE PageNest System SHALL ensure minimum touch target sizes of 44x44 points.

### Requirement 16: Onboarding Experience

**User Story:** As a new user, I want to understand the app's key features and how to use gestures, so that I can start using the app effectively.

#### Acceptance Criteria

1. WHEN the user launches the PageNest System for the first time, THE PageNest System SHALL display a three-screen onboarding carousel.
2. WHEN the PageNest System displays onboarding screens, THE PageNest System SHALL demonstrate offline saving, reader mode themes, and gesture controls.
3. WHEN the user completes onboarding, THE PageNest System SHALL provide instructions for adding the Share Extension to Safari.
4. WHEN the user swipes through onboarding screens, THE PageNest System SHALL animate transitions using Skia effects.
5. WHEN the user completes onboarding, THE PageNest System SHALL persist the completion status and not show onboarding again.

### Requirement 17: Multi-Select and Bulk Actions

**User Story:** As a user, I want to select multiple articles and perform actions on them at once, so that I can efficiently manage my library.

#### Acceptance Criteria

1. WHEN the user long-presses an article card, THE PageNest System SHALL enter multi-select mode and display checkboxes on all article cards with scale animation.
2. WHILE in multi-select mode, WHEN the user taps article cards, THE PageNest System SHALL toggle selection state with haptic feedback.
3. WHILE in multi-select mode, THE PageNest System SHALL display a bottom action bar with options for adding tags, moving to collection, archiving, deleting, and exporting.
4. WHEN the user initiates a delete action on multiple articles, THE PageNest System SHALL display a confirmation dialog with the count of articles to be deleted.
5. WHEN the user completes a bulk action, THE PageNest System SHALL exit multi-select mode and update the article list with animation.

### Requirement 18: Smart Filtering and Sorting

**User Story:** As a user, I want to filter and sort my articles by various criteria, so that I can find specific types of content quickly.

#### Acceptance Criteria

1. WHEN the user selects a filter tab, THE PageNest System SHALL display articles matching the criteria: All, Favorites, Archived, Unread, or With Errors.
2. WHEN the user applies tag filters, THE PageNest System SHALL show only articles that have all selected tags.
3. WHEN the user applies collection filters, THE PageNest System SHALL show only articles within the selected collection.
4. WHEN the user selects a sort option, THE PageNest System SHALL reorder articles by date added, domain, reading time, or read progress.
5. WHERE the user has Pro Version, WHEN the user saves a search query with filters, THE PageNest System SHALL create a new smart tab on the home screen.

### Requirement 19: Reading Progress Tracking

**User Story:** As a user, I want the app to track my reading progress, so that I can see which articles I've started and how far I've read.

#### Acceptance Criteria

1. WHILE the user scrolls in Reader Mode, THE PageNest System SHALL calculate read progress as a percentage based on scroll position.
2. WHEN the PageNest System updates read progress, THE PageNest System SHALL persist the value to the articles table.
3. WHEN the PageNest System displays an article card, THE PageNest System SHALL show a visual progress indicator if the article has been partially read.
4. WHEN the user opens an article, THE PageNest System SHALL create or update a reading session record with the start timestamp.
5. WHEN the PageNest System displays the progress indicator in Reader Mode, THE PageNest System SHALL render it as a thin line at the top using Skia.

### Requirement 20: iPad-Specific Features

**User Story:** As an iPad user, I want to take advantage of the larger screen with split views and drag-and-drop, so that I can work more efficiently.

#### Acceptance Criteria

1. WHEN the PageNest System runs on iPad, THE PageNest System SHALL display a three-panel layout with collections/tags, article list, and reader view.
2. WHEN the user drags an article card on iPad, THE PageNest System SHALL create a drag ghost visual and allow dropping onto collection or tag targets.
3. WHEN the user drops an article onto a collection, THE PageNest System SHALL add the article to that collection and provide haptic feedback.
4. WHEN the PageNest System displays Reader Mode on iPad, THE PageNest System SHALL show the table of contents as a persistent side panel.
5. WHEN the user reorders articles within a collection on iPad, THE PageNest System SHALL support drag-to-reorder with live position updates.

### Requirement 21: Error Handling and Recovery

**User Story:** As a user, I want to be notified of errors and have options to retry or fix issues, so that I don't lose content due to temporary problems.

#### Acceptance Criteria

1. IF an article save operation fails due to network error, THEN THE PageNest System SHALL mark the article as incomplete and display a "Retry" option.
2. IF asset downloads fail after retry attempts, THEN THE PageNest System SHALL mark affected assets as failed and allow the article to be readable with remaining content.
3. WHEN the PageNest System encounters a page without extractable content, THE PageNest System SHALL save the full HTML and display a warning indicator.
4. IF the SQLite database becomes corrupted, THEN THE PageNest System SHALL attempt recovery from the last known good state and notify the user.
5. WHEN the PageNest System detects storage space below 100 MB, THE PageNest System SHALL warn the user and suggest cleanup options.

### Requirement 22: Settings and Preferences

**User Story:** As a user, I want to configure app behavior and defaults, so that the app works according to my preferences.

#### Acceptance Criteria

1. WHEN the user accesses settings, THE PageNest System SHALL display options for reader defaults, download limits, storage management, and privacy.
2. WHEN the user sets reader defaults, THE PageNest System SHALL apply the selected theme, font, line spacing, and margins to newly opened articles.
3. WHEN the user configures download limits, THE PageNest System SHALL respect the maximum parallel downloads and maximum asset file size settings.
4. WHEN the user enables "Wi-Fi only" mode, THE PageNest System SHALL pause asset downloads when the device is on cellular connection.
5. WHEN the user initiates FTS5 reindexing from settings, THE PageNest System SHALL rebuild the search index and display progress.

### Requirement 23: Localization

**User Story:** As a user who speaks Russian or English, I want the app interface in my language, so that I can use it comfortably.

#### Acceptance Criteria

1. WHEN the PageNest System launches, THE PageNest System SHALL detect the device language and display the interface in English or Russian accordingly.
2. WHEN the PageNest System displays text strings, THE PageNest System SHALL use localized strings from the i18n resource files.
3. WHEN the PageNest System formats dates and times, THE PageNest System SHALL use locale-appropriate formatting.
4. WHEN the PageNest System displays numbers, THE PageNest System SHALL use locale-appropriate number formatting.
5. WHEN the PageNest System displays error messages, THE PageNest System SHALL show localized error text.

### Requirement 24: Table of Contents

**User Story:** As a user reading long articles, I want to see a table of contents and jump to sections, so that I can navigate large documents easily.

#### Acceptance Criteria

1. WHEN the PageNest System loads an article with h2 or h3 headings, THE PageNest System SHALL extract the heading structure to build a table of contents.
2. WHEN the user taps the TOC button in Reader Mode, THE PageNest System SHALL display a slide-over panel with the list of headings.
3. WHEN the user taps a TOC entry, THE PageNest System SHALL scroll the article to the corresponding heading with smooth animation.
4. WHEN the PageNest System displays Reader Mode on iPad, THE PageNest System SHALL show the TOC as a persistent side panel.
5. WHEN the user scrolls through an article, THE PageNest System SHALL highlight the current section in the TOC.

### Requirement 25: Article Metadata Display

**User Story:** As a user, I want to see useful metadata about articles, so that I can make informed decisions about what to read.

#### Acceptance Criteria

1. WHEN the PageNest System displays an article card, THE PageNest System SHALL show the domain, title, estimated reading time, and up to three tags.
2. WHEN the PageNest System calculates reading time, THE PageNest System SHALL estimate based on word count at 200 words per minute.
3. WHEN the PageNest System displays an article with a cover image, THE PageNest System SHALL show a thumbnail preview on the card.
4. WHEN the PageNest System displays an article card with more than three tags, THE PageNest System SHALL show "+N" indicator for additional tags.
5. WHEN the PageNest System displays article metadata, THE PageNest System SHALL include the date saved and last read date.
