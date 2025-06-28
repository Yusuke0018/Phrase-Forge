/**
 * @file components/Cards/ReviewCard.tsx
 * @description レビューカードコンポーネント（スワイプ対応）
 * 
 * @see docs/design/review-card.md
 * 
 * @related
 * - types/models.ts: Phraseモデル定義
 * - services/srs.service.ts: SRSアルゴリズム
 * - hooks/useSwipe.ts: スワイプジェスチャー検出
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Phrase, ReviewInterval } from '@/types/models';
import { 
  REVIEW_INTERVALS, 
  calculateNextReviewDate,
  formatNextReviewDate 
} from '@/services/srs.service';
import { usePhraseStore } from '@/stores/phrase.store';
import { updatePhraseReviewDate } from '@/services/db.service';
import { useSwipe } from '@/hooks/useSwipe';
import { FiEye, FiEyeOff } from 'react-icons/fi';

interface ReviewCardProps {
  phrase: Phrase;
}

export function ReviewCard({ phrase }: ReviewCardProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const { moveToNextPhrase, loadTodaysPhrases } = usePhraseStore();

  const handleIntervalSelect = async (interval: ReviewInterval) => {
    try {
      const nextReviewDate = calculateNextReviewDate(interval);
      await updatePhraseReviewDate(phrase.id, nextReviewDate, interval);
      
      // 次のカードへ移動
      moveToNextPhrase();
      
      // リストを更新
      await loadTodaysPhrases();
      
      // 翻訳を隠す
      setShowTranslation(false);
    } catch (error) {
      console.error('Failed to update review date:', error);
    }
  };

  const swipeHandlers = useSwipe({
    onSwipeUp: () => setShowTranslation(true),
    onSwipeDown: () => setShowTranslation(false),
  });

  return (
    <div className="relative">
      <motion.div
        className="bg-white rounded-lg shadow-lg p-8 cursor-pointer select-none"
        whileTap={{ scale: 0.98 }}
        {...swipeHandlers}
        onClick={() => {
          setIsFlipping(true);
          setShowTranslation(!showTranslation);
          setTimeout(() => setIsFlipping(false), 300);
        }}
      >
        {/* 次回レビュー日表示 */}
        <div className="absolute top-4 right-4 text-sm text-gray-500">
          次回: {format(phrase.nextReviewDate, 'yyyy/MM/dd')}
        </div>

        {/* カード内容 */}
        <div className="min-h-[200px] flex flex-col justify-center">
          {/* 英語フレーズ */}
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            {phrase.english}
          </h2>

          {/* 発音記号 */}
          {phrase.pronunciation && (
            <p className="text-lg text-gray-600 mb-6 text-center">
              /{phrase.pronunciation}/
            </p>
          )}

          {/* 日本語訳（アニメーション付き） */}
          <AnimatePresence mode="wait">
            {showTranslation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-xl text-gray-700 text-center"
              >
                {phrase.japanese}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 表示/非表示アイコン */}
          <div className="mt-4 flex justify-center">
            {showTranslation ? (
              <FiEyeOff className="w-6 h-6 text-gray-400" />
            ) : (
              <FiEye className="w-6 h-6 text-gray-400" />
            )}
          </div>
        </div>

        {/* タグ表示 */}
        {phrase.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {phrase.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* 復習間隔選択ボタン */}
      <div className="mt-6 grid grid-cols-2 gap-3 px-4">
        {Object.entries(REVIEW_INTERVALS).map(([key, value]) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleIntervalSelect(key as ReviewInterval)}
            className="py-3 px-4 bg-white border-2 border-gray-200 rounded-lg 
                     hover:border-primary-500 hover:bg-primary-50 
                     transition-colors duration-200 
                     text-gray-700 font-medium"
          >
            {value.label}
          </motion.button>
        ))}
      </div>

      {/* スワイプヒント */}
      <p className="mt-4 text-center text-sm text-gray-500">
        タップまたは上スワイプで日本語訳を表示
      </p>
    </div>
  );
}