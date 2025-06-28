/**
 * @file types/export.types.ts
 * @description インポート/エクスポート関連の型定義
 * 
 * @see docs/design/import-export.md
 * 
 * @related
 * - services/export.service.ts: エクスポート処理
 * - services/import.service.ts: インポート処理
 * - components/Import/ConflictDialog.tsx: コンフリクト解決UI
 */

import { Phrase } from './models';

export type ExportFormat = 'csv' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  phrases: string[]; // 選択されたフレーズIDの配列
  includeReviewHistory: boolean;
  includeMetadata: boolean;
}

export type MergeStrategy = 'skip' | 'overwrite' | 'duplicate' | 'merge';

export interface ImportOptions {
  mergeStrategy: MergeStrategy;
  autoResolveConflicts: boolean;
}

export interface ConflictResolution {
  phraseId: string;
  action: 'keep_existing' | 'use_imported' | 'merge_both';
  mergedData?: Partial<Phrase>;
}

export interface ImportConflict {
  existing: Phrase;
  imported: Phrase;
  differences: string[];
}

export interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface CSVRow {
  id?: string;
  english: string;
  japanese: string;
  pronunciation?: string;
  tags?: string;
  categoryId?: string;
  nextReviewDate?: string;
}