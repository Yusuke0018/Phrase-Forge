/**
 * @file services/srs.service.ts
 * @description SRS（間隔反復システム）アルゴリズムの実装
 * 
 * @see docs/design/srs-algorithm.md
 * 
 * @related
 * - types/models.ts: ReviewInterval型定義
 * - services/db.service.ts: レビュー日更新処理
 * - hooks/useSRS.ts: SRSロジックのReactフック
 */

import { addDays, addWeeks, addMonths } from 'date-fns';
import { ReviewInterval } from '@/types/models';

export const REVIEW_INTERVALS: Record<ReviewInterval, { label: string; getDays: () => number }> = {
  tomorrow: {
    label: '翌日',
    getDays: () => 1
  },
  three_days: {
    label: '三日後',
    getDays: () => 3
  },
  one_week: {
    label: '一週間後',
    getDays: () => 7
  },
  two_weeks: {
    label: '二週間後',
    getDays: () => 14
  },
  one_month: {
    label: '一ヶ月後',
    getDays: () => 30
  }
};

export function calculateNextReviewDate(interval: ReviewInterval): Date {
  const now = new Date();
  const days = REVIEW_INTERVALS[interval].getDays();
  
  if (days <= 7) {
    return addDays(now, days);
  } else if (days <= 14) {
    return addWeeks(now, Math.floor(days / 7));
  } else {
    return addMonths(now, Math.floor(days / 30));
  }
}

export function getRecommendedInterval(reviewHistory: any[]): ReviewInterval {
  if (!reviewHistory || reviewHistory.length === 0) {
    return 'tomorrow';
  }

  const lastReview = reviewHistory[reviewHistory.length - 1];
  const successRate = calculateSuccessRate(reviewHistory);

  // 成功率に基づいて推奨間隔を決定
  if (successRate >= 0.9) {
    // 高い成功率の場合、より長い間隔を推奨
    switch (lastReview.interval) {
      case 'tomorrow':
        return 'three_days';
      case 'three_days':
        return 'one_week';
      case 'one_week':
        return 'two_weeks';
      case 'two_weeks':
      case 'one_month':
        return 'one_month';
      default:
        return 'tomorrow';
    }
  } else if (successRate >= 0.7) {
    // 中程度の成功率の場合、同じ間隔を維持
    return lastReview.interval;
  } else {
    // 低い成功率の場合、より短い間隔を推奨
    switch (lastReview.interval) {
      case 'one_month':
        return 'two_weeks';
      case 'two_weeks':
        return 'one_week';
      case 'one_week':
        return 'three_days';
      case 'three_days':
      case 'tomorrow':
        return 'tomorrow';
      default:
        return 'tomorrow';
    }
  }
}

function calculateSuccessRate(reviewHistory: any[]): number {
  if (!reviewHistory || reviewHistory.length === 0) return 0;
  
  // 最近の5回のレビューを考慮
  const recentReviews = reviewHistory.slice(-5);
  const avgDifficulty = recentReviews.reduce((sum, r) => sum + r.difficulty, 0) / recentReviews.length;
  
  // 難易度が低いほど成功率が高い（0が最も簡単、1が最も難しい）
  return 1 - avgDifficulty;
}

export function formatNextReviewDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '今日';
  if (diffDays === 1) return '明日';
  if (diffDays === 2) return '明後日';
  if (diffDays <= 7) return `${diffDays}日後`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}週間後`;
  
  return `${Math.ceil(diffDays / 30)}ヶ月後`;
}