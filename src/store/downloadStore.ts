import { create } from 'zustand';
import { Asset } from '../domain/Article';
import { QueueProgress } from '../services/DownloadQueue';

interface DownloadStore {
  queue: Asset[];
  progress: QueueProgress;

  addToQueue: (assets: Asset[]) => void;
  updateProgress: (progress: QueueProgress) => void;
  clearQueue: () => void;
}

export const useDownloadStore = create<DownloadStore>(set => ({
  queue: [],
  progress: {
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: 0,
  },

  addToQueue: (assets: Asset[]) => {
    set(state => ({
      queue: [...state.queue, ...assets],
    }));
  },

  updateProgress: (progress: QueueProgress) => {
    set({ progress });
  },

  clearQueue: () => {
    set({
      queue: [],
      progress: {
        total: 0,
        completed: 0,
        failed: 0,
        inProgress: 0,
      },
    });
  },
}));
