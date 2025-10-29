import { create } from 'zustand';
import { Article, ArticleFilters } from '../domain/Article';
import { ArticleRepository } from '../data/repositories/ArticleRepository';

interface ArticleStore {
  articles: Article[];
  loading: boolean;
  error: string | null;
  
  fetchArticles: (filters?: ArticleFilters) => Promise<void>;
  addArticle: (article: Article) => void;
  updateArticle: (id: string, updates: Partial<Article>) => void;
  deleteArticle: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  toggleArchive: (id: string) => Promise<void>;
  clearError: () => void;
}

const articleRepo = new ArticleRepository();

export const useArticleStore = create<ArticleStore>((set, get) => ({
  articles: [],
  loading: false,
  error: null,

  fetchArticles: async (filters?: ArticleFilters) => {
    set({ loading: true, error: null });
    try {
      const articles = await articleRepo.findAll(filters);
      set({ articles, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch articles',
        loading: false 
      });
    }
  },

  addArticle: (article: Article) => {
    set(state => ({
      articles: [article, ...state.articles]
    }));
  },

  updateArticle: (id: string, updates: Partial<Article>) => {
    set(state => ({
      articles: state.articles.map(article =>
        article.id === id ? { ...article, ...updates } : article
      )
    }));
  },

  deleteArticle: async (id: string) => {
    try {
      await articleRepo.delete(id);
      set(state => ({
        articles: state.articles.filter(article => article.id !== id)
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete article'
      });
    }
  },

  toggleFavorite: async (id: string) => {
    try {
      await articleRepo.toggleFavorite(id);
      set(state => ({
        articles: state.articles.map(article =>
          article.id === id ? { ...article, favorite: !article.favorite } : article
        )
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to toggle favorite'
      });
    }
  },

  toggleArchive: async (id: string) => {
    try {
      await articleRepo.toggleArchive(id);
      set(state => ({
        articles: state.articles.map(article =>
          article.id === id ? { ...article, archived: !article.archived } : article
        )
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to toggle archive'
      });
    }
  },

  clearError: () => set({ error: null }),
}));
