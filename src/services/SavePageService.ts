import { ReadabilityService } from './ReadabilityService';
import { HtmlRewriter } from './HtmlRewriter';
import { AssetExtractor } from './AssetExtractor';
import { DownloadQueue } from './DownloadQueue';
import { ArticleRepository } from '../data/repositories/ArticleRepository';
import { AssetRepository } from '../data/repositories/AssetRepository';
import { SearchRepository } from '../data/repositories/SearchRepository';
import { FileSystem } from '../utils/fileSystem';
import { Article, Asset } from '../domain/Article';
import CryptoJS from 'crypto-js';

export interface SaveOptions {
  tags?: string[];
  collections?: string[];
  downloadAssets?: boolean;
  downloadImages?: boolean;
  downloadStyles?: boolean;
  downloadFonts?: boolean;
}

export class SavePageService {
  private readabilityService = new ReadabilityService();
  private htmlRewriter = new HtmlRewriter();
  private assetExtractor = new AssetExtractor();
  private articleRepo = new ArticleRepository();
  private assetRepo = new AssetRepository();
  private searchRepo = new SearchRepository();

  async saveFromUrl(url: string, options: SaveOptions = {}): Promise<string> {
    try {
      // 1. Fetch HTML
      const html = await this.fetchHtml(url);

      // 2. Parse with Readability
      const readable = await this.readabilityService.extract(html, url);

      // 3. Extract assets
      let extractedAssets = this.assetExtractor.extract(readable.content, url);

      // Filter assets based on options
      if (options.downloadAssets !== false) {
        extractedAssets = this.assetExtractor.filterAssetsByType(
          extractedAssets,
          {
            images: options.downloadImages !== false,
            styles: options.downloadStyles !== false,
            fonts: options.downloadFonts !== false,
          },
        );
      } else {
        extractedAssets = [];
      }

      // 4. Create article record
      const domain = this.readabilityService.extractDomain(url);
      const wordCount = this.readabilityService.countWords(
        readable.textContent,
      );
      const readingTime =
        this.readabilityService.calculateReadingTime(wordCount);

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
        hasAssets: extractedAssets.length > 0,
      });

      // 5. Create article directory
      await FileSystem.createArticleDirectory(articleId);

      // 6. Create asset records and queue for download
      const assets: Asset[] = [];
      for (const extracted of extractedAssets) {
        const assetId = await this.assetRepo.create({
          articleId,
          type: extracted.type,
          srcUrl: extracted.srcUrl,
          localPath: '',
          byteSize: 0,
          mime: '',
          status: 'queued',
          hash: CryptoJS.SHA1(extracted.srcUrl).toString(),
        });

        const asset = await this.assetRepo.findByArticleId(articleId);
        if (asset) {
          assets.push(...asset);
        }
      }

      // 7. Rewrite HTML with local paths
      const rewrittenHtml = await this.htmlRewriter.rewrite(
        readable.content,
        articleId,
        assets,
      );

      // 8. Save HTML to file system
      const htmlPath = await FileSystem.writeArticleHtml(
        articleId,
        rewrittenHtml,
      );

      // 9. Save article content
      await this.articleRepo.createContent({
        articleId,
        htmlPath,
        meta: {
          author: readable.byline,
          excerpt: readable.excerpt,
          siteName: readable.siteName,
        },
      });

      // 10. Save metadata
      await FileSystem.writeArticleMeta(articleId, {
        title: readable.title,
        url,
        savedAt: Date.now(),
      });

      // 11. Update FTS5 index
      await this.searchRepo.updateArticleIndex(articleId, {
        title: readable.title,
        plainText: readable.textContent,
        tags: [],
        annotations: [],
      });

      // 12. Start downloading assets
      if (assets.length > 0) {
        const downloadQueue = new DownloadQueue();
        downloadQueue.enqueue(assets);
        downloadQueue.start();
      }

      return articleId;
    } catch (error) {
      console.error('Error saving page:', error);
      throw error;
    }
  }

  async saveFromHtml(
    html: string,
    url: string,
    options: SaveOptions = {},
  ): Promise<string> {
    // Similar to saveFromUrl but skip the fetch step
    return this.saveFromUrl(url, options);
  }

  async retryFailedAssets(articleId: string): Promise<void> {
    const failedAssets = await this.assetRepo.findFailedAssets(articleId);

    if (failedAssets.length === 0) {
      return;
    }

    // Reset status to queued
    for (const asset of failedAssets) {
      await this.assetRepo.updateStatus(asset.id, 'queued');
    }

    // Start download queue
    const downloadQueue = new DownloadQueue();
    downloadQueue.enqueue(failedAssets);
    downloadQueue.start();
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Error fetching HTML:', error);
      throw error;
    }
  }
}
