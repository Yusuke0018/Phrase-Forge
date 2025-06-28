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
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const { removeReviewedPhrase } = usePhraseStore();

  const handleIntervalSelect = async (interval: ReviewInterval) => {
    try {
      // デフォルトの難易度は0.5（中程度）
      const difficulty = selectedDifficulty ?? 0.5;
      const nextReviewDate = calculateNextReviewDate(interval);
      await updatePhraseReviewDate(phrase.id, nextReviewDate, interval, difficulty);
      
      // レビュー済みのフレーズを状態から削除
      removeReviewedPhrase(phrase.id);
      
      // 翻訳を隠す
      setShowTranslation(false);
      setSelectedDifficulty(null);
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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 cursor-pointer select-none"
        whileTap={{ scale: 0.98 }}
        {...swipeHandlers}
        onClick={() => {
          setIsFlipping(true);
          setShowTranslation(!showTranslation);
          setTimeout(() => setIsFlipping(false), 300);
        }}
      >
        {/* 次回レビュー日表示 */}
        <div className="absolute top-4 right-4 text-sm text-gray-500 dark:text-gray-400">
          次回: {format(phrase.nextReviewDate, 'yyyy/MM/dd')}
        </div>

        {/* カード内容 */}
        <div className="min-h-[200px] flex flex-col justify-center">
          {/* 英語フレーズ */}
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">
            {phrase.english}
          </h2>

          {/* 発音記号 */}
          {phrase.pronunciation && (
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 text-center">
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
                className="text-xl text-gray-700 dark:text-gray-300 text-center"
              >
                {phrase.japanese}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 表示/非表示アイコン */}
          <div className="mt-4 flex justify-center">
            {showTranslation ? (
              <FiEyeOff className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            ) : (
              <FiEye className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            )}
          </div>
        </div>

        {/* タグ表示 */}
        {phrase.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {phrase.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* 難易度選択 */}
      {showTranslation && (
        <div className="mt-4 px-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">どのくらい難しかったですか？</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setSelectedDifficulty(0.2)}
              className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                selectedDifficulty === 0.2
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              簡単
            </button>
            <button
              onClick={() => setSelectedDifficulty(0.5)}
              className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                selectedDifficulty === 0.5
                  ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              普通
            </button>
            <button
              onClick={() => setSelectedDifficulty(0.8)}
              className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                selectedDifficulty === 0.8
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              難しい
            </button>
          </div>
        </div>
      )}

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