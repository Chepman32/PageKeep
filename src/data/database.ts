import { open, QuickSQLiteConnection } from 'react-native-quick-sqlite';
import { Platform } from 'react-native';

let dbInstance: QuickSQLiteConnection | null = null;

export const getDatabase = (): QuickSQLiteConnection => {
  if (!dbInstance) {
    try {
      // Open database - react-native-quick-sqlite uses Documents directory by default
      // which should be writable on both iOS and Android
      dbInstance = open({
        name: 'pagenest.db',
        location: 'default' // 'default' maps to Documents directory
      });

      console.log('Database opened successfully at default location');
      initializeDatabase(dbInstance);
    } catch (error) {
      console.error('Failed to open database:', error);

      // Try alternative approach - use Library directory on iOS
      if (Platform.OS === 'ios') {
        console.log('Trying Library directory for iOS...');
        dbInstance = open({
          name: 'pagenest.db',
          location: 'Library'
        });
        console.log('Database opened in Library directory');
        initializeDatabase(dbInstance);
      } else {
        throw error;
      }
    }
  }
  return dbInstance;
};

const initializeDatabase = (db: QuickSQLiteConnection): void => {
  try {
    // Test if database is writable
    try {
      db.execute('PRAGMA journal_mode = WAL;');
      console.log('Database is writable (WAL mode enabled)');
    } catch (e) {
      console.error('Database might be readonly:', e);
    }

    // Enable foreign keys
    db.execute('PRAGMA foreign_keys = ON;');
    console.log('Foreign keys enabled');

    // Create tables
    createTables(db);
    console.log('Tables created');

    // Create indexes
    createIndexes(db);
    console.log('Indexes created');

    // Create FTS5 virtual table
    createFTSTable(db);
    console.log('FTS table created');

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

const createTables = (db: QuickSQLiteConnection): void => {
  // Articles table
  db.execute(`
    CREATE TABLE IF NOT EXISTS articles (
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
  `);

  // Article content table
  db.execute(`
    CREATE TABLE IF NOT EXISTS article_content (
      article_id TEXT PRIMARY KEY,
      html_path TEXT NOT NULL,
      stylesheet_path TEXT,
      meta_json TEXT,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );
  `);

  // Assets table
  db.execute(`
    CREATE TABLE IF NOT EXISTS assets (
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
  `);

  // Tags table
  db.execute(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      color TEXT NOT NULL
    );
  `);

  // Article-Tag junction
  db.execute(`
    CREATE TABLE IF NOT EXISTS article_tags (
      article_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (article_id, tag_id),
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);

  // Collections table
  db.execute(`
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      icon TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );
  `);

  // Article-Collection junction
  db.execute(`
    CREATE TABLE IF NOT EXISTS article_collections (
      article_id TEXT NOT NULL,
      collection_id TEXT NOT NULL,
      order_in_collection INTEGER DEFAULT 0,
      PRIMARY KEY (article_id, collection_id),
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
    );
  `);

  // Annotations table
  db.execute(`
    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      range_json TEXT NOT NULL,
      text TEXT,
      created_at INTEGER NOT NULL,
      color TEXT NOT NULL,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );
  `);

  // Reading sessions table
  db.execute(`
    CREATE TABLE IF NOT EXISTS reading_sessions (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      last_position_selector TEXT,
      last_scroll_y REAL DEFAULT 0,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );
  `);
};

const createIndexes = (db: QuickSQLiteConnection): void => {
  db.execute(
    'CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at DESC);',
  );
  db.execute(
    'CREATE INDEX IF NOT EXISTS idx_articles_domain ON articles(domain);',
  );
  db.execute(
    'CREATE INDEX IF NOT EXISTS idx_articles_archived ON articles(archived);',
  );
  db.execute(
    'CREATE INDEX IF NOT EXISTS idx_articles_favorite ON articles(favorite);',
  );
  db.execute(
    'CREATE INDEX IF NOT EXISTS idx_assets_article ON assets(article_id);',
  );
  db.execute('CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);');
  db.execute(
    'CREATE INDEX IF NOT EXISTS idx_annotations_article ON annotations(article_id);',
  );
};

const createFTSTable = (db: QuickSQLiteConnection): void => {
  try {
    // Try to create FTS5 table
    db.execute(`
      CREATE VIRTUAL TABLE IF NOT EXISTS fts_articles USING fts5(
        article_id UNINDEXED,
        title,
        plain_text,
        tags_cached,
        annotations_cached
      );
    `);
    console.log('FTS5 table created successfully');
  } catch (error) {
    console.warn('FTS5 not available, creating fallback search table:', error);
    // Fallback: create regular table for search
    db.execute(`
      CREATE TABLE IF NOT EXISTS fts_articles (
        article_id TEXT PRIMARY KEY,
        title TEXT,
        plain_text TEXT,
        tags_cached TEXT,
        annotations_cached TEXT
      );
    `);

    // Create indexes for search performance
    db.execute(
      'CREATE INDEX IF NOT EXISTS idx_fts_title ON fts_articles(title);',
    );
    db.execute(
      'CREATE INDEX IF NOT EXISTS idx_fts_content ON fts_articles(plain_text);',
    );
  }
};

export const closeDatabase = (): void => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
};

// Database migration system
const CURRENT_VERSION = 1;

export const migrateDatabase = (db: QuickSQLiteConnection): void => {
  // Get current version
  db.execute(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );
  `);

  const result = db.execute('SELECT version FROM schema_version LIMIT 1;');
  const currentVersion = result.rows?._array[0]?.version || 0;

  if (currentVersion < CURRENT_VERSION) {
    // Run migrations
    for (let v = currentVersion + 1; v <= CURRENT_VERSION; v++) {
      runMigration(db, v);
    }

    // Update version
    if (currentVersion === 0) {
      db.execute(
        `INSERT INTO schema_version (version) VALUES (${CURRENT_VERSION});`,
      );
    } else {
      db.execute(`UPDATE schema_version SET version = ${CURRENT_VERSION};`);
    }
  }
};

const runMigration = (db: QuickSQLiteConnection, version: number): void => {
  switch (version) {
    case 1:
      // Initial schema - already created
      break;
    // Add future migrations here
    default:
      break;
  }
};
