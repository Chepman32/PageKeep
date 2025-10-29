import { create } from 'zustand';
import { Storage } from '../utils/storage';

interface IAPStore {
  isPro: boolean;
  products: any[];
  loading: boolean;

  loadProducts: () => Promise<void>;
  purchase: (productId: string) => Promise<void>;
  restore: () => Promise<void>;
  setProStatus: (isPro: boolean) => void;
  loadProStatus: () => void;
}

export const useIAPStore = create<IAPStore>((set, get) => ({
  isPro: false,
  products: [],
  loading: false,

  loadProducts: async () => {
    set({ loading: true });
    try {
      // TODO: Implement IAP product loading
      // const products = await RNIap.getProducts(['pagenest_pro']);
      // set({ products, loading: false });
      set({ loading: false });
    } catch (error) {
      console.error('Error loading products:', error);
      set({ loading: false });
    }
  },

  purchase: async (productId: string) => {
    set({ loading: true });
    try {
      // TODO: Implement IAP purchase
      // await RNIap.requestPurchase(productId);
      get().setProStatus(true);
      set({ loading: false });
    } catch (error) {
      console.error('Error purchasing:', error);
      set({ loading: false });
      throw error;
    }
  },

  restore: async () => {
    set({ loading: true });
    try {
      // TODO: Implement IAP restore
      // const purchases = await RNIap.getAvailablePurchases();
      // const hasPro = purchases.some(p => p.productId === 'pagenest_pro');
      // get().setProStatus(hasPro);
      set({ loading: false });
    } catch (error) {
      console.error('Error restoring purchases:', error);
      set({ loading: false });
      throw error;
    }
  },

  setProStatus: (isPro: boolean) => {
    Storage.setProStatus(isPro);
    set({ isPro });
  },

  loadProStatus: () => {
    const isPro = Storage.getProStatus();
    set({ isPro });
  },
}));
