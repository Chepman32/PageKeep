import {
  AppState,
  NativeModules,
  NativeEventEmitter,
  Platform,
  Linking,
  AppStateStatus,
} from 'react-native';
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
  markProcessingComplete?: () => void;
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
  private static appStateSubscription?: { remove: () => void };
  private static linkingSubscription?: { remove: () => void };
  private static loadingInitialItems = false;

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

    Linking.getInitialURL()
      .then(url => this.handleIncomingLink(url))
      .catch(error =>
        console.error('[IncomingShareService] Failed to read initial URL', error),
      );

    this.linkingSubscription = Linking.addEventListener('url', event => {
      this.handleIncomingLink(event.url);
    });

    this.appStateSubscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') {
          this.loadInitialItems().catch(error =>
            console.error('[IncomingShareService] Failed to reload shares on foreground', error),
          );
        }
      },
    );
  }

  static teardown(): void {
    this.subscription?.remove();
    this.subscription = undefined;
    this.emitter = null;
    this.initialized = false;
    this.queue.length = 0;
    this.processing = false;
    this.appStateSubscription?.remove?.();
    this.linkingSubscription?.remove?.();
    this.appStateSubscription = undefined;
    this.linkingSubscription = undefined;
  }

  private static async loadInitialItems(): Promise<void> {
    if (!shareModule) {
      return;
    }

    if (this.loadingInitialItems) {
      return;
    }
    this.loadingInitialItems = true;

    try {
      const items = await shareModule.getPendingShares();
      this.enqueueItems(items);
    } catch (error) {
      console.error('[IncomingShareService] Error fetching pending shares', error);
    } finally {
      this.loadingInitialItems = false;
    }
  }

  private static enqueueItems(rawItems: unknown): void {
    if (!Array.isArray(rawItems)) {
      return;
    }

    const normalized = rawItems
      .map(item => this.normalizeItem(item))
      .filter((item): item is SharedItem => item !== null);

    this.enqueueNormalizedItems(normalized);
  }

  private static enqueueNormalizedItems(items: SharedItem[]): void {
    const deduped = items.filter(item => {
      if (this.processedIds.has(item.id)) {
        return false;
      }

      if (this.queue.find(queued => queued.id === item.id)) {
        return false;
      }

      return true;
    });

    if (deduped.length === 0) {
      if (items.length > 0) {
        shareModule?.markProcessingComplete?.();
      }
      return;
    }

    this.queue.push(...deduped);
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

    shareModule.markProcessingComplete?.();
  }

  private static handleIncomingLink(rawUrl: string | null | undefined): void {
    if (!rawUrl) {
      return;
    }

    try {
      const url = new URL(rawUrl);
      if (url.protocol !== 'pagekeep:' || url.hostname.toLowerCase() !== 'share') {
        return;
      }

      const sharedUrl = url.searchParams.get('url');
      if (!sharedUrl) {
        return;
      }

      const rawItem: RawSharedItem = {
        id: url.searchParams.get('id') ?? undefined,
        url: sharedUrl,
        title: url.searchParams.get('title') ?? undefined,
        sourceApp: url.searchParams.get('sourceApp') ?? undefined,
        receivedAt: Date.now(),
      };

      const normalized = this.normalizeItem(rawItem);
      if (normalized) {
        this.enqueueNormalizedItems([normalized]);
      }

      // Also attempt to consume any queued items from native storage
      this.loadInitialItems().catch(error =>
        console.error('[IncomingShareService] Failed to consume queue after link', error),
      );
    } catch (error) {
      console.error('[IncomingShareService] Failed to parse incoming URL', error);
    }
  }

  private static isSupportedUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }
}
