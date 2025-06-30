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
  
  // キャッシュ
  statsCache: any | null;
  statsCacheTimestamp: number;
  
  // アクション
  loadPhrases: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadTags: () => Promise<void>;
  loadTodaysPhrases: () => Promise<void>;
  
  addPhrase: (phrase: Omit<Phrase, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePhrase: (id: string, updates: Partial<Phrase>) => Promise<void>;
  deletePhrase: (id: string) => Promise<void>;
  
  addCategory: (name: string) => Promise<string>;
  
  setCurrentPhraseIndex: (index: number) => void;
  moveToNextPhrase: () => void;
  removeReviewedPhrase: (phraseId: string) => void;
  
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
  statsCache: null,
  statsCacheTimestamp: 0,

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
      
      // キャッシュを無効化
      set({ statsCache: null });
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
      
      // キャッシュを無効化（レビュー履歴が変更される可能性があるため）
      set({ statsCache: null });
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
      
      // キャッシュを無効化
      set({ statsCache: null });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addCategory: async (name) => {
    try {
      const newCategory = {
        id: crypto.randomUUID(),
        name: name.trim(),
        icon: '📁', // デフォルトアイコン
        color: '#3B82F6', // デフォルトカラー
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.categories.add(newCategory);
      
      // カテゴリリストを再読み込み
      const categories = await db.categories.toArray();
      set({ categories });
      
      return newCategory.id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
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

  removeReviewedPhrase: (phraseId: string) => {
    set((state) => {
      const newTodaysPhrases = state.todaysPhrases.filter((p) => p.id !== phraseId);
      // 現在のインデックスが配列の範囲外になった場合は調整
      const newIndex = Math.min(state.currentPhraseIndex, newTodaysPhrases.length - 1);
      return {
        todaysPhrases: newTodaysPhrases,
        currentPhraseIndex: Math.max(0, newIndex)
      };
    });
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
    const state = get();
    const CACHE_DURATION = 5 * 60 * 1000; // 5分間キャッシュ
    
    // キャッシュが有効な場合は返す
    if (state.statsCache && Date.now() - state.statsCacheTimestamp < CACHE_DURATION) {
      return state.statsCache;
    }
    
    const stats = await db.stats.where('id').equals('main').first();
    
    // 連続記録の計算
    const phrases = await db.phrases.toArray();
    
    // 現在の日付を作成
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // 各日のレビュー有無をチェック（最大365日前まで）
    let currentStreak = 0;
    let streakActive = true;
    
    for (let i = 0; i < 365 && streakActive; i++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(checkDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // その日にレビューがあったかチェック
      const hasReview = phrases.some(phrase => 
        phrase.reviewHistory.some(review => {
          const reviewDate = new Date(review.date);
          return reviewDate >= checkDate && reviewDate < nextDate;
        })
      );
      
      if (hasReview) {
        currentStreak++;
      } else if (i === 0) {
        // 今日レビューしていない場合は、連続記録は昨日まで
        streakActive = false;
      } else {
        // 過去の日でレビューがない場合は連続記録終了
        streakActive = false;
      }
    }
    
    // 統計を更新
    if (stats) {
      stats.currentStreak = currentStreak;
      stats.longestStreak = Math.max(currentStreak, stats.longestStreak || 0);
      
      // DBも更新
      await db.stats.where('id').equals('main').modify({
        currentStreak: currentStreak,
        longestStreak: stats.longestStreak
      });
    }
    
    // 効率的なデータ取得のため、必要な部分のみを取得
    const phrasesCount = await db.phrases.count();
    
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
      
      // その日のレビュー回数をカウント
      const reviewCount = phrases.reduce((total, phrase) => {
        return total + phrase.reviewHistory.filter(review => {
          const reviewDate = new Date(review.date);
          return reviewDate >= date && reviewDate < nextDate;
        }).length;
      }, 0);
      
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

    // 月間レビュー数を計算
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const monthlyReviews = phrases.reduce((total, phrase) => {
      return total + phrase.reviewHistory.filter(review => {
        const reviewDate = new Date(review.date);
        return reviewDate >= firstDayOfMonth && reviewDate <= lastDayOfMonth;
      }).length;
    }, 0);

    // 平均習熟度を計算（難易度の平均値）
    const averageMastery = phrases.length > 0
      ? phrases.reduce((sum, phrase) => {
          // 最新のレビューの難易度を使用
          const latestReview = phrase.reviewHistory[phrase.reviewHistory.length - 1];
          return sum + (latestReview?.difficulty || 0.5);
        }, 0) / phrases.length
      : 0;

    const result = {
      ...stats,
      categoryStats: Array.from(categoryStats.entries()).map(([id, count]) => ({
        categoryId: id,
        count
      })),
      dailyStats,
      masteryLevels,
      monthlyReviews,
      averageMastery: Math.round(averageMastery * 100) // パーセンテージとして表示
    };
    
    // 結果をキャッシュに保存
    set({ 
      statsCache: result,
      statsCacheTimestamp: Date.now()
    });
    
    return result;
  },
}))