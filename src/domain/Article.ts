export interface Article {
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

export interface ArticleContent {
  articleId: string;
  htmlPath: string;
  stylesheetPath?: string;
  meta: ArticleMeta;
}

export interface ArticleMeta {
  author?: string;
  excerpt?: string;
  ogImage?: string;
  publishedDate?: string;
  siteName?: string;
}

export interface Asset {
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

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Collection {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
}

export interface Annotation {
  id: string;
  articleId: string;
  range: TextRange;
  text?: string;
  createdAt: number;
  color: string;
}

export interface TextRange {
  startContainer: string;
  startOffset: number;
  endContainer: string;
  endOffset: number;
}

export interface ReadingSession {
  id: string;
  articleId: string;
  startedAt: number;
  lastPositionSelector?: string;
  lastScrollY: number;
}

export interface ArticleFilters {
  archived?: boolean;
  favorite?: boolean;
  tags?: string[];
  collections?: string[];
  hasErrors?: boolean;
  minReadProgress?: number;
  maxReadProgress?: number;
}

export interface SearchResult {
  article: Article;
  highlights: string[];
  score: number;
}

export interface IndexableContent {
  title: string;
  plainText: string;
  tags: string[];
  annotations: string[];
}
