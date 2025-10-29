import ReactNativeBlobUtil from 'react-native-blob-util';
import { Asset } from '../domain/Article';
import { FileSystem } from '../utils/fileSystem';
import CryptoJS from 'crypto-js';

export interface DownloadOptions {
  maxSize?: number; // in bytes
  timeout?: number; // in milliseconds
  validateMime?: boolean;
}

export class AssetDownloader {
  private readonly DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds

  async download(
    asset: Asset,
    destinationPath: string,
    options: DownloadOptions = {},
  ): Promise<void> {
    const maxSize = options.maxSize || this.DEFAULT_MAX_SIZE;
    const timeout = options.timeout || this.DEFAULT_TIMEOUT;

    try {
      // Download the file
      const response = await ReactNativeBlobUtil.config({
        path: destinationPath,
        timeout,
      }).fetch('GET', asset.srcUrl);

      // Get file info
      const info = await response.info();
      const statusCode = info.status;

      if (statusCode < 200 || statusCode >= 300) {
        throw new Error(`HTTP ${statusCode}`);
      }

      // Validate file size
      const fileSize = parseInt(info.headers['Content-Length'] || '0', 10);
      if (fileSize > maxSize) {
        await ReactNativeBlobUtil.fs.unlink(destinationPath);
        throw new Error(`File too large: ${fileSize} bytes`);
      }

      // Validate MIME type if requested
      if (options.validateMime) {
        const contentType = info.headers['Content-Type'] || '';
        if (!this.isValidMimeType(asset.type, contentType)) {
          await ReactNativeBlobUtil.fs.unlink(destinationPath);
          throw new Error(`Invalid MIME type: ${contentType}`);
        }
      }

      // Verify file was written
      const exists = await ReactNativeBlobUtil.fs.exists(destinationPath);
      if (!exists) {
        throw new Error('File was not written');
      }
    } catch (error) {
      // Clean up on error
      try {
        await ReactNativeBlobUtil.fs.unlink(destinationPath);
      } catch {}

      throw error;
    }
  }

  async downloadToArticleAssets(
    asset: Asset,
    articleId: string,
  ): Promise<string> {
    const assetsDir = FileSystem.getArticleAssetsDirectory(articleId);
    await FileSystem.ensureDirectoryExists(assetsDir);

    const filename = FileSystem.generateAssetFilename(
      asset.srcUrl,
      FileSystem.getExtensionFromMime(asset.mime),
    );

    const destinationPath = `${assetsDir}/${filename}`;

    await this.download(asset, destinationPath, {
      validateMime: true,
    });

    return filename;
  }

  private isValidMimeType(assetType: Asset['type'], mimeType: string): boolean {
    const mime = mimeType.toLowerCase();

    switch (assetType) {
      case 'image':
        return mime.startsWith('image/');

      case 'css':
        return mime.includes('css') || mime.includes('text');

      case 'font':
        return (
          mime.includes('font') ||
          mime.includes('woff') ||
          mime.includes('ttf') ||
          mime.includes('otf')
        );

      default:
        return true;
    }
  }

  generateHash(url: string): string {
    return CryptoJS.SHA1(url).toString();
  }

  async validateDownload(
    path: string,
    expectedSize?: number,
  ): Promise<boolean> {
    try {
      const exists = await ReactNativeBlobUtil.fs.exists(path);
      if (!exists) return false;

      if (expectedSize) {
        const stat = await ReactNativeBlobUtil.fs.stat(path);
        return stat.size === expectedSize;
      }

      return true;
    } catch {
      return false;
    }
  }
}
