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
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function ReviewCard({ phrase, onSwipeLeft, onSwipeRight }: ReviewCardProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingInterval, setPendingInterval] = useState<ReviewInterval | null>(null);
  const { removeReviewedPhrase } = usePhraseStore();

  const handleIntervalSelect = (interval: ReviewInterval) => {
    setPendingInterval(interval);
    setShowConfirmDialog(true);
  };

  const confirmReview = async () => {
    if (!pendingInterval) return;
    
    try {
      // デフォルトの難易度は0.5（中程度）
      const difficulty = selectedDifficulty ?? 0.5;
      const nextReviewDate = calculateNextReviewDate(pendingInterval);
      await updatePhraseReviewDate(phrase.id, nextReviewDate, pendingInterval, difficulty);
      
      // レビュー済みのフレーズを状態から削除
      removeReviewedPhrase(phrase.id);
      
      // 翻訳を隠す
      setShowTranslation(false);
      setSelectedDifficulty(null);
      setShowConfirmDialog(false);
      setPendingInterval(null);
    } catch (error) {
      console.error('Failed to update review date:', error);
    }
  };

  const cancelReview = () => {
    setShowConfirmDialog(false);
    setPendingInterval(null);
  };

  const swipeHandlers = useSwipe({
    onSwipeUp: () => setShowTranslation(true),
    onSwipeDown: () => setShowTranslation(false),
    onSwipeLeft: () => {
      if (onSwipeLeft && !showTranslation) {
        setSwipeDirection('left');
        setTimeout(() => {
          onSwipeLeft();
          setSwipeDirection(null);
        }, 300);
      }
    },
    onSwipeRight: () => {
      if (onSwipeRight && !showTranslation) {
        setSwipeDirection('right');
        setTimeout(() => {
          onSwipeRight();
          setSwipeDirection(null);
        }, 300);
      }
    },
  });

  return (
    <div className="relative">
      <motion.div
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl 
                 p-8 cursor-pointer select-none border border-gray-100 dark:border-gray-700
                 hover:shadow-3xl transition-shadow duration-300"
        animate={{
          x: swipeDirection === 'left' ? -300 : swipeDirection === 'right' ? 300 : 0,
          opacity: swipeDirection ? 0 : 1,
          rotate: swipeDirection === 'left' ? -15 : swipeDirection === 'right' ? 15 : 0,
        }}
        transition={{ duration: 0.3 }}
        whileTap={{ scale: 0.98 }}
        {...swipeHandlers}
        onClick={() => {
          setIsFlipping(true);
          setShowTranslation(!showTranslation);
          setTimeout(() => setIsFlipping(false), 300);
        }}
      >
        {/* 次回レビュー日表示 */}
        <div className="absolute top-4 right-4 text-xs font-medium bg-gradient-to-r 
                      from-blue-600 to-purple-600 bg-clip-text text-transparent">
          次回: {format(phrase.nextReviewDate, 'MM/dd')}
        </div>

        {/* カード内容 */}
        <div className="min-h-[200px] flex flex-col justify-center">
          {/* 英語フレーズ */}
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center
                       leading-tight">
            {phrase.english}
          </h2>

          {/* 発音記号 */}
          {phrase.pronunciation && (
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-6 text-center italic">
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
                transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                className="text-2xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 
                         bg-clip-text text-transparent text-center"
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
                className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 
                         dark:from-blue-900/20 dark:to-purple-900/20
                         text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium
                         border border-blue-200 dark:border-blue-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* 難易度選択 */}
      {showTranslation && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 px-4"
        >
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
            どのくらい難しかったですか？
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setSelectedDifficulty(0.2)}
              className={`px-5 py-3 rounded-xl font-medium transition-all duration-200 ${
                selectedDifficulty === 0.2
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-400'
              }`}
            >
              簡単
            </button>
            <button
              onClick={() => setSelectedDifficulty(0.5)}
              className={`px-5 py-3 rounded-xl font-medium transition-all duration-200 ${
                selectedDifficulty === 0.5
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-yellow-400'
              }`}
            >
              普通
            </button>
            <button
              onClick={() => setSelectedDifficulty(0.8)}
              className={`px-5 py-3 rounded-xl font-medium transition-all duration-200 ${
                selectedDifficulty === 0.8
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-red-400'
              }`}
            >
              難しい
            </button>
          </div>
        </motion.div>
      )}

      {/* 復習間隔選択ボタン */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 grid grid-cols-2 gap-3 px-4"
      >
        {Object.entries(REVIEW_INTERVALS).map(([key, value], index) => (
          <motion.button
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleIntervalSelect(key as ReviewInterval)}
            className="py-3 px-4 bg-white dark:bg-gray-800 border border-gray-200 
                     dark:border-gray-700 rounded-xl hover:border-blue-400 
                     hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50
                     dark:hover:from-blue-900/20 dark:hover:to-purple-900/20
                     transition-all duration-200 text-gray-700 dark:text-gray-300 
                     font-medium shadow-sm hover:shadow-md"
          >
            {value.label}
          </motion.button>
        ))}
      </motion.div>

      {/* スワイプヒント */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400"
      >
        タップまたは上スワイプで日本語訳を表示
        {(onSwipeLeft || onSwipeRight) && (
          <>
            <br />
            左右スワイプで次のカードへ
          </>
        )}
      </motion.p>

      {/* 確認ダイアログ */}
      <AnimatePresence>
        {showConfirmDialog && pendingInterval && (
          <>
            {/* オーバーレイ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={cancelReview}
            />

            {/* ダイアログ */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                       w-[90%] max-w-md bg-white dark:bg-gray-800 rounded-2xl 
                       shadow-2xl z-50 p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">
                復習を完了しますか？
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">フレーズ:</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {phrase.english}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">次回復習:</span>
                  <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 
                               bg-clip-text text-transparent">
                    {REVIEW_INTERVALS[pendingInterval].label}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelReview}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 
                           rounded-xl font-medium bg-white dark:bg-gray-700 
                           hover:bg-gray-50 dark:hover:bg-gray-600 
                           transition-all duration-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={confirmReview}
                  className="flex-1 px-4 py-3 rounded-xl font-medium 
                           bg-gradient-to-r from-blue-600 to-purple-600 text-white
                           hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  完了する
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}