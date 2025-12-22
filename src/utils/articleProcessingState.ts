import { DeviceEventEmitter } from 'react-native';

export const ARTICLE_PROCESSING_STARTED = 'ArticleProcessingStarted';
export const ARTICLE_PROCESSING_FAILED = 'ArticleProcessingFailed';

export interface ArticleProcessingPayload {
  articleId: string;
  error?: string;
}

/**
 * Lightweight state manager for article processing status
 * Syncs with metadata files via events
 * Single source of truth is meta.json, this is just a cache for UI performance
 */
class ArticleProcessingStateManager {
  private processingSet = new Set<string>();
  private failedMap = new Map<string, string>();

  constructor() {
    // Subscribe to processing events to keep state in sync
    DeviceEventEmitter.addListener(
      ARTICLE_PROCESSING_STARTED,
      (payload: ArticleProcessingPayload) => {
        this.addProcessing(payload.articleId);
      }
    );

    DeviceEventEmitter.addListener(
      ARTICLE_PROCESSING_FAILED,
      (payload: ArticleProcessingPayload) => {
        this.setFailed(payload.articleId, payload.error || 'Unknown error');
      }
    );

    // ARTICLE_META_UPDATED_EVENT means processing completed successfully
    DeviceEventEmitter.addListener(
      'ArticleMetaUpdated',
      (payload: any) => {
        if (payload.meta?.processingComplete === true) {
          this.removeProcessing(payload.articleId);
          this.clearFailed(payload.articleId);
        }
      }
    );
  }

  addProcessing(articleId: string): void {
    this.processingSet.add(articleId);
    // Remove from failed if it was there (retry scenario)
    this.failedMap.delete(articleId);
  }

  removeProcessing(articleId: string): void {
    this.processingSet.delete(articleId);
  }

  setFailed(articleId: string, error: string): void {
    this.processingSet.delete(articleId);
    this.failedMap.set(articleId, error);
  }

  clearFailed(articleId: string): void {
    this.failedMap.delete(articleId);
  }

  isProcessing(articleId: string): boolean {
    return this.processingSet.has(articleId);
  }

  hasFailed(articleId: string): boolean {
    return this.failedMap.has(articleId);
  }

  getError(articleId: string): string | null {
    return this.failedMap.get(articleId) || null;
  }

  getFailedArticles(): string[] {
    return Array.from(this.failedMap.keys());
  }
}

// Singleton instance
export const ArticleProcessingState = new ArticleProcessingStateManager();
