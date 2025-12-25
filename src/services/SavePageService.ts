import { ReadabilityService } from './ReadabilityService';
import { HtmlRewriter } from './HtmlRewriter';
import { ArticleRepository } from '../data/repositories/ArticleRepository';
import { SearchRepository } from '../data/repositories/SearchRepository';
import { DeviceEventEmitter } from 'react-native';
import { FileSystem } from '../utils/fileSystem';
import RNFetchBlob from 'react-native-blob-util';
import {
  ARTICLE_PROCESSING_STARTED,
  ARTICLE_PROCESSING_FAILED,
} from '../utils/articleProcessingState';

export interface SaveOptions {
  tags?: string[];
  collections?: string[];
}

export const ARTICLE_META_UPDATED_EVENT = 'ArticleMetaUpdated';

export class SavePageService {
  private readabilityService = new ReadabilityService();
  private htmlRewriter = new HtmlRewriter();
  private articleRepo = new ArticleRepository();
  private searchRepo = new SearchRepository();

  /**
   * Fast save - creates article immediately and processes content in background
   */
  async saveFromUrlFast(url: string, options: SaveOptions = {}): Promise<string> {
    try {

      // 1. Fetch HTML (this is unavoidable)
      const html = await this.fetchHtml(url);

      // 2. Parse with Readability
      const readable = await this.readabilityService.extract(html, url);

      // 3. Extract domain and calculate reading metrics
      const domain = this.readabilityService.extractDomain(url);
      const wordCount = this.readabilityService.countWords(readable.textContent);
      const readingTime = this.readabilityService.calculateReadingTime(wordCount);

      // 4. Create article record IMMEDIATELY
      const articleId = await this.articleRepo.create({
        title: readable.title,
        url,
        domain,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        archived: false,
        favorite: false,
        readProgress: 0,
        readingTime,
        wordCount,
        hasAssets: false,
      });

      // 5. Create article directory and save basic content immediately
      await FileSystem.createArticleDirectory(articleId);

      // 6. Save a basic version of the HTML without images (for instant viewing)
      const htmlPath = FileSystem.getArticleHtmlPath(articleId);
      const basicHtml = this.htmlRewriter.rewrite(readable.content, url, new Map());
      await FileSystem.writeArticleHtml(articleId, basicHtml);

      // 7. Save article content record
      await this.articleRepo.createContent({
        articleId,
        htmlPath,
        meta: {
          author: readable.byline,
          excerpt: readable.excerpt,
          siteName: readable.siteName,
        },
      });

      // 8. Determine provisional cover image (meta tags or first inline image)
      const coverCandidate = this.extractCoverImageCandidate(html, readable.content, url);
      const resolvedCover = await this.resolveCoverImage(articleId, coverCandidate);

      // 9. Save basic metadata with processing flag
      const initialMeta = {
        title: readable.title,
        url,
        savedAt: Date.now(),
        processingComplete: false,
        coverImage: resolvedCover,
      };
      await FileSystem.writeArticleMeta(articleId, initialMeta);

      this.emitMetaUpdate(articleId, initialMeta);

      // 10. Update FTS5 index
      await this.searchRepo.updateArticleIndex(articleId, {
        title: readable.title,
        plainText: readable.textContent,
        tags: [],
        annotations: [],
      });

      // 11. Emit processing started event
      DeviceEventEmitter.emit(ARTICLE_PROCESSING_STARTED, { articleId });

      // 12. Process images and update HTML in background (non-blocking)
      this.processArticleContentInBackground(
        articleId,
        url,
        readable,
      ).catch(() => {});

      return articleId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Background processing of images and content
   * Updates the existing HTML with downloaded images
   */
  private async processArticleContentInBackground(
    articleId: string,
    url: string,
    readable: any,
  ): Promise<void> {
    try {
      // 1. Extract all image URLs from HTML
      const imageUrls = this.extractImageUrls(readable.content, url);

      // 2. Download images and get mapping of old URL to new URL
      const { imageMap } = await this.downloadImages(articleId, imageUrls);

      // 3. Rewrite HTML with local image paths
      let contentToRewrite = readable.content;

      // Always inject cover image at the top if we have one (og:image is usually the main article image)
      const currentMeta = await FileSystem.readArticleMeta(articleId);
      if (currentMeta?.coverImage) {
        contentToRewrite = `<figure class="pn-cover-image" style="margin: 0 0 1.5em 0;"><img src="${currentMeta.coverImage}" alt="Article image" style="max-width: 100%; height: auto; display: block;" /></figure>` + contentToRewrite;
      }

      if (imageMap.size > 0 || contentToRewrite !== readable.content) {

        const rewrittenHtml = this.htmlRewriter.rewrite(
          contentToRewrite,
          url,
          imageMap,
        );

        // 4. Update HTML file with images
        await FileSystem.writeArticleHtml(articleId, rewrittenHtml);
      }

      // 5. Update metadata to indicate processing is complete
      // IMPORTANT: Preserve existing coverImage - don't overwrite with inline images
      const meta = await FileSystem.readArticleMeta(articleId);
      const updatedMeta = {
        ...meta,
        processingComplete: true,
        processingError: null,
        processingRetries: 0,
        // Preserve the og:image cover that was set during initial save
        coverImage: meta?.coverImage ?? null,
      };
      await FileSystem.writeArticleMeta(articleId, updatedMeta);

      this.emitMetaUpdate(articleId, updatedMeta);
    } catch (error: any) {

      // Detect if this is a network error
      const isNetworkError =
        error.message?.includes('Network request failed') ||
        error.message?.includes('ETIMEDOUT') ||
        error.message?.includes('ECONNREFUSED') ||
        error.code === 'ECONNREFUSED';

      try {
        const meta = await FileSystem.readArticleMeta(articleId);

        if (isNetworkError) {
          // Network error - mark as failed, will retry when connection is restored
          const updatedMeta = {
            ...meta,
            processingComplete: false,
            processingError: 'No internet connection',
            processingRetries: meta.processingRetries || 0,
          };
          await FileSystem.writeArticleMeta(articleId, updatedMeta);

          // Emit failure event
          DeviceEventEmitter.emit(ARTICLE_PROCESSING_FAILED, {
            articleId,
            error: 'No internet connection',
          });
        } else {
          // Other error - mark as complete anyway (user can read text-only article)
          const updatedMeta = {
            ...meta,
            processingComplete: true,
            processingError: null,
            processingRetries: 0,
          };
          await FileSystem.writeArticleMeta(articleId, updatedMeta);
          this.emitMetaUpdate(articleId, updatedMeta);
        }
      } catch {
        // Failed to update metadata after error
      }
    }
  }

  async saveFromUrl(url: string, options: SaveOptions = {}): Promise<string> {
    let articleId: string | null = null;

    try {

      // 1. Fetch HTML
      const html = await this.fetchHtml(url);

      // 2. Parse with Readability
      const readable = await this.readabilityService.extract(html, url);

      // 3. Extract domain and calculate reading metrics
      const domain = this.readabilityService.extractDomain(url);
      const wordCount = this.readabilityService.countWords(readable.textContent);
      const readingTime = this.readabilityService.calculateReadingTime(wordCount);

      // 4. Create article record
      articleId = await this.articleRepo.create({
        title: readable.title,
        url,
        domain,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        archived: false,
        favorite: false,
        readProgress: 0,
        readingTime,
        wordCount,
        hasAssets: false,
      });

      // 5. Create article directory
      await FileSystem.createArticleDirectory(articleId);

      // 6. Extract all image URLs from HTML
      const coverCandidate = this.extractCoverImageCandidate(html, readable.content, url);

      const imageUrls = this.extractImageUrls(readable.content, url);

      // 7. Download images and get mapping of old URL to new URL
      const { imageMap } = await this.downloadImages(articleId, imageUrls);
      // Use og:image for cover, don't use inline images
      const finalCover = await this.resolveCoverImage(articleId, coverCandidate);

      // 8. Rewrite HTML with local image paths
      let contentToRewrite = readable.content;

      // Always inject cover image at the top if we have one (og:image is usually the main article image)
      if (finalCover) {
        contentToRewrite = `<figure class="pn-cover-image" style="margin: 0 0 1.5em 0;"><img src="${finalCover}" alt="Article image" style="max-width: 100%; height: auto; display: block;" /></figure>` + contentToRewrite;
      }
      const rewrittenHtml = this.htmlRewriter.rewrite(
        contentToRewrite,
        url,
        imageMap,
      );

      // 9. Save HTML to file system
      const htmlPath = FileSystem.getArticleHtmlPath(articleId);
      await FileSystem.writeArticleHtml(articleId, rewrittenHtml);

      // 10. Save article content
      await this.articleRepo.createContent({
        articleId,
        htmlPath,
        meta: {
          author: readable.byline,
          excerpt: readable.excerpt,
          siteName: readable.siteName,
        },
      });

      // 11. Save metadata (processing is already complete for synchronous save)
      const metaPayload = {
        title: readable.title,
        url,
        savedAt: Date.now(),
        processingComplete: true,
        coverImage: finalCover || null,
      };
      await FileSystem.writeArticleMeta(articleId, metaPayload);

      this.emitMetaUpdate(articleId, metaPayload);

      // 12. Update FTS5 index
      await this.searchRepo.updateArticleIndex(articleId, {
        title: readable.title,
        plainText: readable.textContent,
        tags: [],
        annotations: [],
      });

      return articleId;
    } catch (error) {

      // Cleanup: Delete article from database if it was created
      if (articleId) {
        try {
          await this.articleRepo.delete(articleId);
        } catch {
          // Failed to cleanup article
        }
      }

      throw error;
    }
  }

  private extractImageUrls(html: string, baseUrl: string): string[] {
    const imageUrls = new Set<string>();

    // Extract from <img> src attributes
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      const src = this.decodeHtmlEntities(match[1]);
      const absoluteUrl = this.makeAbsoluteUrl(src, baseUrl);
      if (absoluteUrl) {
        imageUrls.add(absoluteUrl);
      }
    }

    // Extract from <img> srcset attributes
    const srcsetRegex = /<img[^>]+srcset=["']([^"']+)["']/gi;
    while ((match = srcsetRegex.exec(html)) !== null) {
      const srcset = match[1];
      // srcset format: "url1 1x, url2 2x" or "url1 100w, url2 200w"
      const urls = srcset.split(',').map(part => part.trim().split(/\s+/)[0]);
      urls.forEach(url => {
        const absoluteUrl = this.makeAbsoluteUrl(url, baseUrl);
        if (absoluteUrl) {
          imageUrls.add(absoluteUrl);
        }
      });
    }

    // Extract from data-src (lazy loading)
    const dataSrcRegex = /<img[^>]+data-src=["']([^"']+)["']/gi;
    while ((match = dataSrcRegex.exec(html)) !== null) {
      const src = match[1];
      const absoluteUrl = this.makeAbsoluteUrl(src, baseUrl);
      if (absoluteUrl) {
        imageUrls.add(absoluteUrl);
      }
    }

    // Extract from <picture><source> elements
    const sourceRegex = /<source[^>]+srcset=["']([^"']+)["']/gi;
    while ((match = sourceRegex.exec(html)) !== null) {
      const srcset = match[1];
      // srcset format: "url1 1x, url2 2x" or "url1 100w, url2 200w"
      const urls = srcset.split(',').map(part => part.trim().split(/\s+/)[0]);
      urls.forEach(url => {
        const absoluteUrl = this.makeAbsoluteUrl(url, baseUrl);
        if (absoluteUrl) {
          imageUrls.add(absoluteUrl);
        }
      });
    }

    // Extract from data-srcset (lazy loading with srcset)
    const dataSrcsetRegex = /<img[^>]+data-srcset=["']([^"']+)["']/gi;
    while ((match = dataSrcsetRegex.exec(html)) !== null) {
      const srcset = match[1];
      const urls = srcset.split(',').map(part => part.trim().split(/\s+/)[0]);
      urls.forEach(url => {
        const absoluteUrl = this.makeAbsoluteUrl(url, baseUrl);
        if (absoluteUrl) {
          imageUrls.add(absoluteUrl);
        }
      });
    }

    // Extract from CSS background-image in style attributes
    const bgImageRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
    while ((match = bgImageRegex.exec(html)) !== null) {
      const src = this.decodeHtmlEntities(match[1]);
      const absoluteUrl = this.makeAbsoluteUrl(src, baseUrl);
      if (absoluteUrl) {
        imageUrls.add(absoluteUrl);
      }
    }

    return Array.from(imageUrls);
  }

  private makeAbsoluteUrl(url: string, baseUrl: string): string | null {
    try {
      // Skip data URLs and blob URLs
      if (url.startsWith('data:') || url.startsWith('blob:')) {
        return null;
      }

      // Handle protocol-relative URLs (//example.com/image.jpg)
      if (url.startsWith('//')) {
        return `https:${url}`;
      }

      // If already absolute, return as is
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }

      // Make absolute
      const base = new URL(baseUrl);
      const absolute = new URL(url, base);
      return absolute.href;
    } catch {
      return null;
    }
  }

  private async downloadImages(
    articleId: string,
    imageUrls: string[],
  ): Promise<{ imageMap: Map<string, string> }> {
    const imageMap = new Map<string, string>();
    const assetsDir = FileSystem.getArticleAssetsDirectory(articleId);

    // Assets directory is already created by FileSystem.createArticleDirectory()
    // No need to create it again

    let imageIndex = 0;

    for (const imageUrl of imageUrls) {
      try {

        // Download image
        const response = await RNFetchBlob.config({
          fileCache: false,
        }).fetch('GET', imageUrl);

        if (response.respInfo.status !== 200) {
          continue;
        }

        // Get file extension from Content-Type or URL
        const contentType = response.respInfo.headers['Content-Type'] ||
                          response.respInfo.headers['content-type'] || '';
        const extension = this.getExtensionFromContentType(contentType) ||
                         this.getExtensionFromUrl(imageUrl) || 'jpg';

        // Generate filename
        const filename = `image_${imageIndex}.${extension}`;
        const localPath = `${assetsDir}/${filename}`;

        // Save file
        const base64Data = await response.base64();
        await RNFetchBlob.fs.writeFile(localPath, base64Data, 'base64');

        // Use data URLs for maximum compatibility with WebView
        // Data URLs embed the image directly in HTML, avoiding file:// security issues
        const mimeType = contentType.split(';')[0] || `image/${extension}`;
        const dataUrl = `data:${mimeType};base64,${base64Data}`;
        imageMap.set(imageUrl, dataUrl);
        imageIndex++;
      } catch {
        // Error downloading image
      }
    }
    return { imageMap };
  }

  private getExtensionFromContentType(contentType: string): string | null {
    const mimeType = contentType.split(';')[0].trim().toLowerCase();
    const mimeMap: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'image/bmp': 'bmp',
    };
    return mimeMap[mimeType] || null;
  }

  private getExtensionFromUrl(url: string): string | null {
    try {
      // Extract path from URL
      const urlObj = new URL(url);
      const path = urlObj.href.split('?')[0]; // Remove query params
      const match = path.match(/\.([a-zA-Z0-9]+)$/);
      return match ? match[1].toLowerCase() : null;
    } catch {
      return null;
    }
  }

  private async fetchHtml(url: string): Promise<string> {
    // Add timeout to prevent hanging on slow/unresponsive sites
    const TIMEOUT_MS = 30000; // 30 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        // Add helpful context for common errors
        if (response.status === 401) {
          errorMessage += ' - This website requires authentication or is blocking automated access.';
        } else if (response.status === 403) {
          errorMessage += ' - Access forbidden. The website may be blocking our request.';
        } else if (response.status === 404) {
          errorMessage += ' - Page not found. The URL may be incorrect or the article was removed.';
        } else if (response.status === 429) {
          errorMessage += ' - Too many requests. Try again later.';
        } else if (response.status >= 500) {
          errorMessage += ' - Server error. The website may be down.';
        }

        throw new Error(errorMessage);
      }

      return await response.text();
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Handle timeout abort
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. The website is taking too long to respond. Please try again or check your connection.');
      }

      throw error;
    }
  }

  private emitMetaUpdate(articleId: string, meta: Record<string, any>): void {
    try {
      DeviceEventEmitter.emit(ARTICLE_META_UPDATED_EVENT, {
        articleId,
        meta,
      });
    } catch {
      // Failed to emit article meta update
    }
  }

  private decodeHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#x3a;/gi, ':')
      .replace(/&#x2f;/gi, '/')
      .replace(/&#x3d;/gi, '=')
      .replace(/&#x3f;/gi, '?');
  }

  private extractCoverImageCandidate(
    originalHtml: string,
    readableContent: string,
    baseUrl: string,
  ): string | null {
    // og:image - try both attribute orderings (property before content, and content before property)
    const ogImageMatch = originalHtml.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    ) || originalHtml.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    );
    if (ogImageMatch) {
      const decoded = this.decodeHtmlEntities(ogImageMatch[1]);
      const absolute = this.makeAbsoluteUrl(decoded, baseUrl);
      if (absolute) {
        return absolute;
      }
    }

    // twitter:image - try both attribute orderings
    const twitterImageMatch = originalHtml.match(
      /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    ) || originalHtml.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
    );
    if (twitterImageMatch) {
      const decoded = this.decodeHtmlEntities(twitterImageMatch[1]);
      const absolute = this.makeAbsoluteUrl(decoded, baseUrl);
      if (absolute) {
        return absolute;
      }
    }

    const readableImgMatch = readableContent.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (readableImgMatch) {
      const decoded = this.decodeHtmlEntities(readableImgMatch[1]);
      const absolute = this.makeAbsoluteUrl(decoded, baseUrl);
      if (absolute) {
        return absolute;
      }
    }

    return null;
  }

  /**
   * Retry processing for a failed article
   * Called by NetworkMonitor when connection is restored
   */
  async retryProcessing(articleId: string): Promise<void> {
    try {

      // Read current metadata
      const meta = await FileSystem.readArticleMeta(articleId);

      // Check retry limit
      const retryCount = meta.processingRetries || 0;
      if (retryCount >= 3) {
        return;
      }

      // Check if still needs processing
      if (meta.processingComplete === true) {
        return;
      }

      // Read article from database to get URL
      const article = await this.articleRepo.findById(articleId);
      if (!article) {
        return;
      }

      // Read article content to get the readable content
      const content = await this.articleRepo.getContent(articleId);
      if (!content || !content.meta) {
        return;
      }

      // Increment retry counter
      await FileSystem.writeArticleMeta(articleId, {
        ...meta,
        processingRetries: retryCount + 1,
        processingError: null, // Clear error before retry
      });

      // Emit processing started event
      DeviceEventEmitter.emit(ARTICLE_PROCESSING_STARTED, { articleId });

      // Re-read the original HTML and extract content
      const html = await FileSystem.readArticleHtml(articleId);

      // Create a mock readable object for processing
      const readable = {
        content: html,
        title: article.title,
        byline: content.meta.author,
        excerpt: content.meta.excerpt,
        siteName: content.meta.siteName,
      };

      // Retry background processing
      await this.processArticleContentInBackground(
        articleId,
        article.url,
        readable,
      );
    } catch (error) {
      throw error;
    }
  }

  private async resolveCoverImage(
    articleId: string,
    coverUrl: string | null,
    retryCount: number = 0,
  ): Promise<string | null> {
    if (!coverUrl) {
      return null;
    }

    if (coverUrl.startsWith('data:')) {
      return coverUrl;
    }

    const MAX_RETRIES = 2;
    const userAgents = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];

    try {

      const headers: Record<string, string> = {
        'User-Agent': userAgents[retryCount] || userAgents[0],
        Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
      };

      // Add Referer header on retry (some sites require it)
      if (retryCount > 0) {
        const match = coverUrl.match(/^(https?:\/\/[^/]+)/);
        if (match) {
          headers['Referer'] = `${match[1]}/`;
        }
      }

      const response = await RNFetchBlob.config({
        fileCache: false,
        timeout: 10000, // 10 second timeout
      }).fetch('GET', coverUrl, headers);

      const status = response.respInfo.status;

      if (status !== 200) {
        // Retry with different headers
        if (retryCount < MAX_RETRIES) {
          return this.resolveCoverImage(articleId, coverUrl, retryCount + 1);
        }

        // Return null instead of unusable external URL
        return null;
      }

      const contentType = response.respInfo.headers['Content-Type'] ||
        response.respInfo.headers['content-type'] || '';
      const extension = this.getExtensionFromContentType(contentType) ||
        this.getExtensionFromUrl(coverUrl) || 'jpg';

      const assetsDir = FileSystem.getArticleAssetsDirectory(articleId);
      const filename = `cover.${extension}`;
      const localPath = `${assetsDir}/${filename}`;

      const base64Data = await response.base64();
      await RNFetchBlob.fs.writeFile(localPath, base64Data, 'base64');

      const mimeType = contentType.split(';')[0] || `image/${extension}`;
      const dataUrl = `data:${mimeType};base64,${base64Data}`;

      return dataUrl;
    } catch {
      if (retryCount < MAX_RETRIES) {
        return this.resolveCoverImage(articleId, coverUrl, retryCount + 1);
      }

      // Return null instead of unusable external URL
      return null;
    }
  }
}
