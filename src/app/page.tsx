/**
 * @file app/page.tsx
 * @description ホーム画面（今日の鍛錬）
 * 
 * @see docs/design/home-screen.md
 * 
 * @related
 * - components/Cards/ReviewCard.tsx: レビューカードコンポーネント
 * - stores/phrase.store.ts: フレーズデータストア
 * - services/srs.service.ts: SRSアルゴリズム
 */

'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { usePhraseStore } from '@/stores/phrase.store';
import { ReviewCard } from '@/components/Cards/ReviewCard';
import { useAppInitializer } from '@/hooks/useAppInitializer';
import { AddPhraseModal } from '@/components/UI/AddPhraseModal';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { isInitializing, initError } = useAppInitializer();
  const { 
    todaysPhrases, 
    currentPhraseIndex,
    loadTodaysPhrases,
    setCurrentPhraseIndex
  } = usePhraseStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const currentPhrase = todaysPhrases[currentPhraseIndex];
  const today = new Date();

  const handleNextPhrase = () => {
    if (currentPhraseIndex < todaysPhrases.length - 1) {
      setCurrentPhraseIndex(currentPhraseIndex + 1);
    }
  };

  const handlePreviousPhrase = () => {
    if (currentPhraseIndex > 0) {
      setCurrentPhraseIndex(currentPhraseIndex - 1);
    }
  };


  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">アプリケーションを初期化しています...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">エラーが発生しました: {initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-6 pt-20">
      {/* ヘッダーとフレーズ追加ボタン */}
      <div className="flex justify-between items-start mb-6">
        {/* 日付表示 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {format(today, 'yyyy年M月d日 (E)', { locale: ja })}
          </h1>
          
          {/* 進捗表示 */}
          {todaysPhrases.length > 0 && (
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              本日 {currentPhraseIndex + 1} / {todaysPhrases.length} 枚目
            </p>
          )}
        </div>

        {/* フレーズ追加ボタン */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="group relative w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 
                   text-white rounded-xl hover:shadow-xl transition-all duration-300 
                   flex items-center justify-center hover:scale-105 shadow-lg"
          aria-label="フレーズを追加"
        >
          <svg 
            className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2.5} 
              d="M12 4v16m8-8H4" 
            />
          </svg>
        </button>
      </div>

      {/* メインコンテンツ */}
      {todaysPhrases.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            本日の復習はありません
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            まずは「武器庫」から新しいフレーズを追加してください。
          </p>
          <a
            href="/arsenal"
            className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg 
                     hover:bg-primary-700 transition-colors"
          >
            フレーズを追加する
          </a>
        </div>
      ) : currentPhrase ? (
        <div className="relative">
          <ReviewCard 
            phrase={currentPhrase} 
            onSwipeLeft={handleNextPhrase}
            onSwipeRight={handlePreviousPhrase}
          />
          
          {/* ナビゲーションボタン */}
          <div className="flex justify-between items-center mt-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePreviousPhrase}
              disabled={currentPhraseIndex === 0}
              className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg 
                       disabled:opacity-30 disabled:cursor-not-allowed
                       hover:shadow-xl transition-all duration-200"
            >
              <FiChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </motion.button>
            
            <div className="flex gap-2">
              {todaysPhrases.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentPhraseIndex
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 w-8'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextPhrase}
              disabled={currentPhraseIndex === todaysPhrases.length - 1}
              className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg 
                       disabled:opacity-30 disabled:cursor-not-allowed
                       hover:shadow-xl transition-all duration-200"
            >
              <FiChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            本日の復習が完了しました！
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            お疲れ様でした。明日も頑張りましょう！
          </p>
        </div>
      )}

      {/* フレーズ追加モーダル */}
      <AddPhraseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          // モーダルを閉じた後、今日のフレーズを再読み込み
          loadTodaysPhrases();
        }}
      />
      </div>
    </div>
  );
}