import { Asset } from '../domain/Article';
import RNFetchBlob from 'react-native-blob-util';
import { FileSystem } from '../utils/fileSystem';
import { AssetRepository } from '../data/repositories/AssetRepository';
import CryptoJS from 'crypto-js';

export interface QueueProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
}

type ProgressCallback = (progress: QueueProgress) => void;

export class DownloadQueue {
  private queue: Asset[] = [];
  private inProgress: Set<string> = new Set();
  private completed: Set<string> = new Set();
  private failed: Set<string> = new Set();
  private maxConcurrent: number = 3;
  private maxRetries: number = 3;
  private timeout: number = 30000; // 30 seconds
  private maxSize: number = 10 * 1024 * 1024; // 10MB
  private progressCallbacks: ProgressCallback[] = [];
  private assetRepo = new AssetRepository();
  private isRunning: boolean = false;

  constructor(maxConcurrent?: number, maxSize?: number) {
    if (maxConcurrent) this.maxConcurrent = maxConcurrent;
    if (maxSize) this.maxSize = maxSize;
  }

  enqueue(assets: Asset[]): void {
    this.queue.push(...assets);
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.processQueue();
  }

  pause(): void {
    this.isRunning = false;
  }

  getProgress(): QueueProgress {
    return {
      total:
        this.queue.length +
        this.completed.size +
        this.failed.size +
        this.inProgress.size,
      completed: this.completed.size,
      failed: this.failed.size,
      inProgress: this.inProgress.size,
    };
  }

  onProgress(callback: ProgressCallback): void {
    this.progressCallbacks.push(callback);
  }

  private notifyProgress(): void {
    const progress = this.getProgress();
    this.progressCallbacks.forEach(cb => cb(progress));
  }

  private async processQueue(): Promise<void> {
    while (
      this.isRunning &&
      (this.queue.length > 0 || this.inProgress.size > 0)
    ) {
      // Start new downloads if under concurrent limit
      while (
        this.isRunning &&
        this.inProgress.size < this.maxConcurrent &&
        this.queue.length > 0
      ) {
        const asset = this.queue.shift()!;
        this.downloadAsset(asset);
      }

      // Wait a bit before checking again
      await this.sleep(100);
    }

    this.isRunning = false;
  }

  private async downloadAsset(
    asset: Asset,
    retryCount: number = 0,
  ): Promise<void> {
    this.inProgress.add(asset.id);
    this.notifyProgress();

    try {
      // Update status to downloading
      await this.assetRepo.updateStatus(asset.id, 'downloading');

      // Download with timeout
      const response = await Promise.race([
        RNFetchBlob.config({
          fileCache: false,
        }).fetch('GET', asset.srcUrl),
        this.timeoutPromise(this.timeout),
      ]);

      // Check response
      if (response.respInfo.status !== 200) {
        throw new Error(`HTTP ${response.respInfo.status}`);
      }

      // Check size
      const size = parseInt(
        response.respInfo.headers['Content-Length'] || '0',
        10,
      );
      if (size > this.maxSize) {
        throw new Error(`File too large: ${size} bytes`);
      }

      // Get MIME type
      const mime =
        response.respInfo.headers['Content-Type'] || 'application/octet-stream';

      // Get file extension
      const extension =
        FileSystem.getExtensionFromMime(mime) ||
        FileSystem.getExtensionFromUrl(asset.srcUrl) ||
        'bin';

      // Generate filename
      const filename = FileSystem.generateAssetFilename(
        asset.srcUrl,
        extension,
      );
      const localPath = `${FileSystem.getArticleAssetsDirectory(
        asset.articleId,
      )}/${filename}`;

      // Save file
      const base64Data = await response.base64();
      await RNFetchBlob.fs.writeFile(localPath, base64Data, 'base64');

      // Update asset in database
      await this.assetRepo.updateStatus(asset.id, 'done');

      // Mark as completed
      this.inProgress.delete(asset.id);
      this.completed.add(asset.id);
      this.notifyProgress();
    } catch (error) {
      console.error(`Error downloading asset ${asset.id}:`, error);

      // Retry logic
      if (retryCount < this.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        await this.sleep(delay);

        this.inProgress.delete(asset.id);
        await this.downloadAsset(asset, retryCount + 1);
      } else {
        // Mark as failed
        await this.assetRepo.updateStatus(asset.id, 'failed');
        this.inProgress.delete(asset.id);
        this.failed.add(asset.id);
        this.notifyProgress();
      }
    }
  }

  private timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Download timeout')), ms);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  clear(): void {
    this.queue = [];
    this.inProgress.clear();
    this.completed.clear();
    this.failed.clear();
    this.notifyProgress();
  }

  getFailedAssets(): string[] {
    return Array.from(this.failed);
  }
}
