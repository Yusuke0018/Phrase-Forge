/**
 * @file utils/duplicate-detector.ts
 * @description フレーズの重複検出ユーティリティ
 * 
 * @see docs/design/duplicate-detection.md
 * 
 * @related
 * - services/import.service.ts: インポート処理で使用
 * - types/models.ts: Phrase型定義
 */

import { Phrase } from '@/types/models';

/**
 * 文字列の類似度を計算（レーベンシュタイン距離ベース）
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // 空文字列の場合
  if (len1 === 0 || len2 === 0) {
    return 0;
  }
  
  // 完全一致
  if (str1 === str2) {
    return 1;
  }
  
  const matrix: number[][] = [];
  
  // 初期化
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // レーベンシュタイン距離を計算
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // 削除
        matrix[i][j - 1] + 1,     // 挿入
        matrix[i - 1][j - 1] + cost // 置換
      );
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  
  // 類似度を0〜1の範囲で返す
  return 1 - (distance / maxLen);
}

/**
 * フレーズの正規化（比較用）
 */
function normalizePhrase(phrase: string): string {
  return phrase
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"]/g, '') // 句読点を削除
    .replace(/\s+/g, ' ');       // 複数の空白を1つに
}

/**
 * 重複フレーズを検出
 */
export async function detectDuplicates(
  newPhrase: Partial<Phrase>,
  existingPhrases: Phrase[],
  threshold: number = 0.8
): Promise<Phrase[]> {
  if (!newPhrase.english || !newPhrase.japanese) {
    return [];
  }
  
  const normalizedNewEnglish = normalizePhrase(newPhrase.english);
  const normalizedNewJapanese = normalizePhrase(newPhrase.japanese);
  
  const duplicates: { phrase: Phrase; score: number }[] = [];
  
  for (const existing of existingPhrases) {
    const normalizedExistingEnglish = normalizePhrase(existing.english);
    const normalizedExistingJapanese = normalizePhrase(existing.japanese);
    
    // 英語と日本語の類似度を計算
    const englishSimilarity = calculateSimilarity(normalizedNewEnglish, normalizedExistingEnglish);
    const japaneseSimilarity = calculateSimilarity(normalizedNewJapanese, normalizedExistingJapanese);
    
    // 総合スコア（英語と日本語の平均）
    const totalScore = (englishSimilarity + japaneseSimilarity) / 2;
    
    // しきい値を超えた場合は重複と判定
    if (totalScore >= threshold) {
      duplicates.push({ phrase: existing, score: totalScore });
    }
    
    // 完全一致の場合は即座に返す
    if (englishSimilarity === 1 && japaneseSimilarity === 1) {
      return [existing];
    }
  }
  
  // スコアの高い順にソート
  duplicates.sort((a, b) => b.score - a.score);
  
  return duplicates.map(d => d.phrase);
}

/**
 * バッチ重複検出（複数フレーズを一度にチェック）
 */
export async function detectBatchDuplicates(
  newPhrases: Partial<Phrase>[],
  existingPhrases: Phrase[],
  threshold: number = 0.8
): Promise<Map<number, Phrase[]>> {
  const results = new Map<number, Phrase[]>();
  
  for (let i = 0; i < newPhrases.length; i++) {
    const duplicates = await detectDuplicates(newPhrases[i], existingPhrases, threshold);
    if (duplicates.length > 0) {
      results.set(i, duplicates);
    }
  }
  
  return results;
}

/**
 * フレーズが類似しているかチェック（シンプル版）
 */
export function isSimilarPhrase(
  phrase1: Partial<Phrase>,
  phrase2: Phrase,
  threshold: number = 0.8
): boolean {
  if (!phrase1.english || !phrase1.japanese) {
    return false;
  }
  
  const englishSimilarity = calculateSimilarity(
    normalizePhrase(phrase1.english),
    normalizePhrase(phrase2.english)
  );
  
  const japaneseSimilarity = calculateSimilarity(
    normalizePhrase(phrase1.japanese),
    normalizePhrase(phrase2.japanese)
  );
  
  const totalScore = (englishSimilarity + japaneseSimilarity) / 2;
  
  return totalScore >= threshold;
}