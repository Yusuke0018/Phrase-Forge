/**
 * @file stores/phrase.store.ts
 * @description フレーズデータの状態管理
 * 
 * @see docs/design/state-management.md
 * 
 * @related
 * - types/models.ts: Phraseモデル定義
 * - services/db.service.ts: データベース操作
 * - hooks/usePhrases.ts: フレーズ操作フック
 */

import { create } from 'zustand';
import { Phrase, Category, Tag } from '@/types/models';
import { db, getTodaysPhrases } from '@/services/db.service';

interface PhraseStore {
  // データ
  phrases: Phrase[];
  categories: Category[];
  tags: Tag[];
  todaysPhrases: Phrase[];
  currentPhraseIndex: number;
  
  // ローディング状態
  isLoading: boolean;
  error: string | null;
  
  // アクション
  loadPhrases: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadTags: () => Promise<void>;
  loadTodaysPhrases: () => Promise<void>;
  
  addPhrase: (phrase: Omit<Phrase, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePhrase: (id: string, updates: Partial<Phrase>) => Promise<void>;
  deletePhrase: (id: string) => Promise<void>;
  
  setCurrentPhraseIndex: (index: number) => void;
  moveToNextPhrase: () => void;
  
  searchPhrases: (query: string) => Promise<Phrase[]>;
  filterByTag: (tagId: string) => Promise<Phrase[]>;
  filterByCategory: (categoryId: string) => Promise<Phrase[]>;
  
  getStats: () => Promise<any>;
}

export const usePhraseStore = create<PhraseStore>((set, get) => ({
  // 初期状態
  phrases: [],
  categories: [],
  tags: [],
  todaysPhrases: [],
  currentPhraseIndex: 0,
  isLoading: false,
  error: null,

  // データ読み込み
  loadPhrases: async () => {
    set({ isLoading: true, error: null });
    try {
      const phrases = await db.phrases.toArray();
      set({ phrases, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadCategories: async () => {
    try {
      const categories = await db.categories.toArray();
      set({ categories });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  loadTags: async () => {
    try {
      const tags = await db.tags.toArray();
      set({ tags });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  loadTodaysPhrases: async () => {
    set({ isLoading: true, error: null });
    try {
      const todaysPhrases = await getTodaysPhrases();
      set({ todaysPhrases, currentPhraseIndex: 0, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // フレーズ操作
  addPhrase: async (phraseData) => {
    try {
      const newPhrase: Phrase = {
        ...phraseData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await db.phrases.add(newPhrase);
      const phrases = [...get().phrases, newPhrase];
      set({ phrases });
      
      // 統計を更新
      await db.stats.where('id').equals('main').modify((stats) => {
        stats.totalPhrases++;
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updatePhrase: async (id, updates) => {
    try {
      await db.phrases.update(id, {
        ...updates,
        updatedAt: new Date(),
      });
      
      const phrases = get().phrases.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      );
      set({ phrases });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deletePhrase: async (id) => {
    try {
      await db.phrases.delete(id);
      const phrases = get().phrases.filter((p) => p.id !== id);
      set({ phrases });
      
      // 統計を更新
      await db.stats.where('id').equals('main').modify((stats) => {
        stats.totalPhrases--;
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // ナビゲーション
  setCurrentPhraseIndex: (index) => {
    set({ currentPhraseIndex: index });
  },

  moveToNextPhrase: () => {
    const { currentPhraseIndex, todaysPhrases } = get();
    if (currentPhraseIndex < todaysPhrases.length - 1) {
      set({ currentPhraseIndex: currentPhraseIndex + 1 });
    }
  },

  // 検索・フィルタ
  searchPhrases: async (query) => {
    const lowerQuery = query.toLowerCase();
    const phrases = await db.phrases
      .filter((phrase) =>
        phrase.english.toLowerCase().includes(lowerQuery) ||
        phrase.japanese.toLowerCase().includes(lowerQuery)
      )
      .toArray();
    return phrases;
  },

  filterByTag: async (tagId) => {
    const phrases = await db.phrases
      .filter((phrase) => phrase.tags.includes(tagId))
      .toArray();
    return phrases;
  },

  filterByCategory: async (categoryId) => {
    const phrases = await db.phrases
      .where('categoryId')
      .equals(categoryId)
      .toArray();
    return phrases;
  },

  getStats: async () => {
    const stats = await db.stats.where('id').equals('main').first();
    const phrases = await db.phrases.toArray();
    
    // カテゴリ別統計
    const categoryStats = new Map();
    phrases.forEach(phrase => {
      const count = categoryStats.get(phrase.categoryId) || 0;
      categoryStats.set(phrase.categoryId, count + 1);
    });

    // 日別学習履歴（最近30日）
    const today = new Date();
    const dailyStats = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // その日にレビューされたフレーズ数をカウント
      const reviewCount = phrases.filter(phrase => {
        return phrase.reviewHistory.some(review => {
          const reviewDate = new Date(review.date);
          return reviewDate >= date && reviewDate < nextDate;
        });
      }).length;
      
      dailyStats.push({
        date: date.toISOString().split('T')[0],
        count: reviewCount
      });
    }

    // 習熟度別統計
    const masteryLevels = {
      beginner: 0,    // レビュー回数 0-2
      intermediate: 0, // レビュー回数 3-5
      advanced: 0,    // レビュー回数 6+
    };
    
    phrases.forEach(phrase => {
      const reviewCount = phrase.reviewHistory.length;
      if (reviewCount <= 2) masteryLevels.beginner++;
      else if (reviewCount <= 5) masteryLevels.intermediate++;
      else masteryLevels.advanced++;
    });

    return {
      ...stats,
      categoryStats: Array.from(categoryStats.entries()).map(([id, count]) => ({
        categoryId: id,
        count
      })),
      dailyStats,
      masteryLevels
    };
  },
}))