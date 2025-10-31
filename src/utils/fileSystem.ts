import RNFS from 'react-native-fs';
import CryptoJS from 'crypto-js';

const BASE_DIR = `${RNFS.DocumentDirectoryPath}/PageNest`;
const ARTICLES_DIR = `${BASE_DIR}/articles`;

export const FileSystem = {
  async initialize(): Promise<void> {
    // Create base directories
    await this.ensureDirectoryExists(BASE_DIR);
    await this.ensureDirectoryExists(ARTICLES_DIR);
  },

  async ensureDirectoryExists(path: string): Promise<void> {
    const exists = await RNFS.exists(path);
    if (!exists) {
      await RNFS.mkdir(path);
    }
  },

  getArticleDirectory(articleId: string): string {
    return `${ARTICLES_DIR}/${articleId}`;
  },

  getArticleHtmlPath(articleId: string): string {
    return `${this.getArticleDirectory(articleId)}/index.html`;
  },

  getArticleAssetsDirectory(articleId: string): string {
    return `${this.getArticleDirectory(articleId)}/assets`;
  },

  getArticleMetaPath(articleId: string): string {
    return `${this.getArticleDirectory(articleId)}/meta.json`;
  },

  async createArticleDirectory(articleId: string): Promise<void> {
    const articleDir = this.getArticleDirectory(articleId);
    const assetsDir = this.getArticleAssetsDirectory(articleId);

    await this.ensureDirectoryExists(articleDir);
    await this.ensureDirectoryExists(assetsDir);
  },

  async writeArticleHtml(articleId: string, html: string): Promise<string> {
    const htmlPath = this.getArticleHtmlPath(articleId);
    await RNFS.writeFile(htmlPath, html, 'utf8');
    return htmlPath;
  },

  async readArticleHtml(articleId: string): Promise<string> {
    const htmlPath = this.getArticleHtmlPath(articleId);
    return await RNFS.readFile(htmlPath, 'utf8');
  },

  async writeArticleMeta(articleId: string, meta: any): Promise<void> {
    const metaPath = this.getArticleMetaPath(articleId);
    await RNFS.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf8');
  },

  async readArticleMeta(articleId: string): Promise<any> {
    const metaPath = this.getArticleMetaPath(articleId);
    const content = await RNFS.readFile(metaPath, 'utf8');
    return JSON.parse(content);
  },

  generateAssetFilename(url: string, extension?: string): string {
    const hash = CryptoJS.SHA1(url).toString();
    const ext = extension || this.getExtensionFromUrl(url) || 'bin';
    return `${hash}.${ext}`;
  },

  getExtensionFromUrl(url: string): string | null {
    try {
      // Extract path from URL by removing protocol and domain
      const path = url.split('?')[0]; // Remove query params
      const match = path.match(/\.([a-zA-Z0-9]+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  },

  getExtensionFromMime(mime: string): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'text/css': 'css',
      'font/woff': 'woff',
      'font/woff2': 'woff2',
      'font/ttf': 'ttf',
      'font/otf': 'otf',
    };

    return mimeMap[mime] || 'bin';
  },

  async deleteArticleDirectory(articleId: string): Promise<void> {
    const articleDir = this.getArticleDirectory(articleId);
    const exists = await RNFS.exists(articleDir);

    if (exists) {
      await RNFS.unlink(articleDir);
    }
  },

  async getDirectorySize(path: string): Promise<number> {
    try {
      const stat = await RNFS.stat(path);

      if (stat.isDirectory()) {
        const items = await RNFS.readDir(path);
        let totalSize = 0;

        for (const item of items) {
          if (item.isDirectory()) {
            totalSize += await this.getDirectorySize(item.path);
          } else {
            totalSize += item.size;
          }
        }

        return totalSize;
      } else {
        return stat.size;
      }
    } catch {
      return 0;
    }
  },

  async getTotalStorageUsed(): Promise<number> {
    return await this.getDirectorySize(BASE_DIR);
  },

  async findOrphanedFiles(): Promise<string[]> {
    const orphaned: string[] = [];

    try {
      const articles = await RNFS.readDir(ARTICLES_DIR);

      for (const article of articles) {
        if (article.isDirectory()) {
          // Check if meta.json exists
          const metaPath = `${article.path}/meta.json`;
          const metaExists = await RNFS.exists(metaPath);

          if (!metaExists) {
            orphaned.push(article.path);
          }
        }
      }
    } catch (error) {
      console.error('Error finding orphaned files:', error);
    }

    return orphaned;
  },

  async cleanupOrphanedFiles(paths: string[]): Promise<void> {
    for (const path of paths) {
      try {
        await RNFS.unlink(path);
      } catch (error) {
        console.error(`Error deleting ${path}:`, error);
      }
    }
  },

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },
};
