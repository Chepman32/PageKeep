import { ReadabilityService } from './ReadabilityService';
import { HtmlRewriter } from './HtmlRewriter';
import { ArticleRepository } from '../data/repositories/ArticleRepository';
import { SearchRepository } from '../data/repositories/SearchRepository';
import { FileSystem } from '../utils/fileSystem';
import RNFetchBlob from 'react-native-blob-util';

export interface SaveOptions {
  tags?: string[];
  collections?: string[];
}

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
      console.log('Fast saving article from URL:', url);

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

      console.log('Created article (fast):', articleId);

      // 5. Create article directory and save basic content immediately
      await FileSystem.createArticleDirectory(articleId);

      // 6. Save a basic version of the HTML without images (for instant viewing)
      const htmlPath = FileSystem.getArticleHtmlPath(articleId);
      // Use HtmlRewriter to create properly structured HTML (without images for now)
      const basicHtml = this.htmlRewriter.rewrite(readable.content, url, new Map());
      await FileSystem.writeArticleHtml(articleId, basicHtml);
      console.log(`Initial HTML saved to: ${htmlPath}`);

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

      // 8. Save basic metadata with processing flag
      await FileSystem.writeArticleMeta(articleId, {
        title: readable.title,
        url,
        savedAt: Date.now(),
        processingComplete: false, // Will be set to true after background processing
      });

      // 9. Update FTS5 index
      await this.searchRepo.updateArticleIndex(articleId, {
        title: readable.title,
        plainText: readable.textContent,
        tags: [],
        annotations: [],
      });

      // 10. Process images and update HTML in background (non-blocking)
      this.processArticleContentInBackground(
        articleId,
        url,
        readable,
      ).catch(error => {
        console.error('Error processing article content in background:', error);
      });

      // Return immediately
      return articleId;
    } catch (error) {
      console.error('❌ Error fast-saving page:', error);
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
      console.log('Background processing started for:', articleId);

      // 1. Extract all image URLs from HTML
      // Debug: Check what HTML Readability extracted
      const htmlSnippet = readable.content.substring(0, 1000);
      console.log('HTML snippet from Readability:', htmlSnippet);

      const imageUrls = this.extractImageUrls(readable.content, url);
      console.log(`Found ${imageUrls.length} images to download`);
      if (imageUrls.length > 0) {
        console.log('First few images:', imageUrls.slice(0, 5));
      }

      // 2. Download images and get mapping of old URL to new URL
      const imageMap = await this.downloadImages(articleId, imageUrls);

      // 3. Rewrite HTML with local image paths (only if we downloaded images)
      if (imageMap.size > 0) {
        console.log(`Rewriting HTML with ${imageMap.size} image mappings`);

        // Log the main article image mapping
        const soraImage = Array.from(imageMap.entries()).find(([url]) =>
          url.includes('sora.jpg')
        );
        if (soraImage) {
          console.log(`Main image (sora.jpg): ${soraImage[0]}`);
          console.log(`Embedded as data URL of length: ${soraImage[1].length}`);
        }

        const rewrittenHtml = this.htmlRewriter.rewrite(
          readable.content,
          url,
          imageMap,
        );

        // Verify the replacement worked
        if (soraImage && rewrittenHtml.includes(soraImage[1].substring(0, 50))) {
          console.log('✅ Main image successfully embedded in HTML');
        } else if (soraImage) {
          console.log('❌ Main image NOT found in rewritten HTML');
        }

        // 4. Update HTML file with images
        await FileSystem.writeArticleHtml(articleId, rewrittenHtml);
        console.log('HTML updated with downloaded images');
      }

      // 5. Update metadata to indicate processing is complete
      const meta = await FileSystem.readArticleMeta(articleId);
      await FileSystem.writeArticleMeta(articleId, {
        ...meta,
        processingComplete: true,
      });

      console.log('✅ Background processing completed for:', articleId);
    } catch (error) {
      console.error('❌ Error in background processing:', error);
      // Mark as complete even if image download failed
      // User can still read the article with the basic HTML
      try {
        const meta = await FileSystem.readArticleMeta(articleId);
        await FileSystem.writeArticleMeta(articleId, {
          ...meta,
          processingComplete: true,
        });
      } catch (metaError) {
        console.error('Failed to update metadata after error:', metaError);
      }
    }
  }

  async saveFromUrl(url: string, options: SaveOptions = {}): Promise<string> {
    let articleId: string | null = null;

    try {
      console.log('Saving article from URL:', url);

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

      console.log('Created article:', articleId);

      // 5. Create article directory
      await FileSystem.createArticleDirectory(articleId);

      // 6. Extract all image URLs from HTML
      const imageUrls = this.extractImageUrls(readable.content, url);
      console.log(`Found ${imageUrls.length} images to download`);

      // 7. Download images and get mapping of old URL to new URL
      const imageMap = await this.downloadImages(articleId, imageUrls);

      // 8. Rewrite HTML with local image paths
      console.log(`Rewriting HTML with ${imageMap.size} image mappings`);
      const rewrittenHtml = this.htmlRewriter.rewrite(
        readable.content,
        url,
        imageMap,
      );

      // Debug: Check if replacements worked
      const firstMapping = Array.from(imageMap.entries())[0];
      if (firstMapping) {
        const [remoteUrl, localPath] = firstMapping;
        console.log(`Sample mapping:`);
        console.log(`  From: ${remoteUrl.substring(0, 80)}...`);
        console.log(`  To: ${localPath.substring(localPath.length - 60)}`);

        // Check if replacement happened
        if (rewrittenHtml.includes(localPath)) {
          console.log('  ✅ Local path found in HTML');
        } else {
          console.log('  ❌ Local path NOT in HTML');

          // Check what's actually in the HTML
          const imgTag = rewrittenHtml.match(new RegExp(`<img[^>]*src=["'][^"']{0,100}${remoteUrl.substring(remoteUrl.length - 20)}[^"']*["'][^>]*>`, 'i'));
          if (imgTag) {
            console.log(`  Found img tag: ${imgTag[0].substring(0, 150)}...`);
          }
        }
      }

      // 9. Save HTML to file system
      const htmlPath = FileSystem.getArticleHtmlPath(articleId);
      await FileSystem.writeArticleHtml(articleId, rewrittenHtml);
      console.log(`HTML saved to: ${htmlPath}`);

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
      await FileSystem.writeArticleMeta(articleId, {
        title: readable.title,
        url,
        savedAt: Date.now(),
        processingComplete: true,
      });

      // 12. Update FTS5 index
      await this.searchRepo.updateArticleIndex(articleId, {
        title: readable.title,
        plainText: readable.textContent,
        tags: [],
        annotations: [],
      });

      console.log('✅ Article saved successfully:', articleId);
      return articleId;
    } catch (error) {
      console.error('❌ Error saving page:', error);

      // Cleanup: Delete article from database if it was created
      if (articleId) {
        try {
          await this.articleRepo.delete(articleId);
          console.log('Cleaned up failed article:', articleId);
        } catch (cleanupError) {
          console.error('Failed to cleanup article:', cleanupError);
        }
      }

      throw error;
    }
  }

  private extractImageUrls(html: string, baseUrl: string): string[] {
    const imageUrls = new Set<string>();

    // Decode HTML entities helper
    const decodeHtmlEntities = (str: string): string => {
      return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
    };

    // Extract from <img> src attributes
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      const src = decodeHtmlEntities(match[1]);
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
      const src = decodeHtmlEntities(match[1]);
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
  ): Promise<Map<string, string>> {
    const imageMap = new Map<string, string>();
    const assetsDir = FileSystem.getArticleAssetsDirectory(articleId);

    // Assets directory is already created by FileSystem.createArticleDirectory()
    // No need to create it again

    let imageIndex = 0;

    for (const imageUrl of imageUrls) {
      try {
        console.log(`Downloading image ${imageIndex + 1}/${imageUrls.length}:`, imageUrl);

        // Download image
        const response = await RNFetchBlob.config({
          fileCache: false,
        }).fetch('GET', imageUrl);

        if (response.respInfo.status !== 200) {
          console.warn(`Failed to download image: ${imageUrl} (status ${response.respInfo.status})`);
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

        console.log(`Saved image: ${filename}`);
        imageIndex++;
      } catch (error) {
        console.error(`Error downloading image ${imageUrl}:`, error);
      }
    }

    console.log(`Downloaded ${imageIndex} images successfully`);
    return imageMap;
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
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        },
      });

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
    } catch (error) {
      console.error('Error fetching HTML:', error);
      throw error;
    }
  }
}
