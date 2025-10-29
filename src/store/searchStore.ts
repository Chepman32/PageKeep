import { create } from 'zustand';
import { SearchResult, ArticleFilters } from '../domain/Article';
import { SearchRepository } from '../data/repositories/SearchRepository';
import { Storage } from '../utils/storage';

interface SearchStore {
  query: string;
  results: SearchResult[];
  filters: ArticleFilters;
  history: string[];
  loading: boolean;

  setQuery: (query: string) => void;
  search: () => Promise<void>;
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  setFilters: (filters: ArticleFilters) => void;
  loadHistory: () => void;
}

const searchRepo = new SearchRepository();

export const useSearchStore = create<SearchStore>((set, get) => ({
  query: '',
  results: [],
  filters: {},
  history: [],
  loading: false,

  setQuery: (query: string) => set({ query }),

  search: async () => {
    const { query, filters } = get();

    if (!query.trim()) {
      set({ results: [] });
      return;
    }

    set({ loading: true });

    try {
      const results = await searchRepo.search(query, filters);
      set({ results, loading: false });

      // Add to history
      get().addToHistory(query);
    } catch (error) {
      console.error('Search error:', error);
      set({ results: [], loading: false });
    }
  },

  addToHistory: (query: string) => {
    if (!query.trim()) return;

    Storage.addToSearchHistory(query);
    set({ history: Storage.getSearchHistory() });
  },

  clearHistory: () => {
    Storage.clearSearchHistory();
    set({ history: [] });
  },

  setFilters: (filters: ArticleFilters) => set({ filters }),

  loadHistory: () => {
    set({ history: Storage.getSearchHistory() });
  },
}));
