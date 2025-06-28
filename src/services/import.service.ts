/**
 * @file services/import.service.ts
 * @description フレーズのインポート機能
 * 
 * @see docs/design/import-export.md
 * 
 * @related
 * - types/export.types.ts: インポート関連の型定義
 * - utils/duplicate-detector.ts: 重複検出ユーティリティ
 * - components/Import/ConflictDialog.tsx: コンフリクト解決UI
 */

import Papa from 'papaparse';
import { Phrase } from '@/types/models';
import { 
  ImportOptions, 
  ImportConflict, 
  ImportResult,
  CSVRow 
} from '@/types/export.types';
import { db } from '@/services/db.service';
import { detectDuplicates } from '@/utils/duplicate-detector';

export async function parseCSVFile(file: File): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as CSVRow[]);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

export async function parseJSONFile(file: File): Promise<Partial<Phrase>[]> {
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) {
      throw new Error('JSONファイルは配列形式である必要があります');
    }
    return data;
  } catch (error) {
    throw new Error('JSONファイルの解析に失敗しました');
  }
}

export function validateImportData(data: any[]): string[] {
  const errors: string[] = [];
  
  data.forEach((item, index) => {
    if (!item.english || typeof item.english !== 'string') {
      errors.push(`行 ${index + 1}: 英語フレーズが必要です`);
    }
    if (!item.japanese || typeof item.japanese !== 'string') {
      errors.push(`行 ${index + 1}: 日本語訳が必要です`);
    }
  });
  
  return errors;
}

export async function convertToPhrase(row: CSVRow | Partial<Phrase>): Promise<Partial<Phrase>> {
  const tags = typeof row.tags === 'string' 
    ? row.tags.split(';').filter(t => t.trim())
    : (row.tags || []);

  return {
    english: row.english || '',
    japanese: row.japanese || '',
    pronunciation: row.pronunciation || undefined,
    tags,
    categoryId: row.categoryId || 'daily',
    nextReviewDate: row.nextReviewDate 
      ? new Date(row.nextReviewDate)
      : new Date(),
    reviewHistory: (row as Partial<Phrase>).reviewHistory || []
  };
}

export async function detectConflicts(
  importPhrases: Partial<Phrase>[]
): Promise<ImportConflict[]> {
  const existingPhrases = await db.phrases.toArray();
  const conflicts: ImportConflict[] = [];
  
  for (const importPhrase of importPhrases) {
    const duplicates = await detectDuplicates(importPhrase, existingPhrases);
    
    if (duplicates.length > 0) {
      const existing = duplicates[0]; // 最も類似度の高いものを選択
      const differences: string[] = [];
      
      if (existing.english !== importPhrase.english) {
        differences.push('英語フレーズ');
      }
      if (existing.japanese !== importPhrase.japanese) {
        differences.push('日本語訳');
      }
      if (existing.pronunciation !== importPhrase.pronunciation) {
        differences.push('発音');
      }
      if (JSON.stringify(existing.tags) !== JSON.stringify(importPhrase.tags)) {
        differences.push('タグ');
      }
      
      conflicts.push({
        existing,
        imported: importPhrase as Phrase,
        differences
      });
    }
  }
  
  return conflicts;
}

export async function importPhrases(
  phrases: Partial<Phrase>[],
  options: ImportOptions,
  conflictResolutions?: Map<string, 'keep_existing' | 'use_imported' | 'merge_both'>
): Promise<ImportResult> {
  const result: ImportResult = {
    added: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  // バックアップを作成
  const backupId = await createImportBackup();
  
  try {
    for (const phrase of phrases) {
      const existingPhrases = await db.phrases.toArray();
      const duplicates = await detectDuplicates(phrase, existingPhrases);
      
      if (duplicates.length === 0) {
        // 新規追加
        await db.phrases.add({
          ...phrase,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date()
        } as Phrase);
        result.added++;
      } else {
        const existing = duplicates[0];
        const resolution = conflictResolutions?.get(existing.id) || options.mergeStrategy;
        
        switch (resolution) {
          case 'keep_existing':
          case 'skip':
            result.skipped++;
            break;
            
          case 'use_imported':
          case 'overwrite':
            await db.phrases.update(existing.id, {
              ...phrase,
              updatedAt: new Date()
            });
            result.updated++;
            break;
            
          case 'merge_both':
          case 'duplicate':
            await db.phrases.add({
              ...phrase,
              id: crypto.randomUUID(),
              createdAt: new Date(),
              updatedAt: new Date()
            } as Phrase);
            result.added++;
            break;
        }
      }
    }
    
    // 統計を更新
    const totalPhrases = await db.phrases.count();
    await db.stats.where('id').equals('main').modify({
      totalPhrases
    });
    
  } catch (error) {
    // エラー時はロールバック
    await rollbackImport(backupId);
    throw error;
  }
  
  return result;
}

async function createImportBackup(): Promise<string> {
  const phrases = await db.phrases.toArray();
  const backupId = `backup_${Date.now()}`;
  
  await db.backups.add({
    id: backupId,
    data: phrases,
    createdAt: new Date(),
    description: 'インポート前の自動バックアップ'
  });
  
  return backupId;
}

async function rollbackImport(backupId: string): Promise<void> {
  const backup = await db.backups.get(backupId);
  if (!backup) return;
  
  // 全フレーズを削除
  await db.phrases.clear();
  
  // バックアップから復元
  await db.phrases.bulkAdd(backup.data);
}