import NetInfo from '@react-native-community/netinfo';
import { ArticleProcessingState } from '../utils/articleProcessingState';
import { SavePageService } from './SavePageService';

/**
 * Network Monitor Service
 * Watches network connection state and triggers auto-retry for failed article downloads
 */
class NetworkMonitorService {
  private savePageService: SavePageService;
  private unsubscribe: (() => void) | null = null;
  private wasOffline = false;

  constructor() {
    this.savePageService = new SavePageService();
  }

  /**
   * Start monitoring network state
   */
  start(): void {
    if (this.unsubscribe) {
      console.log('[NetworkMonitor] Already monitoring');
      return;
    }

    console.log('[NetworkMonitor] Starting network monitoring');

    this.unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;

      console.log('[NetworkMonitor] Network state:', {
        connected: isConnected,
        type: state.type,
        wasOffline: this.wasOffline,
      });

      // Detect transition from offline → online
      if (isConnected && this.wasOffline) {
        console.log('[NetworkMonitor] Connection restored, triggering auto-retry');
        this.handleConnectionRestored();
      }

      this.wasOffline = !isConnected;
    });
  }

  /**
   * Stop monitoring network state
   */
  stop(): void {
    if (this.unsubscribe) {
      console.log('[NetworkMonitor] Stopping network monitoring');
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Handle connection restored event
   * Retry all failed article downloads
   */
  private async handleConnectionRestored(): Promise<void> {
    const failedArticles = ArticleProcessingState.getFailedArticles();

    if (failedArticles.length === 0) {
      console.log('[NetworkMonitor] No failed articles to retry');
      return;
    }

    console.log(`[NetworkMonitor] Retrying ${failedArticles.length} failed articles`);

    // Retry each failed article with a small delay between them
    for (let i = 0; i < failedArticles.length; i++) {
      const articleId = failedArticles[i];

      try {
        // Small delay to avoid overwhelming the network
        if (i > 0) {
          await new Promise<void>(resolve => setTimeout(resolve, 500));
        }

        console.log(`[NetworkMonitor] Retrying article ${i + 1}/${failedArticles.length}: ${articleId}`);
        await this.savePageService.retryProcessing(articleId);
      } catch (error) {
        console.error(`[NetworkMonitor] Failed to retry article ${articleId}:`, error);
        // Continue with next article even if one fails
      }
    }
  }

  /**
   * Get current connection status
   */
  async isConnected(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return !!(state.isConnected && state.isInternetReachable !== false);
  }
}

// Singleton instance
export const NetworkMonitor = new NetworkMonitorService();
