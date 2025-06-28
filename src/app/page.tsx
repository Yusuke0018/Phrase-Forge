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

import { useEffect } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { usePhraseStore } from '@/stores/phrase.store';
import { ReviewCard } from '@/components/Cards/ReviewCard';
import { db, initializeDB } from '@/services/db.service';
import { loadSampleData } from '@/utils/sampleData';

export default function HomePage() {
  const { 
    todaysPhrases, 
    currentPhraseIndex, 
    isLoading,
    loadTodaysPhrases,
    loadCategories,
    loadTags
  } = usePhraseStore();

  useEffect(() => {
    const init = async () => {
      await initializeDB();
      await Promise.all([
        loadTodaysPhrases(),
        loadCategories(),
        loadTags()
      ]);
    };
    init();
  }, [loadTodaysPhrases, loadCategories, loadTags]);

  const currentPhrase = todaysPhrases[currentPhraseIndex];
  const today = new Date();

  const handleLoadSampleData = async () => {
    await loadSampleData();
    await loadTodaysPhrases();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pt-20">
      {/* 日付表示 */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {format(today, 'yyyy年M月d日 (E)', { locale: ja })}
        </h1>
        
        {/* 進捗表示 */}
        {todaysPhrases.length > 0 && (
          <p className="mt-2 text-lg text-gray-600">
            本日 {currentPhraseIndex + 1} / {todaysPhrases.length} 枚目
          </p>
        )}
      </div>

      {/* メインコンテンツ */}
      {todaysPhrases.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            本日の復習はありません
          </h2>
          <p className="text-gray-600 mb-6">
            新しいフレーズを追加するか、明日また確認してください。
          </p>
          <button
            onClick={handleLoadSampleData}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg 
                     hover:bg-primary-700 transition-colors"
          >
            サンプルデータを読み込む
          </button>
        </div>
      ) : currentPhrase ? (
        <ReviewCard phrase={currentPhrase} />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            本日の復習が完了しました！
          </h2>
          <p className="text-gray-600">
            お疲れ様でした。明日も頑張りましょう！
          </p>
        </div>
      )}
    </div>
  );
}