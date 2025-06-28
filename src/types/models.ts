/**
 * @file types/models.ts
 * @description アプリケーションのデータモデル定義
 * 
 * @see docs/design/data-model.md
 * 
 * @related
 * - services/db.service.ts: IndexedDBスキーマ定義
 * - stores/phrase.store.ts: フレーズ状態管理
 */

export type ReviewInterval = 'tomorrow' | 'three_days' | 'one_week' | 'two_weeks' | 'one_month';

export interface ReviewRecord {
  date: Date;
  interval: ReviewInterval;
  difficulty: number; // 0-1
}

export interface Phrase {
  id: string;
  english: string;
  japanese: string;
  pronunciation?: string;
  tags: string[];
  categoryId: string;
  nextReviewDate: Date;
  reviewHistory: ReviewRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
}

export interface UserStats {
  totalPhrases: number;
  phrasesLearned: number;
  currentStreak: number;
  longestStreak: number;
  totalReviews: number;
  lastReviewDate?: Date;
}