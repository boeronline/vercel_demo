'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DetailSelection,
  LIFEGRAPH_STORAGE_KEY,
  LifegraphData,
  LifegraphFilters
} from '@/types/data';

type DatasetKey = keyof LifegraphData;

type LifegraphStoreState = {
  data: LifegraphData;
  filters: LifegraphFilters;
  selection: DetailSelection;
  refreshToken: number;
  lastSavedAt?: string;
  setDataset: <K extends DatasetKey>(key: K, value: LifegraphData[K]) => void;
  replaceData: (data: LifegraphData) => void;
  setFilters: (filters: Partial<LifegraphFilters>) => void;
  setSelection: (selection: DetailSelection) => void;
  triggerRefresh: () => void;
  clearData: () => void;
  markSaved: () => void;
};

const emptyData: LifegraphData = {
  people: [],
  events: [],
  deals: [],
  workouts: []
};

const fallbackStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined
};

export const useLifegraphStore = create<LifegraphStoreState>()(
  persist(
    (set) => ({
      data: emptyData,
      filters: {
        work: true,
        family: true,
        health: true,
        school: true
      },
      selection: null,
      refreshToken: 0,
      setDataset: (key, value) =>
        set((state) => ({
          data: {
            ...state.data,
            [key]: value
          }
        })),
      replaceData: (data) => set({ data }),
      setFilters: (filters) =>
        set((state) => ({
          filters: {
            ...state.filters,
            ...filters
          }
        })),
      setSelection: (selection) => set({ selection }),
      triggerRefresh: () =>
        set((state) => ({
          refreshToken: state.refreshToken + 1
        })),
      clearData: () => set({ data: emptyData, selection: null }),
      markSaved: () => set({ lastSavedAt: new Date().toISOString() })
    }),
    {
      name: LIFEGRAPH_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? window.localStorage
          : (fallbackStorage as unknown as Storage)
      )
    }
  )
);
