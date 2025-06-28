/**
 * @file services/export.service.ts
 * @description フレーズのエクスポート機能
 * 
 * @see docs/design/import-export.md
 * 
 * @related
 * - types/export.types.ts: エクスポート関連の型定義
 * - components/Export/ExportDialog.tsx: エクスポートUI
 */

import { parse } from 'papaparse';
import { Phrase } from '@/types/models';
import { ExportOptions, CSVRow } from '@/types/export.types';

export function exportToCSV(phrases: Phrase[]): string {
  const headers = [
    'id',
    'english', 
    'japanese',
    'pronunciation',
    'tags',
    'categoryId',
    'nextReviewDate'
  ];

  const rows = phrases.map(phrase => [
    phrase.id,
    phrase.english,
    phrase.japanese,
    phrase.pronunciation || '',
    phrase.tags.join(';'),
    phrase.categoryId,
    phrase.nextReviewDate.toISOString()
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

export function exportToJSON(phrases: Phrase[]): string {
  const exportData = phrases.map(phrase => ({
    id: phrase.id,
    english: phrase.english,
    japanese: phrase.japanese,
    pronunciation: phrase.pronunciation,
    tags: phrase.tags,
    categoryId: phrase.categoryId,
    nextReviewDate: phrase.nextReviewDate.toISOString(),
    reviewHistory: phrase.reviewHistory
  }));

  return JSON.stringify(exportData, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
}

export async function exportPhrases(options: ExportOptions, phrases: Phrase[]) {
  const selectedPhrases = options.phrases.length > 0
    ? phrases.filter(p => options.phrases.includes(p.id))
    : phrases;

  if (selectedPhrases.length === 0) {
    throw new Error('エクスポートするフレーズがありません');
  }

  const timestamp = new Date().toISOString().split('T')[0];
  
  if (options.format === 'csv') {
    const content = exportToCSV(selectedPhrases);
    downloadFile(content, `phrase-forge-export-${timestamp}.csv`, 'text/csv');
  } else {
    const content = exportToJSON(selectedPhrases);
    downloadFile(content, `phrase-forge-export-${timestamp}.json`, 'application/json');
  }
}