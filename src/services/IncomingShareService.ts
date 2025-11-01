import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { SavePageService } from './SavePageService';
import { useArticleStore } from '../store/articleStore';

type RawSharedItem = {
  id?: string;
  url?: unknown;
  title?: unknown;
  sourceApp?: unknown;
  receivedAt?: unknown;
};

export interface SharedItem {
  id: string;
  url: string;
  title?: string;
  sourceApp?: string;
  receivedAt?: number;
}

interface ShareQueueNativeModule {
  getPendingShares: () => Promise<RawSharedItem[]>;
}

const SHARE_EVENT_NAME = 'ShareQueueNewItemsNotification';

const shareModule: ShareQueueNativeModule | undefined =
  (NativeModules as { ShareQueueModule?: ShareQueueNativeModule })
    .ShareQueueModule;

export class IncomingShareService {
  private static emitter: NativeEventEmitter | null = null;
  private static subscription?: ReturnType<NativeEventEmitter['addListener']>;
  private static readonly saveService = new SavePageService();
  private static readonly queue: SharedItem[] = [];
  private static processing = false;
  private static readonly processedIds = new Set<string>();
  private static initialized = false;

  static initialize(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    if (!shareModule) {
      console.log(
        '[IncomingShareService] ShareQueueModule not available on this platform.',
      );
      return;
    }

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      this.emitter = new NativeEventEmitter(shareModule as any);
      this.subscription = this.emitter.addListener(
        SHARE_EVENT_NAME,
        items => this.enqueueItems(items),
      );
    }

    this.loadInitialItems().catch(error => {
      console.error('[IncomingShareService] Failed to load initial shares', error);
    });
  }

  static teardown(): void {
    this.subscription?.remove();
    this.subscription = undefined;
    this.emitter = null;
    this.initialized = false;
    this.queue.length = 0;
    this.processing = false;
  }

  private static async loadInitialItems(): Promise<void> {
    if (!shareModule) {
      return;
    }

    try {
      const items = await shareModule.getPendingShares();
      this.enqueueItems(items);
    } catch (error) {
      console.error('[IncomingShareService] Error fetching pending shares', error);
    }
  }

  private static enqueueItems(rawItems: unknown): void {
    if (!Array.isArray(rawItems)) {
      return;
    }

    const normalized = rawItems
      .map(item => this.normalizeItem(item))
      .filter((item): item is SharedItem => item !== null)
      .filter(item => !this.processedIds.has(item.id));

    if (normalized.length === 0) {
      return;
    }

    this.queue.push(...normalized);
    this.processQueue().catch(error => {
      console.error('[IncomingShareService] Error while processing queue', error);
    });
  }

  private static normalizeItem(item: unknown): SharedItem | null {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const raw = item as RawSharedItem;
    if (typeof raw.url !== 'string') {
      return null;
    }

    const trimmedUrl = raw.url.trim();
    if (!this.isSupportedUrl(trimmedUrl)) {
      return null;
    }

    const id =
      typeof raw.id === 'string'
        ? raw.id
        : `${trimmedUrl}-${Number(raw.receivedAt) || Date.now()}`;

    const normalized: SharedItem = {
      id,
      url: trimmedUrl,
    };

    if (typeof raw.title === 'string' && raw.title.trim().length > 0) {
      normalized.title = raw.title.trim();
    }

    if (
      typeof raw.sourceApp === 'string' &&
      raw.sourceApp.trim().length > 0
    ) {
      normalized.sourceApp = raw.sourceApp.trim();
    }

    const timestamp = Number(raw.receivedAt);
    if (!Number.isNaN(timestamp) && timestamp > 0) {
      normalized.receivedAt = timestamp;
    }

    return normalized;
  }

  private static async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;
    let listNeedsRefresh = false;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) {
        continue;
      }

      try {
        console.log(
          `[IncomingShareService] Saving shared URL: ${item.url} (id: ${item.id})`,
        );
        await this.saveService.saveFromUrlFast(item.url, {});
        this.processedIds.add(item.id);
        listNeedsRefresh = true;
      } catch (error) {
        console.error(
          `[IncomingShareService] Failed to save shared URL ${item.url}`,
          error,
        );
      }
    }

    if (listNeedsRefresh) {
      const { fetchArticles, currentFilters } = useArticleStore.getState();
      try {
        await fetchArticles(currentFilters);
      } catch (error) {
        console.error(
          '[IncomingShareService] Failed to refresh articles after share',
          error,
        );
      }
    }

    this.processing = false;
  }

  private static isSupportedUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }
}
