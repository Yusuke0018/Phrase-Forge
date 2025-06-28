/**
 * @file services/db.service.ts
 * @description IndexedDBを使用したローカルストレージ管理
 * 
 * @see docs/design/local-storage.md
 * 
 * @related
 * - types/models.ts: データモデル定義
 * - stores/phrase.store.ts: フレーズ状態管理
 * - services/backup.service.ts: バックアップ機能
 */

import Dexie, { Table } from 'dexie';
import { Phrase, Category, Tag, UserStats } from '@/types/models';

export interface DBBackup {
  id: string;
  data: any;
  createdAt: Date;
  description?: string;
}

class PhraseForgeDB extends Dexie {
  phrases!: Table<Phrase>;
  categories!: Table<Category>;
  tags!: Table<Tag>;
  stats!: Table<UserStats & { id: string }>;
  backups!: Table<DBBackup>;

  constructor() {
    super('PhraseForgeDB');
    
    this.version(1).stores({
      phrases: 'id, english, categoryId, nextReviewDate, createdAt, updatedAt',
      categories: 'id, name, createdAt',
      tags: 'id, name, createdAt',
      stats: 'id',
      backups: 'id, createdAt'
    });
  }
}

export const db = new PhraseForgeDB();

// 初期データのセットアップ
export async function initializeDB() {
  const count = await db.categories.count();
  
  if (count === 0) {
    // 初期統計データのみ作成（カテゴリはユーザーが自分で作成）
    const statsCount = await db.stats.count();
    if (statsCount === 0) {
      await db.stats.add({
        id: 'main',
        totalPhrases: 0,
        phrasesLearned: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalReviews: 0
      });
    }
  }
}

// ユーティリティ関数
export async function getTodaysPhrases(): Promise<Phrase[]> {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  return await db.phrases
    .where('nextReviewDate')
    .belowOrEqual(today)
    .toArray();
}

export async function updatePhraseReviewDate(
  phraseId: string,
  nextReviewDate: Date,
  interval: string,
  difficulty: number = 0.5
): Promise<void> {
  const phrase = await db.phrases.get(phraseId);
  if (!phrase) throw new Error('Phrase not found');

  await db.phrases.update(phraseId, {
    nextReviewDate,
    reviewHistory: [
      ...phrase.reviewHistory,
      {
        date: new Date(),
        interval: interval as any,
        difficulty: difficulty
      }
    ],
    updatedAt: new Date()
  });

  // 統計の更新
  await db.stats.where('id').equals('main').modify((stats) => {
    stats.totalReviews++;
    stats.lastReviewDate = new Date();
  });
}