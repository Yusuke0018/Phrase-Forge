/**
 * @file utils/duplicate-detector.ts
 * @description フレーズの重複検出ユーティリティ
 * 
 * @see docs/design/duplicate-detection.md
 * 
 * @related
 * - services/import.service.ts: インポート処理で使用
 * - types/models.ts: Phraseモデル定義
 */

import { Phrase } from '@/types/models';

export interface DuplicateDetectionResult {
  phrase: Phrase;
  similarity: number;
  matchType: 'exact' | 'english_only' | 'similar';
}

/**
 * レーベンシュタイン距離を計算
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 置換
          matrix[i][j - 1] + 1,     // 挿入
          matrix[i - 1][j] + 1      // 削除
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * 文字列の類似度を計算（0〜1の値）
 */
function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  
  if (maxLength === 0) return 1;
  
  return 1 - (distance / maxLength);
}

/**
 * フレーズの重複を検出
 */
export async function detectDuplicates(
  targetPhrase: Partial<Phrase>,
  existingPhrases: Phrase[]
): Promise<Phrase[]> {
  const results: DuplicateDetectionResult[] = [];
  
  for (const existing of existingPhrases) {
    // 完全一致チェック（英語 + 日本語）
    if (
      existing.english === targetPhrase.english &&
      existing.japanese === targetPhrase.japanese
    ) {
      results.push({
        phrase: existing,
        similarity: 1.0,
        matchType: 'exact'
      });
      continue;
    }
    
    // 英語のみ一致チェック
    if (existing.english === targetPhrase.english) {
      results.push({
        phrase: existing,
        similarity: 0.9,
        matchType: 'english_only'
      });
      continue;
    }
    
    // 類似度チェック
    if (targetPhrase.english) {
      const englishSimilarity = calculateSimilarity(
        existing.english,
        targetPhrase.english
      );
      
      if (englishSimilarity > 0.8) {
        results.push({
          phrase: existing,
          similarity: englishSimilarity,
          matchType: 'similar'
        });
      }
    }
  }
  
  // 類似度の高い順にソート
  results.sort((a, b) => b.similarity - a.similarity);
  
  return results.map(r => r.phrase);
}

/**
 * 重複フレーズをマージ
 */
export function mergePhrases(
  existing: Phrase,
  imported: Partial<Phrase>
): Partial<Phrase> {
  return {
    ...existing,
    // 新しい情報で上書き（空でない場合）
    pronunciation: imported.pronunciation || existing.pronunciation,
    // タグはマージ
    tags: Array.from(new Set([...existing.tags, ...(imported.tags || [])])),
    // レビュー履歴は既存のものを保持
    reviewHistory: existing.reviewHistory,
    // 次回レビュー日は早い方を選択
    nextReviewDate: imported.nextReviewDate && 
      new Date(imported.nextReviewDate) < existing.nextReviewDate
      ? new Date(imported.nextReviewDate)
      : existing.nextReviewDate,
    updatedAt: new Date()
  };
}