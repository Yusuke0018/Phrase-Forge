/**
 * @file types/export.types.ts
 * @description エクスポート・インポート関連の型定義
 * 
 * @see docs/design/import-export.md
 * 
 * @related
 * - services/export.service.ts: エクスポート処理
 * - services/import.service.ts: インポート処理
 * - components/Export/ExportDialog.tsx: エクスポートUI
 * - components/Import/ImportDialog.tsx: インポートUI
 */

import { Phrase } from './models';

/**
 * エクスポート形式
 */
export type ExportFormat = 'csv' | 'json';

/**
 * エクスポートオプション
 */
export interface ExportOptions {
  format: ExportFormat;
  phrases: string[]; // フレーズIDの配列（空の場合は全て）
  includeReviewHistory: boolean;
  includeMetadata: boolean;
}

/**
 * CSVレコードの型
 */
export interface CSVRow {
  id?: string;
  english: string;
  japanese: string;
  pronunciation?: string;
  tags: string;
  categoryId: string;
  nextReviewDate: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * インポートオプション
 */
export interface ImportOptions {
  mergeStrategy: 'skip' | 'overwrite' | 'duplicate';
  autoResolveConflicts: boolean;
}

/**
 * インポート時のコンフリクト
 */
export interface ImportConflict {
  existing: Phrase;
  imported: Phrase;
  differences: string[];
}

/**
 * インポート結果
 */
export interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * バックアップデータ
 */
export interface BackupData {
  version: string;
  exportDate: string;
  phrases: Phrase[];
  categories?: any[];
  tags?: any[];
  stats?: any;
}