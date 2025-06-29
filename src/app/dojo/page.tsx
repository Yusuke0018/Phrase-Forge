/**
 * @file app/dojo/page.tsx
 * @description 道場画面（テストモード）
 * 
 * @see docs/design/dojo-screen.md
 * 
 * @related
 * - components/Dojo/QuickTest.tsx: 瞬間テストコンポーネント
 * - components/Dojo/RandomTest.tsx: ランダム組手コンポーネント
 * - stores/phrase.store.ts: フレーズデータストア
 */

'use client';

import { useState, useEffect } from 'react';
import { FiZap, FiShuffle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { usePhraseStore } from '@/stores/phrase.store';
import { Phrase } from '@/types/models';

type TestMode = 'quick' | 'random' | null;

export default function DojoPage() {
  const { phrases, tags, loadPhrases, loadTags } = usePhraseStore();
  const [testMode, setTestMode] = useState<TestMode>(null);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [testPhrases, setTestPhrases] = useState<Phrase[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [testComplete, setTestComplete] = useState(false);

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadPhrases(), loadTags()]);
    };
    init();
  }, [loadPhrases, loadTags]);

  const startTest = (mode: TestMode) => {
    let filtered = phrases;
    
    if (selectedTag !== 'all') {
      filtered = phrases.filter(p => p.tags.includes(selectedTag));
    }

    if (filtered.length === 0) {
      alert('テスト可能なフレーズがありません。');
      return;
    }

    // ランダムモードの場合はシャッフル
    if (mode === 'random') {
      filtered = [...filtered].sort(() => Math.random() - 0.5);
    }

    setTestMode(mode);
    setTestPhrases(filtered.slice(0, 10)); // 最大10問
    setCurrentIndex(0);
    setShowAnswer(false);
    setScore({ correct: 0, total: 0 });
    setTestComplete(false);
  };

  const handleAnswer = (isCorrect: boolean) => {
    setScore({
      correct: score.correct + (isCorrect ? 1 : 0),
      total: score.total + 1
    });

    if (currentIndex < testPhrases.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      setTestComplete(true);
    }
  };

  const resetTest = () => {
    setTestMode(null);
    setTestComplete(false);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const currentPhrase = testPhrases[currentIndex];

  if (testMode && !testComplete && currentPhrase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-2xl mx-auto px-4 py-6 pt-20">
          {/* 進捗バー */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              <span>問題 {currentIndex + 1} / {testPhrases.length}</span>
              <span className="text-green-600 dark:text-green-400">正解: {score.correct} / {score.total}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(currentIndex / testPhrases.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>

          {/* テストカード */}
          <motion.div
            key={currentPhrase.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl 
                     shadow-2xl border border-gray-100 dark:border-gray-700 p-10"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                {testMode === 'quick' ? currentPhrase.japanese : currentPhrase.english}
              </h2>
            
              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 
                           dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl
                           border border-blue-200 dark:border-blue-700"
                >
                  <p className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 
                               bg-clip-text text-transparent">
                    {testMode === 'quick' ? currentPhrase.english : currentPhrase.japanese}
                  </p>
                  {currentPhrase.pronunciation && testMode === 'random' && (
                    <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 italic">
                      /{currentPhrase.pronunciation}/
                    </p>
                  )}
                </motion.div>
              )}
          </div>

            {!showAnswer ? (
              <button
                onClick={() => setShowAnswer(true)}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white 
                         rounded-xl hover:shadow-xl transition-all duration-300 font-medium
                         text-lg hover:scale-[1.02] shadow-lg"
              >
                答えを見る
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnswer(false)}
                  className="py-4 bg-gradient-to-r from-red-50 to-red-100 
                           dark:from-red-900/20 dark:to-red-800/20
                           text-red-700 dark:text-red-400 rounded-xl 
                           hover:shadow-lg transition-all duration-200 font-medium
                           border border-red-200 dark:border-red-700 hover:scale-[1.02]"
                >
                  不正解
                </button>
                <button
                  onClick={() => handleAnswer(true)}
                  className="py-4 bg-gradient-to-r from-green-50 to-green-100 
                           dark:from-green-900/20 dark:to-green-800/20
                           text-green-700 dark:text-green-400 rounded-xl 
                           hover:shadow-lg transition-all duration-200 font-medium
                           border border-green-200 dark:border-green-700 hover:scale-[1.02]"
                >
                  正解
                </button>
              </div>
            )}
          </motion.div>

          {/* 中断ボタン */}
          <div className="mt-6 text-center">
            <button
              onClick={resetTest}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 
                       dark:hover:text-gray-300 underline transition-colors"
            >
              テストを中断
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (testComplete) {
    const percentage = Math.round((score.correct / score.total) * 100);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-2xl mx-auto px-4 py-6 pt-20">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 150 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl 
                     shadow-2xl border border-gray-100 dark:border-gray-700 p-10 text-center"
          >
            <motion.h2 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 
                       bg-clip-text text-transparent mb-6"
            >
              テスト完了！
            </motion.h2>
          
            <div className="mb-8">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-7xl font-bold mb-3"
              >
                <span className={`bg-gradient-to-r bg-clip-text text-transparent
                              ${percentage >= 80 
                                ? 'from-green-500 to-emerald-600' 
                                : percentage >= 60 
                                ? 'from-yellow-500 to-orange-600'
                                : 'from-red-500 to-pink-600'}`}>
                  {percentage}%
                </span>
              </motion.div>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {score.correct} / {score.total} 問正解
              </p>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-8 p-4 rounded-xl"
            >
              {percentage >= 80 ? (
                <>
                  <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                    素晴らしい成績です！
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    この調子で頑張ってください！
                  </p>
                </>
              ) : percentage >= 60 ? (
                <>
                  <p className="text-xl font-semibold text-yellow-600 dark:text-yellow-400">
                    よく頑張りました！
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    もう少しで完璧です！
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                    もう少し練習が必要です。
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    諦めずに頑張りましょう！
                  </p>
                </>
              )}
            </motion.div>

            <button
              onClick={resetTest}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white 
                       rounded-xl hover:shadow-xl transition-all duration-300 font-medium
                       text-lg hover:scale-[1.02] shadow-lg"
            >
              道場に戻る
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6 pt-20">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 
                     bg-clip-text text-transparent mb-3"
          >
            道場
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-400"
          >
            記憶の瞬発力を試そう
          </motion.p>
        </div>

        {/* タグ選択 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl 
                   shadow-xl border border-gray-100 dark:border-gray-700 p-6 mb-8"
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            テストするタグを選択
          </label>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl 
                     focus:ring-2 focus:ring-orange-500 cursor-pointer text-lg
                     transition-all duration-200"
          >
            <option value="all">すべてのタグ</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.name}>
                {tag.name}
              </option>
            ))}
          </select>
        </motion.div>

        {/* テストモード選択 */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => startTest('quick')}
            className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 
                     dark:to-orange-900/20 rounded-2xl shadow-xl p-8 text-center 
                     hover:shadow-2xl transition-all duration-300 cursor-pointer group
                     border border-yellow-200 dark:border-yellow-700"
          >
            <div className="mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 
                            rounded-full flex items-center justify-center mx-auto 
                            group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FiZap className="w-10 h-10 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 
                         bg-clip-text text-transparent mb-3">瞬間テスト</h3>
            <p className="text-gray-600 dark:text-gray-400">
              日本語を見て、英語をすぐに思い出せるかテスト
            </p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => startTest('random')}
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 
                     dark:to-pink-900/20 rounded-2xl shadow-xl p-8 text-center 
                     hover:shadow-2xl transition-all duration-300 cursor-pointer group
                     border border-purple-200 dark:border-purple-700"
          >
            <div className="mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 
                            rounded-full flex items-center justify-center mx-auto 
                            group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FiShuffle className="w-10 h-10 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                         bg-clip-text text-transparent mb-3">ランダム組手</h3>
            <p className="text-gray-600 dark:text-gray-400">
              英語を見て、意味を理解できるかランダムにテスト
            </p>
          </motion.button>
        </div>
      </div>
    </div>
  );
}